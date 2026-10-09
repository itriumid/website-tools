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
	price: number;
	assignedPersonIds: string[];
}

export interface BillState {
	people: BillPerson[];
	items: BillItem[];
	taxPercentage: number;
	servicePercentage: number;
	currencyCode: string;
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

const isPercentage = (value: unknown): value is number =>
	typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100;

/** What a link says, checked: anyone can write a link, so nothing in it is trusted as it comes. */
function readBill(value: unknown): BillState | undefined {
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
		items.push({
			id: item.id,
			name: item.name,
			price: item.price,
			assignedPersonIds: item.assignedPersonIds
		});
	}
	return {
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
	/** What they had, before tax and service. */
	base: number;
	/** What they owe: their base with their part of tax and service, rounded to the coin. */
	total: number;
}

export interface BillTotals {
	subtotal: number;
	tax: number;
	service: number;
	grandTotal: number;
	/** What the items nobody is tagged to add up to: left out of every share. */
	unassigned: number;
	shares: PersonShare[];
}

/**
 * Divides a bill. Each item is split evenly among the people tagged to it, and tax and service
 * (each a percentage of the subtotal) are shared in proportion to what each person had.
 *
 * Shares are rounded to the currency's smallest coin so they add up to exactly what the tagged
 * items cost with tax and service: the coins left over after rounding go to the people whose
 * shares lost the most, rather than leaving the table a coin short.
 */
export function calculateBill(state: BillState): BillTotals {
	const subtotal = state.items.reduce((sum, item) => sum + item.price, 0);
	const tax = subtotal * (state.taxPercentage / 100);
	const service = subtotal * (state.servicePercentage / 100);
	const grandTotal = subtotal + tax + service;
	const multiplier = subtotal > 0 ? grandTotal / subtotal : 1;

	const bases = new Map<string, number>(state.people.map((person) => [person.id, 0]));
	let unassigned = 0;
	for (const item of state.items) {
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
		tax,
		service,
		grandTotal,
		unassigned,
		shares: state.people.map((person, index) => ({
			personId: person.id,
			base: bases.get(person.id) ?? 0,
			total: rounded[index] / coins
		}))
	};
}
