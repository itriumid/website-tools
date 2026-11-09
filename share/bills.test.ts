import { describe, expect, it } from 'vitest';
import { handle, LIFETIME, LIMIT, type Storage } from './bills';
import { memory } from './testing';

const OWNER = 'o'.repeat(43);
const SOMEONE_ELSE = 's'.repeat(43);

async function send(
	storage: Storage,
	method: string,
	{ body, token, now = 1_000 }: { body?: string | Uint8Array; token?: string; now?: number } = {}
): Promise<{ status: number; text: string }> {
	const headers = token ? { authorization: `Bearer ${token}` } : undefined;
	const request = new Request('https://tools.itrium.id/', { method, body, headers });
	const response = await handle(request, storage, now);
	return { status: response.status, text: await response.text() };
}

describe('a shared bill', () => {
	it('opens as often as anyone likes', async () => {
		const { storage } = memory();
		expect(await send(storage, 'PUT', { body: 'the bill', token: OWNER })).toMatchObject({
			status: 201
		});
		for (let time = 0; time < 3; time += 1) {
			expect(await send(storage, 'GET')).toEqual({ status: 200, text: 'the bill' });
		}
	});

	it('is changed by whoever shared it, under the same name', async () => {
		const { storage } = memory();
		await send(storage, 'PUT', { body: 'first', token: OWNER });
		expect(await send(storage, 'PUT', { body: 'again', token: OWNER })).toMatchObject({
			status: 200
		});
		expect(await send(storage, 'GET')).toEqual({ status: 200, text: 'again' });
	});

	it('is changed by nobody else', async () => {
		const { storage } = memory();
		await send(storage, 'PUT', { body: 'first', token: OWNER });
		expect(await send(storage, 'PUT', { body: 'theirs', token: SOMEONE_ELSE })).toMatchObject({
			status: 403
		});
		expect(await send(storage, 'PUT', { body: 'theirs' })).toMatchObject({ status: 401 });
		expect(await send(storage, 'GET')).toMatchObject({ text: 'first' });
		// The owner stays the owner: their token still deletes it, nobody else's does.
		expect(await send(storage, 'DELETE', { token: SOMEONE_ELSE })).toMatchObject({ status: 403 });
		expect(await send(storage, 'DELETE', { token: OWNER })).toMatchObject({ status: 204 });
	});

	it('starts its thirty days again when it changes', async () => {
		const { storage, alarm } = memory();
		await send(storage, 'PUT', { body: 'first', token: OWNER, now: 1_000 });
		const later = 1_000 + LIFETIME - 10;
		await send(storage, 'PUT', { body: 'changed', token: OWNER, now: later });
		expect(alarm()).toBe(later + LIFETIME);
		expect(await send(storage, 'GET', { now: 1_000 + LIFETIME })).toEqual({
			status: 200,
			text: 'changed'
		});
		expect(await send(storage, 'GET', { now: later + LIFETIME })).toMatchObject({ status: 404 });
	});

	it("isn't changed by a wrong token or a bad body, and keeps its time", async () => {
		const { storage, alarm } = memory();
		await send(storage, 'PUT', { body: 'first', token: OWNER, now: 1_000 });
		await send(storage, 'PUT', { body: 'theirs', token: SOMEONE_ELSE, now: 5_000 });
		expect(await send(storage, 'PUT', { body: '', token: OWNER, now: 5_000 })).toMatchObject({
			status: 400
		});
		expect(
			await send(storage, 'PUT', { body: new Uint8Array(LIMIT + 1), token: OWNER, now: 5_000 })
		).toMatchObject({ status: 413 });
		expect(alarm()).toBe(1_000 + LIFETIME);
		expect(await send(storage, 'GET')).toMatchObject({ text: 'first' });
	});

	it('is shared afresh once its time is up', async () => {
		const { storage } = memory();
		await send(storage, 'PUT', { body: 'old', token: OWNER, now: 1_000 });
		expect(
			await send(storage, 'PUT', { body: 'new', token: SOMEONE_ELSE, now: 1_000 + LIFETIME })
		).toMatchObject({ status: 201 });
	});

	it('needs a token to be shared', async () => {
		const { storage, isEmpty } = memory();
		expect(await send(storage, 'PUT', { body: 'the bill' })).toMatchObject({ status: 401 });
		expect(await send(storage, 'PUT', { body: 'the bill', token: 'short' })).toMatchObject({
			status: 401
		});
		expect(isEmpty()).toBe(true);
	});

	it('is deleted by whoever shared it, and nobody else', async () => {
		const { storage, isEmpty } = memory();
		await send(storage, 'PUT', { body: 'the bill', token: OWNER });
		expect(await send(storage, 'DELETE')).toMatchObject({ status: 401 });
		expect(await send(storage, 'DELETE', { token: SOMEONE_ELSE })).toMatchObject({ status: 403 });
		expect(await send(storage, 'GET')).toMatchObject({ status: 200 });
		expect(await send(storage, 'DELETE', { token: OWNER })).toMatchObject({ status: 204 });
		expect(isEmpty()).toBe(true);
		expect(await send(storage, 'GET')).toMatchObject({ status: 404 });
		expect(await send(storage, 'DELETE', { token: OWNER })).toMatchObject({ status: 404 });
	});

	it('keeps a hash of the token, not the token', async () => {
		const { storage } = memory();
		await send(storage, 'PUT', { body: 'the bill', token: OWNER });
		expect(JSON.stringify(await storage.get('contents'))).not.toContain(OWNER);
	});

	it('is deleted after thirty days, even before its alarm goes off', async () => {
		const { storage, alarm, isEmpty } = memory();
		await send(storage, 'PUT', { body: 'soon gone', token: OWNER, now: 1_000 });
		expect(alarm()).toBe(1_000 + LIFETIME);
		expect(await send(storage, 'GET', { now: 1_000 + LIFETIME - 1 })).toMatchObject({
			status: 200
		});
		expect(await send(storage, 'GET', { now: 1_000 + LIFETIME })).toMatchObject({ status: 404 });
		expect(isEmpty()).toBe(true);
	});

	it('takes nothing empty and nothing over the limit', async () => {
		const { storage, isEmpty } = memory();
		expect(await send(storage, 'PUT', { body: '', token: OWNER })).toMatchObject({ status: 400 });
		expect(
			await send(storage, 'PUT', { body: new Uint8Array(LIMIT + 1), token: OWNER })
		).toMatchObject({ status: 413 });
		expect(isEmpty()).toBe(true);
		expect(await send(storage, 'PUT', { body: new Uint8Array(LIMIT), token: OWNER })).toMatchObject(
			{ status: 201 }
		);
	});

	it('answers nothing else', async () => {
		const { storage } = memory();
		expect(await send(storage, 'POST', { body: 'x', token: OWNER })).toMatchObject({
			status: 405
		});
	});
});
