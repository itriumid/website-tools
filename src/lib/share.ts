// Sharing a bill as a short link. The page makes a code, leaves the bill on our server encrypted
// with a key made from the code, and puts the code in the link: `#bill=` and sixteen characters,
// short enough to survive any chat app. Whoever opens the link fetches the bill and decrypts it.
//
// The code is the only secret. A hash of it names the bill on the server and another hash of it
// is the key, so the server sees neither the code nor the key, only encrypted bytes under a name
// it can't turn back into the code. Whoever shared a bill also gets a token, kept on their device,
// that lets them change it, so the same link opens the latest version, and delete it before its
// thirty days are up.

import lzString from 'lz-string';
import { LIFETIME, LIMIT } from '../../share/bills';
import { readBill, type BillState } from './split-bill';

const { compressToUint8Array, decompressFromUint8Array } = lzString;

export { LIFETIME };

/** The address fragment of a short link, before its code. */
export const SHORT_PREFIX = '#bill=';

/** Crockford's base32: no I, L, O or U, so a code copied by hand stays right. */
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
/** 16 characters of 5 bits each: 80 bits, far too many to guess. */
const LENGTH = 16;

export type Problem = 'too-large' | 'offline' | 'gone' | 'not-yours' | 'server';

/** Anything that fetches: the browser's own, or a stand-in in tests. */
type Send = (input: string, init?: RequestInit) => Promise<Response>;

interface Place {
	/** What the server knows the bill by: a hash of the code. */
	name: string;
	key: CryptoKey;
}

/* ─── Codes ─── */

function random(characters: number): string {
	return [...crypto.getRandomValues(new Uint8Array(characters))]
		.map((byte) => ALPHABET[byte & 31])
		.join('');
}

/** The code in a short link's fragment, or undefined if it holds none. */
export function codeFromHash(hash: string): string | undefined {
	if (!hash.startsWith(SHORT_PREFIX)) return undefined;
	const code = hash.slice(SHORT_PREFIX.length).toUpperCase();
	return code.length === LENGTH && [...code].every((character) => ALPHABET.includes(character))
		? code
		: undefined;
}

/* ─── Encryption ─── */

const text = (value: string) => new TextEncoder().encode(value);

function toBase64Url(bytes: Uint8Array): string {
	return btoa(String.fromCharCode(...bytes))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '');
}

async function placeFor(code: string): Promise<Place> {
	const material = await crypto.subtle.importKey('raw', text(code), 'HKDF', false, [
		'deriveBits',
		'deriveKey'
	]);
	const hkdf = (info: string) =>
		({
			name: 'HKDF',
			hash: 'SHA-256',
			salt: text('tools.itrium.id split bill'),
			info: text(info)
		}) as const;
	const name = new Uint8Array(await crypto.subtle.deriveBits(hkdf('bill name'), material, 256));
	const key = await crypto.subtle.deriveKey(
		hkdf('bill key'),
		material,
		{ name: 'AES-GCM', length: 256 },
		false,
		['encrypt', 'decrypt']
	);
	return { name: toBase64Url(name), key };
}

/**
 * When the bill was shared, and whether that was a change to one shared before. It goes inside the
 * encrypted bill, beside its fields, so the server never sees it. Bills shared before it existed
 * have neither.
 */
export interface Version {
	updatedAt: number;
	updated?: true;
}

/** A shared bill as it opens: the bill, and when it was shared, if it says. */
export interface Opened {
	bill: BillState;
	version?: Version;
}

/**
 * The bill, compressed and encrypted: 12 bytes of nonce, then the encrypted bytes. The nonce is
 * random every time, so a bill changed and sealed again under the same code and key never reuses
 * one.
 */
async function seal(
	place: Place,
	bill: BillState,
	version: Version
): Promise<Uint8Array<ArrayBuffer>> {
	const plain = new Uint8Array(compressToUint8Array(JSON.stringify({ ...bill, ...version })));
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const data = new Uint8Array(
		await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, place.key, plain)
	);
	const sealed = new Uint8Array(iv.length + data.length);
	sealed.set(iv);
	sealed.set(data, iv.length);
	return sealed;
}

async function unseal(place: Place, sealed: Uint8Array): Promise<Opened | undefined> {
	try {
		const plain = await crypto.subtle.decrypt(
			{ name: 'AES-GCM', iv: sealed.slice(0, 12) },
			place.key,
			sealed.slice(12)
		);
		const json = decompressFromUint8Array(new Uint8Array(plain));
		if (!json) return undefined;
		const value: unknown = JSON.parse(json);
		const bill = readBill(value);
		if (!bill) return undefined;
		// readBill keeps only the bill's own fields; the version sits beside them.
		const { updatedAt, updated } = value as Record<string, unknown>;
		if (typeof updatedAt !== 'number' || !Number.isFinite(updatedAt)) return { bill };
		return { bill, version: updated === true ? { updatedAt, updated } : { updatedAt } };
	} catch {
		// AES-GCM checks what it decrypts: anything changed on the way fails here.
		return undefined;
	}
}

/* ─── The server ─── */

const address = (place: Place) => `/api/bills/${place.name}`;
const authorization = (token: string) => ({ authorization: `Bearer ${token}` });

export interface Shared {
	code: string;
	/** Lets whoever shared the bill change it and delete it. */
	token: string;
}

/** Seals the bill for `code` and leaves it on the server: the status it answered, or a problem. */
async function put(
	{ code, token }: Shared,
	bill: BillState,
	version: Version,
	send: Send
): Promise<number | Problem> {
	const place = await placeFor(code);
	const body = await seal(place, bill, version);
	if (body.length > LIMIT) return 'too-large';
	const response = await send(address(place), {
		method: 'PUT',
		headers: authorization(token),
		body
	}).catch(() => undefined);
	if (!response) return 'offline';
	if (response.status === 413) return 'too-large';
	if (response.status === 403) return 'not-yours';
	return response.status;
}

/** Leaves the bill on the server under a new code. */
export async function shareBill(
	bill: BillState,
	send: Send = fetch,
	now = Date.now()
): Promise<Shared | { problem: Problem }> {
	const shared = {
		code: random(LENGTH),
		token: toBase64Url(crypto.getRandomValues(new Uint8Array(32)))
	};
	const result = await put(shared, bill, { updatedAt: now }, send);
	if (result === 201) return shared;
	return { problem: typeof result === 'string' ? result : 'server' };
}

/**
 * Replaces a bill this device shared with a newer version, under the same code, so the link
 * people already have opens it. Its thirty days start again. Undefined when it's done.
 */
export async function updateBill(
	shared: Shared,
	bill: BillState,
	send: Send = fetch,
	now = Date.now()
): Promise<Problem | undefined> {
	const result = await put(shared, bill, { updatedAt: now, updated: true }, send);
	// 201: it had been deleted, by time or by hand, and is back under the same code.
	if (result === 200 || result === 201) return undefined;
	return typeof result === 'string' ? result : 'server';
}

/** The bill a short link's code points to, and when it was shared. */
export async function openBill(
	code: string,
	send: Send = fetch
): Promise<Opened | { problem: Problem }> {
	const place = await placeFor(code);
	const response = await send(address(place)).catch(() => undefined);
	if (!response) return { problem: 'offline' };
	if (response.status === 404) return { problem: 'gone' };
	if (response.status !== 200) return { problem: 'server' };
	return (await unseal(place, new Uint8Array(await response.arrayBuffer()))) ?? { problem: 'gone' };
}

/** Deletes a shared bill, so its link stops opening. Only whoever shared it can. */
export async function deleteBill(
	{ code, token }: Shared,
	send: Send = fetch
): Promise<Problem | undefined> {
	const place = await placeFor(code);
	const response = await send(address(place), {
		method: 'DELETE',
		headers: authorization(token)
	}).catch(() => undefined);
	if (!response) return 'offline';
	// Already gone, by time or by an earlier delete: what was asked for is done.
	if (response.status === 204 || response.status === 404) return undefined;
	if (response.status === 403) return 'not-yours';
	return 'server';
}

/* ─── What this device shared ─── */

// The tokens of bills shared from this device, so whoever shared one can delete it later, even
// after closing the page. Kept in this browser only, and dropped when the bill expires. Storage
// can be missing or full (a private window, blocked site data): sharing still works without it,
// there's just no deleting later.

const STORAGE_KEY = 'split-bill-shared';

type Kept = Record<string, { token: string; expiresAt: number }>;

function readKept(now: number): Kept {
	try {
		const kept: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
		if (typeof kept !== 'object' || kept === null) return {};
		return Object.fromEntries(
			Object.entries(kept as Kept).filter(
				([, entry]) =>
					typeof entry?.token === 'string' &&
					typeof entry.expiresAt === 'number' &&
					entry.expiresAt > now
			)
		);
	} catch {
		return {};
	}
}

function writeKept(kept: Kept) {
	try {
		if (Object.keys(kept).length) localStorage.setItem(STORAGE_KEY, JSON.stringify(kept));
		else localStorage.removeItem(STORAGE_KEY);
	} catch {
		// Nowhere to keep it: see above.
	}
}

export function remember({ code, token }: Shared, now = Date.now()) {
	writeKept({ ...readKept(now), [code]: { token, expiresAt: now + LIFETIME } });
}

export function forget(code: string, now = Date.now()) {
	const kept = readKept(now);
	delete kept[code];
	writeKept(kept);
}

/** The bill this device shared under `code`, if it did and it hasn't expired. */
export function sharedHere(code: string, now = Date.now()): Shared | undefined {
	const entry = readKept(now)[code];
	return entry && { code, token: entry.token };
}
