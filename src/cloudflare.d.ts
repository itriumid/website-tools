// The part of Cloudflare's runtime the site's server code uses: the bindings in `wrangler.jsonc`.
// Cloudflare's full types are only loaded for the share Worker (`share/`).
declare module 'cloudflare:workers' {
	export const env: {
		/** The share Worker (`share/`). Missing in the local preview, which doesn't run it. */
		SHARE?: { fetch(request: Request): Promise<Response> };
	};
}
