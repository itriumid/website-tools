# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Anyone, anywhere, who has a small job to get done and no wish to sign up for anything to do it.
The audience is global. The tools started in Indonesia, which is why Indonesian rupiah is the
default currency, Indonesian phone numbers are read the way people type them, and Indonesian
receipt conventions (tax charged on service) are the default for new bills in rupiah. Those
defaults stay, but future decisions should not assume the visitor is Indonesian.

The jobs are:

- **Split bill:** a group at a restaurant table, usually one person holding a phone in one hand,
  turning a receipt into what each person owes, then sending it to the group chat or as a link.
  The people who open that link are users too: they need to see their share on a phone, without
  context or an account.
- **WhatsApp click-to-chat:** someone who wants to message a phone number without saving it as
  a contact, or who needs a link that opens a chat with their own number (for a shop, a profile,
  a printed card).

## Product Purpose

Small, free web tools for small jobs, from Itrium. They exist as goodwill and as proof of craft:
they are useful and respectful, and they show what Itrium cares about, which is privacy,
accessibility and finish. They are not a sales funnel.

Success means people come back to the tools and share their links with others. It does not
mean clicks through to itrium.id.

## Positioning

Most free utilities pay for themselves with accounts, advertisements and tracking. These tools
run entirely in the browser: no account, no cookies, no analytics, and no requests to other
domains. The one thing that ever reaches a server, a bill someone chooses to share, is
encrypted with a key that only exists in the link, so Itrium can't read it. A strict
Content-Security-Policy enforces this, and the source is public, so the claim can be checked,
not just taken on trust.

## Operating Context

- Mostly phones, often used one-handed, often in a noisy restaurant with a group waiting.
- Receipts are read from text the phone's own text recognition gives (Scan Text on iPhone,
  Live Text, Google Lens) and pasted in. The site never uploads a photo; one picked for
  reference stays on the device.
- Results leave the site through the group chat: a short `#bill=` link, a long `#data=` link
  when the server can't be reached, or the split copied as plain text.
- A draft of the bill in progress survives switching to the camera and back
  (`sessionStorage`, cleared when the tab closes).

## Capabilities and Constraints

- Pages: `/` (the index of tools), `/split-bill`, `/whatsapp-click-to-chat`. Bigger tools from
  Itrium that run in the browser, such as Amber, get sites of their own and are linked from
  the index, not built here.
- Shared bills are kept for 30 days after they were last shared, at most 64 KB, and can be
  updated or deleted early only from the browser that shared them.
- Shared links of both kinds, including links made on zakir.id before the move, must keep
  opening.
- No new connections, third-party resources, inline styles or `data:` URLs; the
  Content-Security-Policy is not loosened to make a feature work. See `AGENTS.md` for the full
  list.
- No native `<select>`: it breaks the style policy in WebKit.
- What a tool decides lives in `src/lib/*.ts` with tests, not in components.
- Copy is in English. **Open decision:** Indonesian copy is planned later, so layouts should
  leave room for longer strings, and copy stays in `src/lib/content.ts` where it can be
  translated. How a language is chosen (switcher, path, detection) is not decided yet.

## Brand Commitments

- Itrium's own site: Rhodonite palette only, with no palette picker. Pink marks the primary
  action and focus, nothing else. Rules in `.handbook/conventions/reference/brand.md`.
- Plus Jakarta Sans, served from the site itself.
- Logo and brand files are copies from `~/Itrium/Assets`; they are regenerated there, never
  edited here.
- Voice: Itrium's. It says "we", uses plain words and no abbreviations, and explains what
  happens to people's data in concrete terms. Every wording change is shown to the owner
  before it is committed.
- The footer's promise ("no cookies, no analytics and no trackers") is a commitment the site
  must keep true.

## Evidence on Hand

- The source code is public: https://github.com/itriumid/website-tools.
- Two real receipts, as text recognition read them and made anonymous, are in the receipt
  tests. They are test material, not marketing material.
- There are no testimonials, user counts, usage statistics or press, and there can't be any
  usage statistics, because the site collects none. Future work must not invent them.

## Product Principles

1. **Nothing leaves the device unless the person sends it,** and then only encrypted. A feature
   that needs more doesn't ship.
2. **Built for the table, not the desk.** A phone, one hand, a group waiting, and a receipt that
   was misread: that's the normal case to design for.
3. **Explain, don't hide.** Say plainly what was read, what couldn't be checked, and what
   happens to the data. Show details when asked, next to the thing they explain.
4. **Links are promises.** What has been shared keeps working.
5. **Craft is the pitch.** No upsell. The tools persuade by being careful.

## Accessibility & Inclusion

Level AA of the Web Content Accessibility Guidelines everywhere: contrast on every surface,
every control named and reachable by keyboard, and state never shown by color alone. Fields and
buttons use `--control-border`, which reaches 3:1.
