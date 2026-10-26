import { beforeEach, describe, expect, it, vi } from 'vitest';
import { server } from '../../share/testing';
import {
	codeFromHash,
	deleteBill,
	forget,
	LIFETIME,
	openBill,
	remember,
	shareBill,
	sharedHere,
	SHORT_PREFIX,
	type Shared
} from './share';
import type { BillState } from './split-bill';

const bill: BillState = {
	people: [
		{ id: 'a', name: 'Ana' },
		{ id: 'b', name: 'Budi' }
	],
	items: [{ id: 'i', name: 'Nasi goreng', price: 25_000, assignedPersonIds: ['a', 'b'] }],
	taxPercentage: 10,
	servicePercentage: 5,
	currencyCode: 'IDR'
};

async function shared(send: ReturnType<typeof server>): Promise<Shared> {
	const result = await shareBill(bill, send);
	if ('problem' in result) throw new Error(result.problem);
	return result;
}

describe('short links', () => {
	it('carry a bill in sixteen characters, and anyone with the code opens it', async () => {
		const send = server();
		const { code } = await shared(send);
		expect(code).toMatch(/^[0-9A-HJKMNP-TV-Z]{16}$/);
		expect(codeFromHash(`${SHORT_PREFIX}${code}`)).toBe(code);
		expect(await openBill(code, send)).toEqual(bill);
		expect(await openBill(code, send)).toEqual(bill);
	});

	it('send the server neither the code nor the bill', async () => {
		const seen: string[] = [];
		const send = server();
		const { code } = await shared(async (input, init) => {
			seen.push(input, new TextDecoder().decode(init?.body as Uint8Array));
			return send(input, init);
		});
		const all = seen.join(' ');
		expect(all).not.toContain(code);
		expect(all).not.toContain('Nasi goreng');
		expect(all).not.toContain('Budi');
	});

	it('are deleted by whoever shared them', async () => {
		const send = server();
		const mine = await shared(send);
		expect(await deleteBill({ ...mine, token: 'x'.repeat(43) }, send)).toBe('not-yours');
		expect(await openBill(mine.code, send)).toEqual(bill);
		expect(await deleteBill(mine, send)).toBeUndefined();
		expect(await openBill(mine.code, send)).toEqual({ problem: 'gone' });
		// Deleting again finds nothing, which is what was asked for.
		expect(await deleteBill(mine, send)).toBeUndefined();
	});

	it('stop opening after thirty days', async () => {
		let now = 0;
		const send = server(() => now);
		const { code } = await shared(send);
		now = LIFETIME;
		expect(await openBill(code, send)).toEqual({ problem: 'gone' });
	});

	it('say what went wrong', async () => {
		const offline = () => Promise.reject(new TypeError('Failed to fetch'));
		expect(await shareBill(bill, offline)).toEqual({ problem: 'offline' });
		expect(await openBill('0'.repeat(16), offline)).toEqual({ problem: 'offline' });
		expect(await openBill('0'.repeat(16), server())).toEqual({ problem: 'gone' });
		const broken = async () => new Response(null, { status: 503 });
		expect(await shareBill(bill, broken)).toEqual({ problem: 'server' });
	});

	it('refuse a bill too large to keep, before sending it', async () => {
		const send = vi.fn(server());
		const huge: BillState = {
			...bill,
			// Random names barely compress, so this stays over the limit once compressed.
			items: Array.from({ length: 5_000 }, (_, index) => ({
				id: String(index),
				name: crypto.randomUUID(),
				price: index,
				assignedPersonIds: []
			}))
		};
		expect(await shareBill(huge, send)).toEqual({ problem: 'too-large' });
		expect(send).not.toHaveBeenCalled();
	});

	it('only take codes that could be codes', () => {
		expect(codeFromHash('#bill=too-short')).toBeUndefined();
		expect(codeFromHash('#bill=ILOUILOUILOUILOU')).toBeUndefined();
		expect(codeFromHash('#data=0123456789ABCDEF')).toBeUndefined();
		expect(codeFromHash('#bill=0123456789abcdef')).toBe('0123456789ABCDEF');
	});

	it("don't open a bill that was tampered with", async () => {
		const send = server();
		const { code } = await shared(send);
		const tampered = async (input: string, init?: RequestInit) => {
			const response = await send(input, init);
			const bytes = new Uint8Array(await response.arrayBuffer());
			bytes[bytes.length - 1] ^= 1;
			return new Response(bytes, { status: response.status });
		};
		expect(await openBill(code, tampered)).toEqual({ problem: 'gone' });
	});
});

describe('what this device shared', () => {
	beforeEach(() => {
		const items = new Map<string, string>();
		vi.stubGlobal('localStorage', {
			getItem: (key: string) => items.get(key) ?? null,
			setItem: (key: string, value: string) => void items.set(key, value),
			removeItem: (key: string) => void items.delete(key)
		});
	});

	it('remembers a token until the bill expires, or until it is forgotten', () => {
		remember({ code: 'A', token: 'one' }, 0);
		remember({ code: 'B', token: 'two' }, 0);
		expect(sharedHere('A', 1)).toEqual({ code: 'A', token: 'one' });
		expect(sharedHere('A', LIFETIME)).toBeUndefined();
		forget('B', 1);
		expect(sharedHere('B', 1)).toBeUndefined();
		expect(sharedHere('A', 1)).toEqual({ code: 'A', token: 'one' });
	});

	it('shares without remembering when there is nowhere to keep it', () => {
		vi.stubGlobal('localStorage', {
			getItem: () => {
				throw new Error('blocked');
			},
			setItem: () => {
				throw new Error('blocked');
			},
			removeItem: () => {
				throw new Error('blocked');
			}
		});
		expect(() => remember({ code: 'A', token: 'one' })).not.toThrow();
		expect(sharedHere('A')).toBeUndefined();
	});
});
