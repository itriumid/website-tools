# tools.itrium.id

[Itrium](https://itrium.id)'s free web tools, live at [tools.itrium.id](https://tools.itrium.id):

- **WhatsApp click-to-chat**: make a link that opens a WhatsApp chat with any phone number.
- **Split bill**: split a bill fairly, with tax and service, and share it as a link.

They run in your browser. There's no account, no cookies, no analytics, and nothing you type is
sent to a server: a shared bill lives in the part of the address after the `#`, which browsers
never send. A strict Content-Security-Policy (set in [`vite.config.ts`](vite.config.ts) and
[`_headers`](_headers)) allows scripts and files from the site itself and nothing else, and
blocks every connection that isn't to the site.

## Stack

[SvelteKit](https://svelte.dev/docs/kit) with TypeScript and [Tailwind CSS](https://tailwindcss.com),
prerendered and served by [Cloudflare Workers](https://developers.cloudflare.com/workers/).
Cloudflare builds and deploys `main` itself, so merging a pull request publishes it.

## Developing

```sh
pnpm install
pnpm dev
```

| What          | Command                             |
| ------------- | ----------------------------------- |
| Type-check    | `pnpm check`                        |
| Lint          | `pnpm lint` (Prettier, then ESLint) |
| Format        | `pnpm format`                       |
| Test          | `pnpm test`                         |
| Build         | `pnpm build`                        |
| Preview build | `pnpm build && pnpm preview`        |

The rules of each tool (how a bill is divided and shared, how a chat link is built) are in
[`src/lib/split-bill.ts`](src/lib/split-bill.ts) and [`src/lib/whatsapp.ts`](src/lib/whatsapp.ts),
apart from the pages, and are tested. The text of every page is in
[`src/lib/content.ts`](src/lib/content.ts).

## History

These tools started on [zakir.id](https://zakir.id) and moved here. Links people already shared
keep working: a Split Bill link made there opens the same bill here.

## License

The code is [MIT](LICENSE). The Itrium name and logo aren't covered by it: please don't use
them for your own work.
