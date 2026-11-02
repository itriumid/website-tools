// Reading a receipt: text the phone's own text recognition copied from a photo, turned into items,
// adjustments and the tax and service rates. Everything happens here, in the browser.
//
// That text is messy in two ways, both seen on real receipts. Its layout varies: some phones give
// one line per item ("2 Nasi Goreng 50.000"), others every name first and every number after,
// in columns. And it misreads: two lines merged into one, one number split in two, a 9 read as a
// 2. So nothing here trusts position alone. Prices are paired with names only when they add up to
// the printed subtotal, and the rates are found by arithmetic (which amounts add up to the
// printed total, at rates a restaurant would charge), not by which line they sat on. What can't
// be checked is marked unsure, for the person to look at, rather than guessed.

import { calculateBill, decimalPlaces, type AdjustmentKind, type BillState } from './split-bill';

export interface ScannedItem {
	name: string;
	/** How many the line was for: "2 Nasi Goreng" is 2. The price is for all of them. */
	quantity: number;
	/** The line's price, or undefined when the receipt's text had none to give it. */
	price: number | undefined;
	/** The pairing of this name and price couldn't be checked: someone should look. */
	unsure: boolean;
}

export interface ScannedAdjustment {
	kind: AdjustmentKind;
	name: string;
	amount: number;
	unsure: boolean;
}

export interface ScannedReceipt {
	/** One line per item, or names and numbers in separate columns. */
	layout: 'lines' | 'columns';
	/** Items with a price of zero (a free bag, a bowl) are left out: they change nobody's share. */
	items: ScannedItem[];
	adjustments: ScannedAdjustment[];
	/** Undefined when no rate could be worked out that reproduces the receipt. */
	servicePercentage?: number;
	taxPercentage?: number;
	taxOnService: boolean;
	/** The subtotal the receipt printed, after discounts, when one was found. */
	subtotal?: number;
	/** The total the receipt printed, when one was found. */
	total?: number;
	/** Items and discounts minus the printed subtotal, when they don't match: something's misread. */
	itemsGap?: number;
}

/* ─── Amounts ─── */

// Letters text recognition commonly reads in place of digits on receipt paper.
const LOOKALIKES: Record<string, string> = {
	O: '0',
	o: '0',
	I: '1',
	l: '1',
	'|': '1',
	B: '8',
	S: '5'
};

/**
 * An amount as a receipt prints it, in a currency with `places` decimals: "60,000", "58.000",
 * "Rp 25.000", "( 45,454)" and "-1.000" (both below zero), "1B.000" (18.000, misread). Undefined
 * for anything else, including long runs of digits with no grouping, which are phone numbers.
 */
export function readAmount(
	text: string,
	places: number
): { value: number; misread: boolean } | undefined {
	let token = text.trim();
	const negative = /^\(.*\)$/.test(token) || /^[-−]/.test(token);
	token = token
		.replace(/^\(|\)$/g, '')
		.replace(/^[-−]\s*/, '')
		.replace(/^(?:rp\.?|idr)\s*/i, '')
		.replace(/\s+/g, '');
	if (!/^[\dOolI|BS][\dOolI|BS.,]*$/.test(token)) return undefined;
	const digits = (token.match(/\d/g) ?? []).length;
	const misread = /[OolI|BS]/.test(token);
	if (misread && (digits < 2 || token.length < 4)) return undefined;
	token = token.replace(/[OolI|BS]/g, (letter) => LOOKALIKES[letter]);
	if (!/[.,]/.test(token) && token.length >= 8) return undefined;

	let whole = token;
	let fraction = '';
	if (places > 0) {
		const last = Math.max(token.lastIndexOf('.'), token.lastIndexOf(','));
		if (last >= 0 && token.length - last - 1 === places) {
			whole = token.slice(0, last);
			fraction = token.slice(last + 1);
		}
	}
	whole = whole.replace(/[.,]/g, '');
	if (!whole && !fraction) return undefined;
	const value = Number(`${whole || '0'}.${fraction || '0'}`);
	return { value: negative ? -value : value, misread };
}

/* ─── Lines ─── */

type LabelKind = 'itemsTotal' | 'subtotal' | 'discount' | 'rounding' | 'service' | 'tax' | 'total';

// In order: the first that matches decides. Payment and counting lines come first, so "Total
// item :4" and "Tunai 600.000" are never mistaken for a total.
const LABELS: [LabelKind | 'ignore', RegExp][] = [
	[
		'ignore',
		/total\s*(qty|item)|kembali|change|tunai|cash|edc|qris|debit|credit|kartu|card|bayar|payment|paid/i
	],
	['itemsTotal', /items?\s*total/i],
	['subtotal', /sub\s*-?\s*total/i],
	['rounding', /pembulatan|rounding/i],
	['discount', /disc|diskon|promo|bogo|voucher|potongan/i],
	['service', /service|servis|layanan|\bsvc\b/i],
	['tax', /\btax\b|pajak|\bpjk\b|\bpb\s*1\b|\bppn\b|\bvat\b|\bgst\b/i],
	['total', /^\s*(grand\s*)?total\b/i]
];

type Line =
	| { kind: 'amount'; text: string; value: number; misread: boolean }
	| { kind: 'label'; text: string; label: LabelKind | 'ignore'; amount?: number }
	| { kind: 'noise'; text: string }
	| { kind: 'text'; text: string };

const QUANTITY = /^(\d{1,3})\s*[x×]?\s+(?=\S)/;
// A price at the end of a line counts only if it looks like one: grouped ("25.000"), long enough
// ("8000"), or a zero. "Bowl 33" is a name, not a bowl for 33.
const TRAILING = /^(.*?)[\s:]+(\(?\s*[-−]?\s*(?:rp\.?\s*)?[\dOolI|BS][\dOolI|BS.,]*\s*\)?)$/i;
const looksLikePrice = (token: string) =>
	/[.,]\d/.test(token) || /\d{4,}/.test(token) || /^\(?\s*0\s*\)?$/.test(token.trim());

/** The amount at the end of a line. After a label, any number is its amount ("Pembulatan -460"). */
function trailingAmount(text: string, places: number, afterLabel = false) {
	const match = TRAILING.exec(text);
	if (!match || (!afterLabel && !looksLikePrice(match[2]))) return undefined;
	const amount = readAmount(match[2], places);
	return amount && { rest: match[1].trim(), ...amount };
}

function classify(text: string, places: number): Line {
	const amount = readAmount(text, places);
	if (amount) return { kind: 'amount', text, ...amount };
	if (!QUANTITY.test(text)) {
		const trailing = trailingAmount(text, places, true);
		const words = trailing?.rest ?? text;
		for (const [label, pattern] of LABELS) {
			if (pattern.test(words))
				return { kind: 'label', text: words, label, amount: trailing?.value };
		}
	}
	if (/[:#]|\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}|^\W*$/.test(text)) return { kind: 'noise', text };
	return { kind: 'text', text };
}

/* ─── Items ─── */

interface ItemDraft extends ScannedItem {
	/** A price came on the item's own line. */
	priced: boolean;
}

// Text recognition sometimes joins two lines, reading the second line's quantity "1" as "i":
// "1 French Fries i Green Juice" is two items.
const JOINED = /\s[iIl|1]\s(?=[A-Z])/;

/** The items in the lines between the header and the first total, in either layout. */
function readItems(lines: Line[], places: number): ItemDraft[] {
	const items: ItemDraft[] = [];
	let pendingQuantity: number | undefined;
	let pendingName: string | undefined;

	const add = (text: string, quantity: number, unsure = false) => {
		const trailing = trailingAmount(text, places);
		const name = (trailing?.rest ?? text).trim();
		if (!name) return;
		items.push({
			name,
			quantity,
			price: trailing?.value,
			unsure: unsure || Boolean(trailing?.misread),
			priced: Boolean(trailing)
		});
	};

	for (const [index, line] of lines.entries()) {
		const next = lines[index + 1];
		if (line.kind === 'amount') {
			const bare = /^\d{1,3}$/.test(line.text.trim());
			if (bare && next?.kind === 'text') {
				pendingQuantity = line.value;
			} else if (bare && items.length && !items.at(-1)?.priced) {
				// A number after a name, with no name after it: part of the name ("Bowl" "33").
				items.at(-1)!.name += ` ${line.text.trim()}`;
			}
			continue;
		}
		if (line.kind === 'label' && line.label === 'discount') {
			// A discount among the items belongs to the item above it.
			const above = items.at(-1);
			if (above?.price !== undefined && line.amount !== undefined) {
				above.price = Math.max(0, above.price - Math.abs(line.amount));
			}
			continue;
		}
		if (line.kind !== 'text') continue;

		// "Ayam Bakar" then "2 x 35.000 70.000": a name, then its quantity and prices.
		const multiplied = /^(\d{1,3})\s*[x×]\s*(\S+)\s+(\S+)$/.exec(line.text);
		if (multiplied && pendingName !== undefined) {
			const unit = readAmount(multiplied[2], places);
			const total = readAmount(multiplied[3], places);
			const quantity = Number(multiplied[1]);
			if (total) {
				items.push({
					name: pendingName,
					quantity,
					price: total.value,
					unsure: total.misread || (unit !== undefined && unit.value * quantity !== total.value),
					priced: true
				});
				pendingName = undefined;
				continue;
			}
		}

		const quantityMatch = QUANTITY.exec(line.text);
		let quantity = pendingQuantity ?? 1;
		let text = line.text;
		if (quantityMatch) {
			quantity = Number(quantityMatch[1]);
			text = text.slice(quantityMatch[0].length);
		}
		pendingQuantity = undefined;

		const parts = quantityMatch ? text.split(JOINED) : [text];
		const before = items.length;
		parts.forEach((part, partIndex) => add(part, partIndex === 0 ? quantity : 1, partIndex > 0));
		const added = items.slice(before);
		// A line with no price may be a name whose price comes on the next line.
		pendingName =
			added.length === 1 && !added[0].priced && !quantityMatch ? added[0].name : undefined;
		if (pendingName !== undefined && next?.kind === 'text' && /^\d{1,3}\s*[x×]/.test(next.text)) {
			items.pop();
		}
	}
	return items;
}

/* ─── Charges ─── */

/** Rates a restaurant charges: whole or half percents, up to 25. Whole ones are likelier. */
function snap(rate: number): number | undefined {
	const nearest = Math.round(rate * 2) / 2;
	if (nearest <= 0 || nearest > 25 || Math.abs(rate - nearest) > 0.05) return undefined;
	return nearest;
}

interface Charges {
	subtotal: number;
	service: number;
	tax: number;
	taxOnService: boolean;
	total: number | undefined;
	/** The printed total minus what the rates come to: rounding the receipt didn't print. */
	unprinted: number;
}

/**
 * Which amounts are the subtotal, service, tax and total: the combination whose rates snap to
 * what a restaurant charges and that reproduces the printed total, to within the rounding a
 * cashier does without printing it. One of service and tax may be missing or misread: it's
 * worked out from the others then. Undefined when nothing fits.
 */
function findCharges(options: {
	subtotals: number[];
	services: number[];
	taxes: number[];
	totals: number[];
	expectedSubtotal: number;
	hasService: boolean;
	hasTax: boolean;
	printedRounding: number;
	places: number;
}): Charges | undefined {
	const coin = 10 ** -options.places;
	const allowance = options.places === 0 ? 100 : 0.05;
	const toCoin = (value: number) => Math.round(value / coin) * coin;
	const subtotals = [...new Set([options.expectedSubtotal, ...options.subtotals])].filter(
		(v) => v > 0
	);
	const totals: (number | undefined)[] = options.totals.length
		? [...new Set(options.totals)]
		: [undefined];
	const services = options.hasService ? [...new Set([...options.services, NaN])] : [0];
	const taxes = options.hasTax ? [...new Set([...options.taxes, NaN])] : [0];

	let best: (Charges & { score: number }) | undefined;
	for (const subtotal of subtotals) {
		for (const total of totals) {
			if (total !== undefined && total < subtotal) continue;
			for (const printedService of services) {
				for (const printedTax of taxes) {
					const derived = Number.isNaN(printedService) || Number.isNaN(printedTax);
					if (Number.isNaN(printedService) && Number.isNaN(printedTax)) continue;
					if (derived && total === undefined) continue;
					const rest = (total ?? 0) - options.printedRounding - subtotal;
					const service = Number.isNaN(printedService) ? rest - printedTax : printedService;
					const tax = Number.isNaN(printedTax) ? rest - printedService : printedTax;
					if (service < 0 || tax < 0) continue;

					const serviceRate = service > 0 ? snap((service / subtotal) * 100) : 0;
					if (serviceRate === undefined || (options.hasService && serviceRate === 0)) continue;
					const serviceAmount = subtotal * (serviceRate / 100);
					for (const stacked of tax > 0 && serviceRate > 0 ? [false, true] : [false]) {
						const base = stacked ? subtotal + serviceAmount : subtotal;
						const taxRate = tax > 0 ? snap((tax / base) * 100) : 0;
						if (taxRate === undefined || (options.hasTax && taxRate === 0)) continue;
						const computed = toCoin(
							subtotal + serviceAmount + base * (taxRate / 100) + options.printedRounding
						);
						const unprinted = total === undefined ? 0 : toCoin(total - computed);
						if (Math.abs(unprinted) > allowance) continue;
						const score =
							(subtotal === options.expectedSubtotal ? 8 : 0) +
							(derived ? 0 : 3) +
							(unprinted === 0 ? 2 : 0) +
							(Number.isInteger(serviceRate) ? 1 : 0) +
							(Number.isInteger(taxRate) ? 1 : 0) +
							(total === undefined ? 0 : 1);
						if (!best || score > best.score) {
							best = {
								subtotal,
								service: serviceRate,
								tax: taxRate,
								taxOnService: stacked,
								total,
								unprinted,
								score
							};
						}
					}
				}
			}
		}
	}
	return best;
}

/* ─── The receipt ─── */

/** Reads the text of a receipt, in a currency, into what a bill needs. */
export function readReceipt(text: string, currencyCode: string): ScannedReceipt {
	const places = decimalPlaces(currencyCode);
	const lines = text
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean)
		.map((line) => classify(line, places));

	// The items sit between the header and the first total. The header ends at the last line that
	// is clearly not an item: a date, a number with a colon, a "#".
	const closesItems = (line: Line) =>
		line.kind === 'label' && line.label !== 'discount' && line.label !== 'ignore';
	let end = lines.findIndex(closesItems);
	if (end < 0) end = lines.length;
	let start = end;
	while (start > 0 && lines[start - 1].kind !== 'noise') start--;

	const drafts = readItems(lines.slice(start, end), places);
	const after = lines.slice(end);
	const layout =
		drafts.filter((item) => item.priced).length * 2 >= drafts.length ? 'lines' : 'columns';

	const labels = after.filter(
		(line) => line.kind === 'label' && line.label !== 'ignore'
	) as Extract<Line, { kind: 'label' }>[];
	const has = (kind: LabelKind) => labels.some((line) => line.label === kind);
	const adjustments: ScannedAdjustment[] = [];

	let subtotals: number[] = [];
	let services: number[] = [];
	let taxes: number[] = [];
	let totals: number[] = [];
	let printedRounding = 0;

	if (layout === 'lines') {
		// Each label carries its amount, on its line or the one after.
		const valueOf = (line: Extract<Line, { kind: 'label' }>) => {
			if (line.amount !== undefined) return line.amount;
			const next = after[after.indexOf(line) + 1];
			return next?.kind === 'amount' ? next.value : undefined;
		};
		for (const line of labels) {
			const value = valueOf(line);
			if (value === undefined) continue;
			if (line.label === 'subtotal') subtotals.push(value);
			if (line.label === 'service') services.push(value);
			if (line.label === 'tax') taxes.push(value);
			if (line.label === 'total') totals.push(value);
			if (line.label === 'discount') {
				adjustments.push({
					kind: 'discount',
					name: line.text,
					amount: -Math.abs(value),
					unsure: false
				});
			}
			if (line.label === 'rounding') {
				printedRounding += value;
				adjustments.push({ kind: 'rounding', name: line.text, amount: value, unsure: false });
			}
		}
	} else {
		// Every number, in order, after every label. The first numbers are the items' prices; they
		// end where one number is the sum of those before it (an items total or subtotal).
		const numbers = after.filter((line) => line.kind === 'amount') as Extract<
			Line,
			{ kind: 'amount' }
		>[];
		const positives = numbers.filter((line) => line.value >= 0);
		let itemsEnd = -1;
		let sum = 0;
		for (const [index, line] of positives.entries()) {
			if (index > 0 && Math.abs(line.value - sum) < 10 ** -places / 2 && line.value > 0) {
				itemsEnd = index;
				break;
			}
			sum += line.value;
		}
		const matched = itemsEnd >= 0;
		const prices = matched ? positives.slice(0, itemsEnd) : positives.slice(0, drafts.length);
		for (const [index, item] of drafts.entries()) {
			const price = prices[index];
			item.price = price?.value ?? (matched ? 0 : undefined);
			// Paired by position: only as good as the subtotal says.
			item.unsure = !matched || prices.length !== drafts.length || Boolean(price?.misread);
		}
		const rest = positives.slice(prices.length).map((line) => line.value);
		subtotals = rest;
		services = rest;
		taxes = rest;
		totals = rest;

		// Discounts print below zero, in brackets or with a minus: pair them with discount labels.
		const discountNames = labels
			.filter((line) => line.label === 'discount')
			.map((line) => line.text);
		numbers
			.filter((line) => line.value < 0)
			.forEach((line, index) =>
				adjustments.push({
					kind: 'discount',
					name: discountNames[index] ?? 'Discount',
					amount: line.value,
					unsure: discountNames[index] === undefined || line.misread
				})
			);
	}

	const items: ScannedItem[] = drafts
		.filter((item) => item.price !== 0)
		.map(({ name, quantity, price, unsure }) => ({ name, quantity, price, unsure }));
	const itemsSum = items.reduce((total, item) => total + (item.price ?? 0), 0);
	const discounts = adjustments
		.filter((adjustment) => adjustment.kind === 'discount')
		.reduce((total, adjustment) => total + adjustment.amount, 0);
	const expectedSubtotal = itemsSum + discounts;

	const charges = findCharges({
		subtotals,
		services,
		taxes,
		totals,
		expectedSubtotal,
		hasService: has('service'),
		hasTax: has('tax'),
		printedRounding,
		places
	});

	if (charges && charges.unprinted !== 0) {
		adjustments.push({
			kind: 'rounding',
			name: 'Rounding (not on the receipt)',
			amount: charges.unprinted,
			unsure: true
		});
	}

	const subtotal = charges?.subtotal ?? (layout === 'lines' ? subtotals.at(-1) : undefined);
	const gap = subtotal === undefined ? 0 : expectedSubtotal - subtotal;
	const coin = 10 ** -places;
	const itemsGap = Math.abs(gap) >= coin / 2 ? gap : undefined;
	if (itemsGap !== undefined) for (const item of items) item.unsure = true;

	return {
		layout,
		items,
		adjustments,
		servicePercentage: charges?.service,
		taxPercentage: charges?.tax,
		taxOnService: charges?.taxOnService ?? false,
		subtotal,
		total: charges?.total ?? (layout === 'lines' ? totals.at(-1) : undefined),
		itemsGap
	};
}

/** What the receipt's items, adjustments and rates come to, the way the bill will add them up. */
export function receiptTotal(receipt: ScannedReceipt, currencyCode: string): number {
	const state: BillState = {
		people: [{ id: 'everyone', name: '' }],
		items: receipt.items.map((item, index) => ({
			id: String(index),
			name: item.name,
			price: item.price ?? 0,
			assignedPersonIds: ['everyone']
		})),
		taxPercentage: receipt.taxPercentage ?? 0,
		servicePercentage: receipt.servicePercentage ?? 0,
		currencyCode,
		taxOnService: receipt.taxOnService,
		adjustments: receipt.adjustments.map((adjustment, index) => ({
			id: String(index),
			kind: adjustment.kind,
			name: adjustment.name,
			amount: adjustment.amount
		}))
	};
	return calculateBill(state).shares[0].total;
}
