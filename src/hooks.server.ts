// The pages are static; the only requests that reach code here are for shared bills, which are
// handed to their own Worker (`share/`) through a service binding. It has no address of its own,
// so this is the only way in.
//
// Bindings come from `cloudflare:workers`, not `event.platform`: the Cloudflare adapter no longer
// passes them to SvelteKit with each request. The module is loaded only when a bill is asked
// for, because the local preview runs the build in Node, which can't load it at all; there, and
// anywhere else without the share Worker, bills answer 503.

import type { Handle } from '@sveltejs/kit/hooks';

export const handle: Handle = async ({ event, resolve }) => {
	if (!event.url.pathname.startsWith('/api/')) return resolve(event);
	const share = await import('cloudflare:workers').then(
		({ env }) => env.SHARE,
		() => undefined
	);
	if (!share) return new Response(null, { status: 503 });
	return share.fetch(event.request);
};
