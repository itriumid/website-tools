---
name: tools.itrium.id
description: The Rhodonite Specimen, put to work. Itrium's free tools, in the same stone as itrium.id.
colors:
  graphite: '#2b2b2b'
  graphite-surface: '#343434'
  graphite-border: '#474747'
  graphite-raised: '#3d3d3d'
  graphite-raised-border: '#4f4f4f'
  off-white: '#f2f2f2'
  muted-gray-on-dark: '#aaaaaa'
  control-edge-on-dark: '#8a8a8a'
  pastel-pink: '#febfca'
  paper: '#fafafa'
  paper-surface: '#ffffff'
  paper-border: '#e4e4e4'
  muted-gray-on-light: '#6b6b6b'
  control-edge-on-light: '#767676'
  deep-rose: '#c46475'
  rose-text: '#a84d60'
typography:
  display:
    fontFamily: "'Plus Jakarta Sans Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: '4.5rem'
    fontWeight: 700
    lineHeight: 1
    letterSpacing: '-0.025em'
  headline:
    fontFamily: "'Plus Jakarta Sans Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: '2.25rem'
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: '-0.025em'
  card-title:
    fontFamily: "'Plus Jakarta Sans Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: '1.25rem'
    fontWeight: 600
    lineHeight: 1.4
  title:
    fontFamily: "'Plus Jakarta Sans Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: '1.125rem'
    fontWeight: 600
    lineHeight: 1.55
  lead:
    fontFamily: "'Plus Jakarta Sans Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: '1.125rem'
    fontWeight: 400
    lineHeight: 1.625
  body:
    fontFamily: "'Plus Jakarta Sans Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: '1rem'
    fontWeight: 400
    lineHeight: 1.5
  control:
    fontFamily: "'Plus Jakarta Sans Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: '0.875rem'
    fontWeight: 400
    lineHeight: 1.43
  label:
    fontFamily: "'Plus Jakarta Sans Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: '0.875rem'
    fontWeight: 500
    lineHeight: 1.43
  button:
    fontFamily: "'Plus Jakarta Sans Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: '0.875rem'
    fontWeight: 600
    lineHeight: 1.43
rounded:
  focus: '4px'
  sm: '0.5rem'
  md: '0.75rem'
  lg: '1rem'
  xl: '1.5rem'
  full: '9999px'
spacing:
  gutter-panel: '0.75rem'
  gutter-phone: '1.25rem'
  gutter-wide: '2rem'
  card: '1.25rem'
  card-wide: '1.5rem'
  section: '5rem'
  control-compact: '2.25rem'
  touch-target: '2.75rem'
  form-width: '36rem'
  tool-width: '42rem'
  content-width: '64rem'
  panel-width: '72rem'
components:
  button-primary:
    backgroundColor: '{colors.pastel-pink}'
    textColor: '{colors.graphite}'
    rounded: '{rounded.full}'
    padding: '0.75rem 1.5rem'
    typography: '{typography.button}'
  button-secondary:
    backgroundColor: 'transparent'
    textColor: '{colors.off-white}'
    rounded: '{rounded.full}'
    padding: '0.75rem 1.5rem'
    typography: '{typography.label}'
  button-secondary-hover:
    backgroundColor: '{colors.graphite}'
  button-small:
    backgroundColor: 'transparent'
    rounded: '{rounded.full}'
    padding: '0 1rem'
    height: '{spacing.control-compact}'
    typography: '{typography.label}'
  field:
    backgroundColor: '{colors.graphite}'
    textColor: '{colors.off-white}'
    rounded: '{rounded.sm}'
    padding: '0.625rem 0.75rem'
    typography: '{typography.control}'
  tag-chip:
    backgroundColor: 'transparent'
    rounded: '{rounded.full}'
    padding: '0 0.875rem'
    height: '{spacing.control-compact}'
    typography: '{typography.control}'
  tag-chip-selected:
    backgroundColor: '{colors.pastel-pink}'
    textColor: '{colors.graphite}'
    rounded: '{rounded.full}'
  card:
    backgroundColor: '{colors.graphite-surface}'
    rounded: '{rounded.lg}'
    padding: '{spacing.card}'
  inset-list:
    backgroundColor: '{colors.graphite}'
    rounded: '{rounded.md}'
  tool-card:
    backgroundColor: '{colors.graphite-surface}'
    rounded: '{rounded.lg}'
    padding: '{spacing.card-wide}'
  graphite-panel:
    backgroundColor: '{colors.graphite}'
    textColor: '{colors.off-white}'
    rounded: '{rounded.xl}'
    width: '{spacing.panel-width}'
  title-band:
    backgroundColor: '{colors.graphite}'
    textColor: '{colors.off-white}'
    rounded: '{rounded.xl}'
    typography: '{typography.headline}'
  running-total:
    backgroundColor: '{colors.graphite-surface}'
    padding: '0.75rem 1.25rem'
  skip-link:
    backgroundColor: '{colors.pastel-pink}'
    textColor: '{colors.graphite}'
    rounded: '{rounded.sm}'
    padding: '0.5rem 1rem'
---

# Design System: tools.itrium.id

## Overview

**Creative North Star: "The Rhodonite Specimen, put to work"**

The tools are cut from the same stone as itrium.id. That site is The Rhodonite Specimen (`DESIGN.md` in the `website` repository): a graphite matrix with a pink vein, where gray is
the body and pink marks what a visitor should find. Here the specimen leaves the display case and
goes onto the workbench. The world is the same: Plus Jakarta Sans for everything, graphite and
paper, pastel pink with its two deepenings, flat tonal surfaces, pills and soft corners, one drawn
arrow. Only the job changes. itrium.id persuades; a tool gets out of the way. On the index the
stone is on show, with full graphite slabs, big type and cards that lift. On a tool page the slab
shrinks to a slim title band and the work starts directly under it, because the person using it
is at a restaurant table with a phone in one hand and a group waiting.

Components are soft and sure-footed, and tactile without being playful. Every control has a
round, generous target that a thumb finds the first time (2.75rem on touch screens) and an edge
you can see (3:1 against the page and the card). They feel good to press but never perform.
Density is calm but working: forms sit in a narrow column of 36 to 42rem, inset lists and notes
nest one tonal step down inside cards, and the running total stays at the bottom of a phone's
screen while the bill is made.

Light and dark are equal. Each follows the visitor's system, and neither is a courtesy version of
the other: every new pairing is designed and checked in both. The system refuses what itrium.id
refuses: generic SaaS ornament (gradient text, icon-card rows, invented numbers), drop shadows on
anything but a floating list, pure black and white, decorative pink, and small labels above
headings. It also refuses what only a tool can get wrong: a hero that pushes the tool off a phone
screen, and state shown by color alone.

**Key Characteristics:**

- One stone with itrium.id: the same tokens, typeface, radii, button shapes and arrow.
- The index opens and closes with full graphite panels. A tool page opens with a slim title band,
  then the tool.
- Light and dark are equal, and both follow the system. There's no toggle.
- Flat surfaces with tonal steps. The only shadow is under the open searchable list.
- Every control has a 3:1 edge (`--control-border`), a target at least 2.75rem tall on touch
  screens, and 16px text on touch screens so iOS doesn't zoom.
- Pink marks the primary action, focus, what's selected, and the way onward, and nothing else.
- Motion is CSS only and off under reduced motion.

## Colors

Rhodonite, as itrium.id applies it, plus the two edge grays that the tools' controls need. The
tokens live in `src/app.css` as `--bg`, `--surface`, `--border`, `--text`, `--muted`, `--accent`,
`--on-accent`, `--accent-edge`, `--control-border` and `--focus`. Each swaps value between the
dark default and `prefers-color-scheme: light`. The binding rules are in the handbook's
`itrium/brand.md`.

### Primary

- **Pastel pink** (`pastel-pink`): the accent, always as a fill. The primary button, the selected
  tag chip, the selection highlight and the skip link. On graphite it's also the focus outline,
  the line of a state, and pink text.
- **Deep rose** (`deep-rose`): pink as a line on light backgrounds (`--accent-edge`). The edge of
  a selected chip, an unsure receipt line, a note's edge, a card's hover edge, and the checked
  box or radio button. It reaches 3:1 on white.
- **Rose text** (`rose-text`): pink as text on light backgrounds (`--accent-text`). Action lines
  with the arrow, such as "Open Split bill". 4.8:1 on paper, 5.4:1 on
  white: AA with little headroom, so never put it on a pink tint.

### Neutral

- **Graphite** (`graphite`): the dark page, the field fill and inset lists in dark mode, the
  graphite panels in both themes, light mode's text, and the text on pink, always.
- **Graphite surface** (`graphite-surface`) and **graphite border** (`graphite-border`): cards and
  their dividing lines in dark mode, and the running total's bar. Inside a panel in dark mode, the
  panel steps up to graphite surface and its cards to **graphite raised** (`graphite-raised`) with
  **graphite raised border** (`graphite-raised-border`), as on itrium.id.
- **Off-white** (`off-white`): text on graphite.
- **Muted gray on dark** (`muted-gray-on-dark`) and **muted gray on light**
  (`muted-gray-on-light`): secondary text such as introductions, hints, legends, the footer and the
  navigation. The lighter one stays at 4.6:1 even on graphite raised.
- **Control edge on dark** (`control-edge-on-dark`) and **control edge on light**
  (`control-edge-on-light`): the border of every field, button, chip and floating list
  (`--control-border`). They reach 3:1 against both the page and a card, where the softer border
  colors don't.
- **Paper** (`paper`), **paper surface** (`paper-surface`) and **paper border** (`paper-border`):
  light mode's page (and field fill), cards and dividing lines.

### Named Rules

**The Vein Rule.** Pink marks something: the primary action, focus, what's selected, or the way
onward. If you can't say what a pink element marks, it should be gray. In a tool, one pink button
per view.

**The Two Borders Rule.** `--border` is for lines nothing depends on, such as card edges and
dividers. Anything a person has to find in order to use it gets `--control-border`.

**The Graphite Text Rule.** Text on pink is graphite, never white. On light backgrounds pink text
is rose text and pink lines are deep rose. Pastel pink is never text or a line there.

**The Every-Surface Rule.** Contrast is checked on every surface text sits on: page, card, inset
list, note and running total, in both themes. Text needs 4.5:1. Focus outlines, control edges and
state lines need 3:1.

## Typography

**Display Font:** Plus Jakarta Sans Variable (with `ui-sans-serif, system-ui, sans-serif`)
**Body Font:** Plus Jakarta Sans Variable, the same file

**Character:** One variable typeface from the Indonesian foundry Tokotype carries every role, the
same as on itrium.id. Hierarchy comes from weight and size alone: bold, tightly tracked headings
in sentence case and plain, readable working text. It's served from the site itself.

### Hierarchy

- **Display** (`display`): the index's title in its graphite panel. 3rem on phones, the token size
  from 640 px. The error page's heading uses it too.
- **Headline** (`headline`): a tool's title in its title band. 1.875rem on phones, the token size
  from 640 px.
- **Card title** (`card-title`): a tool's name on the index card.
- **Title** (`title`): a section card's heading inside a tool (`cardHeading`), semibold.
- **Lead** (`lead`): longer introductions, muted, at most about 42rem wide. The index's tagline
  is larger (1.5rem, then 1.875rem from 640 px, medium weight) and in the text color.
- **Body** (`body`): a tool's introduction and running prose.
- **Control** (`control`): field text, chips, notes, hints and amounts, at 0.875rem. On touch
  screens field text rises to 1rem (`pointer-coarse:text-base`) so iOS Safari doesn't zoom the
  page.
- **Label** (`label`): field labels, secondary and small button labels, navigation.
- **Button** (`button`): the primary button's label, semibold.

Amounts that line up or change in place (counts, the running total) use tabular figures.

### Named Rules

**The One Typeface Rule.** Plus Jakarta Sans does everything. Never add a second family, and never
load a font from another domain.

**The No Kicker Rule.** A heading is the first thing in its block. No eyebrow, category label,
small uppercase heading or back link sits above it. Nothing here is set in uppercase.

## Layout

- **Widths:** header, footer and the index sit in the 64rem content column (`content-width`).
  Graphite panels are wider, at 72rem (`panel-width`), and inset from the viewport by 0.75 to
  1.25rem (`gutter-panel`). A tool sits in a narrow working column: 36rem (`form-width`) for a
  single form like WhatsApp click-to-chat, 42rem (`tool-width`) for Split bill.
- **Gutters:** 1.25rem on phones (`gutter-phone`), 2rem from 640 px (`gutter-wide`).
- **Rhythm:** a page ends with 5rem of space (`section`). Within a tool, cards stack 1.25 to 1.5rem
  apart, and fields and their hints step in 0.5rem to 1rem.
- **Index:** the opening slab (the title and a tagline naming the two jobs, in the text color), then
  the tool cards in one column, two from 640 px, Split bill first. Then a section heading and the
  cards for tools on sites of their own. A closing slab ends it: what stays on the device as a ruled
  list, and the source as a secondary button. On a screen under 44rem tall the panel and the gap
  under it tighten, so the first card's action line stays on a 390x667 phone's first screen;
  under 36rem of visible height (an iPhone SE in Safari shows about 548px) the cards' samples give
  way too, since the browser's own bars take what the device height promised. Above
  the cards, for someone in the middle of a bill, one line from what the browser already keeps (the
  draft in this tab, or the bills this device shared) with an action line to a shared one (a draft's
  way in is the Split bill card under it, whose action then says "Continue your bill", read to screen readers too, and
  whose sample gives way so a made-up bill isn't taken for theirs): shown after the
  page loads, never stored or sent, in the space already kept above the cards for everyone (up to
  two lines on a phone), so the cards don't move when it appears. While there's only one tool on a site of its own, its card takes
  the whole row from 640 px, text on the left and the action line on the right. Its
  address shows under the action line, since it leaves this site; screen readers skip it, as it
  only lengthened the link's name. The section heading
  over tools on sites of their own is a step smaller than the closing panel's, which is the page's
  last word.
- **Tool page:** a slim title band (title and introduction only, about 2rem of padding on phones),
  then the tool immediately. No closing panel, because the running total owns the bottom of the
  screen.
- **Split bill from 1024 px:** two columns in the 72rem width. The bill on the left; the split on
  the right in a 26rem column that stays in view (sticky, scrolling on its own when it's taller than
  the screen) and updates as the bill changes. Before any item, the column holds one muted line
  saying the split will show there. Below 1024 px it follows the bill in one column.
- **Phones:** every control is at least 2.75rem tall on touch screens (`touch-target`), and
  2.25rem (`control-compact`) with a fine pointer. Split bill's running total is sticky (not
  fixed) at the bottom below 1024 px, padded for the home indicator, and the page scrolls focused
  fields clear of it (`scroll-padding-bottom: 6rem`).
- **Breakpoints:** Tailwind's defaults, 640, 768 and 1024 px, plus `pointer-coarse` for touch
  sizing.

**The Slab Rule, for tools.** The index opens and closes with a graphite panel. A tool page opens
with a title band and never closes with one: on a phone, the tool comes before the frame.

**The First Screen Rule.** On a phone, the first field of a tool is visible without scrolling.
If a new element would push it down, it belongs lower on the page.

**The Answer In Reach Rule.** Wherever a tool is being filled in, its answer is one glance or one
tap away: the running total below 1024 px, the split's own column above. Someone opening a shared
result lands on it, not on the form that made it.

## Elevation & Depth

Surfaces are flat. Depth comes from tonal steps (page, then card, then an inset list or note one
step back down inside the card, then raised inside a panel) and from 1 px borders. The one shadow
is the floating list of the searchable select, which genuinely sits above the content and has to
be read against it. There are no glows, in either theme.

### Shadow Vocabulary

- **Floating list** (`box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`):
  the open option list of `SearchableSelect`, and anything else that floats over the page. Nothing
  else.

### Named Rules

**The Only Floating Things Cast Shadows Rule.** Cards, buttons, chips, bands and the running total
never get a drop shadow. A card responds by lifting 4 px and taking a pink edge. A control
responds by filling with the next tonal step.

## Shapes

Soft and rounded, with the radius growing with the size of the object, on the same scale as
itrium.id. Buttons, chips and the info button are pills (`full`). Fields, notes and floating lists
get 0.5rem (`sm`), and options inside a list a little less (0.375rem). Inset lists, receipt lines
and the receipt photo get 0.75rem (`md`). Cards get 1rem (`lg`). Panels and title bands get 1.5rem
(`xl`). The focus outline is 2 px at 4 px radius (`focus`), 3 px away from the element. Headings and
cards that the page itself moves focus to (`tabindex="-1"`) show none: focus still moves and is
announced, but a ring there read as a stray selection box, pink in dark mode. Edges are
1 px hairlines, notes included.

The arrow is drawn, not typed: one SVG, the same as itrium.id's `Arrow.svelte`, with a 2-unit
round-capped stroke in the current color, sized to the text beside it. A selected chip carries a
check mark, so selection never rests on color alone.

## Components

### Buttons

Pressable pills, soft and sure-footed. There are three kinds, and pink is the main action.

- **Shape:** fully rounded (`full`), 0.75rem by 1.5rem of padding, label and icon centered with a
  0.5rem gap.
- **Primary:** pastel pink with graphite text, semibold. One per view: "Read the receipt", "Add to
  the bill", "Open in WhatsApp" (messaging a number is the job most people come for; "Copy link"
  beside it is secondary).
- **Secondary:** transparent, with a 1 px control-edge border and medium weight. Every other
  action beside the primary.
- **Small:** the secondary's look at 2.25rem tall with 1rem of padding (2.75rem on touch screens).
  For actions inside a card or the running total.
- **Hover:** the primary fades to 85% opacity. Secondary and small fill with the page color.
- **Disabled:** 50% opacity and a not-allowed cursor, with a line beside it saying why
  (`SPLIT_BILL.missing`).
- **Focus:** a 2 px outline 3 px away, pastel pink on graphite and graphite on light backgrounds.
- **Text actions:** small actions that aren't the point, such as "Everyone", "Nobody" and
  "Remove", are muted, underlined 4 px below the text, and turn to the text color on hover. They
  keep the touch target height.

### Tag chips (signature)

The people on a bill, tapped to say who had what.

- **Unselected:** a transparent pill with a control-edge border and 0.875rem text, at least 2.25rem
  tall (2.75rem on touch screens), with 0.875rem of side padding. Hover fills with the surface
  color.
- **Selected:** pastel pink fill, graphite text, medium weight, a deep-rose edge on light
  backgrounds, and a leading check mark. `aria-pressed` carries the state.
- **Counting:** when people had different numbers of an item, a counted chip looks like a
  selected one (pink, with the check mark) and holds round buttons with a drawn minus and plus
  (2rem, or 2.75rem on touch screens) around a tabular count.
- **Everyone:** an underlined text button on the line of the question, "Who had this?", at its
  right end, never in the row of names: at six people it took a row of its own under them on
  most items.

### Fields

- **Style:** a 1 px control-edge border, 0.5rem radius (`sm`), filled with the page color, so a
  field sits one step back inside a card. 0.625rem by 0.75rem of padding, and 0.875rem text that
  rises to 1rem on touch screens.
- **Label:** above, medium weight, 0.375rem away.
- **Feedback:** what we read or why we can't goes under the field, muted, as it's typed
  (`SPLIT_BILL.amounts`). Problems are said in words, never only in red.
- **Beside a field:** a button next to a field is as tall as it, 42 px (46 px on touch screens).
- **Never a native `<select>`:** use `SearchableSelect` or radio buttons.

### Searchable select

A field that opens a floating list: 0.5rem radius, control-edge border, the surface color, 0.25rem
inset, and the floating-list shadow. The active option, where keyboard focus is in the list, fills pink like any focus; hovering one
fills it with the page color. It's capped at
16rem tall and scrolls. What's typed matches anywhere in a choice, and choices with a word starting
with it come first: "mal" lists Malaysia before Guatemala (`src/lib/search.ts`). A
word that is exactly what's typed comes before both, and countries are found by the other names
they go by too, never shown: "uk", "usa", "uae", or their names in Indonesian ("Jepang").

### Cards

- **Section cards (in a tool):** 1rem radius (`lg`), the surface color with a 1 px `--border`
  edge, 1.25rem of padding (1.5rem from 640 px), and a title-size heading 1rem above the content.
  They don't respond to hover, because they aren't links.
- **Tool cards (on the index):** the whole card is the link. Its name is in card-title type, then
  a muted summary, then a sample of what the tool makes under a muted caption ("Each person's
  share", "The link it makes"): an inset list of shares or the link, hidden from screen readers
  with its caption because the summary says it, then a pink action line with the drawn arrow,
  hidden from screen readers too so each card's name isn't the same words (except "Continue your
  bill", which says something the name doesn't). On hover the card lifts
  4 px, its edge turns pink (deep rose on light backgrounds), and the arrow moves 4 px right, all
  gated on `motion-safe`.
- **Inset lists and receipt lines:** one tonal step back inside a card (page color), 0.75rem
  radius (`md`), divided by hairlines. A receipt line we couldn't check takes a pink edge and a
  "Check this" mark with an icon, not just the color.

### Notes

A tinted aside for what someone should know right now: an unchecked receipt, a total that doesn't
match. Page color, 0.5rem radius, 0.75rem of padding, and a 1 px pink edge all round (deep rose on
light backgrounds), the same edge an unsure receipt line takes. An explanation opened from a
toggletip uses the same form with a gray hairline.

**The Whole Edge Rule.** A note is marked by its whole edge, never by a thick bar down one side.

### Toggletip

A round ⓘ button (2rem, 2.75rem on touch screens) beside the setting it explains. Pressed, it
opens the explanation as a gray-barred note on the next line, never as a floating bubble.

### Chat result (WhatsApp click-to-chat)

The form asks for the country, the number and then the optional message, all before the result:
the message goes into the link, so typed after it, it changed a link and a QR code out of sight.
The answer is the number, as people read it, in groups: "+62 811-2345-678" in bold 1.5rem (written the way numbers are where they're from, for the
countries people most often message: Japan's "90-1234-5678", the United Kingdom's "7700-900123"), in an
inset with a hairline, with the country it's for in muted text under it. The same number is read
back in one muted line right under the field ("= +62 811-2345-678, Indonesia"), like an amount in
Split bill, in a slot two lines tall that the hint and any problem share, so the result under
it never moves: on a phone the keyboard covers the result while the number is typed, and this is the
line to check it against. Then anything decided on the person's behalf, each with the drawn warning sign in medium weight (letters
left out, an extension WhatsApp can't dial, a number at the short end for its country). Then "Open
in WhatsApp" and "Copy link" side by side, neither ever breaking onto two lines (on the narrowest
phones Copy moves under Open); Copy says "Copied" for three seconds after a press, where the
press was, as well as in the status line under the result, and the raw link in small muted monospace, selectable.
Under it, one muted line on using the link: in a profile or a message, or as a QR code checked once
before it's printed. Everything about the answer sits together, right under the field it comes from:
nothing floats over it, so nothing can cover it on a short phone. A number too short or too long for
its country is a problem in words, never a link. "Too short" and "add the area code" wait until the
typing stops: every number is too short halfway through it.

### QR code to print (WhatsApp click-to-chat)

Under the line on using the link, "QR code to print" is a disclosure with the drawn arrow, closed by
default since most people came to message a number. Open, it shows the code drawn in the browser
(`src/lib/qr.ts`, encoded by qrcode-generator): graphite on white with its four-module margin in
both themes, because scanners read dark on light and that's what prints. "Save the QR code" hands
it over as a PNG made on the device, 24 pixels a module, with "Chat on WhatsApp" and the number
under the code, below its white margin, in Plus Jakarta Sans: a printed code can be checked by eye,
and used by someone without a camera. Nothing is sent anywhere to make either.
With a message, a muted line says the code includes it ("whoever scans it starts with it typed"),
with a "Leave the message out of the code" checkbox: a shop printing one code for everyone may not
want one customer's message on it, and a shorter link makes a coarser code that scans better.

### Running total (signature)

Split bill's bar at the bottom of a phone screen while items exist: the surface color, a hairline
on top, the total in semibold, and what isn't in anyone's share yet (semibold when it isn't zero,
muted when it is), with a small "See the split" button. While something is in nobody's share, the
two lines are one button, with the drawn arrow after the amount: it goes to the first item that
amount comes from, the way through a long list of items on a big table. Sticky, not fixed, so it never hides the
end of the page. While the split itself is on screen it steps aside (invisible, keeping its space), since it has
nothing to add there. Hidden from 1024 px, where the split has its own column.

### The split (signature)

What each person hands over comes first and largest: one row per person, the name in medium weight
with a muted line under it ("To Budi", or what they ordered), and the amount in bold 1.5rem tabular
figures, right-aligned. Whoever paid hands nothing over, so their big number is what comes back to
them, labelled "comes back" beside it (on the same line, so choosing who paid never makes the row
taller), with "Paid the bill" in the muted line under their name. Every row keeps that muted line,
even empty, and every note in it is short, so choosing who paid never changes a row's height. What comes back to whoever paid is set apart from the debts: a plus, a size smaller and
muted ("+Rp 437.000").
Someone with nothing tagged gets "Nothing tagged yet" and a muted Rp 0, never "To Budi": the split
doesn't tell anyone to pay nothing. The "Not in anyone's share" note is gray until anything is
tagged, and pink once tagging has begun and something is still left out, and it names the items, up
to three and then how many more: a state isn't an error
before anyone has started. The two lines under the rounding choice are kept even when empty, so
picking a step never shifts what's below it. Then two radio groups, "Who paid?" and "Round shares
up" (to two steps people actually hand over, Rp 500 and Rp 1.000 for rupiah), with a muted line
saying what rounding added and who gets it back. The breakdown (subtotal, charges, total)
comes last, in an inset list: it's how the answer was reached, not the answer. Each row with something
tagged opens, tapping anywhere on it, to what's in that share, in an inset: the items with the
person's part of each ("Es Teh, ½", "Jus, 3 of 4") and what they come to, then "Charges and
adjustments" and, when rounding added to it, "Rounded up", adding up to the big number. For whoever paid, the row shows the subtraction: "Rounding from the others" as a minus, "Not in
anyone's share, on Budi for now" while something is untagged, and "Budi pays in the end", with a muted line under it
that joins it to the row's "comes back" ("That's the Rp 427.900 Budi paid, less the Rp 300.000 that
comes back."). The drawn arrow follows the name, turning down when open; an indent before the
name would take the width the muted line under it needs. A shared link opens
with the split's heading focused, scrolled to on a phone.

### A bill shared with you

Someone who opens a shared bill that wasn't shared from their own device sees the split on its own,
centered. The title band says what this bill is instead of how to make one ("A bill shared with you:
Rp 459.250 in all, paid by Budi."), and one line above the split says where to look ("Find your
name, and tap it to see what's in your share."). A small "Make changes", with a muted note that
changes stay on the device until the bill is shared again, waits under the split, so the friend's own
row is on a phone's first screen. Who paid and rounding show only as their result in the rows;
there's no running total, since the split is already in view. "Copy the link", which copies the
link they opened, is secondary: reading their row and paying is the friend's job, and there's no
pink on the page. The note on what sharing keeps on our server is left out, since a long link keeps
nothing there. "Make changes" brings back the whole editor, focused on its first card. Whoever shared
the bill gets the editor straight away, as before.

### More on the receipt

The Charges card shows the two rates. What only some receipts say (prices that include tax or
service, tax on service, discounts and rounding) waits behind a disclosure, "More on the receipt",
with the drawn arrow turning down when open. It opens itself when a scan, a link or a choice puts
any of it on the bill, and only then: tax on service counts only when there's service and it isn't
the currency's usual way.

### Undo line

After removing a person or an item, the card it was removed from says so in one line, "Removed
Citra.", with an underlined "Undo" beside it at touch-target height. It stays until the bill
changes some other way. There's no countdown and no confirmation dialog: one tap took it, one
tap brings it back. The split repeats the line, with its Undo, under its heading, since a removal
changes it and on a wide screen it's in the other column; only the card's own line is a live
region, so it's announced once. The split's copy is only for 1024px and up, where the split has a column of
its own; below that the card's line is right above it. Removing someone who had items alone says what's no longer in
anyone's share, as an amount: money leaving the split is the one thing that line must not hide.

### Where focus goes

A press that removes or replaces the control it was made on never leaves focus on nothing (which
drops a keyboard or a screen reader at the top of the page). Opening the scan form focuses its
first field, reading the receipt its review heading, adding it the People field when there's nobody
yet (scrolled to), or else the Items heading; removing focuses the Undo, and Undo the person or
item brought back. "Yes, clear" takes the card it was in with it: focus goes to "The bill", and the
line at the top of the page says "Cleared.". "Clear everything" itself sits apart from the share
buttons, under a hairline, as a quiet underlined button.

### Adding an item

With no items, the Items card is the form. Once there are items, they come first, and the form
waits under them behind "Add an item by hand": after a receipt is read, the items are what's next,
not an empty form above them. Items typed in by hand keep the form open under the list, with focus back in its Item field
for the next. With a quantity over one, the price asked for is for one, and the line under it says
what the line comes to ("= 4 × Rp 32.000 = Rp 128.000"), so a line total typed as "each" shows.

### Folded items

An item that's someone's folds to one line once the person moves on to another: its name, "·",
who had it in muted text (with counts when it was counted), "Everyone" when it's the whole table, and its price on the right; a tap
opens it again, with focus on its first name, and screen readers hear "Change who had Nasi
Goreng". The item last touched stays open, so tagging a second person on it doesn't fold it under
the finger, and when items above fold or open, the one being worked on stays where it was on
screen (scrolled at once, not smoothly, with the browser's own anchoring off for the list). A bill
reopened from a draft starts with its tagged items folded.

### Links that can't open

A shared link cut off when it was pasted, or changed on the way, says so ("This link looks
incomplete…") with "Start a new bill", rather than opening an empty bill as if nothing were wrong. That line, and the ones for a bill
that's gone or a server out of reach, carry the warning sign in medium weight. A link that fails after
one that opened in the same tab clears the bill it showed, so the old one isn't left under the
error still headed as shared; someone's own bill stays.

### Graphite panel and title band

The `.band` from itrium.id: the dark tokens in either theme (stepping up to graphite surface in
dark mode), rounded 1.5rem, inset and wider than the content. On the index it's a full panel that
holds the title and the tagline and nothing above the title, and a closing panel ends the page.
The error page is one panel: its heading in display type and a ruled list of where to go instead,
each row with the arrow. On a tool
page it's a title band holding just the title and the introduction. The band is a little wider than the
tool under it: Split bill's goes to 72rem, where the split has its own column, and WhatsApp
click-to-chat's to its form card's 32rem, so their edges line up and on a wide screen the form
isn't a small card under a long slab.

### Navigation

Two text links in the header beside the lockup, "Free tools" and "About Itrium", muted, turning to
the text color on hover. On the index, "Free tools" carries `aria-current="page"` and stays in
the text color. It's the way back from a tool. The lockup leads to itrium.id and is named
"Itrium's main site". Under 360px wide the lockup gives way to the mark alone, so the header
stays one line. A pink skip link sits off screen and drops in from the top on focus. The footer is muted
small text: the no-tracking promise on the left (except on the index, where the closing panel
says it in full; only Split bill's mentions sharing a bill, the one thing that reaches us), contact
and source links on the right. The header's and footer's links stay small text but are 2.75rem
tall on touch screens, like every other control: "Free tools" is the only way back from a tool.

## Do's and Don'ts

### Do:

- **Do** take tokens, radii, button shapes, the arrow and type roles from itrium.id's DESIGN.md
  before inventing anything. A difference between the two sites needs a reason a tool has and a
  page doesn't.
- **Do** keep a tool's first field on the first phone screen.
- **Do** give every field, button and chip a `--control-border` edge and a touch target at least
  2.75rem tall on touch screens.
- **Do** show every state in two ways: a check mark with the pink fill, words with the pink edge,
  and the reason a
  button can't be pressed yet, said under it when someone presses or reaches it (not at rest, and
  not read out again after every add).
- **Do** design and check every new pairing in light and dark, on every surface it sits on.
- **Do** use the drawn arrow wherever a link points onward.
- **Do** keep motion in CSS, gated on `motion-safe` or `prefers-reduced-motion: no-preference`:
  page cross-fades, the 4 px card lift and arrow nudge, and the loading spinner. Nothing in a tool
  rises or reveals as it scrolls.
- **Do** use Tailwind classes with the theme tokens and the shared classes in `src/lib/styles.ts`,
  never raw hex values in markup.

### Don't:

- **Don't** use pink as decoration, or put two pink buttons in one view.
- **Don't** put a small uppercase heading, eyebrow, kicker or back link above a heading.
- **Don't** type arrows or chevrons as characters.
- **Don't** give cards, buttons, chips, bands or the running total a drop shadow.
- **Don't** use `#000000` or pure white text on pink. Graphite is `#2b2b2b`.
- **Don't** put pastel pink text or lines on a light background.
- **Don't** use a native `<select>`, inline styles, `data:` URLs, or anything from another domain.
- **Don't** add gradient text, icon-card rows, invented numbers, or a hero that pushes the tool off
  a phone screen.
- **Don't** set field text below 16px on touch screens.
