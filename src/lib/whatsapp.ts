// The WhatsApp click-to-chat tool's rules, kept apart from the page so they can be tested.

import { COUNTRIES } from './countries';
import { asciiDigits } from './digits';

/** Only the digits of what was typed or pasted, as 0 to 9: spaces, dashes and brackets go. */
export function digitsOnly(text: string): string {
	return asciiDigits(text).replace(/\D/g, '');
}

export interface ChatTarget {
	/** The full number as WhatsApp wants it: country code and number, digits only. */
	number: string;
	/** The same number, for people to read, in groups: "+62 811-2345-678". */
	display: string;
	/** The country code it was read with, so the page can say which country that is. */
	countryCode: string;
	/**
	 * As short as a number there can be, where most are longer: a mobile number missing a digit
	 * can look like a landline. Worth a second look, not a stop.
	 */
	short: boolean;
	/** The link that opens the chat, with the message typed in if there is one. */
	link: string;
	/** Letters were typed with the number and left out: the person should check what's left. */
	lettersDropped: boolean;
	/** An extension typed after the number ("ext 5"), left off: WhatsApp can't dial one. */
	extension?: string;
}

/**
 * Why there's no chat to open: the number is too short or too long to be a phone number (in the
 * country it's for, where we know how long numbers there are), too short once the letters typed
 * with it are left out ("0812-FLOWERS"), a landline without its area code (seven digits in North
 * America, seven or eight in Indonesia that aren't a mobile's), there's more than one number, or
 * nothing typed was a digit.
 */
export type ChatProblem =
	| 'too-short'
	| 'too-short-letters'
	| 'too-long'
	| 'too-many-digits'
	| 'area-code'
	| 'several'
	| 'no-digits';

/** The link that opens a chat with a number (digits, country code first), with a message typed in. */
export function chatLink(number: string, message = ''): string {
	const text = message.trim();
	return `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

/**
 * Whether a problem is true of every number halfway typed ("too short", "add the area code"), so
 * it waits until the typing stops. The others can't be right however the number ends.
 */
export function waitsForTyping(problem: ChatProblem): boolean {
	return problem === 'too-short' || problem === 'too-short-letters' || problem === 'area-code';
}

/** A full number, country code included, has 8 to 15 digits (E.164 allows at most 15). */
export const SHORTEST_NUMBER = 8;
export const LONGEST_NUMBER = 15;

// What people dial before a number inside their own country (the trunk prefix), by country code,
// where it isn't 0: the 0 of "0811 …" in Indonesia is the 8 of "8 912 …" in Russia and
// Kazakhstan, and the 06 of "06 30 …" in Hungary. Belarus dials "8 0", and Lithuania has dialed
// both 8 and 0, so both work there. Italy has none: its leading 0 is part of the number ("+39 06 …"
// is Rome). North America's is 1, the same as its code, so a number dialed with it already reads
// as one with its code. Other countries with none (Spain, Singapore) keep 0 here: none of their
// numbers start with 0, so it never drops a digit that's part of one.
const TRUNK_PREFIXES: Record<string, string[]> = {
	'1': [],
	'7': ['8'],
	'36': ['06'],
	'39': [],
	'370': ['8', '0'],
	'375': ['80', '8']
};
const trunkPrefixes = (code: string) => TRUNK_PREFIXES[code] ?? ['0'];

// How many digits a number has after the country code, by country code, for the countries where
// people most often paste a number with its code but without the "+". It says whether a number
// was pasted with its code, and whether it can be a number there at all: a link to a number too
// short to exist fails in WhatsApp, after it's been printed on a card. So the shortest is the
// shortest real number, landlines included: Seoul's are 8 digits after +82 (02 123 4567), and so
// are Malaysia's outside Kuala Lumpur (04 123 4567, Penang). Countries not listed here take
// anything from 7 digits up to what E.164 leaves after the code.
const NATIONAL_LENGTHS: Record<string, [shortest: number, longest: number]> = {
	'1': [10, 10],
	'7': [10, 10],
	'20': [9, 10],
	'27': [9, 9],
	'33': [9, 9],
	'36': [8, 9],
	'44': [9, 10],
	'60': [8, 10],
	'61': [9, 9],
	'62': [9, 12],
	'63': [8, 10],
	'65': [8, 8],
	'66': [8, 9],
	'81': [9, 10],
	'82': [8, 10],
	'84': [9, 10],
	'86': [10, 11],
	'91': [10, 10],
	'92': [10, 10],
	'234': [8, 10],
	'370': [8, 8],
	'375': [9, 9],
	'852': [8, 8],
	'880': [10, 10],
	'966': [9, 9],
	'971': [8, 9]
};

const nationalLengths = (code: string): [number, number] =>
	NATIONAL_LENGTHS[code] ?? [7, LONGEST_NUMBER - code.length];

// Country codes are made so none starts with another; longest first all the same, to be safe.
const CODES = [...new Set(COUNTRIES.map((country) => country.phoneCode))].sort(
	(a, b) => b.length - a.length
);

const fits = (code: string, national: string) => {
	const [shortest, longest] = nationalLengths(code);
	return national.length >= shortest && national.length <= longest;
};

/**
 * The number after the country code, without the trunk prefix dialed before it at home. Where the
 * prefix starts with 0, it always goes: no number there starts with 0. Where it doesn't (Russia's
 * 8), it goes only when the number is too long with it and the right length without it, since
 * numbers there can start with the same digit: "8 912 345 67 89" is "+7 912 …", but
 * "812 345 67 89" is St Petersburg, "+7 812 …".
 */
function withoutTrunkPrefix(code: string, national: string): string {
	if (!code) return national;
	for (const prefix of trunkPrefixes(code)) {
		if (!national.startsWith(prefix)) continue;
		const rest = national.slice(prefix.length);
		if (prefix.startsWith('0') || (fits(code, rest) && !fits(code, national))) return rest;
	}
	return national;
}

/**
 * The chat to open for a number typed or pasted into the box, in the country chosen; a problem
 * when it can't be a phone number; undefined until there's a digit to go on.
 *
 * - A number that starts with "+" or "00" (how most countries dial abroad) already has its
 *   country code, so the chosen country doesn't matter. A trunk prefix typed after the code goes:
 *   "+62 0811 …" is "+62 811 …".
 * - A number that starts with the chosen country's trunk prefix (0 in most countries, 8 in Russia)
 *   is a local one: the prefix goes and the country's code goes in front, so "0811 …" in
 *   Indonesia is "+62 811 …". So is one typed with a "+" in front of that prefix, "+0811 …".
 * - A number that starts with the chosen country's code was most likely pasted without its "+",
 *   so the code isn't added again: "628112345678" is "+62 8112345678". Some countries' own
 *   numbers start with the digits of their code, though (Indian mobiles can start with 91), so it
 *   counts as pasted with its code only when what follows the code is as long as a number there.
 *   "9198765432" in India is ten digits, a whole Indian number, and the eight after its 91 aren't,
 *   so it gets +91 in front. In Indonesia a number has 9 to 12 digits after the 62, and none of
 *   its own numbers that long start with 62 (mobiles start with 8).
 * - Anything else is local, with the chosen country's code put in front.
 * - North America (the United States, Canada, the Dominican Republic, Jamaica and the rest) shares
 *   country code 1, and every number there is ten digits after it, area code first: seven digits
 *   on their own are missing it.
 */
export function chatTarget(
	countryCode: string,
	original: string,
	message: string
): ChatTarget | { problem: ChatProblem } | undefined {
	// An extension at the end ("ext 5", "x5", "#5") isn't part of the number WhatsApp dials.
	const extensionMatch = EXTENSION.exec(asciiDigits(original));
	const typed = extensionMatch ? original.slice(0, extensionMatch.index) : original;
	const digits = digitsOnly(typed);
	if (!digits) return /\p{L}/u.test(original) ? { problem: 'no-digits' } : undefined;
	if (severalNumbers(typed)) return { problem: 'several' };
	const lettersDropped = /\p{L}/u.test(asciiDigits(typed));
	let international = asciiDigits(typed).trim().startsWith('+') || digits.startsWith('00');
	let code = countryCode;
	let national: string;
	const full = international ? digits.replace(/^00/, '') : digits;
	const known = CODES.find((candidate) => full.startsWith(candidate));
	// A "+" before the chosen country's trunk prefix, and no country code, is a local number typed
	// with a "+" out of habit: "+0811 …" (no country code starts with 0), or "+8 912 …" in Russia.
	if (
		international &&
		!known &&
		trunkPrefixes(countryCode).some((prefix) => full.startsWith(prefix))
	) {
		international = false;
	}
	if (international) {
		code = known ?? '';
		national = withoutTrunkPrefix(code, full.slice(code.length));
	} else {
		const afterCode = withoutTrunkPrefix(countryCode, full.slice(countryCode.length));
		const pasted = full.startsWith(countryCode) && fits(countryCode, afterCode);
		national = pasted ? afterCode : withoutTrunkPrefix(countryCode, full);
	}
	if (!national) return undefined;
	// North American numbers are always ten digits after the 1: a three-digit area code first.
	if (code === '1' && national.length === 7) return { problem: 'area-code' };
	// An Indonesian landline is its area code (21 for Jakarta) and five to eight digits; mobiles
	// start with 8. Seven or eight digits that don't is a landline typed without its area code.
	if (
		code === '62' &&
		(national.length === 7 || national.length === 8) &&
		!national.startsWith('8')
	) {
		return { problem: 'area-code' };
	}
	const number = `${code}${national}`;
	// Where we know how long numbers are, a number has to be one of those lengths; elsewhere, 8 to
	// 15 digits with the code, as E.164 allows.
	const lengths = NATIONAL_LENGTHS[code];
	if (number.length < SHORTEST_NUMBER || (lengths && national.length < lengths[0])) {
		return { problem: lettersDropped ? 'too-short-letters' : 'too-short' };
	}
	// More digits than any phone number anywhere has. When the number after the code starts with
	// the code again ("62 62 812…"), that's the likely reason, and "too long" says so; otherwise
	// it's just too many.
	if (number.length > LONGEST_NUMBER) {
		return { problem: national.startsWith(code) ? 'too-long' : 'too-many-digits' };
	}
	if (lengths && national.length > lengths[1]) return { problem: 'too-long' };
	const text = message.trim();
	const target: ChatTarget = {
		number,
		display: code ? `+${code} ${grouped(code, national)}` : `+${number}`,
		link: chatLink(number, text),
		countryCode: code,
		short: Boolean(lengths && lengths[0] < lengths[1] && national.length === lengths[0]),
		lettersDropped
	};
	if (extensionMatch) target.extension = extensionMatch[1];
	return target;
}

// How numbers are written where people most often message from Indonesia, mobile numbers above
// all, by country code: which numbers (a length and how they start) and the sizes of their groups.
// Only for reading: the link keeps the digits alone.
const NUMBER_FORMATS: Record<string, { length: number; starts: RegExp; groups: number[] }[]> = {
	'1': [{ length: 10, starts: /^/, groups: [3, 3, 4] }], // 415-555-0132
	'44': [{ length: 10, starts: /^7/, groups: [4, 6] }], // 7700-900123
	'60': [
		{ length: 9, starts: /^1/, groups: [2, 3, 4] }, // 12-345-6789
		{ length: 10, starts: /^1/, groups: [2, 4, 4] } // 11-2345-6789
	],
	'61': [{ length: 9, starts: /^4/, groups: [3, 3, 3] }], // 412-345-678
	'62': [
		{ length: 9, starts: /^8/, groups: [3, 3, 3] }, // 812-345-678
		{ length: 10, starts: /^8/, groups: [3, 4, 3] }, // 811-2345-678
		{ length: 11, starts: /^8/, groups: [3, 4, 4] }, // 812-3456-7890
		{ length: 12, starts: /^8/, groups: [3, 4, 5] }
	],
	'63': [{ length: 10, starts: /^9/, groups: [3, 3, 4] }], // 917-123-4567
	'65': [{ length: 8, starts: /^/, groups: [4, 4] }], // 9123-4567
	'66': [{ length: 9, starts: /^[689]/, groups: [2, 3, 4] }], // 81-234-5678
	'81': [{ length: 10, starts: /^[789]0/, groups: [2, 4, 4] }], // 90-1234-5678
	'82': [{ length: 10, starts: /^10/, groups: [2, 4, 4] }], // 10-1234-5678
	'84': [{ length: 9, starts: /^[35789]/, groups: [2, 3, 4] }], // 91-234-5678
	'86': [{ length: 11, starts: /^1/, groups: [3, 4, 4] }], // 138-1234-5678
	'91': [{ length: 10, starts: /^[6-9]/, groups: [5, 5] }], // 98765-43210
	'852': [{ length: 8, starts: /^/, groups: [4, 4] }], // 9123-4567
	'966': [{ length: 9, starts: /^5/, groups: [2, 3, 4] }], // 50-123-4567
	'971': [{ length: 9, starts: /^5/, groups: [2, 3, 4] }] // 50-123-4567
};

/**
 * A number after its country code, in groups, so it can be checked against what was typed: a run
 * of eleven digits is the hardest thing to compare. Where it's known how numbers are written there
 * ("90-1234-5678" in Japan), that way; elsewhere, blocks of three with four at the end, the way
 * most numbers are read out, and never a digit on its own.
 */
export function grouped(code: string, national: string): string {
	const format = NUMBER_FORMATS[code]?.find(
		(candidate) => candidate.length === national.length && candidate.starts.test(national)
	);
	if (format) {
		const parts: string[] = [];
		let at = 0;
		for (const size of format.groups) {
			parts.push(national.slice(at, at + size));
			at += size;
		}
		return parts.join('-');
	}
	if (national.length <= 4) return national;
	const groups = [national.slice(-4)];
	let rest = national.slice(0, -4);
	while (rest.length > 3) {
		groups.unshift(rest.slice(-3));
		rest = rest.slice(0, -3);
	}
	// A digit on its own reads as a slip: it joins the block after it instead.
	if (rest.length === 1) groups[0] = rest + groups[0];
	else if (rest) groups.unshift(rest);
	return groups.join('-');
}

/**
 * The countries a country code belongs to, by name: "Russia" and "Kazakhstan" for 7. For 1, only
 * the United States and Canada: the other countries on it are told apart by area code, which the
 * number itself carries.
 */
export function countriesWithCode(code: string): string[] {
	return COUNTRIES.filter((country) => country.phoneCode === code && !country.areaCodes).map(
		(country) => country.name
	);
}

// "ext 5", "ext. 12", "x5", "#5" at the end of what was typed: an extension, not more digits.
const EXTENSION = /\s*(?:ext\.?|extension|x|#)\s*(\d{1,6})\s*$/i;

/**
 * Whether what was typed holds more than one number: two runs of digits long enough to be numbers
 * on their own, with a comma, slash, semicolon, "or" or a new line between them.
 */
function severalNumbers(typed: string): boolean {
	const parts = asciiDigits(typed).split(/[,;/\n]|\bor\b|\batau\b/i);
	return parts.filter((part) => digitsOnly(part).length >= 7).length >= 2;
}
