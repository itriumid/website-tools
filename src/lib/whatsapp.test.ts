import { describe, expect, it } from 'vitest';
import { chatTarget, digitsOnly, type ChatTarget } from './whatsapp';

/** The chat to open, when there is one: undefined for nothing yet and for a problem alike. */
function chat(...input: Parameters<typeof chatTarget>): ChatTarget | undefined {
	const result = chatTarget(...input);
	return result && 'link' in result ? result : undefined;
}

describe('digitsOnly', () => {
	it('keeps the digits and drops everything else', () => {
		expect(digitsOnly('+62 (811) 971-0096')).toBe('628119710096');
	});
});

describe('chatTarget', () => {
	it('has nothing to open until there is a digit', () => {
		expect(chatTarget('62', '', '')).toBeUndefined();
		expect(chatTarget('62', ' - ', 'hi')).toBeUndefined();
		expect(chatTarget('62', '0', '')).toBeUndefined();
	});

	it('puts the chosen country in front of a local number', () => {
		const target = chat('62', '8119710096', '');
		expect(target?.link).toBe('https://wa.me/628119710096');
		expect(target?.display).toBe('+62 8119710096');
	});

	it('drops the leading 0 of a local number', () => {
		expect(chat('62', '0811 9710 096', '')?.number).toBe('628119710096');
	});

	it('takes a number that starts with + as it is, whatever country is chosen', () => {
		const target = chat('62', '+1 (415) 555-0132', '');
		expect(target?.number).toBe('14155550132');
		// Written the same way as a local one: the code, a space, then the number.
		expect(target?.display).toBe('+1 4155550132');
	});

	it('adds the message, trimmed and escaped', () => {
		const target = chat('62', '8119710096', '  Hi! Can we talk & meet?  ');
		expect(target?.link).toBe(
			'https://wa.me/628119710096?text=Hi!%20Can%20we%20talk%20%26%20meet%3F'
		);
	});

	it('leaves the text off when the message is only spaces', () => {
		expect(chat('62', '8119710096', '   ')?.link).toBe('https://wa.me/628119710096');
	});

	it('takes 00 as the + of dialing abroad', () => {
		expect(chat('62', '0062 811 9710 096', '')?.link).toBe('https://wa.me/628119710096');
		expect(chat('62', '00 1 415 555 0132', '')?.link).toBe('https://wa.me/14155550132');
	});

	it('drops a trunk 0 typed after the country code', () => {
		expect(chat('62', '+62 0811 9710 096', '')?.link).toBe('https://wa.me/628119710096');
		expect(chat('62', '0062 0811 9710 096', '')?.link).toBe('https://wa.me/628119710096');
		expect(chat('62', '+44 07700 900123', '')?.link).toBe('https://wa.me/447700900123');
	});

	it("keeps Italy's leading 0, which is part of the number", () => {
		expect(chat('62', '+39 06 1234 5678', '')?.link).toBe('https://wa.me/390612345678');
		expect(chat('39', '06 1234 5678', '')?.link).toBe('https://wa.me/390612345678');
		expect(chat('39', '0039 347 123 4567', '')?.link).toBe('https://wa.me/393471234567');
	});

	it("doesn't add the country code again to a number pasted with it", () => {
		const target = chat('62', '628119710096', '');
		expect(target?.link).toBe('https://wa.me/628119710096');
		expect(target?.display).toBe('+62 8119710096');
		expect(chat('62', '62 0811 9710 096', '')?.link).toBe('https://wa.me/628119710096');
		expect(chat('65', '6591234567', '')?.link).toBe('https://wa.me/6591234567');
		expect(chat('1', '14155550132', '')?.link).toBe('https://wa.me/14155550132');
	});

	it('adds the code to a local number that only starts with its digits', () => {
		// An Indian mobile can start with 91: ten digits is a whole Indian number.
		expect(chat('91', '9198765432', '')?.link).toBe('https://wa.me/919198765432');
		expect(chat('91', '919198765432', '')?.link).toBe('https://wa.me/919198765432');
		// Eight digits after Singapore's 65 is a Singapore number; six aren't.
		expect(chat('65', '65123456', '')?.link).toBe('https://wa.me/6565123456');
		// An Indonesian landline typed without its 0: 0622 is Pematangsiantar.
		expect(chat('62', '622 1234567', '')?.link).toBe('https://wa.me/626221234567');
	});

	it('builds the usual links for other countries', () => {
		expect(chat('60', '012-345 6789', '')?.link).toBe('https://wa.me/60123456789');
		expect(chat('44', '07700 900123', '')?.link).toBe('https://wa.me/447700900123');
		expect(chat('91', '98765 43210', '')?.link).toBe('https://wa.me/919876543210');
		expect(chat('1', '(415) 555-0132', '')?.link).toBe('https://wa.me/14155550132');
		expect(chat('49', '0151 23456789', '')?.link).toBe('https://wa.me/4915123456789');
	});

	it('says a number is too short instead of building a link', () => {
		expect(chatTarget('62', '1', '')).toEqual({ problem: 'too-short' });
		expect(chatTarget('62', '0811', '')).toEqual({ problem: 'too-short' });
		expect(chatTarget('62', '+62 81', '')).toEqual({ problem: 'too-short' });
	});

	it('says a number is too long instead of building a link', () => {
		expect(chatTarget('62', '0811 9710 0961 2345', '')).toEqual({ problem: 'too-long' });
		expect(chatTarget('62', '+62 811 9710 0961 2345', '')).toEqual({ problem: 'too-long' });
	});

	it('takes 8 to 15 digits, country code included', () => {
		expect(chat('65', '9123 4567', '')?.number).toBe('6591234567');
		expect(chatTarget('', '+30 12345', '')).toEqual({ problem: 'too-short' });
		expect(chat('', '+30 123456', '')?.number).toBe('30123456');
		expect(chat('', '+30 1234567890123', '')?.number).toBe('301234567890123');
		expect(chatTarget('', '+30 12345678901234', '')).toEqual({ problem: 'too-long' });
	});

	it("drops the trunk prefix of countries where it isn't 0", () => {
		expect(chat('7', '8 912 345 67 89', '')?.link).toBe('https://wa.me/79123456789');
		expect(chat('7', '8 (701) 123-45-67', '')?.link).toBe('https://wa.me/77011234567');
		expect(chat('7', '+7 8 912 345 67 89', '')?.link).toBe('https://wa.me/79123456789');
		expect(chat('36', '06 30 123 4567', '')?.link).toBe('https://wa.me/36301234567');
		expect(chat('375', '8 029 123-45-67', '')?.link).toBe('https://wa.me/375291234567');
		expect(chat('370', '8 612 34567', '')?.link).toBe('https://wa.me/37061234567');
		expect(chat('370', '0 612 34567', '')?.link).toBe('https://wa.me/37061234567');
		expect(chat('976', '8811 2345', '')?.link).toBe('https://wa.me/97688112345');
	});

	it("keeps an 8 that's part of a Russian number", () => {
		// 812 is St Petersburg: ten digits with the 8, so it isn't a trunk prefix.
		expect(chat('7', '812 345 67 89', '')?.link).toBe('https://wa.me/78123456789');
		expect(chat('7', '+7 812 345 67 89', '')?.link).toBe('https://wa.me/78123456789');
		expect(chat('7', '8 812 345 67 89', '')?.link).toBe('https://wa.me/78123456789');
	});

	it('takes the area code as part of a North American number', () => {
		// The Dominican Republic and Jamaica share country code 1: the area code is in the number.
		expect(chat('1', '809 555 1234', '')?.link).toBe('https://wa.me/18095551234');
		expect(chat('1', '(829) 555-1234', '')?.link).toBe('https://wa.me/18295551234');
		expect(chat('1', '1 809 555 1234', '')?.link).toBe('https://wa.me/18095551234');
		expect(chat('62', '+1 876 555 1234', '')?.link).toBe('https://wa.me/18765551234');
		expect(chat('1', '876-555-1234', '')?.display).toBe('+1 8765551234');
	});

	it('asks for the area code of a seven-digit North American number', () => {
		expect(chatTarget('1', '555 1234', '')).toEqual({ problem: 'area-code' });
		expect(chatTarget('1', '809 555 123', '')).toEqual({ problem: 'too-short' });
		expect(chatTarget('1', '809 555 12345', '')).toEqual({ problem: 'too-long' });
	});

	it('takes a + before the trunk prefix as a local number', () => {
		const target = chat('62', '+0811 9710 096', '');
		expect(target?.link).toBe('https://wa.me/628119710096');
		expect(target?.display).toBe('+62 8119710096');
		expect(chat('7', '+8 912 345 67 89', '')?.link).toBe('https://wa.me/79123456789');
		// A real country code after the + still wins: 81 is Japan.
		expect(chat('7', '+81 90 1234 5678', '')?.link).toBe('https://wa.me/819012345678');
	});

	it('reads Arabic, Persian and full-width digits', () => {
		expect(chat('62', '٠٨١١ ٩٧١٠ ٠٩٦', '')?.link).toBe('https://wa.me/628119710096');
		expect(chat('62', '۰۸۱۱۹۷۱۰۰۹۶', '')?.link).toBe('https://wa.me/628119710096');
		expect(chat('62', '＋６２ ８１１ ９７１０ ０９６', '')?.link).toBe(
			'https://wa.me/628119710096'
		);
		expect(chat('966', '٠٥٠ ١٢٣ ٤٥٦٧', '')?.link).toBe('https://wa.me/966501234567');
	});

	it('says a number is too short or too long for its country, where we know how long they are', () => {
		// Japan: 9 or 10 digits after +81. Six can't be a number there.
		expect(chatTarget('81', '090 1234', '')).toEqual({ problem: 'too-short' });
		expect(chat('81', '090 1234 5678', '')?.link).toBe('https://wa.me/819012345678');
		// Indonesia: 9 to 12 digits after +62.
		expect(chatTarget('62', '811 970', '')).toEqual({ problem: 'too-short' });
		expect(chatTarget('62', '+62 811 9710 0961 23', '')).toEqual({ problem: 'too-long' });
		// Singapore: always 8.
		expect(chatTarget('65', '9123 456', '')).toEqual({ problem: 'too-short' });
	});

	it('takes the short landlines that are real: Seoul and Penang', () => {
		expect(chat('82', '02 123 4567', '')?.link).toBe('https://wa.me/8221234567');
		expect(chat('60', '04 123 4567', '')?.link).toBe('https://wa.me/6041234567');
	});

	it('leaves out letters, and says so', () => {
		const target = chat('62', 'WA: 0811 9710 096', '');
		expect(target?.link).toBe('https://wa.me/628119710096');
		expect(target?.lettersDropped).toBe(true);
		expect(chat('62', '0811 9710 096', '')?.lettersDropped).toBe(false);
		expect(chatTarget('62', 'abc', '')).toEqual({ problem: 'no-digits' });
		expect(chatTarget('62', ' - ', '')).toBeUndefined();
	});

	it("leaves off an extension, which WhatsApp can't dial", () => {
		for (const typed of ['0811 9710 096 ext 5', '0811 9710 096 ext. 5', '0811 9710 096 x5']) {
			const target = chat('62', typed, '');
			expect(target?.link).toBe('https://wa.me/628119710096');
			expect(target?.extension).toBe('5');
		}
	});

	it('says when there is more than one number', () => {
		expect(chatTarget('62', '0811 9710 096 / 0812 3456 789', '')).toEqual({ problem: 'several' });
		expect(chatTarget('62', '08119710096, 08123456789', '')).toEqual({ problem: 'several' });
		expect(chatTarget('62', '0811 9710 096 atau 0812 3456 789', '')).toEqual({
			problem: 'several'
		});
	});
});
