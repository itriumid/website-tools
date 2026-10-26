// Where a shared bill waits for the people it was shared with. The page leaves the bill here,
// encrypted with a key that's only in the link, so nothing here can read it; anyone with the link
// can open it as often as they like, for thirty days; then it's deleted, or sooner, by whoever
// shared it.
//
// These are the rules alone, apart from Cloudflare, so they can be tested anywhere. The Durable
// Object in `index.ts` gives them storage and a clock.

/** How long a shared bill is kept before it's deleted. */
export const LIFETIME = 30 * 24 * 60 * 60 * 1000;
/** The most a bill may take: a long bill, compressed and encrypted, fits many times over. */
export const LIMIT = 64 * 1024;

/** A bill's name: a hash of the code in the link, 32 bytes in base64url, so the code never comes here. */
export const NAME = /^[A-Za-z0-9_-]{43}$/;
/** `/api/bills/<name>`. */
export const ADDRESS = /^\/api\/bills\/([^/]+)$/;
/** What proves who shared a bill: 32 random bytes in base64url, kept on their device. */
const TOKEN = /^Bearer ([A-Za-z0-9_-]{43})$/;

export interface Storage {
	get<T>(key: string): Promise<T | undefined>;
	put(key: string, value: unknown): Promise<void>;
	deleteAll(): Promise<void>;
	setAlarm(time: number): Promise<void>;
}

interface Contents {
	sharedAt: number;
	bill: ArrayBuffer;
	/** A hash of the token of whoever shared it. The token itself isn't kept. */
	owner: string;
}

const KEY = 'contents';
const empty = (status: number) => new Response(null, { status });

async function hash(token: string): Promise<string> {
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
	return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

const tokenOf = (request: Request) => TOKEN.exec(request.headers.get('authorization') ?? '')?.[1];

async function body(request: Request): Promise<ArrayBuffer | Response> {
	const declared = Number(request.headers.get('content-length') ?? 0);
	if (declared > LIMIT) return empty(413);
	const bytes = await request.arrayBuffer();
	if (bytes.byteLength > LIMIT) return empty(413);
	if (!bytes.byteLength) return empty(400);
	return bytes;
}

/** Answers one request for a shared bill. */
export async function handle(request: Request, storage: Storage, now: number): Promise<Response> {
	let contents = await storage.get<Contents>(KEY);
	if (contents && now - contents.sharedAt >= LIFETIME) {
		// Past its time, even if the alarm hasn't gone off yet.
		await storage.deleteAll();
		contents = undefined;
	}

	if (request.method === 'GET') {
		if (!contents) return empty(404);
		return new Response(contents.bill, {
			headers: { 'content-type': 'application/octet-stream', 'cache-control': 'no-store' }
		});
	}

	if (request.method === 'PUT') {
		const token = tokenOf(request);
		if (!token) return empty(401);
		// A bill never changes once shared: a changed bill is shared again, under a new code.
		if (contents) return empty(409);
		const bill = await body(request);
		if (bill instanceof Response) return bill;
		await storage.put(KEY, { sharedAt: now, bill, owner: await hash(token) } satisfies Contents);
		await storage.setAlarm(now + LIFETIME);
		return empty(201);
	}

	if (request.method === 'DELETE') {
		const token = tokenOf(request);
		if (!token) return empty(401);
		if (!contents) return empty(404);
		if ((await hash(token)) !== contents.owner) return empty(403);
		await storage.deleteAll();
		return empty(204);
	}

	return empty(405);
}
