import { describe, expect, it } from 'vitest';
import { asciiDigits } from './digits';

describe('asciiDigits', () => {
	it('reads Arabic-Indic digits as 0 to 9', () => {
		expect(asciiDigits('٠١٢٣٤٥٦٧٨٩')).toBe('0123456789');
	});

	it('reads Eastern Arabic digits, as Persian and Urdu write them, as 0 to 9', () => {
		expect(asciiDigits('۰۱۲۳۴۵۶۷۸۹')).toBe('0123456789');
	});

	it('reads full-width digits and marks as their usual ones', () => {
		expect(asciiDigits('０１２３４５６７８９')).toBe('0123456789');
		expect(asciiDigits('＋６２　８１１')).toBe('+62　811');
		expect(asciiDigits('１，２３４．５０')).toBe('1,234.50');
		expect(asciiDigits('－５')).toBe('-5');
	});

	it('reads the Arabic decimal and thousands marks as a dot and a comma', () => {
		expect(asciiDigits('١٬٢٣٤٫٥٦')).toBe('1,234.56');
	});

	it('leaves everything else as it is', () => {
		expect(asciiDigits('Rp 45.000, +62 (811)')).toBe('Rp 45.000, +62 (811)');
	});
});
