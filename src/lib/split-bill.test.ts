import { describe, expect, it } from 'vitest';
import {
	billFromHash,
	billToHash,
	calculateBill,
	decimalPlaces,
	formatAmount,
	type BillState
} from './split-bill';

const bill = (overrides: Partial<BillState> = {}): BillState => ({
	people: [
		{ id: 'a', name: 'Ayu' },
		{ id: 'b', name: 'Budi' }
	],
	items: [],
	taxPercentage: 0,
	servicePercentage: 0,
	currencyCode: 'IDR',
	...overrides
});

describe('share links', () => {
	// Made on zakir.id before the tool moved here: these must keep opening, forever.
	const LINK_FROM_BEFORE_THE_MOVE =
		'#data=N4IgDgpg9mA2EgFwG1QEsAmSQEMCMIANCAHY4C2CiIAggJ4CuIAvoeltQEYBMRpFVEACEGGNCwC6xNABcI5AM5JUITNjQFiZStgByOBWgAEAcygAnCCRN8w5tAGMqAZgCsABk-EDhkyQgYAAoQ5gpQJACSGEoouAQSrOzqvFoC2ACiCkZyABa29k5IeNye7t4Kvv5BIWGR0cpxfDwgCVIgMjgAHsHmTiQdJlR4ZSAKIQBujhA9fQNUrsQODOaWJA50AMJQGIIRACIASixAA';

	it('opens a link made before the move', () => {
		expect(billFromHash(LINK_FROM_BEFORE_THE_MOVE)).toEqual({
			people: [
				{ id: 'a1', name: 'Ayu' },
				{ id: 'b2', name: 'Budi' }
			],
			items: [
				{ id: 'i1', name: 'Nasi goreng', price: 35000, assignedPersonIds: ['a1'] },
				{ id: 'i2', name: 'Es teh', price: 12000, assignedPersonIds: ['a1', 'b2'] }
			],
			taxPercentage: 10,
			servicePercentage: 5,
			currencyCode: 'IDR'
		});
	});

	it('makes links that open again as they were', () => {
		const state = bill({
			items: [{ id: 'i', name: 'Kopi susu ☕', price: 22500.5, assignedPersonIds: ['a'] }],
			taxPercentage: 11,
			servicePercentage: 0,
			currencyCode: 'USD'
		});
		expect(billFromHash(billToHash(state))).toEqual(state);
	});

	it('fills in what an older link leaves out', () => {
		const old = '#data=' + billToHash(bill()).slice('#data='.length);
		expect(billFromHash(old)?.currencyCode).toBe('IDR');
	});

	it('is shut of anything that is not a bill', () => {
		expect(billFromHash('')).toBeUndefined();
		expect(billFromHash('#data=')).toBeUndefined();
		expect(billFromHash('#data=not-a-bill')).toBeUndefined();
		expect(billFromHash('#other=abc')).toBeUndefined();
		expect(billFromHash('#data=NoIgxg')).toBeUndefined();
	});

	it('refuses a bill whose parts are the wrong shape', () => {
		const wrong = (value: unknown) => {
			const json = JSON.stringify(value);
			// Compress by round-tripping through a real bill's encoder is impossible for bad shapes,
			// so use the same library the page does.
			return billFromHash('#data=' + compress(json));
		};
		expect(wrong({ people: [{ id: 1, name: 'x' }], items: [] })).toBeUndefined();
		expect(
			wrong({ people: [], items: [{ id: 'i', name: 'x', price: -5, assignedPersonIds: [] }] })
		).toBeUndefined();
		expect(
			wrong({ people: [], items: [{ id: 'i', name: 'x', price: 'free', assignedPersonIds: [] }] })
		).toBeUndefined();
		expect(wrong({ people: [], items: [], taxPercentage: 'lots' })?.taxPercentage).toBe(10);
		expect(wrong({ people: [], items: [], servicePercentage: 500 })?.servicePercentage).toBe(5);
	});
});

import lzString from 'lz-string';
const compress = (text: string) => lzString.compressToEncodedURIComponent(text);

describe('calculateBill', () => {
	it('adds up the items, tax and service', () => {
		const totals = calculateBill(
			bill({
				items: [{ id: 'i', name: 'Nasi', price: 100000, assignedPersonIds: ['a'] }],
				taxPercentage: 10,
				servicePercentage: 5
			})
		);
		expect(totals.subtotal).toBe(100000);
		expect(totals.tax).toBe(10000);
		expect(totals.service).toBe(5000);
		expect(totals.grandTotal).toBe(115000);
	});

	it('splits an item evenly among the people tagged to it', () => {
		const totals = calculateBill(
			bill({
				items: [
					{ id: '1', name: 'Pizza', price: 60000, assignedPersonIds: ['a', 'b'] },
					{ id: '2', name: 'Beer', price: 20000, assignedPersonIds: ['b'] }
				]
			})
		);
		expect(totals.shares.map((share) => share.total)).toEqual([30000, 50000]);
	});

	it('shares tax and service in proportion to what each person had', () => {
		const totals = calculateBill(
			bill({
				items: [
					{ id: '1', name: 'Soup', price: 40000, assignedPersonIds: ['a'] },
					{ id: '2', name: 'Steak', price: 160000, assignedPersonIds: ['b'] }
				],
				taxPercentage: 10,
				servicePercentage: 0
			})
		);
		expect(totals.shares.map((share) => share.base)).toEqual([40000, 160000]);
		expect(totals.shares.map((share) => share.total)).toEqual([44000, 176000]);
	});

	it('shares always add up to the bill, even when it does not divide evenly', () => {
		const people = ['a', 'b', 'c'].map((id) => ({ id, name: id }));
		const items = [{ id: '1', name: 'Platter', price: 100000, assignedPersonIds: ['a', 'b', 'c'] }];
		const rupiah = calculateBill(bill({ people, items }));
		expect(rupiah.shares.map((share) => share.total)).toEqual([33334, 33333, 33333]);
		expect(rupiah.shares.reduce((sum, share) => sum + share.total, 0)).toBe(100000);

		const dollars = calculateBill(
			bill({ people, items: [{ ...items[0], price: 100 }], currencyCode: 'USD' })
		);
		expect(dollars.shares.map((share) => share.total)).toEqual([33.34, 33.33, 33.33]);
	});

	it('leaves items nobody is tagged to out of every share, and says what they come to', () => {
		const totals = calculateBill(
			bill({
				items: [
					{ id: '1', name: 'Rice', price: 10000, assignedPersonIds: ['a'] },
					{ id: '2', name: 'Mystery', price: 25000, assignedPersonIds: [] }
				]
			})
		);
		expect(totals.unassigned).toBe(25000);
		expect(totals.shares.map((share) => share.total)).toEqual([10000, 0]);
	});

	it('ignores a tag for someone who is not on the bill any more', () => {
		const totals = calculateBill(
			bill({ items: [{ id: '1', name: 'Rice', price: 9000, assignedPersonIds: ['gone'] }] })
		);
		expect(totals.unassigned).toBe(9000);
	});

	it('handles an empty bill', () => {
		const totals = calculateBill(bill());
		expect(totals.grandTotal).toBe(0);
		expect(totals.shares.map((share) => share.total)).toEqual([0, 0]);
	});
});

describe('money', () => {
	it('knows how many decimals a currency has', () => {
		expect(decimalPlaces('IDR')).toBe(0);
		expect(decimalPlaces('JPY')).toBe(0);
		expect(decimalPlaces('USD')).toBe(2);
		expect(decimalPlaces('SGD')).toBe(2);
		expect(decimalPlaces('KWD')).toBe(3);
	});

	it('writes amounts to the currency decimals', () => {
		expect(formatAmount(12500, 'IDR', 'id-ID')).toBe('12.500');
		expect(formatAmount(12.5, 'USD', 'en-US')).toBe('12.50');
		expect(formatAmount(1234.5, 'USD', 'en-US')).toBe('1,234.50');
	});
});
