import { describe, expect, it } from 'vitest';
import { chatTarget, digitsOnly } from './whatsapp';

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
		const target = chatTarget('62', '8119710096', '');
		expect(target?.link).toBe('https://wa.me/628119710096');
		expect(target?.display).toBe('+62 8119710096');
	});

	it('drops the leading 0 of a local number', () => {
		expect(chatTarget('62', '0811 9710 096', '')?.number).toBe('628119710096');
	});

	it('takes a number that starts with + as it is, whatever country is chosen', () => {
		const target = chatTarget('62', '+1 (415) 555-0132', '');
		expect(target?.number).toBe('14155550132');
		expect(target?.display).toBe('+14155550132');
	});

	it('adds the message, trimmed and escaped', () => {
		const target = chatTarget('62', '8119710096', '  Hi! Can we talk & meet?  ');
		expect(target?.link).toBe(
			'https://wa.me/628119710096?text=Hi!%20Can%20we%20talk%20%26%20meet%3F'
		);
	});

	it('leaves the text off when the message is only spaces', () => {
		expect(chatTarget('62', '8119710096', '   ')?.link).toBe('https://wa.me/628119710096');
	});
});
