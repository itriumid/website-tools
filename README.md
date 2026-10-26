# tools.itrium.id

[Itrium](https://itrium.id)'s free web tools, live at [tools.itrium.id](https://tools.itrium.id):

- **WhatsApp click-to-chat**: make a link that opens a WhatsApp chat with any phone number.
- **Split bill**: split a bill fairly, with tax and service, and share it as a short link.

They run in your browser. There's no account, no cookies, no analytics, and nothing you type is
sent to a server, except a bill you share, and that only encrypted. A strict
Content-Security-Policy (set in [`vite.config.ts`](vite.config.ts) and [`_headers`](_headers))
allows scripts and files from the site itself and nothing else, and blocks every connection that
isn't to the site.

## How sharing a bill works

1. The page makes a random 16-character code. From it, it derives two things: a name for the
   bill and an encryption key. The code itself never leaves the browser.
2. The bill is compressed, encrypted with that key (AES-GCM), and left on our server under the
   name, in a Worker of its own ([`share/`](share)). The link is the page's address plus
   `#bill=` and the code, and the part after the `#` is never sent to a server.
3. Whoever opens the link derives the same name and key, fetches the bill, and decrypts it.
4. The server deletes the bill after 30 days. Whoever shared it can delete it sooner from the
   same browser, which keeps a token for it; the server keeps only a hash of that token.

If the server can't be reached, the page copies a long link instead, holding the whole bill
after the `#` like the links from before short links existed. Those keep opening.

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
