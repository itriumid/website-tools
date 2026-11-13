import { describe, expect, it } from 'vitest';
import {
	chatLink,
	chatTarget,
	countriesWithCode,
	digitsOnly,
	grouped,
	waitsForTyping,
	withoutDoubledCode,
	type ChatTarget
} from './whatsapp';

/** The chat to open, when there is one: undefined for nothing yet and for a problem alike. */
function chat(...input: Parameters<typeof chatTarget>): ChatTarget | undefined {
	const result = chatTarget(...input);
	return result && 'link' in result ? result : undefined;
}

describe('digitsOnly', () => {
	it('keeps the digits and drops everything else', () => {
		expect(digitsOnly('+62 (811) 234-5678')).toBe('628112345678');
	});
});

describe('chatTarget', () => {
	it('has nothing to open until there is a digit', () => {
		expect(chatTarget('62', '', '')).toBeUndefined();
		expect(chatTarget('62', ' - ', 'hi')).toBeUndefined();
		expect(chatTarget('62', '0', '')).toBeUndefined();
	});

	it('puts the chosen country in front of a local number', () => {
		const target = chat('62', '8112345678', '');
		expect(target?.link).toBe('https://wa.me/628112345678');
		expect(target?.display).toBe('+62 811-2345-678');
	});

	it('drops the leading 0 of a local number', () => {
		expect(chat('62', '0811 2345 678', '')?.number).toBe('628112345678');
	});

	it('takes a number that starts with + as it is, whatever country is chosen', () => {
		const target = chat('62', '+1 (415) 555-0132', '');
		expect(target?.number).toBe('14155550132');
		// Written the same way as a local one: the code, a space, then the number.
		expect(target?.display).toBe('+1 415-555-0132');
	});

	it('adds the message, trimmed and escaped', () => {
		const target = chat('62', '8112345678', '  Hi! Can we talk & meet?  ');
		expect(target?.link).toBe(
			'https://wa.me/628112345678?text=Hi!%20Can%20we%20talk%20%26%20meet%3F'
		);
	});

	it('leaves the text off when the message is only spaces', () => {
		expect(chat('62', '8112345678', '   ')?.link).toBe('https://wa.me/628112345678');
	});

	it('takes 00 as the + of dialing abroad', () => {
		expect(chat('62', '0062 811 2345 678', '')?.link).toBe('https://wa.me/628112345678');
		expect(chat('62', '00 1 415 555 0132', '')?.link).toBe('https://wa.me/14155550132');
	});

	it('drops a trunk 0 typed after the country code', () => {
		expect(chat('62', '+62 0811 2345 678', '')?.link).toBe('https://wa.me/628112345678');
		expect(chat('62', '0062 0811 2345 678', '')?.link).toBe('https://wa.me/628112345678');
		expect(chat('62', '+44 07700 900123', '')?.link).toBe('https://wa.me/447700900123');
	});

	it("keeps Italy's leading 0, which is part of the number", () => {
		expect(chat('62', '+39 06 1234 5678', '')?.link).toBe('https://wa.me/390612345678');
		expect(chat('39', '06 1234 5678', '')?.link).toBe('https://wa.me/390612345678');
		expect(chat('39', '0039 347 123 4567', '')?.link).toBe('https://wa.me/393471234567');
	});

	it("doesn't add the country code again to a number pasted with it", () => {
		const target = chat('62', '628112345678', '');
		expect(target?.link).toBe('https://wa.me/628112345678');
		expect(target?.display).toBe('+62 811-2345-678');
		expect(chat('62', '62 0811 2345 678', '')?.link).toBe('https://wa.me/628112345678');
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
		expect(chatTarget('62', '0811 2345 6781 23', '')).toEqual({ problem: 'too-long' });
		expect(chatTarget('62', '+62 811 2345 6781 23', '')).toEqual({ problem: 'too-long' });
		// More than 15 digits isn't a phone number anywhere: a different problem from a code twice.
		expect(chatTarget('62', '0811 2345 6781 2345', '')).toEqual({ problem: 'too-many-digits' });
		// The country code typed twice: "too long", which asks about exactly that.
		expect(chatTarget('62', '62 62 812 3456 7890', '')).toEqual({ problem: 'too-long' });
		expect(chatTarget('62', '+62 62 812 3456 7890', '')).toEqual({ problem: 'too-long' });
	});

	it('takes 8 to 15 digits, country code included', () => {
		expect(chat('65', '9123 4567', '')?.number).toBe('6591234567');
		expect(chatTarget('', '+30 12345', '')).toEqual({ problem: 'too-short' });
		expect(chat('', '+30 123456', '')?.number).toBe('30123456');
		expect(chat('', '+30 1234567890123', '')?.number).toBe('301234567890123');
		expect(chatTarget('', '+30 12345678901234', '')).toEqual({ problem: 'too-many-digits' });
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
		expect(chat('1', '876-555-1234', '')?.display).toBe('+1 876-555-1234');
	});

	it('asks for the area code of a seven-digit North American number', () => {
		expect(chatTarget('1', '555 1234', '')).toEqual({ problem: 'area-code' });
		// In Indonesia too: a landline's seven or eight digits, without the 21 of Jakarta.
		expect(chatTarget('62', '555 1234', '')).toEqual({ problem: 'area-code' });
		expect(chatTarget('62', '5555 1234', '')).toEqual({ problem: 'area-code' });
		expect(chat('62', '021 5555 1234', '')?.link).toBe('https://wa.me/622155551234');
		// A mobile number seven digits long is just too short.
		expect(chatTarget('62', '0812 345', '')).toEqual({ problem: 'too-short' });
		expect(chatTarget('1', '809 555 123', '')).toEqual({ problem: 'too-short' });
		expect(chatTarget('1', '809 555 12345', '')).toEqual({ problem: 'too-long' });
	});

	it('takes a + before the trunk prefix as a local number', () => {
		const target = chat('62', '+0811 2345 678', '');
		expect(target?.link).toBe('https://wa.me/628112345678');
		expect(target?.display).toBe('+62 811-2345-678');
		expect(chat('7', '+8 912 345 67 89', '')?.link).toBe('https://wa.me/79123456789');
		// A real country code after the + still wins: 81 is Japan.
		expect(chat('7', '+81 90 1234 5678', '')?.link).toBe('https://wa.me/819012345678');
	});

	it('reads Arabic, Persian and full-width digits', () => {
		expect(chat('62', '٠٨١١ ٢٣٤٥ ٦٧٨', '')?.link).toBe('https://wa.me/628112345678');
		expect(chat('62', '۰۸۱۱۲۳۴۵۶۷۸', '')?.link).toBe('https://wa.me/628112345678');
		expect(chat('62', '＋６２ ８１１ ２３４５ ６７８', '')?.link).toBe(
			'https://wa.me/628112345678'
		);
		expect(chat('966', '٠٥٠ ١٢٣ ٤٥٦٧', '')?.link).toBe('https://wa.me/966501234567');
	});

	it('says a number is too short or too long for its country, where we know how long they are', () => {
		// Japan: 9 or 10 digits after +81. Six can't be a number there.
		expect(chatTarget('81', '090 1234', '')).toEqual({ problem: 'too-short' });
		expect(chat('81', '090 1234 5678', '')?.link).toBe('https://wa.me/819012345678');
		// Indonesia: 9 to 12 digits after +62.
		expect(chatTarget('62', '811 234', '')).toEqual({ problem: 'too-short' });
		expect(chatTarget('62', '+62 811 2345 6781 23', '')).toEqual({ problem: 'too-long' });
		// Singapore: always 8.
		expect(chatTarget('65', '9123 456', '')).toEqual({ problem: 'too-short' });
	});

	it('takes the short landlines that are real: Seoul and Penang', () => {
		expect(chat('82', '02 123 4567', '')?.link).toBe('https://wa.me/8221234567');
		expect(chat('60', '04 123 4567', '')?.link).toBe('https://wa.me/6041234567');
	});

	it('leaves out letters, and says so', () => {
		const target = chat('62', 'WA: 0811 2345 678', '');
		expect(target?.link).toBe('https://wa.me/628112345678');
		expect(target?.lettersDropped).toBe(true);
		expect(chat('62', '0811 2345 678', '')?.lettersDropped).toBe(false);
		expect(chatTarget('62', 'abc', '')).toEqual({ problem: 'no-digits' });
		expect(chatTarget('62', ' - ', '')).toBeUndefined();
	});

	it("leaves off an extension, which WhatsApp can't dial", () => {
		for (const typed of ['0811 2345 678 ext 5', '0811 2345 678 ext. 5', '0811 2345 678 x5']) {
			const target = chat('62', typed, '');
			expect(target?.link).toBe('https://wa.me/628112345678');
			expect(target?.extension).toBe('5');
		}
	});

	it('says when there is more than one number', () => {
		expect(chatTarget('62', '0811 2345 678 / 0812 3456 789', '')).toEqual({ problem: 'several' });
		expect(chatTarget('62', '08112345678, 08123456789', '')).toEqual({ problem: 'several' });
		expect(chatTarget('62', '0811 2345 678 atau 0812 3456 789', '')).toEqual({
			problem: 'several'
		});
	});

	it('says which country code it read the number with, and the countries that use it', () => {
		expect(chat('62', '0811 2345 678', '')?.countryCode).toBe('62');
		expect(chat('62', '+44 7911 123456', '')?.countryCode).toBe('44');
		expect(countriesWithCode('62')).toEqual(['Indonesia']);
		expect(countriesWithCode('7')).toEqual(['Kazakhstan', 'Russia']);
		expect(countriesWithCode('1')).toEqual(['Canada', 'United States']);
	});

	it('marks a number at the short end, where most there are longer', () => {
		// A UK mobile is 10 digits after +44; 9 is a landline length, or a mobile missing one.
		expect(chat('44', '07911 12345', '')?.short).toBe(true);
		expect(chat('44', '07911 123456', '')?.short).toBe(false);
		// Singapore's numbers are all 8: nothing to mark.
		expect(chat('65', '9123 4567', '')?.short).toBe(false);
		// Where we don't know the lengths, nothing is marked either.
		expect(chat('49', '0151 23456789', '')?.short).toBe(false);
	});
});

describe('grouped', () => {
	it('writes Indonesian mobile numbers the way they are written there', () => {
		expect(grouped('62', '81234567890')).toBe('812-3456-7890');
		expect(grouped('62', '8112345678')).toBe('811-2345-678');
		expect(grouped('62', '812345678901')).toBe('812-3456-78901');
	});

	it('writes North American numbers as area code, exchange and line', () => {
		expect(grouped('1', '4155550132')).toBe('415-555-0132');
	});

	it('writes mobile numbers the way they are written where they are from', () => {
		expect(grouped('81', '9012345678')).toBe('90-1234-5678');
		expect(grouped('44', '7700900123')).toBe('7700-900123');
		expect(grouped('60', '123456789')).toBe('12-345-6789');
		expect(grouped('60', '1123456789')).toBe('11-2345-6789');
		expect(grouped('61', '412345678')).toBe('412-345-678');
		expect(grouped('63', '9171234567')).toBe('917-123-4567');
		expect(grouped('82', '1012345678')).toBe('10-1234-5678');
		expect(grouped('86', '13812345678')).toBe('138-1234-5678');
		expect(grouped('91', '9876543210')).toBe('98765-43210');
		expect(grouped('966', '501234567')).toBe('50-123-4567');
		expect(grouped('971', '501234567')).toBe('50-123-4567');
		expect(grouped('852', '91234567')).toBe('9123-4567');
	});

	it('elsewhere, reads in threes with four at the end', () => {
		expect(grouped('62', '215550123')).toBe('21-555-0123');
		expect(grouped('49', '3012345678')).toBe('301-234-5678');
		expect(grouped('65', '91234567')).toBe('9123-4567');
		expect(grouped('49', '15123456789')).toBe('1512-345-6789');
	});

	it('never changes the digits, only where the gaps are', () => {
		for (const national of ['1', '12345', '123456789012345']) {
			expect(grouped('49', national).replaceAll('-', '')).toBe(national);
		}
	});
});

describe('waitsForTyping', () => {
	it('holds back what every number is halfway through, and nothing else', () => {
		const halfway = chatTarget('62', '08', '');
		expect(halfway && 'problem' in halfway && waitsForTyping(halfway.problem)).toBe(true);
		expect(waitsForTyping('area-code')).toBe(true);
		expect(waitsForTyping('too-short-letters')).toBe(true);
		for (const problem of ['too-long', 'too-many-digits', 'several', 'no-digits'] as const) {
			expect(waitsForTyping(problem)).toBe(false);
		}
	});
});

describe('countries', () => {
	it('names every country in full, so it can be found by any word of its name', () => {
		expect(countriesWithCode('971')).toEqual(['United Arab Emirates']);
	});
});

describe('letters typed with a number', () => {
	it('says when a number is too short once the letters are left out', () => {
		expect(chatTarget('62', '0812-FLOWERS', '')).toEqual({ problem: 'too-short-letters' });
		expect(chatTarget('62', '0812', '')).toEqual({ problem: 'too-short' });
	});
});

describe('chatLink', () => {
	it('opens a chat with the number, with the message typed in when there is one', () => {
		expect(chatLink('6281234567890')).toBe('https://wa.me/6281234567890');
		expect(chatLink('6281234567890', ' Halo, kak ')).toBe(
			'https://wa.me/6281234567890?text=Halo%2C%20kak'
		);
	});
});

describe('withoutDoubledCode', () => {
	it('offers the number with its country code once', () => {
		expect(withoutDoubledCode('62', '+62 62 812 3456 7890', '')?.display).toBe('+62 812-3456-7890');
		expect(withoutDoubledCode('62', '62 62 812 3456 7890', '')?.display).toBe('+62 812-3456-7890');
		expect(withoutDoubledCode('62', '0062 62 812 3456 7890', 'Halo')?.link).toBe(
			'https://wa.me/6281234567890?text=Halo'
		);
	});
	it("offers nothing when once still isn't a number", () => {
		expect(withoutDoubledCode('62', '+62 62 812 3456 7890 12', '')).toBeUndefined();
		expect(withoutDoubledCode('62', '0811 2345 6781 23', '')).toBeUndefined();
		expect(withoutDoubledCode('62', '+62 812 3456 7890', '')).toBeUndefined();
		expect(withoutDoubledCode('62', '', '')).toBeUndefined();
	});
});
