// Stand-ins for Cloudflare, for tests: storage kept in memory, and a server that sends each
// request to its bill the way `index.ts` does, with the same rules.

import { ADDRESS, handle, NAME, type Storage } from './bills';

/** Storage kept in memory, standing in for a Durable Object's. */
export function memory() {
	let data = new Map<string, unknown>();
	let alarm: number | undefined;
	const storage: Storage = {
		get: async <T>(key: string) => structuredClone(data.get(key)) as T | undefined,
		put: async (key, value) => void data.set(key, structuredClone(value)),
		deleteAll: async () => {
			data = new Map();
		},
		setAlarm: async (time) => {
			alarm = time;
		}
	};
	return { storage, alarm: () => alarm, isEmpty: () => data.size === 0 };
}

/** Every bill, each with its own storage, answering at `/api/bills/`. */
export function server(now = Date.now) {
	const bills = new Map<string, Storage>();
	return async (input: string, init?: RequestInit): Promise<Response> => {
		const request = new Request(new URL(input, 'https://tools.itrium.id'), init);
		const match = ADDRESS.exec(new URL(request.url).pathname);
		if (!match || !NAME.test(match[1])) return new Response(null, { status: 404 });
		let storage = bills.get(match[1]);
		if (!storage) bills.set(match[1], (storage = memory().storage));
		return handle(request, storage, now());
	};
}
