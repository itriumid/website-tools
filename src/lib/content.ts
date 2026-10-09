// Everything the site says, in one place, so the copy can be reviewed without reading markup.
// It's public copy in Itrium's voice: "we", plain words, no abbreviations. See the brand brief.

export const SITE_URL = 'https://tools.itrium.id';
export const MAIN_SITE_URL = 'https://itrium.id';
export const EMAIL = 'hello@itrium.id';
export const SECURITY_EMAIL = 'security@itrium.id';
export const GITHUB_URL = 'https://github.com/itriumid';
export const SOURCE_URL = 'https://github.com/itriumid/tools';

export const TITLE = 'Free tools · Itrium';
export const DESCRIPTION =
	'Small, free web tools from Itrium. No account, no advertisements, and nothing you type leaves your device.';

export const HEADING = 'Free tools';
export const INTRODUCTION =
	'Small tools for small jobs. They are free, they need no account, and they run in your browser, so nothing you type is ever sent to us.';

export const NO_TRACKING =
	'This site has no cookies, no analytics and no trackers. What you type stays in your browser.';
export const FOOTNOTE = 'Itrium is the Indonesian word for yttrium: element 39.';

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
		'Split a bill fairly: add the people and the items, tag who had what, add tax and service, and share the result as a link. Nothing is sent to a server.',
	introduction:
		'Add the people and the items, tag each item to the people who had it, and we work out a fair share for each person, tax and service included.',
	privacy:
		'A shared link holds the whole bill in the part of the address after the #, which browsers never send to a server. We never see your bill.'
};

export const TOOLS = [WHATSAPP, SPLIT_BILL];
