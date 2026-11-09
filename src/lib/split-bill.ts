// The split bill calculator's rules, kept apart from the page so they can be tested: how a bill
// is shared as a link, and how it's divided.

import lzString from 'lz-string';
import { CURRENCIES } from './countries';
import { asciiDigits } from './digits';

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
	/**
	 * Who it's for, when it isn't everyone: a member's voucher, a card fee for whoever paid by
	 * card. Split evenly among them. Missing or empty means everyone, by what they had: what the
	 * tool did before. Only kept when someone's tagged.
	 */
	assignedPersonIds?: string[];
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
				(adjustment.kind === 'discount' && adjustment.amount > 0) ||
				(adjustment.assignedPersonIds !== undefined &&
					(!Array.isArray(adjustment.assignedPersonIds) ||
						!adjustment.assignedPersonIds.every((id) => typeof id === 'string')))
			) {
				return undefined;
			}
			const read: BillAdjustment = {
				id: adjustment.id,
				kind: adjustment.kind as AdjustmentKind,
				name: adjustment.name,
				amount: adjustment.amount
			};
			const tagged = adjustment.assignedPersonIds as string[] | undefined;
			if (tagged?.length) read.assignedPersonIds = tagged;
			adjustments.push(read);
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

// How each currency's own people write it, by currency: rupiah as Indonesians do ("146.000"),
// dollars as Americans do ("1,234.50"), yen as the Japanese do ("1,200"), and the euro the way
// Germany writes it ("1.234,50"), as most of the euro countries do. Currencies of countries whose
// language has its own digits (Arabic, Persian, Burmese) keep 0 to 9 ("-u-nu-latn"), as receipts
// there mostly print them; a few use English where the country's own language does that too.
// A currency missing here is written the way the reader's browser writes numbers (its
// navigator.language). Every amount on the page is written through this, the "= Rp 45.000" under
// a field as well, so what's typed and what's shown agree. It's only for showing: bills are
// shared and kept as numbers, never as these strings.
const CURRENCY_LOCALES: Record<string, string> = {
	IDR: 'id-ID',
	USD: 'en-US',
	EUR: 'de-DE',
	JPY: 'ja-JP',
	GBP: 'en-GB',
	SGD: 'en-SG',
	MYR: 'ms-MY',
	THB: 'th-TH',
	VND: 'vi-VN',
	PHP: 'en-PH',
	BND: 'ms-BN',
	KHR: 'km-KH',
	LAK: 'lo-LA',
	MMK: 'my-MM-u-nu-latn',
	AUD: 'en-AU',
	NZD: 'en-NZ',
	CAD: 'en-CA',
	CNY: 'zh-CN',
	HKD: 'zh-HK',
	MOP: 'zh-MO',
	TWD: 'zh-TW',
	KRW: 'ko-KR',
	KPW: 'ko-KP',
	MNT: 'mn-MN',
	INR: 'en-IN',
	PKR: 'en-PK',
	BDT: 'en-BD',
	LKR: 'en-LK',
	NPR: 'en-NP',
	MVR: 'en-MV',
	AFN: 'fa-AF-u-nu-latn',
	IRR: 'fa-IR-u-nu-latn',
	AED: 'ar-AE-u-nu-latn',
	SAR: 'ar-SA-u-nu-latn',
	QAR: 'ar-QA-u-nu-latn',
	KWD: 'ar-KW-u-nu-latn',
	BHD: 'ar-BH-u-nu-latn',
	OMR: 'ar-OM-u-nu-latn',
	JOD: 'ar-JO-u-nu-latn',
	IQD: 'ar-IQ-u-nu-latn',
	LBP: 'ar-LB-u-nu-latn',
	YER: 'ar-YE-u-nu-latn',
	EGP: 'ar-EG-u-nu-latn',
	LYD: 'ar-LY-u-nu-latn',
	DZD: 'ar-DZ-u-nu-latn',
	MAD: 'ar-MA-u-nu-latn',
	ILS: 'he-IL',
	TRY: 'tr-TR',
	CHF: 'de-CH',
	SEK: 'sv-SE',
	NOK: 'nb-NO',
	DKK: 'da-DK',
	ISK: 'is-IS',
	PLN: 'pl-PL',
	CZK: 'cs-CZ',
	HUF: 'hu-HU',
	RON: 'ro-RO',
	BGN: 'bg-BG',
	RSD: 'sr-RS',
	BAM: 'bs-BA',
	ALL: 'sq-AL',
	RUB: 'ru-RU',
	UAH: 'uk-UA',
	BYN: 'be-BY',
	KZT: 'kk-KZ',
	UZS: 'uz-UZ',
	GEL: 'ka-GE',
	AMD: 'hy-AM',
	AZN: 'az-AZ',
	BRL: 'pt-BR',
	MXN: 'es-MX',
	ARS: 'es-AR',
	CLP: 'es-CL',
	COP: 'es-CO',
	PEN: 'es-PE',
	UYU: 'es-UY',
	PYG: 'es-PY',
	BOB: 'es-BO',
	VES: 'es-VE',
	CRC: 'es-CR',
	GTQ: 'es-GT',
	PAB: 'es-PA',
	DOP: 'es-DO',
	CUP: 'es-CU',
	JMD: 'en-JM',
	ZAR: 'en-ZA',
	NGN: 'en-NG',
	KES: 'en-KE',
	GHS: 'en-GH',
	TZS: 'en-TZ',
	UGX: 'en-UG',
	ETB: 'en-ET',
	ZWL: 'en-ZW'
};

/**
 * An amount written the way the currency's own people write it, to the currency's decimals: see
 * `CURRENCY_LOCALES`. `locale` overrides that, for tests.
 */
export function formatAmount(
	amount: number,
	currencyCode: string,
	locale: string | undefined = CURRENCY_LOCALES[currencyCode]
): string {
	const places = decimalPlaces(currencyCode);
	return new Intl.NumberFormat(locale, {
		minimumFractionDigits: places,
		maximumFractionDigits: places
	}).format(amount);
}

export type AmountProblem = 'unreadable' | 'negative' | 'no-cents';

/**
 * An amount typed into a field, read the way people in the currency's countries write it, or what
 * stops it being read. Empty text is neither: there's nothing to say yet.
 *
 * Dots and commas both work, for grouping and for the decimal mark, so "45.000", "45,000",
 * "1,234.56" and "1.234,56" all read as meant:
 *
 * - The last dot or comma is the decimal mark when it's followed by at most as many digits as the
 *   currency has decimals (one or two for most, up to three for the dinars) and the same mark
 *   isn't used earlier too. Every other dot and comma groups thousands and is dropped.
 * - So in a currency without cents, like rupiah, every dot and comma groups: "45.000" and
 *   "45,000" are both 45000. The one exception is cents that are all zeros after both marks
 *   ("45.000,00", as banking apps show it), which are dropped; any other cents are a problem.
 * - Spaces and apostrophes group too ("45 000", "1'234.50"), and the currency's symbol or code
 *   may come first or last ("Rp 45.000"). A minus sign makes it negative, which is a problem.
 * - Arabic, Persian and full-width digits read as 0 to 9, and the Arabic decimal and thousands
 *   marks as a dot and a comma: "٤٥٫٥٠" is 45.50.
 */
export function parseAmount(
	text: string,
	currencyCode: string
): { amount: number } | { problem: AmountProblem } | undefined {
	const symbol = CURRENCIES.find((currency) => currency.code === currencyCode)?.symbol;
	let token = asciiDigits(text).replace(/[\s'’]/g, '');
	for (const name of [currencyCode, symbol]) {
		if (!name) continue;
		const lower = token.toLowerCase();
		const mark = name.toLowerCase().replace(/\s/g, '');
		if (lower.startsWith(mark)) token = token.slice(mark.length);
		else if (lower.endsWith(mark)) token = token.slice(0, -mark.length);
	}
	if (!token) return undefined;
	const negative = /^[-−]/.test(token);
	if (negative) token = token.slice(1);
	if (!/^[\d.,]*\d[\d.,]*$/.test(token)) return { problem: 'unreadable' };
	if (negative) return { problem: 'negative' };

	const places = decimalPlaces(currencyCode);
	const last = Math.max(token.lastIndexOf('.'), token.lastIndexOf(','));
	let whole = token;
	let fraction = '';
	if (last >= 0) {
		const mark = token[last];
		const other = mark === '.' ? ',' : '.';
		const after = token.length - last - 1;
		const alone = token.indexOf(mark) === last;
		const cents = token.slice(last + 1);
		if (places === 0) {
			// Without cents, a mark is a decimal one only after the other mark: "45.000,00".
			if (alone && after >= 1 && after <= 2 && token.slice(0, last).includes(other)) {
				if (!/^0+$/.test(cents)) return { problem: 'no-cents' };
				whole = token.slice(0, last);
			}
		} else if (alone && after >= 1 && after <= places) {
			whole = token.slice(0, last);
			fraction = cents;
		}
	}
	whole = whole.replace(/[.,]/g, '');
	const amount = Number(`${whole || '0'}.${fraction || '0'}`);
	return Number.isFinite(amount) ? { amount } : { problem: 'unreadable' };
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
	const serviceRate = state.serviceIncluded ? 0 : state.servicePercentage / 100;
	const taxRate = state.taxIncluded ? 0 : state.taxPercentage / 100;
	const stacked = Boolean(state.taxOnService && !state.taxIncluded);
	const service = discounted * serviceRate;
	const tax = (stacked ? discounted + service : discounted) * taxRate;
	const grandTotal = Math.max(0, discounted + service + tax + lateAdjustments);
	// Service and tax are percentages, so they grow every share by the same factor.
	const charges = 1 + serviceRate + taxRate * (stacked ? 1 + serviceRate : 1);

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

	// Adjustments for some people split evenly among them; the rest are everyone's, by what they had.
	const ids = state.people.map((person) => person.id);
	const taggedOf = (adjustment: BillAdjustment) =>
		(adjustment.assignedPersonIds ?? []).filter((id) => bases.has(id));
	const perPerson = (kinds: AdjustmentKind[]) => {
		const amounts = new Map<string, number>(ids.map((id) => [id, 0]));
		let everyone = 0;
		for (const adjustment of adjustments.filter((a) => kinds.includes(a.kind))) {
			const tagged = taggedOf(adjustment);
			if (!tagged.length) everyone += adjustment.amount;
			for (const id of tagged)
				amounts.set(id, amounts.get(id)! + adjustment.amount / tagged.length);
		}
		return { amounts, everyone };
	};

	// 1. Discounts. Someone's own comes off what they had, down to nothing; any left over is
	// everyone's. Everyone's come off what's left, in proportion.
	const discount = perPerson(['discount']);
	let everyoneDiscount = discount.everyone;
	const own = new Map<string, number>();
	for (const id of ids) {
		const left = (bases.get(id) ?? 0) + discount.amounts.get(id)!;
		if (left < 0) everyoneDiscount += left;
		own.set(id, Math.max(0, left));
	}
	const afterOwn = [...own.values()].reduce((sum, value) => sum + value, 0) + unassigned;
	const shrink = afterOwn > 0 ? Math.max(0, afterOwn + everyoneDiscount) / afterOwn : 0;

	// 2. Service and tax, the same factor for everyone. 3. Rounding and the rest, last: someone's
	// own on them (never below nothing), everyone's in proportion to what each comes to by then.
	const charged = new Map(ids.map((id) => [id, own.get(id)! * shrink * charges]));
	const chargedUnassigned = unassigned * shrink * charges;
	const late = perPerson(['rounding', 'other']);
	const chargedTotal =
		[...charged.values()].reduce((sum, value) => sum + value, 0) + chargedUnassigned;
	const owed = ids.map((id) => {
		const before = charged.get(id)!;
		const everyone = chargedTotal > 0 ? (late.everyone * before) / chargedTotal : 0;
		return Math.max(0, before + late.amounts.get(id)! + everyone);
	});

	const coins = 10 ** decimalPlaces(state.currencyCode);
	const exact = owed.map((value) => value * coins);
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
