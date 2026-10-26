// Shared bills on Cloudflare. The Worker checks the address and hands each request to the Durable
// Object for that bill, which applies the rules in `bills.ts`. Each bill lives in its own Durable
// Object, so bills never share storage, and an alarm deletes each one when its time is up.

import { DurableObject } from 'cloudflare:workers';
import { ADDRESS, handle, NAME } from './bills';

export class Bill extends DurableObject<Env> {
	async fetch(request: Request): Promise<Response> {
		return handle(request, this.ctx.storage, Date.now());
	}

	async alarm() {
		await this.ctx.storage.deleteAll();
	}
}

export default {
	async fetch(request, env) {
		const match = ADDRESS.exec(new URL(request.url).pathname);
		if (!match || !NAME.test(match[1])) return new Response(null, { status: 404 });
		return env.BILL.get(env.BILL.idFromName(match[1])).fetch(request);
	}
} satisfies ExportedHandler<Env>;
