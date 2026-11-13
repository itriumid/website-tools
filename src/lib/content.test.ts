import { describe, expect, it } from 'vitest';
import { SPLIT_BILL } from './content';

describe("what's in nobody's share, in words", () => {
	it('names one item, several, and more than three', () => {
		expect(SPLIT_BILL.untagged(['Teh'], 'Rp 5.500')).toBe(
			"Teh isn't tagged or counted for anyone, so Rp 5.500 of the total is left out of the shares."
		);
		expect(SPLIT_BILL.untagged(['2× Kerupuk', 'Teh'], 'Rp 13.200')).toBe(
			"2× Kerupuk and Teh aren't tagged or counted for anyone, so Rp 13.200 of the total is left out of the shares."
		);
		expect(SPLIT_BILL.untagged(['A', 'B', 'C', 'D', 'E'], 'Rp 1')).toMatch(
			/^A, B, C and 2 more aren't/
		);
	});

	it("tells a friend who covers it, or that it's left out", () => {
		expect(SPLIT_BILL.unsharedCovered(['Teh'], 'Rp 5.500', 'Budi')).toBe(
			"Teh (Rp 5.500) isn't in anyone's share: Budi covers it for now."
		);
		expect(SPLIT_BILL.unsharedCovered(['2× Kerupuk', 'Teh'], 'Rp 13.200', 'Budi')).toBe(
			"2× Kerupuk and Teh (Rp 13.200) aren't in anyone's share: Budi covers them for now."
		);
		expect(SPLIT_BILL.unsharedLeftOut(['2× Kerupuk', 'Teh'], 'Rp 13.200')).toBe(
			"2× Kerupuk and Teh (Rp 13.200) aren't in anyone's share, so they're left out of everyone's share."
		);
	});
});
