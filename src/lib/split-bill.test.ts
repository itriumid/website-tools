import { describe, expect, it } from 'vitest';
import { CURRENCIES } from './countries';
import {
	billFromHash,
	billToHash,
	calculateBill,
	decimalPlaces,
	formatAmount,
	parseAmount,
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

	it('carries how tax and service are charged, and the adjustments, as they were', () => {
		const state = bill({
			items: [{ id: 'i', name: 'Nasi', price: 500000, assignedPersonIds: ['a'] }],
			taxPercentage: 10,
			servicePercentage: 5,
			serviceIncluded: true,
			taxOnService: true,
			adjustments: [
				{ id: 'd', kind: 'discount', name: 'PROMO GAJIAN', amount: -15000 },
				{ id: 'r', kind: 'rounding', name: 'Pembulatan', amount: 500 }
			]
		});
		expect(billFromHash(billToHash(state))).toEqual(state);
	});

	it('leaves out what says nothing, so a plain bill reads back with no new fields', () => {
		const read = billFromHash(
			'#data=' +
				compress(
					JSON.stringify({
						...bill(),
						taxIncluded: false,
						serviceIncluded: 'yes',
						adjustments: []
					})
				)
		);
		expect(read).toEqual(bill());
		expect(read && Object.keys(read)).toEqual(Object.keys(bill()));
	});

	it('never keeps tax on service once tax is included', () => {
		const read = billFromHash(
			'#data=' + compress(JSON.stringify({ ...bill(), taxIncluded: true, taxOnService: true }))
		);
		expect(read?.taxIncluded).toBe(true);
		expect(read?.taxOnService).toBeUndefined();
	});

	it('refuses adjustments that are the wrong shape', () => {
		const withAdjustments = (adjustments: unknown) =>
			billFromHash('#data=' + compress(JSON.stringify({ ...bill(), adjustments })));
		const fine = { id: 'x', kind: 'rounding', name: 'Pembulatan', amount: -500 };
		expect(withAdjustments([fine])?.adjustments).toEqual([fine]);
		expect(withAdjustments('lots')).toBeUndefined();
		expect(withAdjustments([{ ...fine, kind: 'tip' }])).toBeUndefined();
		expect(withAdjustments([{ ...fine, amount: 'some' }])).toBeUndefined();
		expect(withAdjustments([{ ...fine, amount: Infinity }])).toBeUndefined();
		expect(withAdjustments([{ ...fine, name: 5 }])).toBeUndefined();
		// A discount that adds to the bill isn't a discount.
		expect(withAdjustments([{ ...fine, kind: 'discount', amount: 1000 }])).toBeUndefined();
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

describe('calculateBill, the ways a receipt charges tax and service', () => {
	// The receipt-scanning plan's example: a 500.000 subtotal, service 5%, tax 10%.
	const receipt = (overrides: Partial<BillState> = {}) =>
		calculateBill(
			bill({
				items: [
					{ id: '1', name: 'Gurame', price: 300000, assignedPersonIds: ['a'] },
					{ id: '2', name: 'Kangkung', price: 200000, assignedPersonIds: ['b'] }
				],
				taxPercentage: 10,
				servicePercentage: 5,
				...overrides
			})
		);
	const owed = (totals: ReturnType<typeof calculateBill>) =>
		totals.shares.reduce((sum, share) => sum + share.total, 0);

	it('charges both on the subtotal, as it always has', () => {
		const totals = receipt();
		expect(totals.grandTotal).toBe(575000);
		expect(owed(totals)).toBe(575000);
	});

	it('charges tax on the subtotal plus service when asked', () => {
		const totals = receipt({ taxOnService: true });
		expect(totals.service).toBe(25000);
		expect(totals.tax).toBe(52500);
		expect(totals.grandTotal).toBe(577500);
		expect(totals.shares.map((share) => share.total)).toEqual([346500, 231000]);
	});

	it('adds nothing for tax the prices already include', () => {
		const totals = receipt({ taxIncluded: true });
		expect(totals.tax).toBe(0);
		expect(totals.grandTotal).toBe(525000);
	});

	it('adds nothing at all when the prices include tax and service', () => {
		const totals = receipt({ taxIncluded: true, serviceIncluded: true });
		expect(totals.grandTotal).toBe(500000);
		expect(owed(totals)).toBe(500000);
	});

	it('ignores tax on service once tax is included, even if a bill says both', () => {
		expect(receipt({ taxIncluded: true, taxOnService: true }).grandTotal).toBe(525000);
	});

	it('charges tax on prices that already include service', () => {
		expect(receipt({ serviceIncluded: true }).grandTotal).toBe(550000);
	});
});

describe('calculateBill, adjustments', () => {
	const items = [
		{ id: '1', name: 'Gurame', price: 300000, assignedPersonIds: ['a'] },
		{ id: '2', name: 'Kangkung', price: 200000, assignedPersonIds: ['b'] }
	];

	it('takes a discount off before tax and service', () => {
		const totals = calculateBill(
			bill({
				items,
				taxPercentage: 10,
				servicePercentage: 5,
				adjustments: [{ id: 'd', kind: 'discount', name: 'PROMO', amount: -100000 }]
			})
		);
		expect(totals.discounts).toBe(-100000);
		expect(totals.service).toBe(20000);
		expect(totals.tax).toBe(40000);
		expect(totals.grandTotal).toBe(460000);
		// Shared by what each person had: 60% and 40%.
		expect(totals.shares.map((share) => share.total)).toEqual([276000, 184000]);
	});

	it('lands rounding after tax and service, and still adds up to the coin', () => {
		const totals = calculateBill(
			bill({
				items,
				taxPercentage: 10,
				servicePercentage: 5,
				taxOnService: true,
				adjustments: [{ id: 'r', kind: 'rounding', name: 'Pembulatan', amount: -500 }]
			})
		);
		expect(totals.lateAdjustments).toBe(-500);
		expect(totals.grandTotal).toBe(577000);
		expect(totals.shares.reduce((sum, share) => sum + share.total, 0)).toBe(577000);
	});

	it('keeps each adjustment apart while adding them up by when they apply', () => {
		const totals = calculateBill(
			bill({
				items,
				adjustments: [
					{ id: '1', kind: 'discount', name: 'Diskon member', amount: -20000 },
					{ id: '2', kind: 'discount', name: 'PROMO', amount: -30000 },
					{ id: '3', kind: 'rounding', name: 'Pembulatan', amount: 300 },
					{ id: '4', kind: 'other', name: 'Biaya kartu', amount: 2000 }
				]
			})
		);
		expect(totals.discounts).toBe(-50000);
		expect(totals.lateAdjustments).toBe(2300);
		expect(totals.grandTotal).toBe(452300);
	});

	it('never lets a discount take the bill below zero', () => {
		const totals = calculateBill(
			bill({
				items,
				taxPercentage: 10,
				adjustments: [{ id: 'd', kind: 'discount', name: 'Free', amount: -900000 }]
			})
		);
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

describe('formatAmount, the way each currency is written where it is used', () => {
	it('writes rupiah the Indonesian way, whatever the reader’s language', () => {
		expect(formatAmount(146000, 'IDR')).toBe('146.000');
		expect(formatAmount(7300, 'IDR')).toBe('7.300');
		expect(formatAmount(1250000, 'IDR')).toBe('1.250.000');
		expect(formatAmount(45000.4, 'IDR')).toBe('45.000');
	});

	it('writes dollars the American way and euros the German way', () => {
		expect(formatAmount(1234.5, 'USD')).toBe('1,234.50');
		expect(formatAmount(7, 'USD')).toBe('7.00');
		expect(formatAmount(1234.5, 'EUR')).toBe('1.234,50');
	});

	it('writes yen the Japanese way, without decimals', () => {
		expect(formatAmount(1200, 'JPY')).toBe('1,200');
		expect(formatAmount(1234567, 'JPY')).toBe('1,234,567');
	});

	it('keeps 0 to 9 for currencies of countries with digits of their own', () => {
		expect(formatAmount(1234.5, 'SAR')).toMatch(/^1.234.50$/);
		expect(formatAmount(1.25, 'KWD')).toMatch(/^1.250$/);
	});

	it('writes a currency it has no locale for the way the reader does', () => {
		expect(formatAmount(1234.5, 'XYZ')).toBe(
			new Intl.NumberFormat(undefined, {
				minimumFractionDigits: 2,
				maximumFractionDigits: 2
			}).format(1234.5)
		);
	});

	it('writes what the parser reads back as the same amount', () => {
		for (const [amount, currency] of [
			[146000, 'IDR'],
			[1234.5, 'USD'],
			[1234.5, 'EUR'],
			[1200, 'JPY'],
			[1234.567, 'KWD'],
			[123456.78, 'INR'],
			[1234.5, 'CHF'],
			[1234.5, 'SAR']
		] as const) {
			expect(parseAmount(formatAmount(amount, currency), currency)).toEqual({ amount });
		}
	});

	it('writes every currency on the list in 0 to 9, and reads it back', () => {
		for (const { code } of CURRENCIES) {
			const amount = decimalPlaces(code) ? 1234567.5 : 1234567;
			const written = formatAmount(amount, code);
			expect(written, code).toMatch(/^[\d.,\s'’]+$/);
			expect(parseAmount(written, code), `${code}: ${written}`).toEqual({ amount });
		}
	});
});

describe('parseAmount', () => {
	const read = (text: string, currencyCode = 'IDR') => parseAmount(text, currencyCode);
	const amount = (value: number) => ({ amount: value });

	it('has nothing to say about an empty field', () => {
		expect(read('')).toBeUndefined();
		expect(read('   ')).toBeUndefined();
		expect(read('Rp')).toBeUndefined();
	});

	it('reads rupiah grouped with dots or commas, or not at all', () => {
		expect(read('45.000')).toEqual(amount(45000));
		expect(read('45,000')).toEqual(amount(45000));
		expect(read('45000')).toEqual(amount(45000));
		expect(read('1.250.000')).toEqual(amount(1250000));
		expect(read('1,250,000')).toEqual(amount(1250000));
		expect(read('45 000')).toEqual(amount(45000));
	});

	it('reads rupiah while it is still being typed', () => {
		expect(read('45.')).toEqual(amount(45));
		expect(read('45.0')).toEqual(amount(450));
		expect(read('45.00')).toEqual(amount(4500));
		expect(read('45.5')).toEqual(amount(455));
	});

	it('drops rupiah cents that are all zeros, as banking apps show them', () => {
		expect(read('45.000,00')).toEqual(amount(45000));
		expect(read('45,000.00')).toEqual(amount(45000));
		expect(read('1.250.000,0')).toEqual(amount(1250000));
	});

	it('says rupiah has no cents when there are some', () => {
		expect(read('45.000,50')).toEqual({ problem: 'no-cents' });
		expect(read('45,000.5')).toEqual({ problem: 'no-cents' });
	});

	it('takes the currency symbol or code before or after', () => {
		expect(read('Rp 45.000')).toEqual(amount(45000));
		expect(read('Rp45.000')).toEqual(amount(45000));
		expect(read('IDR 45.000')).toEqual(amount(45000));
		expect(read('45.000 idr')).toEqual(amount(45000));
		expect(read('$12.50', 'USD')).toEqual(amount(12.5));
		expect(read('12,50 €', 'EUR')).toEqual(amount(12.5));
	});

	it('reads both ways of writing a two-decimal currency', () => {
		expect(read('1,234.56', 'USD')).toEqual(amount(1234.56));
		expect(read('1.234,56', 'EUR')).toEqual(amount(1234.56));
		expect(read('1234.56', 'USD')).toEqual(amount(1234.56));
		expect(read('1234,56', 'EUR')).toEqual(amount(1234.56));
		expect(read('12.5', 'USD')).toEqual(amount(12.5));
		expect(read('12,5', 'EUR')).toEqual(amount(12.5));
		expect(read('.5', 'USD')).toEqual(amount(0.5));
		expect(read("1'234.50", 'CHF')).toEqual(amount(1234.5));
	});

	it('takes three digits after the last mark as thousands in a two-decimal currency', () => {
		expect(read('1,234', 'USD')).toEqual(amount(1234));
		expect(read('1.234', 'EUR')).toEqual(amount(1234));
		expect(read('1.234.567', 'EUR')).toEqual(amount(1234567));
		expect(read('1,234,567.89', 'USD')).toEqual(amount(1234567.89));
	});

	it("doesn't take a mark used more than once as the decimal mark", () => {
		expect(read('1.234.56', 'USD')).toEqual(amount(123456));
	});

	it('takes up to three decimals in the dinars', () => {
		expect(read('1.250', 'KWD')).toEqual(amount(1.25));
		expect(read('1,250', 'KWD')).toEqual(amount(1.25));
		expect(read('1,234.567', 'KWD')).toEqual(amount(1234.567));
		expect(read('1.234.567', 'KWD')).toEqual(amount(1234567));
	});

	it('reads whole amounts in other currencies without cents', () => {
		expect(read('1,200', 'JPY')).toEqual(amount(1200));
		expect(read('1.200', 'JPY')).toEqual(amount(1200));
		expect(read('120', 'USD')).toEqual(amount(120));
		expect(read('0', 'USD')).toEqual(amount(0));
	});

	it('reads Arabic, Persian and full-width digits', () => {
		expect(read('٤٥٫٠٠٠')).toEqual(amount(45000));
		expect(read('۴۵.۰۰۰')).toEqual(amount(45000));
		expect(read('٤٥٫٥٠', 'USD')).toEqual(amount(45.5));
		expect(read('١٬٢٣٤٫٥٦', 'SAR')).toEqual(amount(1234.56));
		expect(read('４５，０００')).toEqual(amount(45000));
		expect(read('－５', 'JPY')).toEqual({ problem: 'negative' });
	});

	it('says an amount is below zero', () => {
		expect(read('-5.000')).toEqual({ problem: 'negative' });
		expect(read('−5.000')).toEqual({ problem: 'negative' });
		expect(read('-12.50', 'USD')).toEqual({ problem: 'negative' });
	});

	it("says when it can't read the amount at all", () => {
		expect(read('abc')).toEqual({ problem: 'unreadable' });
		expect(read('45rb')).toEqual({ problem: 'unreadable' });
		expect(read('12.50 USD', 'EUR')).toEqual({ problem: 'unreadable' });
		expect(read('.')).toEqual({ problem: 'unreadable' });
		expect(read('-')).toEqual({ problem: 'unreadable' });
		expect(read('1e5')).toEqual({ problem: 'unreadable' });
		expect(read('--5')).toEqual({ problem: 'unreadable' });
	});
});

describe('quantities and counts', () => {
	const people = ['a', 'b', 'c'].map((id) => ({ id, name: id }));
	const esTeh = {
		id: 'e',
		name: 'Es Teh',
		price: 30000,
		assignedPersonIds: ['a', 'b'],
		quantity: 3
	};

	it('splits an item with a quantity evenly, like any other, until counts are given', () => {
		const totals = calculateBill(bill({ people, items: [esTeh] }));
		expect(totals.shares.map((share) => share.total)).toEqual([15000, 15000, 0]);
	});

	it('charges each person for as many as they had', () => {
		const totals = calculateBill(
			bill({ people, items: [{ ...esTeh, counts: { a: 2, b: 1 } }], taxPercentage: 10 })
		);
		expect(totals.shares.map((share) => share.total)).toEqual([22000, 11000, 0]);
		expect(totals.unassigned).toBe(0);
	});

	it("leaves the ones nobody's counted for out of every share, and says what they come to", () => {
		const totals = calculateBill(bill({ people, items: [{ ...esTeh, counts: { a: 2 } }] }));
		expect(totals.shares.map((share) => share.total)).toEqual([20000, 0, 0]);
		expect(totals.unassigned).toBe(10000);
	});

	it('shrinks everyone to fit when more are counted than there were, so the item costs its price', () => {
		const totals = calculateBill(bill({ people, items: [{ ...esTeh, counts: { a: 2, b: 2 } }] }));
		expect(totals.shares.map((share) => share.total)).toEqual([15000, 15000, 0]);
		expect(totals.unassigned).toBe(0);
	});

	it('ignores a count for someone no longer on the bill', () => {
		const totals = calculateBill(
			bill({ people, items: [{ ...esTeh, counts: { a: 1, gone: 2 } }] })
		);
		expect(totals.shares.map((share) => share.total)).toEqual([10000, 0, 0]);
		expect(totals.unassigned).toBe(20000);
	});

	it('carries quantities and counts in links, and only when they say something', () => {
		const counted = bill({ people, items: [{ ...esTeh, counts: { a: 2, b: 1 } }] });
		expect(billFromHash(billToHash(counted))).toEqual(counted);

		const read = billFromHash(
			'#data=' +
				compress(
					JSON.stringify(
						bill({
							items: [
								{ id: '1', name: 'One', price: 1, assignedPersonIds: [], quantity: 1 },
								{ id: '2', name: 'Two', price: 2, assignedPersonIds: [], counts: { a: 1 } },
								{ ...esTeh, counts: { a: 0 } }
							]
						})
					)
				)
		);
		expect(read?.items.map((item) => Object.keys(item).sort().join(','))).toEqual([
			'assignedPersonIds,id,name,price',
			'assignedPersonIds,id,name,price',
			'assignedPersonIds,id,name,price,quantity'
		]);
	});

	it('refuses quantities and counts that are the wrong shape', () => {
		const withItem = (extra: object) =>
			billFromHash(
				'#data=' +
					compress(
						JSON.stringify(
							bill({ items: [{ id: 'i', name: 'x', price: 1, assignedPersonIds: [], ...extra }] })
						)
					)
			);
		expect(withItem({ quantity: 2, counts: { a: 1 } })).toBeDefined();
		expect(withItem({ quantity: 0 })).toBeUndefined();
		expect(withItem({ quantity: 2.5 })).toBeUndefined();
		expect(withItem({ quantity: 'lots' })).toBeUndefined();
		expect(withItem({ quantity: 100000 })).toBeUndefined();
		expect(withItem({ quantity: 2, counts: [1, 2] })).toBeUndefined();
		expect(withItem({ quantity: 2, counts: { a: -1 } })).toBeUndefined();
		expect(withItem({ quantity: 2, counts: { a: 'two' } })).toBeUndefined();
	});
});

describe('adjustments for some people', () => {
	const items = [
		{ id: '1', name: 'Gurame', price: 100000, assignedPersonIds: ['a'] },
		{ id: '2', name: 'Kangkung', price: 100000, assignedPersonIds: ['b'] }
	];
	const shares = (overrides: Partial<BillState>) =>
		calculateBill(bill({ items, ...overrides })).shares.map((share) => share.total);

	it("takes someone's own discount off their part, before tax", () => {
		const totals = calculateBill(
			bill({
				items,
				taxPercentage: 10,
				adjustments: [
					{ id: 'v', kind: 'discount', name: 'Voucher', amount: -20000, assignedPersonIds: ['a'] }
				]
			})
		);
		expect(totals.shares.map((share) => share.total)).toEqual([88000, 110000]);
		expect(totals.grandTotal).toBe(198000);
	});

	it('splits one evenly among the people it is for', () => {
		const people = ['a', 'b', 'c'].map((id) => ({ id, name: id }));
		const totals = calculateBill(
			bill({
				people,
				items: [...items, { id: '3', name: 'Tahu', price: 100000, assignedPersonIds: ['c'] }],
				adjustments: [
					{
						id: 'v',
						kind: 'discount',
						name: 'Promo',
						amount: -20000,
						assignedPersonIds: ['a', 'b']
					}
				]
			})
		);
		expect(totals.shares.map((share) => share.total)).toEqual([90000, 90000, 100000]);
	});

	it("shares everyone's discount by what's left after people's own", () => {
		expect(
			shares({
				items: [
					{ id: '1', name: 'Gurame', price: 30000, assignedPersonIds: ['a'] },
					{ id: '2', name: 'Kangkung', price: 70000, assignedPersonIds: ['b'] }
				],
				adjustments: [
					{ id: 'v', kind: 'discount', name: 'Voucher', amount: -30000, assignedPersonIds: ['a'] },
					{ id: 'p', kind: 'discount', name: 'Promo', amount: -10000 }
				]
			})
		).toEqual([0, 60000]);
	});

	it("gives everyone what's left of a discount bigger than someone's part", () => {
		expect(
			shares({
				items: [
					{ id: '1', name: 'Gurame', price: 30000, assignedPersonIds: ['a'] },
					{ id: '2', name: 'Kangkung', price: 70000, assignedPersonIds: ['b'] }
				],
				adjustments: [
					{ id: 'v', kind: 'discount', name: 'Voucher', amount: -50000, assignedPersonIds: ['a'] }
				]
			})
		).toEqual([0, 50000]);
	});

	it("adds someone's own fee after tax, to them alone, and never takes a share below nothing", () => {
		expect(
			shares({
				taxPercentage: 10,
				adjustments: [
					{ id: 'f', kind: 'other', name: 'Biaya kartu', amount: 2000, assignedPersonIds: ['b'] }
				]
			})
		).toEqual([110000, 112000]);
		expect(
			shares({
				adjustments: [
					{ id: 'r', kind: 'other', name: 'Refund', amount: -150000, assignedPersonIds: ['a'] }
				]
			})
		).toEqual([0, 100000]);
	});

	it('treats one tagged only to people no longer on the bill as everyone’s', () => {
		expect(
			shares({
				adjustments: [
					{
						id: 'v',
						kind: 'discount',
						name: 'Voucher',
						amount: -20000,
						assignedPersonIds: ['gone']
					}
				]
			})
		).toEqual([90000, 90000]);
	});

	it('carries who an adjustment is for in links, only when someone is tagged', () => {
		const state = bill({
			items,
			adjustments: [
				{ id: 'v', kind: 'discount', name: 'Voucher', amount: -20000, assignedPersonIds: ['a'] }
			]
		});
		expect(billFromHash(billToHash(state))).toEqual(state);
		const read = billFromHash(
			'#data=' +
				compress(
					JSON.stringify(
						bill({
							adjustments: [
								{ id: 'p', kind: 'discount', name: 'Promo', amount: -1, assignedPersonIds: [] }
							]
						})
					)
				)
		);
		expect(read?.adjustments?.[0]).toEqual({
			id: 'p',
			kind: 'discount',
			name: 'Promo',
			amount: -1
		});
		const wrong = (assignedPersonIds: unknown) =>
			billFromHash(
				'#data=' +
					compress(
						JSON.stringify(
							bill({
								adjustments: [
									{ id: 'p', kind: 'discount', name: 'P', amount: -1, assignedPersonIds }
								] as never
							})
						)
					)
			);
		expect(wrong('a')).toBeUndefined();
		expect(wrong([1])).toBeUndefined();
	});
});
