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
export const INTRODUCTION =
	"Small tools for small jobs. They are free, they need no account, and they run in your browser. What you type isn't sent to us, and a bill you share reaches us only encrypted, so we can't read it.";

export const NO_TRACKING =
	'This site has no cookies, no analytics and no trackers. What you type stays in your browser, unless you share a bill, and then we only ever see it encrypted.';

export const WHATSAPP = {
	path: '/whatsapp-click-to-chat' as const,
	name: 'WhatsApp click-to-chat',
	summary:
		'Make a link that opens a WhatsApp chat with any phone number, with a message already typed if you like.',
	description:
		'Make a WhatsApp click-to-chat link from any phone number, with a message already typed if you like. Spaces and symbols are removed for you.',
	introduction:
		'Enter a phone number and we build the link that opens a chat with it. Spaces, dashes and brackets are taken out, so you can paste a number as it is.'
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
	privacy:
		"A shared bill waits on our server for 30 days, encrypted with a key that is only in the link, so we can't read it. Whoever shared it can delete it sooner, on the same device.",
	sharing: {
		opening: 'Opening the shared bill…',
		gone: "This shared bill isn't here anymore. Shared bills are kept for 30 days, and whoever shared one can delete it sooner.",
		unreachable:
			"We couldn't reach our server to open this bill. Check your connection, then reload the page.",
		copied: 'Link copied. Anyone with it can open this bill for 30 days after it was first shared.',
		copiedLong:
			"We couldn't reach our server, so we copied a long link that holds the whole bill. Make sure it's pasted in full.",
		copyFailed: "We couldn't copy it. The link is in your address bar now: copy it from there.",
		deleted: "Deleted. The link doesn't open this bill anymore.",
		deleteFailed: "We couldn't delete it. Check your connection, then try again.",
		deleteQuestion: 'Delete the shared copy? The link stops working for everyone.'
	}
};

export const TOOLS = [WHATSAPP, SPLIT_BILL];

// Bigger things from us that run in the browser too, on sites of their own: their data lives
// in the browser, and a site of its own keeps it apart from everything else.
export const ELSEWHERE_HEADING = 'On sites of their own';
export const ELSEWHERE = [
	{
		name: 'Amber',
		url: 'https://amber.itrium.id',
		summary:
			'Lists for to-dos and bucket lists, with categories, tags, steps and search. It works offline, and your lists stay on your device.',
		label: 'Open Amber'
	}
];
