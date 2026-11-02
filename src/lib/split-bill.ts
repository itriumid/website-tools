// The split bill calculator's rules, kept apart from the page so they can be tested: how a bill
// is shared as a link, and how it's divided.

import lzString from 'lz-string';

const { compressToEncodedURIComponent, decompressFromEncodedURIComponent } = lzString;

export interface BillPerson {
	id: string;
	name: string;
}

export interface BillItem {
	id: string;
	name: string;
	/** For all of them, when there are several. */
	price: number;
	assignedPersonIds: string[];
	// Both below came after links were already shared: optional, and missing means what the tool
	// did before (one of it, split evenly among the people tagged to it).
	/** How many there were: "3× Es Teh". Only kept when more than one. */
	quantity?: number;
	/**
	 * How many each person had, by person: for when people had different numbers. Each pays for
	 * their own; any not counted are in nobody's share yet. Only kept with a quantity.
	 */
	counts?: Record<string, number>;
}

export const MAX_QUANTITY = 999;

/**
 * A change to the whole bill, kept as the receipt printed it rather than netted into one number.
 * The kind decides when it applies: a discount comes off the subtotal before tax and service;
 * rounding and anything else land on the total after them.
 */
export interface BillAdjustment {
	id: string;
	kind: AdjustmentKind;
	/** As printed: "PROMO GAJIAN", "Pembulatan". */
	name: string;
	/** Signed: a discount is never above zero; rounding and other adjustments go either way. */
	amount: number;
}

export const ADJUSTMENT_KINDS = ['discount', 'rounding', 'other'] as const;
export type AdjustmentKind = (typeof ADJUSTMENT_KINDS)[number];

export interface BillState {
	people: BillPerson[];
	items: BillItem[];
	taxPercentage: number;
	servicePercentage: number;
	currencyCode: string;
	// Everything below came after links were already shared, so each is optional and missing
	// means what the tool did before: tax and service added on top of the subtotal, each on its
	// own, and no adjustments. Old links open exactly as they were.
	/** The prices already include tax: it's noted, not added. */
	taxIncluded?: boolean;
	/** The prices already include service: it's noted, not added. */
	serviceIncluded?: boolean;
	/** Tax is charged on the subtotal plus service. Meaningless once tax is included: ignored then. */
	taxOnService?: boolean;
	adjustments?: BillAdjustment[];
}

export const DEFAULT_TAX_PERCENTAGE = 10;
export const DEFAULT_SERVICE_PERCENTAGE = 5;
export const DEFAULT_CURRENCY_CODE = 'IDR';

/* ─── Sharing ─── */

// A bill travels in the part of the address after the "#", compressed. Browsers never send that
// part to a server, so nobody but the people given the link sees the bill. Links made before this
// site moved to tools.itrium.id use the same format and still open: keep it exactly as it is.
const HASH_PREFIX = '#data=';

/** The address fragment that holds `state`, to put after the page's address. */
export function billToHash(state: BillState): string {
	return `${HASH_PREFIX}${compressToEncodedURIComponent(JSON.stringify(state))}`;
}

/** The bill in an address fragment, or undefined if it holds none (or one that isn't a bill). */
export function billFromHash(hash: string): BillState | undefined {
	if (!hash.startsWith(HASH_PREFIX) || hash.length === HASH_PREFIX.length) return undefined;
	try {
		const json = decompressFromEncodedURIComponent(hash.slice(HASH_PREFIX.length));
		return json ? readBill(JSON.parse(json)) : undefined;
	} catch {
		return undefined;
	}
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

const isCount = (value: unknown): value is number =>
	typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= MAX_QUANTITY;

const isPercentage = (value: unknown): value is number =>
	typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100;

/** What a link says, checked: anyone can write a link, so nothing in it is trusted as it comes. */
export function readBill(value: unknown): BillState | undefined {
	if (!isRecord(value) || !Array.isArray(value.people) || !Array.isArray(value.items)) {
		return undefined;
	}
	const people: BillPerson[] = [];
	for (const person of value.people) {
		if (!isRecord(person) || typeof person.id !== 'string' || typeof person.name !== 'string') {
			return undefined;
		}
		people.push({ id: person.id, name: person.name });
	}
	const items: BillItem[] = [];
	for (const item of value.items) {
		if (
			!isRecord(item) ||
			typeof item.id !== 'string' ||
			typeof item.name !== 'string' ||
			typeof item.price !== 'number' ||
			!Number.isFinite(item.price) ||
			item.price < 0 ||
			!Array.isArray(item.assignedPersonIds) ||
			!item.assignedPersonIds.every((id) => typeof id === 'string')
		) {
			return undefined;
		}
		const read: BillItem = {
			id: item.id,
			name: item.name,
			price: item.price,
			assignedPersonIds: item.assignedPersonIds
		};
		if (item.quantity !== undefined) {
			if (!isCount(item.quantity) || item.quantity < 1 || item.quantity > MAX_QUANTITY) {
				return undefined;
			}
			if (item.quantity > 1) read.quantity = item.quantity;
		}
		if (item.counts !== undefined) {
			if (!isRecord(item.counts) || !Object.values(item.counts).every(isCount)) return undefined;
			const counts = Object.entries(item.counts as Record<string, number>).filter(([, n]) => n > 0);
			if (read.quantity && counts.length) read.counts = Object.fromEntries(counts);
		}
		items.push(read);
	}
	const adjustments: BillAdjustment[] = [];
	if (value.adjustments !== undefined) {
		if (!Array.isArray(value.adjustments)) return undefined;
		for (const adjustment of value.adjustments) {
			if (
				!isRecord(adjustment) ||
				typeof adjustment.id !== 'string' ||
				typeof adjustment.name !== 'string' ||
				!ADJUSTMENT_KINDS.includes(adjustment.kind as AdjustmentKind) ||
				typeof adjustment.amount !== 'number' ||
				!Number.isFinite(adjustment.amount) ||
				(adjustment.kind === 'discount' && adjustment.amount > 0)
			) {
				return undefined;
			}
			adjustments.push({
				id: adjustment.id,
				kind: adjustment.kind as AdjustmentKind,
				name: adjustment.name,
				amount: adjustment.amount
			});
		}
	}
	const state: BillState = {
		people,
		items,
		taxPercentage: isPercentage(value.taxPercentage) ? value.taxPercentage : DEFAULT_TAX_PERCENTAGE,
		servicePercentage: isPercentage(value.servicePercentage)
			? value.servicePercentage
			: DEFAULT_SERVICE_PERCENTAGE,
		currencyCode:
			typeof value.currencyCode === 'string' && value.currencyCode
				? value.currencyCode
				: DEFAULT_CURRENCY_CODE
	};
	// Only what says something is kept, so a bill without these reads back exactly as written.
	if (value.taxIncluded === true) state.taxIncluded = true;
	if (value.serviceIncluded === true) state.serviceIncluded = true;
	if (value.taxOnService === true && !state.taxIncluded) state.taxOnService = true;
	if (adjustments.length) state.adjustments = adjustments;
	return state;
}

/* ─── Money ─── */

const WHOLE_CURRENCIES = new Set([
	'BIF',
	'CLP',
	'DJF',
	'GNF',
	'IDR',
	'ISK',
	'JPY',
	'KMF',
	'KRW',
	'PYG',
	'RWF',
	'UGX',
	'VND',
	'VUV',
	'XAF',
	'XOF',
	'XPF'
]);
const THOUSANDTHS_CURRENCIES = new Set(['BHD', 'IQD', 'JOD', 'KWD', 'LYD', 'OMR', 'TND']);

/**
 * How many decimal places a currency's smallest coin takes: none for rupiah, yen and a few more,
 * three for the dinars, two for nearly everything else.
 */
export function decimalPlaces(currencyCode: string): number {
	if (WHOLE_CURRENCIES.has(currencyCode)) return 0;
	return THOUSANDTHS_CURRENCIES.has(currencyCode) ? 3 : 2;
}

/** An amount written the way the visitor's language writes numbers, to the currency's decimals. */
export function formatAmount(amount: number, currencyCode: string, locale?: string): string {
	const places = decimalPlaces(currencyCode);
	return new Intl.NumberFormat(locale, {
		minimumFractionDigits: places,
		maximumFractionDigits: places
	}).format(amount);
}

/* ─── Dividing ─── */

export interface PersonShare {
	personId: string;
	/** What they had, before discounts, tax and service. */
	base: number;
	/** What they owe: their base with their part of everything else, rounded to the coin. */
	total: number;
}

export interface BillTotals {
	subtotal: number;
	/** The discounts, together: zero or below. */
	discounts: number;
	/** Tax added on top: zero when the prices already include it. */
	tax: number;
	/** Service added on top: zero when the prices already include it. */
	service: number;
	/** Rounding and other adjustments, together: they land after tax and service. */
	lateAdjustments: number;
	grandTotal: number;
	/** What the items nobody is tagged to add up to: left out of every share. */
	unassigned: number;
	shares: PersonShare[];
}

/**
 * Divides a bill. Each item is split evenly among the people tagged to it, or, when it says how
 * many each had, by those counts; everything else (discounts, tax, service, rounding) is shared
 * in proportion to what each person had.
 *
 * In order: discounts come off the subtotal; service is a percentage of that; tax is a percentage
 * of it too, or of it plus service when tax is charged on service; tax or service the prices
 * already include adds nothing; rounding and other adjustments land last. The total never goes
 * below zero.
 *
 * Shares are rounded to the currency's smallest coin so they add up to exactly what the tagged
 * items cost with all of that: the coins left over after rounding go to the people whose shares
 * lost the most, rather than leaving the table a coin short.
 */
export function calculateBill(state: BillState): BillTotals {
	const subtotal = state.items.reduce((sum, item) => sum + item.price, 0);
	const adjustments = state.adjustments ?? [];
	const sumOf = (kinds: AdjustmentKind[]) =>
		adjustments
			.filter((adjustment) => kinds.includes(adjustment.kind))
			.reduce((sum, adjustment) => sum + adjustment.amount, 0);
	const discounts = sumOf(['discount']);
	const lateAdjustments = sumOf(['rounding', 'other']);

	const discounted = Math.max(0, subtotal + discounts);
	const service = state.serviceIncluded ? 0 : discounted * (state.servicePercentage / 100);
	const taxBase = state.taxOnService && !state.taxIncluded ? discounted + service : discounted;
	const tax = state.taxIncluded ? 0 : taxBase * (state.taxPercentage / 100);
	const grandTotal = Math.max(0, discounted + service + tax + lateAdjustments);
	const multiplier = subtotal > 0 ? grandTotal / subtotal : 1;

	const bases = new Map<string, number>(state.people.map((person) => [person.id, 0]));
	let unassigned = 0;
	for (const item of state.items) {
		if (item.counts && (item.quantity ?? 1) > 1) {
			// Each pays for as many as they had; any nobody's counted for are nobody's yet. Counted
			// past the quantity, everyone's share shrinks to fit, so the item still costs its price.
			const counted = Object.entries(item.counts).filter(([id, n]) => bases.has(id) && n > 0);
			const total = counted.reduce((sum, [, n]) => sum + n, 0);
			const units = Math.max(item.quantity ?? 1, total);
			for (const [id, n] of counted) {
				bases.set(id, (bases.get(id) ?? 0) + (item.price * n) / units);
			}
			unassigned += (item.price * (units - total)) / units;
			continue;
		}
		const tagged = item.assignedPersonIds.filter((id) => bases.has(id));
		if (tagged.length === 0) {
			unassigned += item.price;
			continue;
		}
		for (const id of tagged) bases.set(id, (bases.get(id) ?? 0) + item.price / tagged.length);
	}

	const coins = 10 ** decimalPlaces(state.currencyCode);
	const exact = state.people.map((person) => (bases.get(person.id) ?? 0) * multiplier * coins);
	const rounded = exact.map(Math.floor);
	// Rounding to a millionth of a coin first keeps 0.1 + 0.2 style noise from costing a coin.
	const target = Math.round(Math.round(exact.reduce((sum, value) => sum + value, 0) * 1e6) / 1e6);
	let leftover = target - rounded.reduce((sum, value) => sum + value, 0);
	const byRemainder = exact
		.map((value, index) => ({ index, lost: value - Math.floor(value) }))
		.sort((a, b) => b.lost - a.lost || a.index - b.index);
	for (const { index } of byRemainder) {
		if (leftover <= 0) break;
		rounded[index] += 1;
		leftover -= 1;
	}

	return {
		subtotal,
		discounts,
		tax,
		service,
		lateAdjustments,
		grandTotal,
		unassigned,
		shares: state.people.map((person, index) => ({
			personId: person.id,
			base: bases.get(person.id) ?? 0,
			total: rounded[index] / coins
		}))
	};
}
