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
- **Index:** the opening slab (the title and a tagline naming the two jobs, in the text color), then the tool cards in
  one column, two from 640 px, Split bill first. Then a section heading and the cards for tools on
  sites of their own. A closing slab ends it: what stays on the device as a ruled list, and the
  source as a secondary button. On a screen under 44rem tall the panel and the gap under it tighten, so the first
  card's action line stays on a 390x667 phone's first screen. Above the cards, for someone in the
  middle of a bill, one line from what the browser already keeps (the draft in this tab, or the
  bills this device shared) with an action line to it: shown after the page loads, never stored
  or sent. The section heading over tools on sites of their own is a step smaller than the
  closing panel's, which is the page's last word.
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
(`xl`). The focus outline is 2 px at 4 px radius (`focus`), 3 px away from the element. Edges are
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
  the bill", "Copy link".
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
- **Counting:** when people had different numbers of an item, the chip holds round minus and plus
  buttons (2rem, or 2.75rem on touch screens) around a tabular count.

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
inset, and the floating-list shadow. The active option fills with the page color. It's capped at
16rem tall and scrolls.

### Cards

- **Section cards (in a tool):** 1rem radius (`lg`), the surface color with a 1 px `--border`
  edge, 1.25rem of padding (1.5rem from 640 px), and a title-size heading 1rem above the content.
  They don't respond to hover, because they aren't links.
- **Tool cards (on the index):** the whole card is the link. Its name is in card-title type, then
  a muted summary, then a sample of what the tool makes under a muted caption ("Each person's
  share", "The link it makes"): an inset list of shares or the link, hidden from screen readers
  with its caption because the summary says it, then a pink action line with the drawn arrow,
  hidden from screen readers too so each card's name isn't the same words. On hover the card lifts
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

The answer is the number, as people read it: "+62 8119710096" in bold 1.5rem, in an inset with a
hairline, with the country it's for in muted text under it. Then the message as plain text, then
anything decided on the person's behalf, each with the drawn warning sign in medium weight (letters
left out, an extension WhatsApp can't dial, a number at the short end for its country). Then "Open
in WhatsApp" and "Copy link" side by side, and the raw link in small muted monospace, selectable.
Under it, one muted line on using the link: in a profile or a message, or as a QR code checked once
before it's printed. Everything about the answer sits together, right under the field it comes from:
nothing floats over it, so nothing can cover it on a short phone. A number too short or too long for
its country is a problem in words, never a link.

### Running total (signature)

Split bill's bar at the bottom of a phone screen while items exist: the surface color, a hairline
on top, the total in semibold, and what isn't in anyone's share yet (semibold when it isn't zero,
muted when it is), with a small "See the split" button. Sticky, not fixed, so it never hides the
end of the page. Hidden from 1024 px, where the split has its own column.

### The split (signature)

What each person hands over comes first and largest: one row per person, the name in medium weight
with a muted line under it ("To Budi", or what they ordered), and the amount in bold 1.5rem tabular
figures, right-aligned. Whoever paid hands nothing over, so their big number is what comes back to
them, labelled "comes back" beside it (on the same line, so choosing who paid never makes the row
taller), with "Paid the bill" in the muted line under their name. Every row keeps that muted line,
even empty, and every note in it is short, so choosing who paid never changes a row's height.
Someone with nothing tagged gets "Nothing tagged yet" and a muted Rp 0, never "To Budi": the split
doesn't tell anyone to pay nothing. The "Not in anyone's share" note is gray until anything is
tagged, and pink once tagging has begun and something is still left out: a state isn't an error
before anyone has started. The two lines under the rounding choice are kept even when empty, so
picking a step never shifts what's below it. Then two radio groups, "Who paid?" and "Round shares
up" (to two steps people actually hand over, Rp 500 and Rp 1.000 for rupiah), with a muted line
saying what rounding added and whose part it came off. The breakdown (subtotal, charges, total)
comes last, in an inset list: it's how the answer was reached, not the answer. A shared link opens
with the split's heading focused, scrolled to on a phone.

### More on the receipt

The Charges card shows the two rates. What only some receipts say (prices that include tax or
service, tax on service, discounts and rounding) waits behind a disclosure, "More on the receipt",
with the drawn arrow turning down when open. It opens itself when a scan, a link or a choice puts
any of it on the bill.

### Undo line

After removing a person or an item, the card it was removed from says so in one line, "Removed
Citra.", with an underlined "Undo" beside it at touch-target height. It stays until the bill
changes some other way. There's no countdown and no confirmation dialog: one tap took it, one
tap brings it back.

### Graphite panel and title band

The `.band` from itrium.id: the dark tokens in either theme (stepping up to graphite surface in
dark mode), rounded 1.5rem, inset and wider than the content. On the index it's a full panel that
holds the title and the tagline and nothing above the title, and a closing panel ends the page.
The error page is one panel: its heading in display type and a ruled list of where to go instead,
each row with the arrow. On a tool
page it's a title band holding just the title and the introduction.

### Navigation

Two text links in the header beside the lockup, "Free tools" and "About Itrium", muted, turning to
the text color on hover. On the index, "Free tools" carries `aria-current="page"` and stays in
the text color. It's the way back from a tool. The lockup leads to itrium.id and is named
"Itrium's main site". A pink skip link sits off screen and drops in from the top on focus. The footer is muted
small text: the no-tracking promise on the left (except on the index, where the closing panel
says it in full), contact and source links on the right.

## Do's and Don'ts

### Do:

- **Do** take tokens, radii, button shapes, the arrow and type roles from itrium.id's DESIGN.md
  before inventing anything. A difference between the two sites needs a reason a tool has and a
  page doesn't.
- **Do** keep a tool's first field on the first phone screen.
- **Do** give every field, button and chip a `--control-border` edge and a touch target at least
  2.75rem tall on touch screens.
- **Do** show every state in two ways: a check mark with the pink fill, words with the pink edge,
  and a reason beside a disabled button.
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
