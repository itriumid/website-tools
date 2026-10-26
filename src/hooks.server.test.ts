import { describe, expect, it, vi } from 'vitest';

// The bindings, the way the Cloudflare adapter's stand-in for `cloudflare:workers` finds them in
// the local preview: on a global it sets when the preview starts.
const share = vi.hoisted(() => {
	const share = {
		fetch: vi.fn(async (request: Request) => new Response(`bill: ${new URL(request.url).pathname}`))
	};
	Object.assign(globalThis, { __sveltekit_cloudflare_platform: { env: { SHARE: share } } });
	return share;
});

const { handle } = await import('./hooks.server');

const run = (path: string) => {
	const url = new URL(path, 'https://tools.itrium.id');
	const resolve = vi.fn(async () => new Response('page'));
	const event = { url, request: new Request(url) } as Parameters<typeof handle>[0]['event'];
	return { response: handle({ event, resolve }), resolve };
};

describe('the server hook', () => {
	it('hands shared bills to the share Worker', async () => {
		const { response, resolve } = run('/api/bills/abc');
		expect(await (await response).text()).toBe('bill: /api/bills/abc');
		expect(resolve).not.toHaveBeenCalled();
	});

	it('leaves everything else to SvelteKit', async () => {
		const { response } = run('/');
		expect(await (await response).text()).toBe('page');
		expect(share.fetch).not.toHaveBeenCalled();
	});
});
