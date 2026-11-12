// Everything the site says, in one place, so the copy can be reviewed without reading markup.
// It's public copy in Itrium's voice: "we", plain words, no abbreviations. See the brand brief.

export const SITE_URL = 'https://tools.itrium.id';
export const MAIN_SITE_URL = 'https://itrium.id';
export const EMAIL = 'hello@itrium.id';
export const SECURITY_EMAIL = 'security@itrium.id';
export const GITHUB_URL = 'https://github.com/itriumid';
export const SOURCE_URL = 'https://github.com/itriumid/website-tools';

export const TITLE = 'Free tools · Itrium';
export const DESCRIPTION =
	'Small, free web tools from Itrium. No account, no advertisements, and what you type stays on your device unless you share it.';

export const HEADING = 'Free tools';
// The two jobs, said plainly: what's free and private is the closing panel's to say.
export const TAGLINE = "Split a bill fairly, or message a number you haven't saved.";

// Above the tools, for someone who was in the middle of a bill: from what this browser already
// keeps (the draft in this tab, the bills this device shared). Nothing new is kept.
export const IN_PROGRESS = {
	draft: 'You have a bill in progress in this tab.',
	carryOn: 'Carry on',
	shared: (count: number) =>
		count === 1
			? 'You shared a bill from this device in the last 30 days.'
			: `You shared ${count} bills from this device in the last 30 days.`,
	openIt: 'Open it',
	openLatest: 'Open the latest'
};

// The index's closing panel: what happens to what people type, said plainly, with the source as
// the proof.
export const PROMISE_HEADING = 'What stays on your device';
export const PROMISE = [
	"What you type stays in your browser. It isn't sent to us.",
	"A bill you share reaches us encrypted, with a key that's only in the link, so we can't read it. We delete it 30 days after it was last shared.",
	'No cookies, no analytics, no trackers, and nothing loaded from anywhere else.'
];
export const SOURCE_LABEL = 'Read the source';

export const NO_TRACKING =
	'This site has no cookies, no analytics and no trackers. What you type stays in your browser, unless you share a bill, and then we only ever see it encrypted.';

/** Lines that show what a tool makes, on the index: an optional name, then the value. */
type Sample = { label?: string; value: string }[];

export const WHATSAPP = {
	path: '/whatsapp-click-to-chat' as const,
	name: 'WhatsApp click-to-chat',
	summary:
		'Make a link that opens a WhatsApp chat with any phone number, with a message already typed if you like.',
	description:
		'Make a WhatsApp click-to-chat link from any phone number, with a message already typed if you like. Spaces and symbols are removed for you.',
	introduction:
		'Enter a phone number and we build the link that opens a chat with it. Spaces, dashes and brackets are taken out, so you can paste a number as it is.',
	/** On the index, a glimpse of what the tool makes. */
	sample: [{ value: 'wa.me/6281200000000' }] as Sample,
	sampleCaption: 'The link it makes',
	hint: 'A number that starts with + or 00 already has its country, so we use it as it is.',
	problems: {
		'too-short': "That's too short for a phone number there. Check you have every digit.",
		'too-long':
			"That's too long for a phone number there. Check the country code isn't in it twice.",
		'too-many-digits':
			"That's more digits than any phone number has: 15 at most, country code included.",
		'area-code': 'Add the area code too.',
		several: 'That looks like more than one number. Make a link for one at a time.',
		'no-digits': "There's no number here yet. Type the phone number's digits."
	},
	result: {
		heading: 'Your link',
		empty: 'Enter a phone number and the link appears here.',
		lettersDropped: 'We left out the letters and kept the digits: check this is the number.',
		extension: (extension: string) =>
			`We left off the extension (${extension}): WhatsApp can't dial one.`,
		short: "That's shorter than most numbers there. Check you have every digit.",
		useIt:
			'Put the link in a profile or a message. To print it, make it into a QR code, and scan the QR code once to check it opens this chat.'
	}
};

export const SPLIT_BILL = {
	path: '/split-bill' as const,
	name: 'Split bill',
	summary:
		'Split a bill fairly: tag each item to the people who had it, add tax and service, and share the result as a link.',
	description:
		'Split a bill fairly: add the people and the items, tag who had what, add tax and service, and share the result as a short link. Shared bills are encrypted, and only people with the link can open them.',
	introduction:
		'Add the people and the items, tag each item to the people who had it, and we work out a fair share for each person, tax and service included.',
	/** On the index, a glimpse of what the tool makes: each person's share. */
	sample: [
		{ label: 'Ayu', value: 'Rp 86.500' },
		{ label: 'Budi', value: 'Rp 112.000' },
		{ label: 'Citra', value: 'Rp 64.500' }
	] as Sample,
	sampleCaption: "Each person's share",
	privacy:
		"A shared bill waits on our server for 30 days after it was last shared, encrypted with a key that is only in the link, so we can't read it. Whoever shared it can update it or delete it, on the same device.",
	sharing: {
		opening: 'Opening the shared bill…',
		gone: "This shared bill isn't here anymore. Shared bills are kept for 30 days, and whoever shared one can delete it sooner.",
		opened: 'Bill opened.',
		sharedAt: (when: string) => `Shared ${when}`,
		updatedAt: (when: string) => `Updated ${when}`,
		unreachable:
			"We couldn't reach our server to open this bill. Check your connection, then try again.",
		retry: 'Try again',
		startNew: 'Start a new bill',
		copied: 'Link copied. Anyone with it can open this bill for 30 days.',
		copiedUpdated:
			"Link copied. It's the same link as before, and it now opens this version for 30 days.",
		copiedNew: "Link copied. It's a new link: the one from before still shows the bill as it was.",
		copiedLong:
			"We couldn't reach our server, so we copied a long link that holds the whole bill. Make sure it's pasted in full.",
		copyFailed: "We couldn't copy it. The link is in your address bar now: copy it from there.",
		deleted: "Deleted. The link doesn't open this bill anymore.",
		deleteFailed: "We couldn't delete it. Check your connection, then try again.",
		deleteQuestion: 'Delete the shared copy? The link stops working for everyone.',
		textCopied: 'Copied. Paste it in your group chat.',
		textCopyFailed: "We couldn't copy it. Copy the text below instead.",
		shareFailed: "We couldn't share it. Use Copy as text instead."
	},
	// The split as text, for a group chat.
	text: {
		total: 'Total',
		unshared: "Not in anyone's share",
		to: (name: string) => `to ${name}`,
		getsBack: (amount: string) => `paid the bill, gets ${amount} back`
	},
	// Next to a button that can't be pressed yet: why.
	missing: {
		personName: 'Type a name first.',
		itemNameAndPrice: 'Type the item and its price first.',
		itemName: 'Type the item first.',
		itemPrice: 'Type the price first.'
	},
	// The split: what each person hands over, and to whom.
	split: {
		paidBy: 'Who paid?',
		nobody: 'No one yet',
		paidTheBill: 'Paid the bill',
		comesBack: 'comes back',
		nothingTagged: 'Nothing tagged yet',
		to: (name: string) => `To ${name}`,
		ordered: (amount: string) => `Ordered ${amount}`,
		roundUp: 'Round shares up',
		noRounding: 'No',
		roundTo: (amount: string) => `To ${amount}`,
		extraToPayer: (extra: string, name: string) =>
			`Rounding up adds ${extra}, which ${name} gets back.`,
		extraOnTop: (extra: string) => `Rounding up adds ${extra} on top of the total.`,
		empty: 'Add the items from the bill, and the split shows here as you go.'
	},
	// After removing someone or something: one tap took it, one tap brings it back.
	removed: (name: string) => `Removed ${name}.`,
	removedPerson: (name: string, shared: number) =>
		shared === 0
			? `Removed ${name}.`
			: `Removed ${name}. ${shared === 1 ? 'The item they shared is' : `The ${shared} items they shared are`} now split among the others.`,
	// Behind it in the Charges card: what only some receipts say.
	moreOnReceipt: 'More on the receipt',
	moreOnReceiptHint: 'Prices with tax, discounts, rounding',
	undo: 'Undo',
	/** Under the untagged items' worth, when their part of the total differs from it. */
	unsharedOfTotal: (amount: string) => `That's ${amount} of the total.`,
	// What an amount field says under it as it's typed: what we read, or why we can't.
	amounts: {
		reads: (amount: string) => `= ${amount}`,
		unreadable: "We can't read this amount. Use digits, with dots or commas if you like.",
		noCents: 'This currency has no cents. Leave them off.',
		zero: 'Enter an amount above zero.',
		negativePrice: "A price can't be below zero.",
		negativeDiscount: 'Leave out the minus. A discount always comes off.',
		negativeAdjustment: 'Leave out the minus, and choose below whether it takes off or adds.'
	},
	scanning: {
		open: 'Scan or paste a receipt',
		photo: 'Photo of the receipt (optional)',
		photoHint:
			'Pick a photo to see it here, then press and hold its text to copy it. The photo stays on your device.',
		photoAlt: 'The receipt photo you picked',
		field: 'Receipt text',
		hint: 'On an iPhone, tap the box and choose Scan Text to read the receipt with your camera. Or copy the text from a photo with Live Text or Google Lens, and paste it here. It stays in your browser.',
		read: 'Read the receipt',
		cancel: 'Cancel',
		review: 'Check what we read',
		nothing:
			"We couldn't find any items in that text. Check it's the whole receipt, or add the items by hand.",
		check: 'Check this',
		quantity: (count: number) =>
			`${count} of these on the receipt: count who had how many once it's in the bill.`,
		rates: (service: number, tax: number, onService: boolean) =>
			`Service ${service}% and tax ${tax}%${onService ? ', charged on service too' : ''}.`,
		ratesUntilNow: (service: number, tax: number) =>
			`Until now the bill had service ${service}% and tax ${tax}%.`,
		noRates:
			"We couldn't work out tax and service from this receipt, so your settings stay as they are.",
		matches: "The items match the receipt's subtotal.",
		itemsOff: (difference: string, less: boolean) =>
			`The items add up to ${difference} ${less ? 'less' : 'more'} than the receipt's subtotal. Check the marked prices.`,
		totalOff: (ours: string, theirs: string) =>
			`This comes to ${ours}, but the receipt says ${theirs}.`,
		missingPrice: 'Fill in every price first, or remove the lines that have none.',
		removeUnpriced: 'Remove the lines without a price',
		add: 'Add to the bill',
		itemsStay: (count: number) =>
			`The ${count === 1 ? 'item' : `${count} items`} already on the bill stay: these are added after them.`
	},
	// Shown only when someone asks, behind an ⓘ next to the setting they explain.
	explanations: {
		counting:
			"Tagging people shares an item evenly. Counting is for when people had different numbers of it: each pays for their own, and any nobody's counted for show up as not in anyone's share.",
		unsure:
			"Text recognition sometimes misreads a number, or puts a price next to the wrong item. We mark what we couldn't check against the receipt's own totals.",
		taxIncluded:
			"For prices marked nett, or 'tax included'. We note the tax but don't add it again. Service usually comes included too, so we tick that as well. Untick it if the receipt adds service on top.",
		taxOnService:
			"Some restaurants charge tax on the subtotal plus service, so the bill comes out a little higher. When prices already include tax, there's no tax left to charge on service, so this turns off when you tick 'Prices include tax'.",
		adjustments:
			"Discounts come off before tax and service. Rounding and anything else land on the total after them. Everyone shares them by what they ordered, unless one is just for some people: then it's split evenly among them."
	}
};

// Split bill first: it's the one people come for.
export const TOOLS = [SPLIT_BILL, WHATSAPP];

// Bigger things from us that run in the browser too, on sites of their own: their data lives
// in the browser, and a site of its own keeps it apart from everything else.
export const ELSEWHERE_HEADING = 'Bigger tools, on sites of their own';
export const ELSEWHERE = [
	{
		name: 'Amber',
		url: 'https://amber.itrium.id',
		summary:
			'Lists for to-dos and bucket lists, with categories, tags, steps and search. It works offline, and your lists stay on your device.',
		label: 'Open Amber'
	}
];
