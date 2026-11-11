import { describe, expect, it } from 'vitest';
import { readAmount, readReceipt, receiptTotal } from './receipt';

// Two real receipts, as an iPhone's Live Text copied them from photos: misreads, joined lines,
// split numbers and all, because those are what the parser has to survive. Everything that could
// identify the restaurants or the people on them was replaced: names of the places, staff and
// dishes, addresses, and every invoice, reference, table and phone number and date. The amounts
// and the layout are as they were.

/** Names first, numbers after: two lines joined ("i"), 58,000 and 38,300 each split in two. */
const BISTRO = `SAMPLE BISTRO
DOWNTOWN
POS: CASHIER
Print Cnt: 1
Invoice #001234
Jan 5, 2026 4:01:09 PM
TBL A3
REF :XQ7RTUWLMNB2
1 Banana Split
1 Iced Latte
1 Oat Milk
1 French Fries i Green Juice
1 Grilled Chicken with Garlic Rice
1 Spicy Spaghetti
1 Iced Lemon Tea
1 Fruit 'N Nuts
1 Creamy Carbonara Spaghetti
1 Beef Teriyakl Rice Bowl i Mineral Water Still
1 Berry Fruit Tea
Subtotal
Service Charge
TAX
Total
Cashier: Dina
Server: Rafa
PAX: 4
60,000
48,000
15,000
45,000
60,000
89,000
85,000
58.000
58
1,000
75,000
95,000
30,000
48,000
766,000
38
3,300
80,430
884,800
Printed Jan 5, 2026 10:13:48 PM`;

/** Names first, numbers after: quantities on lines of their own, a price lost, service and tax misread. */
const NOODLES = `Noodle House
7
ty centr
Delivery: 5550100
ORDER: 7
OP
itle:NHBRANCH
Rcpt#:NH2400004321
Noodle Garlic SpcyMiso
Noodle Hot Xtra Spcy
1
Plastik Kecil
2
Bowl
21
ITEMS TOTAL
BOGO MEMBER DEAL
SUBTOTAL
SUBTOTAL
Service/PackagingFee
PJK RST
TOTAL
Total item :4
EDC CARD
Name: 0
05/01/2026 13:37
49,783
45,454
0
95,237
( 45,454)
49,783
49,783
2,482
5,221
57,500
Closed Bill
- 05/01/2026 13:40-
08005550123
End of narrative
your visit again`;

/** One line per item, the way a typed or well-read receipt comes. */
const WARUNG = `WARUNG CONTOH
Jl. Melati No. 12
12/01/2026 19:30
2 Nasi Goreng 50.000
1 Es Teh 8.000
Ayam Bakar
2 x 35.000 70.000
1 Kerupuk 5.000
Diskon 20% -1.000
Subtotal 132.000
Service 5% 6.600
PB1 10% 13.860
Pembulatan -460
Total 152.000
Tunai 200.000
Kembali 48.000`;

describe('readAmount', () => {
	it('reads amounts the way receipts print them', () => {
		expect(readAmount('60,000', 0)?.value).toBe(60000);
		expect(readAmount('58.000', 0)?.value).toBe(58000);
		expect(readAmount('Rp 25.000', 0)?.value).toBe(25000);
		expect(readAmount('Rp. 1.250.000', 0)?.value).toBe(1250000);
		expect(readAmount('( 45,454)', 0)?.value).toBe(-45454);
		expect(readAmount('-1.000', 0)?.value).toBe(-1000);
		expect(readAmount('0', 0)?.value).toBe(0);
	});

	it('reads decimals only where the currency has them', () => {
		expect(readAmount('12.50', 2)?.value).toBe(12.5);
		expect(readAmount('1,234.50', 2)?.value).toBe(1234.5);
		expect(readAmount('1.234,50', 2)?.value).toBe(1234.5);
		expect(readAmount('1,234', 2)?.value).toBe(1234);
		expect(readAmount('1.250', 3)?.value).toBe(1.25);
	});

	it('reads letters misread for digits, and says so', () => {
		expect(readAmount('1B.000', 0)).toEqual({ value: 18000, misread: true });
		expect(readAmount('2O.5OO', 0)).toEqual({ value: 20500, misread: true });
	});

	it('is shut of what is not an amount', () => {
		expect(readAmount('Bowl', 0)).toBeUndefined();
		expect(readAmount('08005550123', 0)).toBeUndefined();
		expect(readAmount('13:37', 0)).toBeUndefined();
		expect(readAmount('05/01/2026', 0)).toBeUndefined();
		expect(readAmount('BS', 0)).toBeUndefined();
	});
});

describe('readReceipt, one line per item', () => {
	const receipt = readReceipt(WARUNG, 'IDR');

	it('reads each item, its quantity and price', () => {
		expect(receipt.layout).toBe('lines');
		expect(receipt.items).toEqual([
			{ name: 'Nasi Goreng', quantity: 2, price: 50000, unsure: false },
			{ name: 'Es Teh', quantity: 1, price: 8000, unsure: false },
			{ name: 'Ayam Bakar', quantity: 2, price: 70000, unsure: false },
			// The discount under it comes off it.
			{ name: 'Kerupuk', quantity: 1, price: 4000, unsure: false }
		]);
	});

	it('works out the rates, and that tax is charged on service', () => {
		expect(receipt.servicePercentage).toBe(5);
		expect(receipt.taxPercentage).toBe(10);
		expect(receipt.taxOnService).toBe(true);
		expect(receipt.adjustments).toEqual([
			{ kind: 'rounding', name: 'Pembulatan', amount: -460, unsure: false }
		]);
	});

	it('comes to the printed total, ignoring the payment and change', () => {
		expect(receipt.total).toBe(152000);
		expect(receipt.itemsGap).toBeUndefined();
		expect(receiptTotal(receipt, 'IDR')).toBe(152000);
	});
});

describe('readReceipt, names and numbers in columns', () => {
	it('pairs names with prices when they add up, and leaves out free lines', () => {
		const receipt = readReceipt(NOODLES, 'IDR');
		expect(receipt.layout).toBe('columns');
		expect(receipt.items.map(({ name, price }) => [name, price])).toEqual([
			['Noodle Garlic SpcyMiso', 49783],
			['Noodle Hot Xtra Spcy', 45454]
		]);
		// One price was lost, so the pairing is by position: worth a look.
		expect(receipt.items.every((item) => item.unsure)).toBe(true);
	});

	it('takes the discount, and sees through the misread service and tax', () => {
		const receipt = readReceipt(NOODLES, 'IDR');
		expect(receipt.adjustments).toEqual([
			{ kind: 'discount', name: 'BOGO MEMBER DEAL', amount: -45454, unsure: false },
			{ kind: 'rounding', name: 'Rounding (not on the receipt)', amount: 1, unsure: true }
		]);
		// Read as 2,482 and 5,221; really 2,489 and 5,227: 5% and 10% either way.
		expect(receipt.servicePercentage).toBe(5);
		expect(receipt.taxPercentage).toBe(10);
		expect(receipt.taxOnService).toBe(true);
		expect(receipt.subtotal).toBe(49783);
		expect(receipt.itemsGap).toBeUndefined();
		expect(receiptTotal(receipt, 'IDR')).toBe(57500);
	});

	it('splits two items text recognition joined, and keeps a number that is part of a name', () => {
		const names = readReceipt(BISTRO, 'IDR').items.map((item) => item.name);
		expect(names).toHaveLength(13);
		expect(names).toContain('French Fries');
		expect(names).toContain('Green Juice');
		expect(names).toContain('Mineral Water Still');

		const bowls = readReceipt('Soup\n2\nBowl\n21\nSubtotal\n30.000\n15.000\n45.000', 'IDR');
		expect(bowls.items).toEqual([
			{ name: 'Soup', quantity: 1, price: 30000, unsure: false },
			{ name: 'Bowl 21', quantity: 2, price: 15000, unsure: false }
		]);
	});

	it('finds the charges even when the numbers are out of place', () => {
		const receipt = readReceipt(BISTRO, 'IDR');
		// Service was split into "38" and "3,300": worked out from the subtotal, tax and total.
		expect(receipt.subtotal).toBe(766000);
		expect(receipt.servicePercentage).toBe(5);
		expect(receipt.taxPercentage).toBe(10);
		expect(receipt.taxOnService).toBe(true);
		expect(receipt.total).toBe(884800);
		expect(receipt.adjustments).toEqual([
			{ kind: 'rounding', name: 'Rounding (not on the receipt)', amount: 70, unsure: true }
		]);
	});

	it("doesn't guess when the prices don't add up: it says by how much, and marks them all", () => {
		const receipt = readReceipt(BISTRO, 'IDR');
		expect(receipt.itemsGap).toBe(661058 - 766000);
		expect(receipt.items.every((item) => item.unsure)).toBe(true);
	});
});

describe('readReceipt, the odd ones', () => {
	it('reads a name, then its price on the next line', () => {
		const receipt = readReceipt('Es Jeruk\n1 x 1B.000 1B.000\nTotal 18.000', 'IDR');
		expect(receipt.items).toEqual([{ name: 'Es Jeruk', quantity: 1, price: 18000, unsure: true }]);
	});

	it("skips the place's name at the top, and reads a quantity in the middle of a line", () => {
		const receipt = readReceipt(
			[
				'WARUNG CONTOH',
				'Nasi Goreng 45.000',
				'Es Teh 2 x 8.000 16.000',
				'Sate Ayam 52.000',
				'Subtotal 113.000',
				'Service 5% 5.650',
				'Tax 10% 11.865',
				'Total 130.515'
			].join('\n'),
			'IDR'
		);
		expect(receipt.items).toEqual([
			{ name: 'Nasi Goreng', quantity: 1, price: 45000, unsure: false },
			{ name: 'Es Teh', quantity: 2, price: 16000, unsure: false },
			{ name: 'Sate Ayam', quantity: 1, price: 52000, unsure: false }
		]);
		expect(receipt.itemsGap).toBeUndefined();
		expect(receiptTotal(receipt, 'IDR')).toBe(130515);
	});

	it('keeps a line without a price below the first item, and marks it', () => {
		const receipt = readReceipt('Kopi 20.000\nAir Putih\nTeh 10.000\nTotal 30.000', 'IDR');
		expect(receipt.items).toEqual([
			{ name: 'Kopi', quantity: 1, price: 20000, unsure: false },
			{ name: 'Air Putih', quantity: 1, price: undefined, unsure: true },
			{ name: 'Teh', quantity: 1, price: 10000, unsure: false }
		]);
	});

	it('marks a line whose unit price and quantity disagree with its total', () => {
		const receipt = readReceipt('Sate\n3 x 10.000 25.000\nTotal 25.000', 'IDR');
		expect(receipt.items[0].unsure).toBe(true);
	});

	it('has no rates to give when nothing reproduces the total', () => {
		const receipt = readReceipt('1 Kopi 20.000\nSubtotal 20.000\nTax 3.333\nTotal 99.000', 'IDR');
		expect(receipt.taxPercentage).toBeUndefined();
		expect(receipt.servicePercentage).toBeUndefined();
	});

	it('works in a currency with cents', () => {
		const receipt = readReceipt(
			'1 Burger 12.50\n2 Fries 7.00\nSubtotal 19.50\nTax 1.95\nTotal 21.45',
			'USD'
		);
		expect(receipt.items.map((item) => item.price)).toEqual([12.5, 7]);
		expect(receipt.taxPercentage).toBe(10);
		// No service line: no service.
		expect(receipt.servicePercentage).toBe(0);
		expect(receiptTotal(receipt, 'USD')).toBe(21.45);
	});
});
