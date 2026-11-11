<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { resolve } from '$app/paths';
	import SearchableSelect, { type Choice } from '#lib/SearchableSelect.svelte';
	import Check from '#lib/Check.svelte';
	import Seo from '#lib/Seo.svelte';
	import Toggletip from '#lib/Toggletip.svelte';
	import {
		readReceipt,
		receiptTotal,
		type ScannedAdjustment,
		type ScannedReceipt
	} from '#lib/receipt.js';
	import { SPLIT_BILL } from '#lib/content.js';
	import { CURRENCIES } from '#lib/countries.js';
	import {
		DEFAULT_CURRENCY_CODE,
		DEFAULT_SERVICE_PERCENTAGE,
		DEFAULT_TAX_PERCENTAGE,
		MAX_QUANTITY,
		billAsText,
		billFromHash,
		billToHash,
		calculateBill,
		changeItem,
		decimalPlaces,
		formatAmount,
		formatMoney,
		missingForItem,
		parseAmount,
		taxOnServiceByDefault,
		ADJUSTMENT_KINDS,
		type AdjustmentKind,
		type AmountProblem,
		type BillAdjustment,
		type BillItem,
		type BillPerson,
		type BillState
	} from '#lib/split-bill.js';
	import {
		SHORT_PREFIX,
		codeFromHash,
		deleteBill,
		forget,
		openBill,
		remember,
		shareBill,
		sharedHere,
		updateBill,
		type Shared,
		type Version
	} from '#lib/share.js';
	import { clearDraft, draftToOpen, loadDraft, saveDraft } from '#lib/draft.js';
	import {
		besideField,
		card,
		cardHeading,
		checkRow,
		checkbox,
		field,
		label,
		primaryButton,
		secondaryButton,
		smallButton
	} from '#lib/styles.js';

	const currencyChoices: Choice[] = CURRENCIES.map((currency) => ({
		value: currency.code,
		label: `${currency.code} (${currency.symbol})`,
		detail:
			currency.countries.slice(0, 3).join(', ') +
			(currency.countries.length > 3 ? ` and ${currency.countries.length - 3} more` : ''),
		searchTerms: `${currency.symbol} ${currency.countries.join(' ')}`
	}));

	/* ─── The bill ─── */
	let people: BillPerson[] = $state([]);
	let items: BillItem[] = $state([]);
	// Inputs hold null while they're empty.
	let taxInput: number | null = $state(DEFAULT_TAX_PERCENTAGE);
	let serviceInput: number | null = $state(DEFAULT_SERVICE_PERCENTAGE);
	let currencyCode = $state(DEFAULT_CURRENCY_CODE);
	let taxIncluded = $state(false);
	let serviceIncluded = $state(false);
	let taxOnService = $state(taxOnServiceByDefault(DEFAULT_CURRENCY_CODE));
	// Until someone sets tax on service themselves, it follows the currency's usual way.
	let taxOnServiceChosen = $state(false);
	let adjustments: BillAdjustment[] = $state([]);

	const percentage = (value: number | null) =>
		typeof value === 'number' && Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;

	const bill: BillState = $derived.by(() => {
		const state: BillState = {
			people: $state.snapshot(people),
			items: $state.snapshot(items),
			taxPercentage: percentage(taxInput),
			servicePercentage: percentage(serviceInput),
			currencyCode
		};
		// Only what says something goes in, the way a link reads back: shorter links, and a bill
		// that didn't change still compares equal to the one last shared.
		if (taxIncluded) state.taxIncluded = true;
		if (serviceIncluded) state.serviceIncluded = true;
		if (taxOnService && !taxIncluded) state.taxOnService = true;
		if (adjustments.length) state.adjustments = $state.snapshot(adjustments);
		return state;
	});
	const totals = $derived(calculateBill(bill));
	const money = (amount: number) => formatMoney(amount, currencyCode);
	const nameOf = (id: string) => people.find((person) => person.id === id)?.name ?? '';

	/* ─── Amounts as typed ─── */
	// Amount fields are text, not numbers: "45.000" is forty-five thousand rupiah, which a number
	// field reads as 45. src/lib/split-bill.ts reads them the way the currency is written.
	type AmountRead = ReturnType<typeof parseAmount>;
	const readTypedAmount = (text: string): AmountRead => parseAmount(text, currencyCode);
	const amountOf = (read: AmountRead) => (read && 'amount' in read ? read.amount : null);
	// A phone's keypad for whole amounts has no dots or commas, and rupiah need neither.
	const amountKeypad = $derived(decimalPlaces(currencyCode) > 0 ? 'decimal' : 'numeric');
	const PROBLEMS: Record<Exclude<AmountProblem, 'negative'>, string> = {
		unreadable: SPLIT_BILL.amounts.unreadable,
		'no-cents': SPLIT_BILL.amounts.noCents
	};
	/** What to say under an amount field: what it reads as, or what's wrong with it. */
	function amountNote(
		read: AmountRead,
		negative: string,
		zeroIsProblem = true
	): { text: string; problem: boolean } | undefined {
		if (!read) return undefined;
		if ('problem' in read) {
			return {
				text: read.problem === 'negative' ? negative : PROBLEMS[read.problem],
				problem: true
			};
		}
		if (read.amount === 0 && zeroIsProblem) return { text: SPLIT_BILL.amounts.zero, problem: true };
		return { text: SPLIT_BILL.amounts.reads(money(read.amount)), problem: false };
	}

	/* ─── People ─── */
	let newPerson = $state('');

	// Not a secret and not for security: just a name for a row that doesn't change when others do.
	const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

	function addPerson() {
		const name = newPerson.trim();
		if (!name) return;
		people.push({ id: newId(), name });
		newPerson = '';
	}

	// Renaming someone keeps everything they're tagged to: it's the same person.
	let renaming: { id: string; name: string } | undefined = $state();

	async function startRenaming(person: BillPerson) {
		renaming = { id: person.id, name: person.name };
		await tick();
		document.getElementById('rename-person')?.focus();
	}

	async function stopRenaming(save: boolean) {
		if (!renaming) return;
		const { id, name } = renaming;
		if (save && !name.trim()) return;
		const person = people.find((other) => other.id === id);
		if (save && person) person.name = name.trim();
		renaming = undefined;
		await tick();
		document.getElementById(`rename-${id}`)?.focus();
	}

	function removePerson(id: string) {
		people = people.filter((person) => person.id !== id);
		for (const item of items) {
			item.assignedPersonIds = item.assignedPersonIds.filter((tagged) => tagged !== id);
			if (item.counts && id in item.counts) {
				const counts = { ...item.counts };
				delete counts[id];
				item.counts = counts;
			}
		}
		for (const adjustment of adjustments) {
			if (adjustment.assignedPersonIds?.includes(id)) toggleAdjustmentTag(adjustment, id);
		}
	}

	/* ─── Items ─── */
	let newItem = $state('');
	let newPriceText = $state('');
	const newPriceRead = $derived(readTypedAmount(newPriceText));
	const newPrice = $derived(amountOf(newPriceRead));
	const newPriceNote = $derived(amountNote(newPriceRead, SPLIT_BILL.amounts.negativePrice));
	let newQuantity: number | null = $state(1);
	const quantityOf = (value: number | null) =>
		typeof value === 'number' && Number.isFinite(value)
			? Math.min(MAX_QUANTITY, Math.max(1, Math.round(value)))
			: 1;
	const canAddItem = $derived(newItem.trim() !== '' && newPrice !== null && newPrice > 0);

	function addItem() {
		if (!canAddItem || newPrice === null) return;
		// People know a menu's price for one, so the form asks for that; the bill keeps the line's.
		const quantity = quantityOf(newQuantity);
		items.push({
			id: newId(),
			name: newItem.trim(),
			price: newPrice * quantity,
			assignedPersonIds: [],
			...(quantity > 1 ? { quantity } : {})
		});
		newItem = '';
		newPriceText = '';
		newQuantity = 1;
	}

	const nameWithQuantity = (item: BillItem) =>
		(item.quantity ?? 1) > 1 ? `${item.quantity}× ${item.name}` : item.name;
	const countedOf = (item: BillItem) =>
		Object.values(item.counts ?? {}).reduce((sum, count) => sum + count, 0);

	// Counting is the advanced way to tag: for an item there were several of, when people had
	// different numbers of them. It starts from whoever is tagged, one each.
	function startCounting(item: BillItem) {
		item.counts = Object.fromEntries(item.assignedPersonIds.map((id) => [id, 1]));
	}

	function stopCounting(item: BillItem) {
		delete item.counts;
	}

	function changeCount(item: BillItem, personId: string, change: number) {
		const counts = { ...item.counts };
		const count = Math.min(MAX_QUANTITY, (counts[personId] ?? 0) + change);
		if (count > 0) counts[personId] = count;
		else delete counts[personId];
		item.counts = counts;
		item.assignedPersonIds = Object.keys(counts);
	}

	/** Why "Add item" can't be pressed yet. A price that can't be read says why under it already. */
	const addItemReason = $derived.by(() => {
		if (newPriceNote?.problem) return undefined;
		const missing = missingForItem(newItem, newPrice);
		if (missing === 'name-and-price') return SPLIT_BILL.missing.itemNameAndPrice;
		if (missing === 'name') return SPLIT_BILL.missing.itemName;
		return missing === 'price' ? SPLIT_BILL.missing.itemPrice : undefined;
	});

	// Changing an item in place keeps who had it. One at a time, with its own fields.
	interface ItemEdit {
		id: string;
		name: string;
		quantity: number | null;
		priceText: string;
		/** The price for one as the field first showed it: left alone, the price stays exact. */
		shownPriceText: string;
	}
	let editing: ItemEdit | undefined = $state();
	const editPriceRead = $derived(editing && readTypedAmount(editing.priceText));
	const editPriceNote = $derived(
		editing && amountNote(editPriceRead, SPLIT_BILL.amounts.negativePrice)
	);
	const editReason = $derived.by(() => {
		if (!editing || editPriceNote?.problem) return undefined;
		const priceUnchanged = editing.priceText === editing.shownPriceText;
		const missing = missingForItem(editing.name, priceUnchanged ? 1 : amountOf(editPriceRead));
		if (missing === 'name-and-price') return SPLIT_BILL.missing.itemNameAndPrice;
		if (missing === 'name') return SPLIT_BILL.missing.itemName;
		return missing === 'price' ? SPLIT_BILL.missing.itemPrice : undefined;
	});
	const canSaveEdit = $derived(Boolean(editing) && !editReason && !editPriceNote?.problem);

	async function startEditing(item: BillItem) {
		const quantity = item.quantity ?? 1;
		const shown = formatAmount(item.price / quantity, currencyCode);
		editing = { id: item.id, name: item.name, quantity, priceText: shown, shownPriceText: shown };
		await tick();
		document.getElementById('edit-item-name')?.focus();
	}

	async function stopEditing(save: boolean) {
		if (!editing) return;
		const edit = editing;
		if (save) {
			if (!canSaveEdit) return;
			const index = items.findIndex((item) => item.id === edit.id);
			if (index >= 0) {
				const priceEach =
					edit.priceText === edit.shownPriceText
						? undefined
						: (amountOf(editPriceRead) ?? undefined);
				items[index] = changeItem($state.snapshot(items[index]), {
					name: edit.name,
					quantity: quantityOf(edit.quantity),
					priceEach
				});
			}
		}
		editing = undefined;
		await tick();
		document.getElementById(`edit-${edit.id}`)?.focus();
	}

	function removeItem(id: string) {
		items = items.filter((item) => item.id !== id);
	}

	function toggleTag(item: BillItem, personId: string) {
		item.assignedPersonIds = item.assignedPersonIds.includes(personId)
			? item.assignedPersonIds.filter((id) => id !== personId)
			: [...item.assignedPersonIds, personId];
	}

	const everyoneHasIt = (item: BillItem) =>
		people.length > 0 && people.every((person) => item.assignedPersonIds.includes(person.id));

	function toggleEveryone(item: BillItem) {
		item.assignedPersonIds = everyoneHasIt(item) ? [] : people.map((person) => person.id);
	}

	/* ─── Charges and adjustments ─── */

	function setTaxOnService(on: boolean) {
		taxOnService = on;
		taxOnServiceChosen = true;
	}

	function changeCurrency(code: string) {
		if (!taxOnServiceChosen) taxOnService = taxOnServiceByDefault(code);
		currencyCode = code;
	}

	// Prices that include tax nearly always include service too, and tax can't be charged on
	// service once it's in the price: ticking one sets the others, so the odd mix needs a choice.
	function setTaxIncluded(included: boolean) {
		taxIncluded = included;
		if (included) {
			serviceIncluded = true;
			taxOnService = false;
		}
	}

	const KIND_NAMES: Record<AdjustmentKind, string> = {
		discount: 'Discount',
		rounding: 'Rounding',
		other: 'Other'
	};
	let newAdjustmentKind: AdjustmentKind = $state('discount');
	let newAdjustmentName = $state('');
	let newAdjustmentText = $state('');
	const newAdjustmentRead = $derived(readTypedAmount(newAdjustmentText));
	const newAdjustmentAmount = $derived(amountOf(newAdjustmentRead));
	// A discount always takes off; rounding and other adjustments go whichever way the receipt says.
	let newAdjustmentAdds = $state(false);
	const newAdjustmentNote = $derived(
		amountNote(
			newAdjustmentRead,
			newAdjustmentKind === 'discount'
				? SPLIT_BILL.amounts.negativeDiscount
				: SPLIT_BILL.amounts.negativeAdjustment
		)
	);
	const canAddAdjustment = $derived(newAdjustmentAmount !== null && newAdjustmentAmount > 0);

	function addAdjustment() {
		if (!canAddAdjustment || newAdjustmentAmount === null) return;
		const adds = newAdjustmentKind !== 'discount' && newAdjustmentAdds;
		adjustments.push({
			id: newId(),
			kind: newAdjustmentKind,
			name: newAdjustmentName.trim() || KIND_NAMES[newAdjustmentKind],
			amount: adds ? newAdjustmentAmount : -newAdjustmentAmount
		});
		newAdjustmentName = '';
		newAdjustmentText = '';
		newAdjustmentAdds = false;
	}

	function removeAdjustment(id: string) {
		adjustments = adjustments.filter((adjustment) => adjustment.id !== id);
		choosing = choosing.filter((other) => other !== id);
	}

	// An adjustment is everyone's unless someone says otherwise. Which ones have their "who is it
	// for" open, though nobody's picked yet: once someone is, the tags themselves keep it open.
	let choosing: string[] = $state([]);

	function toggleAdjustmentTag(adjustment: BillAdjustment, personId: string) {
		const tagged = adjustment.assignedPersonIds ?? [];
		const next = tagged.includes(personId)
			? tagged.filter((id) => id !== personId)
			: [...tagged, personId];
		if (next.length) adjustment.assignedPersonIds = next;
		else delete adjustment.assignedPersonIds;
	}

	function shareWithEveryone(adjustment: BillAdjustment) {
		delete adjustment.assignedPersonIds;
		choosing = choosing.filter((id) => id !== adjustment.id);
	}

	/** "Voucher", or "Voucher, for Andi" when it's only some people's. */
	const adjustmentLabel = (adjustment: BillAdjustment) => {
		const names = (adjustment.assignedPersonIds ?? []).map(nameOf).filter(Boolean);
		return names.length ? `${adjustment.name}, for ${names.join(' and ')}` : adjustment.name;
	};

	const signed = (amount: number) => `${amount < 0 ? '−' : '+'}${money(Math.abs(amount))}`;
	const discountsOf = (state: BillState) =>
		(state.adjustments ?? []).filter((adjustment) => adjustment.kind === 'discount');
	const lateAdjustmentsOf = (state: BillState) =>
		(state.adjustments ?? []).filter((adjustment) => adjustment.kind !== 'discount');

	/* ─── Scanning a receipt ─── */

	// The text is read here, in the browser, by src/lib/receipt.ts. What it found waits in a
	// review list, every line editable, until the person adds it to the bill.
	interface ReviewLine {
		id: string;
		name: string;
		/** As typed: read with the bill's currency, like every amount field. */
		priceText: string;
		quantity: number;
		unsure: boolean;
	}
	const priceOf = (line: ReviewLine) => amountOf(readTypedAmount(line.priceText));
	interface ReviewAdjustment extends ScannedAdjustment {
		id: string;
	}
	let scanning = $state(false);
	let receiptText = $state('');
	// A photo the person picked, shown from an address inside the browser (blob:) so Live Text can
	// read it. It's never uploaded or kept, and the address is let go once it isn't shown.
	let photoUrl: string | undefined = $state();

	function showPhoto(file: File | undefined) {
		if (photoUrl) URL.revokeObjectURL(photoUrl);
		photoUrl = file ? URL.createObjectURL(file) : undefined;
	}
	let scanned: ScannedReceipt | undefined = $state();
	let reviewLines: ReviewLine[] = $state([]);
	let reviewAdjustments: ReviewAdjustment[] = $state([]);

	function readScan() {
		scanned = readReceipt(receiptText, currencyCode);
		reviewLines = scanned.items.map((item) => ({
			id: newId(),
			name: item.name,
			priceText: item.price === undefined ? '' : String(item.price),
			quantity: item.quantity,
			unsure: item.unsure
		}));
		reviewAdjustments = scanned.adjustments.map((adjustment) => ({ ...adjustment, id: newId() }));
	}

	function closeScan() {
		showPhoto(undefined);
		scanning = false;
		scanned = undefined;
		receiptText = '';
		reviewLines = [];
		reviewAdjustments = [];
	}

	// The receipt as it stands after the person's edits, to check against what it printed.
	const reviewed: ScannedReceipt | undefined = $derived(
		scanned && {
			...scanned,
			items: reviewLines.map((line) => ({
				name: line.name,
				quantity: line.quantity,
				price: priceOf(line) ?? 0,
				unsure: line.unsure
			})),
			adjustments: reviewAdjustments
		}
	);
	const coin = $derived(10 ** -decimalPlaces(currencyCode));
	/** Items and discounts minus the printed subtotal, as edited. */
	const reviewGap = $derived.by(() => {
		if (!reviewed || reviewed.subtotal === undefined) return undefined;
		const items = reviewed.items.reduce((sum, item) => sum + (item.price ?? 0), 0);
		const discounts = reviewed.adjustments
			.filter((adjustment) => adjustment.kind === 'discount')
			.reduce((sum, adjustment) => sum + adjustment.amount, 0);
		return items + discounts - reviewed.subtotal;
	});
	const reviewTotal = $derived(reviewed && receiptTotal(reviewed, currencyCode));
	const totalDiffers = $derived(
		reviewed?.total !== undefined &&
			reviewed.servicePercentage !== undefined &&
			reviewTotal !== undefined &&
			Math.abs(reviewTotal - reviewed.total) >= coin / 2
	);
	const pricesMissing = $derived(
		reviewLines.some((line) => {
			const price = priceOf(line);
			return price === null || !(price > 0);
		})
	);

	function addScan() {
		if (!scanned || pricesMissing) return;
		for (const line of reviewLines) {
			items.push({
				id: newId(),
				name: line.name.trim() || 'Item',
				price: priceOf(line) ?? 0,
				assignedPersonIds: [],
				...(line.quantity > 1 ? { quantity: Math.min(MAX_QUANTITY, line.quantity) } : {})
			});
		}
		for (const { kind, name, amount } of reviewAdjustments) {
			adjustments.push({ id: newId(), kind, name, amount });
		}
		// The receipt's own rates replace the settings, when it gave them.
		if (scanned.servicePercentage !== undefined && scanned.taxPercentage !== undefined) {
			serviceInput = scanned.servicePercentage;
			taxInput = scanned.taxPercentage;
			taxIncluded = false;
			serviceIncluded = false;
			taxOnService = scanned.taxOnService;
			taxOnServiceChosen = true;
		}
		closeScan();
	}

	/* ─── Sharing ─── */
	type Status =
		| { kind: 'opening' }
		| { kind: 'opened'; version?: Version }
		| { kind: 'gone' }
		| { kind: 'unreachable' }
		| { kind: 'copied' }
		| { kind: 'copied-updated' }
		| { kind: 'copied-new' }
		| { kind: 'copied-long' }
		| { kind: 'copy-failed' }
		| { kind: 'deleted' }
		| { kind: 'delete-failed' }
		| { kind: 'text-copied' }
		| { kind: 'text-copy-failed'; text: string }
		| { kind: 'share-failed' };
	let status: Status | undefined = $state();
	let sharing = $state(false);
	// The bill as it was last shared from here, so sharing it again unchanged reuses its link.
	let lastShared: { json: string; code: string } | undefined;
	// The shared copy this device can delete: the one the address points to, if it shared it.
	let deletable: Shared | undefined = $state();
	let confirmingDelete = $state(false);

	function open(state: BillState) {
		people = state.people;
		items = state.items;
		taxInput = state.taxPercentage;
		serviceInput = state.servicePercentage;
		currencyCode = state.currencyCode;
		taxIncluded = state.taxIncluded ?? false;
		serviceIncluded = state.serviceIncluded ?? false;
		taxOnService = state.taxOnService ?? false;
		// A bill that says something other than its currency's usual way has had it chosen.
		taxOnServiceChosen = taxOnService !== taxOnServiceByDefault(state.currencyCode);
		adjustments = state.adjustments ?? [];
		renaming = undefined;
		editing = undefined;
	}

	// A link opens the bill it holds, now or if the address changes later: a short link fetches
	// it, and a long one (the only kind before short links) carries it whole.
	// Once a short link is opening, the line that says so keeps its height after the bill arrives,
	// so the bill doesn't jump up the page as it fills in.
	let openedFromLink = $state(false);
	const opening = $derived(status?.kind === 'opening');

	// The bill is kept as a draft in this tab as it changes (src/lib/draft.ts), once the page knows
	// which bill it's showing: not while a link's bill is on its way, or after it failed to arrive,
	// until something's put on the bill.
	let settled = $state(false);
	const billIsEmpty = $derived(
		people.length === 0 && items.length === 0 && adjustments.length === 0
	);

	$effect(() => {
		if (settled || !billIsEmpty) saveDraft(bill, location.hash);
	});

	async function readLink() {
		const code = codeFromHash(location.hash);
		if (!code) {
			const shared = billFromHash(location.hash);
			if (shared) open(shared);
			settled = true;
			return;
		}
		settled = false;
		openedFromLink = true;
		status = { kind: 'opening' };
		const result = await openBill(code);
		if (codeFromHash(location.hash) !== code) return;
		if ('problem' in result) {
			status = { kind: result.problem === 'gone' ? 'gone' : 'unreachable' };
			return;
		}
		open(result.bill);
		lastShared = { json: JSON.stringify(bill), code };
		deletable = sharedHere(code);
		status = { kind: 'opened', version: result.version };
		settled = true;
	}

	/** A link in the address wins over the draft, unless the draft is that link's bill, changed. */
	function openPage() {
		const code = codeFromHash(location.hash);
		const hasLink = code !== undefined || billFromHash(location.hash) !== undefined;
		const draft = draftToOpen(loadDraft(), location.hash, hasLink);
		if (!draft) {
			void readLink();
			return;
		}
		open(draft);
		if (code) deletable = sharedHere(code);
		settled = true;
	}

	/** When a shared bill was shared or last changed, the way the reader writes dates: "9 Nov, 14:05". */
	const when = (time: number) =>
		new Intl.DateTimeFormat(undefined, {
			day: 'numeric',
			month: 'short',
			hour: '2-digit',
			minute: '2-digit'
		}).format(time);

	let canShare = $state(false);

	onMount(() => {
		canShare = typeof navigator.share === 'function';
		openPage();
		addEventListener('hashchange', readLink);
		return () => removeEventListener('hashchange', readLink);
	});

	/** The short link to the bill as it is, sharing it if it changed; the long one if that fails. */
	type Copied = 'copied' | 'copied-updated' | 'copied-new' | 'copied-long';

	/**
	 * The short link to the bill as it is, and what became of it. A bill shared from this device is
	 * changed in place, so the link people already have opens the latest version. Anyone else's,
	 * opened from their link, can't be: it's shared under a new code. The long link if both fail.
	 */
	async function linkToBill(): Promise<{ url: string; copied: Copied }> {
		const json = JSON.stringify(bill);
		let code: string | undefined;
		let copied: Copied = 'copied';
		if (lastShared?.json === json) {
			code = lastShared.code;
		} else {
			if (deletable) {
				const mine = deletable;
				const problem = await updateBill(mine, bill);
				if (!problem) {
					remember(mine);
					code = mine.code;
					copied = 'copied-updated';
				} else if (problem === 'not-yours') {
					forget(mine.code);
					deletable = undefined;
				}
			}
			if (!code) {
				// Changing a bill opened from a link that can't be changed from here: a new one.
				const replacing = codeFromHash(location.hash) !== undefined;
				const result = await shareBill(bill);
				if (!('problem' in result)) {
					remember(result);
					deletable = result;
					code = result.code;
					copied = replacing ? 'copied-new' : 'copied';
				}
			}
			if (code) lastShared = { json, code };
		}
		const hash = code ? `${SHORT_PREFIX}${code}` : billToHash(bill);
		if (!code) copied = 'copied-long';
		// The address bar now holds the link too, so copying it from there works as well.
		history.replaceState(null, '', hash);
		return { url: `${location.origin}${location.pathname}${hash}`, copied };
	}

	async function copyLink() {
		sharing = true;
		status = undefined;
		confirmingDelete = false;
		const link = linkToBill();
		try {
			// Safari only lets a page copy while it's handling the press, so the link is handed
			// over as a promise, before the server has answered. Browsers without that copy after.
			if (typeof ClipboardItem !== 'undefined' && 'write' in navigator.clipboard) {
				const text = link.then(({ url }) => new Blob([url], { type: 'text/plain' }));
				await navigator.clipboard.write([new ClipboardItem({ 'text/plain': text })]);
			} else {
				await navigator.clipboard.writeText((await link).url);
			}
			status = { kind: (await link).copied };
		} catch {
			await link;
			status = { kind: 'copy-failed' };
		}
		sharing = false;
	}

	/** The link to the bill as it is, if there already is one: the text doesn't make a new one. */
	function currentLink(): string | undefined {
		const json = JSON.stringify(bill);
		const base = `${location.origin}${location.pathname}`;
		if (lastShared?.json === json) return `${base}${SHORT_PREFIX}${lastShared.code}`;
		const inAddress = billFromHash(location.hash);
		return inAddress && JSON.stringify(inAddress) === json ? `${base}${location.hash}` : undefined;
	}

	async function copyText() {
		status = undefined;
		confirmingDelete = false;
		const text = billAsText(bill, currentLink());
		try {
			await navigator.clipboard.writeText(text);
			status = { kind: 'text-copied' };
		} catch {
			status = { kind: 'text-copy-failed', text };
		}
	}

	async function shareText() {
		status = undefined;
		confirmingDelete = false;
		try {
			await navigator.share({ text: billAsText(bill, currentLink()) });
		} catch (error) {
			// Closing the share sheet without picking anything isn't a failure.
			if (!(error instanceof DOMException && error.name === 'AbortError')) {
				status = { kind: 'share-failed' };
			}
		}
	}

	function showSplit() {
		const heading = document.getElementById('split-heading');
		heading?.focus({ preventScroll: true });
		heading?.scrollIntoView({ block: 'start' });
	}

	async function deleteShared() {
		if (!deletable) return;
		const shared = deletable;
		confirmingDelete = false;
		const problem = await deleteBill(shared);
		if (problem) {
			status = { kind: 'delete-failed' };
			return;
		}
		forget(shared.code);
		deletable = undefined;
		lastShared = undefined;
		if (codeFromHash(location.hash) === shared.code) {
			history.replaceState(null, '', location.pathname);
		}
		status = { kind: 'deleted' };
	}

	let confirmingClear = $state(false);

	function clearEverything() {
		people = [];
		items = [];
		taxInput = DEFAULT_TAX_PERCENTAGE;
		serviceInput = DEFAULT_SERVICE_PERCENTAGE;
		currencyCode = DEFAULT_CURRENCY_CODE;
		taxIncluded = false;
		serviceIncluded = false;
		taxOnService = taxOnServiceByDefault(DEFAULT_CURRENCY_CODE);
		taxOnServiceChosen = false;
		adjustments = [];
		choosing = [];
		renaming = undefined;
		editing = undefined;
		history.replaceState(null, '', location.pathname);
		confirmingClear = false;
		deletable = undefined;
		confirmingDelete = false;
		status = undefined;
		clearDraft();
		settled = true;
	}
</script>

<Seo
	title="{SPLIT_BILL.name} · Itrium"
	description={SPLIT_BILL.description}
	path={SPLIT_BILL.path}
	structuredData={{
		'@context': 'https://schema.org',
		'@type': 'WebApplication',
		name: SPLIT_BILL.name,
		description: SPLIT_BILL.description,
		url: `https://tools.itrium.id${SPLIT_BILL.path}`,
		applicationCategory: 'FinanceApplication',
		operatingSystem: 'Any',
		isAccessibleForFree: true,
		offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
		publisher: { '@type': 'Organization', name: 'Itrium', url: 'https://itrium.id' }
	}}
/>

<section class="mx-auto max-w-2xl px-5 pt-6 pb-20 sm:px-8">
	<p class="text-sm">
		<a href={resolve('/')} class="text-muted underline underline-offset-4 hover:text-text"
			>← All tools</a
		>
	</p>
	<h1 class="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{SPLIT_BILL.name}</h1>
	<p class="mt-3 text-muted">{SPLIT_BILL.introduction}</p>
	<div class="mt-4 {openedFromLink ? 'min-h-6' : 'empty:mt-0'}" role="status">
		{#if status?.kind === 'opening'}
			<p class="flex items-center gap-2">
				<svg
					class="size-5 shrink-0 motion-safe:animate-spin"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2.5"
					aria-hidden="true"
				>
					<circle cx="12" cy="12" r="9" class="opacity-25" />
					<path stroke-linecap="round" d="M21 12a9 9 0 0 0-9-9" />
				</svg>
				{SPLIT_BILL.sharing.opening}
			</p>
		{:else if status?.kind === 'opened'}
			<p class="text-sm text-muted">
				<span class="sr-only">{SPLIT_BILL.sharing.opened}</span>
				{#if status.version}{(status.version.updated
						? SPLIT_BILL.sharing.updatedAt
						: SPLIT_BILL.sharing.sharedAt)(when(status.version.updatedAt))}{/if}
			</p>
		{:else if status?.kind === 'gone'}
			<p>{SPLIT_BILL.sharing.gone}</p>
		{:else if status?.kind === 'unreachable'}
			<p>{SPLIT_BILL.sharing.unreachable}</p>
		{/if}
	</div>
	{#if status?.kind === 'gone' || status?.kind === 'unreachable'}
		<div class="mt-3 flex flex-wrap gap-3">
			{#if status.kind === 'unreachable'}
				<button type="button" onclick={readLink} class={smallButton}
					>{SPLIT_BILL.sharing.retry}</button
				>
			{/if}
			<button type="button" onclick={clearEverything} class={smallButton}
				>{SPLIT_BILL.sharing.startNew}</button
			>
		</div>
	{/if}

	<!-- While a shared bill opens, the empty one under it can't be changed: it's about to be replaced. -->
	<div
		class="mt-8 space-y-6 motion-safe:transition-opacity {opening ? 'opacity-50' : ''}"
		aria-busy={opening}
		inert={opening}
	>
		<!-- The bill: what's decided before any price is typed -->
		<section class={card} aria-labelledby="bill-heading">
			<h2 id="bill-heading" class={cardHeading}>The bill</h2>
			<label for="currency" class={label}>Currency</label>
			<SearchableSelect
				id="currency"
				choices={currencyChoices}
				value={currencyCode}
				onchange={changeCurrency}
				placeholder="Type a currency or a country"
			/>

			{#if !scanning}
				<button
					type="button"
					onclick={() => (scanning = true)}
					class="{secondaryButton} mt-4 w-full">{SPLIT_BILL.scanning.open}</button
				>
			{:else if !scanned}
				<form
					class="mt-5 border-t border-border pt-5"
					onsubmit={(event) => {
						event.preventDefault();
						readScan();
					}}
				>
					<label for="receipt-photo" class={label}>{SPLIT_BILL.scanning.photo}</label>
					<p id="receipt-photo-hint" class="mb-2 text-sm text-muted">
						{SPLIT_BILL.scanning.photoHint}
					</p>
					<input
						id="receipt-photo"
						type="file"
						accept="image/*"
						aria-describedby="receipt-photo-hint"
						onchange={(event) => showPhoto(event.currentTarget.files?.[0])}
						class="block w-full text-sm text-muted file:mr-3 file:min-h-9 file:cursor-pointer file:rounded-full file:border file:border-control-border file:bg-transparent file:px-4 file:text-sm file:font-medium file:text-text hover:file:bg-bg"
					/>
					{#if photoUrl}
						<img
							src={photoUrl}
							alt={SPLIT_BILL.scanning.photoAlt}
							class="mt-3 max-h-[70vh] w-full rounded-xl border border-border object-contain"
						/>
					{/if}

					<label for="receipt-text" class="{label} mt-5">{SPLIT_BILL.scanning.field}</label>
					<p id="receipt-hint" class="mb-2 text-sm text-muted">{SPLIT_BILL.scanning.hint}</p>
					<textarea
						id="receipt-text"
						rows="8"
						aria-describedby="receipt-hint"
						bind:value={receiptText}
						class={field}></textarea>
					<div class="mt-3 flex flex-wrap gap-3">
						<button type="submit" disabled={!receiptText.trim()} class={smallButton}
							>{SPLIT_BILL.scanning.read}</button
						>
						<button type="button" onclick={closeScan} class={smallButton}
							>{SPLIT_BILL.scanning.cancel}</button
						>
					</div>
				</form>
			{:else}
				<div class="mt-5 border-t border-border pt-5">
					<div class="flex flex-wrap items-center gap-x-1">
						<h3 class="text-base font-semibold">{SPLIT_BILL.scanning.review}</h3>
						<Toggletip label="About what to check" text={SPLIT_BILL.explanations.unsure} />
					</div>

					{#if reviewLines.length === 0}
						<p class="mt-2 text-sm">{SPLIT_BILL.scanning.nothing}</p>
					{:else}
						<ul class="mt-3 space-y-3">
							{#each reviewLines as line, index (line.id)}
								{@const lineNote = amountNote(
									readTypedAmount(line.priceText),
									SPLIT_BILL.amounts.negativePrice,
									false
								)}
								<li
									class="rounded-xl border bg-bg p-3 {line.unsure
										? 'border-accent-edge'
										: 'border-border'}"
								>
									{#if line.unsure}
										<p class="mb-2 flex items-center gap-1.5 text-sm font-medium">
											<svg
												class="size-4 shrink-0"
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
												stroke-width="2"
												aria-hidden="true"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
												/>
											</svg>
											{SPLIT_BILL.scanning.check}
										</p>
									{/if}
									<!-- On a phone the name takes a row of its own: next to the price, it's cut off. -->
									<div
										class="grid grid-cols-[1fr_auto] items-center gap-2 sm:grid-cols-[1fr_7.5rem_auto]"
									>
										<label for="review-name-{line.id}" class="sr-only">Item {index + 1}</label>
										<input
											id="review-name-{line.id}"
											type="text"
											autocomplete="off"
											bind:value={line.name}
											oninput={() => (line.unsure = false)}
											class="{field} col-span-2 sm:col-span-1"
										/>
										<label for="review-price-{line.id}" class="sr-only"
											>Price of item {index + 1}</label
										>
										<input
											id="review-price-{line.id}"
											type="text"
											inputmode={amountKeypad}
											autocomplete="off"
											bind:value={line.priceText}
											oninput={() => (line.unsure = false)}
											aria-describedby="review-price-note-{line.id}"
											aria-invalid={lineNote?.problem ? true : undefined}
											class={field}
										/>
										<button
											type="button"
											onclick={() =>
												(reviewLines = reviewLines.filter((other) => other.id !== line.id))}
											aria-label="Remove {line.name || `item ${index + 1}`}"
											class="inline-flex size-8 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-text pointer-coarse:size-11"
										>
											<svg
												class="size-4"
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
												stroke-width="2"
												aria-hidden="true"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													d="M6 18L18 6M6 6l12 12"
												/>
											</svg>
										</button>
									</div>
									<p
										id="review-price-note-{line.id}"
										role="status"
										class="mt-2 text-sm empty:mt-0 {lineNote?.problem
											? 'font-medium'
											: 'text-muted'}"
									>
										{#if lineNote}{lineNote.text}{/if}
									</p>
									{#if line.quantity > 1}
										<p class="mt-2 text-sm text-muted">
											{SPLIT_BILL.scanning.quantity(line.quantity)}
										</p>
									{/if}
								</li>
							{/each}
						</ul>
					{/if}

					{#if reviewAdjustments.length}
						<ul class="mt-3 divide-y divide-border rounded-xl border border-border bg-bg">
							{#each reviewAdjustments as adjustment (adjustment.id)}
								<li class="flex items-center justify-between gap-3 py-2 pr-2 pl-4 text-sm">
									<span class="min-w-0">
										<span class="font-medium break-words">{adjustment.name}</span>
										<span class="text-muted"> · {KIND_NAMES[adjustment.kind]}</span>
										{#if adjustment.unsure}
											<span class="mt-0.5 flex items-center gap-1.5 font-medium">
												<svg
													class="size-4 shrink-0"
													xmlns="http://www.w3.org/2000/svg"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
													stroke-width="2"
													aria-hidden="true"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
													/>
												</svg>
												{SPLIT_BILL.scanning.check}
											</span>
										{/if}
									</span>
									<span class="flex shrink-0 items-center gap-1">
										{signed(adjustment.amount)}
										<button
											type="button"
											onclick={() =>
												(reviewAdjustments = reviewAdjustments.filter(
													(other) => other.id !== adjustment.id
												))}
											aria-label="Remove {adjustment.name}"
											class="inline-flex size-8 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-text pointer-coarse:size-11"
										>
											<svg
												class="size-4"
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
												stroke-width="2"
												aria-hidden="true"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													d="M6 18L18 6M6 6l12 12"
												/>
											</svg>
										</button>
									</span>
								</li>
							{/each}
						</ul>
					{/if}

					<div class="mt-4 space-y-2 text-sm" role="status">
						{#if reviewLines.length && scanned.servicePercentage !== undefined && scanned.taxPercentage !== undefined}
							<p>
								{SPLIT_BILL.scanning.rates(
									scanned.servicePercentage,
									scanned.taxPercentage,
									scanned.taxOnService
								)}
							</p>
						{:else if reviewLines.length}
							<p>{SPLIT_BILL.scanning.noRates}</p>
						{/if}
						{#if reviewGap !== undefined && reviewLines.length}
							{#if Math.abs(reviewGap) < coin / 2}
								<p>
									<Check class="mr-1 align-[-0.125em]" />{SPLIT_BILL.scanning.matches}
								</p>
							{:else}
								<p class="rounded-lg border-l-4 border-accent-edge bg-bg p-3">
									{SPLIT_BILL.scanning.itemsOff(money(Math.abs(reviewGap)), reviewGap < 0)}
								</p>
							{/if}
						{/if}
						{#if totalDiffers && reviewed?.total !== undefined && reviewTotal !== undefined}
							<p class="rounded-lg border-l-4 border-accent-edge bg-bg p-3">
								{SPLIT_BILL.scanning.totalOff(money(reviewTotal), money(reviewed.total))}
							</p>
						{/if}
						{#if pricesMissing && reviewLines.length}
							<p>{SPLIT_BILL.scanning.missingPrice}</p>
						{/if}
					</div>

					<div class="mt-4 flex flex-wrap gap-3">
						<button
							type="button"
							onclick={addScan}
							disabled={pricesMissing || reviewLines.length === 0}
							class={primaryButton}>{SPLIT_BILL.scanning.add}</button
						>
						<button type="button" onclick={closeScan} class={secondaryButton}
							>{SPLIT_BILL.scanning.cancel}</button
						>
					</div>
				</div>
			{/if}
		</section>

		<!-- People -->
		<section class={card} aria-labelledby="people-heading">
			<h2 id="people-heading" class={cardHeading}>
				People {#if people.length}<span class="font-normal text-muted">({people.length})</span>{/if}
			</h2>
			<form
				class="flex items-end gap-2"
				onsubmit={(event) => {
					event.preventDefault();
					addPerson();
				}}
			>
				<div class="min-w-0 flex-1">
					<label for="person" class={label}>Name</label>
					<input id="person" type="text" autocomplete="off" bind:value={newPerson} class={field} />
				</div>
				<button
					type="submit"
					disabled={!newPerson.trim()}
					aria-describedby="add-person-reason"
					class={`${smallButton} ${besideField}`}>Add person</button
				>
			</form>
			<p id="add-person-reason" role="status" class="mt-2 text-sm text-muted empty:mt-0">
				{#if !newPerson.trim()}{SPLIT_BILL.missing.personName}{/if}
			</p>

			{#if people.length}
				<ul class="mt-4 flex flex-wrap gap-2">
					{#each people as person (person.id)}
						{#if renaming?.id === person.id}
							<li class="basis-full">
								<form
									class="flex flex-wrap items-center gap-2"
									onsubmit={(event) => {
										event.preventDefault();
										void stopRenaming(true);
									}}
								>
									<label for="rename-person" class="sr-only">New name for {person.name}</label>
									<input
										id="rename-person"
										type="text"
										autocomplete="off"
										bind:value={renaming.name}
										onkeydown={(event) => event.key === 'Escape' && stopRenaming(false)}
										aria-describedby="rename-person-reason"
										class="{field} min-w-0 flex-1 basis-40"
									/>
									<button type="submit" disabled={!renaming.name.trim()} class={smallButton}
										>Save</button
									>
									<button type="button" onclick={() => stopRenaming(false)} class={smallButton}
										>Cancel</button
									>
								</form>
								<p
									id="rename-person-reason"
									role="status"
									class="mt-2 text-sm text-muted empty:mt-0"
								>
									{#if !renaming.name.trim()}{SPLIT_BILL.missing.personName}{/if}
								</p>
							</li>
						{:else}
							<li
								class="flex items-center rounded-full border border-control-border py-1 pr-1 pl-1 text-sm pointer-coarse:py-0"
							>
								<button
									id="rename-{person.id}"
									type="button"
									onclick={() => startRenaming(person)}
									aria-label="Rename {person.name}"
									class="inline-flex min-h-7 items-center gap-1.5 rounded-full pr-1.5 pl-2 hover:bg-bg pointer-coarse:min-h-11"
								>
									{person.name}
									<svg
										class="size-3.5 shrink-0 text-muted"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										stroke-width="2"
										aria-hidden="true"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M16.9 3.6a2 2 0 0 1 2.9 2.9L8 18.3 4 19.5l1.2-4z"
										/>
									</svg>
								</button>
								<button
									type="button"
									onclick={() => removePerson(person.id)}
									aria-label="Remove {person.name}"
									class="inline-flex size-7 items-center justify-center rounded-full text-muted hover:bg-bg hover:text-text pointer-coarse:size-11"
								>
									<svg
										class="size-3.5"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										stroke-width="2"
										aria-hidden="true"
									>
										<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							</li>
						{/if}
					{/each}
				</ul>
			{:else}
				<p class="mt-4 text-sm text-muted">Nobody yet. Add the people splitting this bill.</p>
			{/if}
		</section>

		<!-- Items -->
		<section class={card} aria-labelledby="items-heading">
			<h2 id="items-heading" class={cardHeading}>
				Items {#if items.length}<span class="font-normal text-muted">({items.length})</span>{/if}
			</h2>
			<form
				class="grid grid-cols-[6rem_1fr] gap-3 sm:grid-cols-[1fr_6rem_9rem_auto] sm:items-end"
				onsubmit={(event) => {
					event.preventDefault();
					addItem();
				}}
			>
				<div class="col-span-2 sm:col-span-1">
					<label for="item" class={label}>Item</label>
					<input id="item" type="text" autocomplete="off" bind:value={newItem} class={field} />
				</div>
				<div>
					<label for="quantity" class={label}>Quantity</label>
					<input
						id="quantity"
						type="number"
						inputmode="numeric"
						min="1"
						max={MAX_QUANTITY}
						step="1"
						bind:value={newQuantity}
						class={field}
					/>
				</div>
				<div>
					<!-- People know a menu's price for one, so with several it asks for that. -->
					<label for="price" class={label}
						>{quantityOf(newQuantity) > 1 ? 'Price each' : 'Price'}</label
					>
					<input
						id="price"
						type="text"
						inputmode={amountKeypad}
						autocomplete="off"
						bind:value={newPriceText}
						aria-describedby="price-note"
						aria-invalid={newPriceNote?.problem ? true : undefined}
						class={field}
					/>
				</div>
				<button
					type="submit"
					disabled={!canAddItem}
					aria-describedby="add-item-reason price-note"
					class="{smallButton} {besideField} col-span-2 sm:col-span-1">Add item</button
				>
			</form>
			<p
				id="price-note"
				role="status"
				class="mt-2 text-sm empty:mt-0 {newPriceNote?.problem ? 'font-medium' : 'text-muted'}"
			>
				{#if newPriceNote}{newPriceNote.text}{/if}
			</p>
			<p id="add-item-reason" role="status" class="mt-2 text-sm text-muted empty:mt-0">
				{#if addItemReason}{addItemReason}{/if}
			</p>

			{#if items.length}
				<ul class="mt-5 space-y-3">
					{#each items as item (item.id)}
						<li class="rounded-xl border border-border bg-bg p-4">
							{#if editing?.id === item.id}
								<form
									class="grid grid-cols-[6rem_1fr] gap-3"
									aria-label="Change {item.name}"
									onsubmit={(event) => {
										event.preventDefault();
										void stopEditing(true);
									}}
								>
									<div class="col-span-2">
										<label for="edit-item-name" class={label}>Item</label>
										<input
											id="edit-item-name"
											type="text"
											autocomplete="off"
											bind:value={editing.name}
											onkeydown={(event) => event.key === 'Escape' && stopEditing(false)}
											class={field}
										/>
									</div>
									<div>
										<label for="edit-item-quantity" class={label}>Quantity</label>
										<input
											id="edit-item-quantity"
											type="number"
											inputmode="numeric"
											min="1"
											max={MAX_QUANTITY}
											step="1"
											bind:value={editing.quantity}
											onkeydown={(event) => event.key === 'Escape' && stopEditing(false)}
											class={field}
										/>
									</div>
									<div>
										<label for="edit-item-price" class={label}
											>{quantityOf(editing.quantity) > 1 ? 'Price each' : 'Price'}</label
										>
										<input
											id="edit-item-price"
											type="text"
											inputmode={amountKeypad}
											autocomplete="off"
											bind:value={editing.priceText}
											onkeydown={(event) => event.key === 'Escape' && stopEditing(false)}
											aria-describedby="edit-item-price-note"
											aria-invalid={editPriceNote?.problem ? true : undefined}
											class={field}
										/>
									</div>
									<div class="col-span-2">
										<p
											id="edit-item-price-note"
											role="status"
											class="text-sm empty:hidden {editPriceNote?.problem
												? 'font-medium'
												: 'text-muted'}"
										>
											{#if editPriceNote}{editPriceNote.text}{/if}
										</p>
										<p
											id="edit-item-reason"
											role="status"
											class="mt-1 text-sm text-muted empty:hidden"
										>
											{#if editReason}{editReason}{/if}
										</p>
									</div>
									<div class="col-span-2 flex flex-wrap gap-3">
										<button
											type="submit"
											disabled={!canSaveEdit}
											aria-describedby="edit-item-reason edit-item-price-note"
											class={smallButton}>Save</button
										>
										<button type="button" onclick={() => stopEditing(false)} class={smallButton}
											>Cancel</button
										>
									</div>
								</form>
							{:else}
								<div class="flex items-start justify-between gap-3">
									<div class="min-w-0">
										<p class="font-medium break-words">{nameWithQuantity(item)}</p>
										<p class="text-sm text-muted">
											{money(item.price)}{(item.quantity ?? 1) > 1
												? ` · ${money(item.price / (item.quantity ?? 1))} each`
												: ''}
										</p>
									</div>
									<div class="flex shrink-0">
										<button
											id="edit-{item.id}"
											type="button"
											onclick={() => startEditing(item)}
											aria-label="Change {item.name}"
											class="inline-flex size-8 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-text pointer-coarse:size-11"
										>
											<svg
												class="size-4"
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
												stroke-width="2"
												aria-hidden="true"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													d="M16.9 3.6a2 2 0 0 1 2.9 2.9L8 18.3 4 19.5l1.2-4z"
												/>
											</svg>
										</button>
										<button
											type="button"
											onclick={() => removeItem(item.id)}
											aria-label="Remove {item.name}"
											class="inline-flex size-8 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-text pointer-coarse:size-11"
										>
											<svg
												class="size-4"
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
												stroke-width="2"
												aria-hidden="true"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													d="M6 18L18 6M6 6l12 12"
												/>
											</svg>
										</button>
									</div>
								</div>
							{/if}

							{#if people.length && item.counts}
								{@const quantity = item.quantity ?? 1}
								{@const counted = countedOf(item)}
								<fieldset class="mt-3">
									<legend class="mb-2 text-sm text-muted">How many each had</legend>
									<div class="flex flex-wrap gap-2">
										{#each people as person (person.id)}
											{@const count = item.counts[person.id] ?? 0}
											{#if count > 0}
												<span
													role="group"
													aria-label={person.name}
													class="inline-flex min-h-9 items-center gap-0.5 rounded-full border border-accent-edge bg-accent py-0.5 pr-0.5 pl-3.5 text-sm font-medium text-on-accent pointer-coarse:py-0"
												>
													{person.name}
													<button
														type="button"
														onclick={() => changeCount(item, person.id, -1)}
														aria-label="One fewer for {person.name}"
														class="ml-1.5 inline-flex size-8 items-center justify-center rounded-full text-base hover:bg-on-accent/10 pointer-coarse:size-11"
														>−</button
													>
													<span class="min-w-5 text-center tabular-nums">{count}</span>
													<button
														type="button"
														onclick={() => changeCount(item, person.id, 1)}
														aria-label="One more for {person.name}"
														class="inline-flex size-8 items-center justify-center rounded-full text-base hover:bg-on-accent/10 pointer-coarse:size-11"
														>+</button
													>
												</span>
											{:else}
												<button
													type="button"
													onclick={() => changeCount(item, person.id, 1)}
													class="min-h-9 rounded-full border border-control-border px-3.5 text-sm transition-colors hover:bg-surface pointer-coarse:min-h-11"
													>{person.name}</button
												>
											{/if}
										{/each}
									</div>
									<p class="mt-2 text-sm" role="status">
										{counted} of {quantity} counted{#if counted < quantity}: {quantity - counted} not
											in anyone's share yet.{:else if counted > quantity}, more than there were:
											each share is made smaller to fit.{:else}.{/if}
									</p>
									<button
										type="button"
										onclick={() => stopCounting(item)}
										class="mt-1 min-h-9 text-sm text-muted underline underline-offset-4 hover:text-text"
										>Share evenly instead</button
									>
								</fieldset>
							{:else if people.length}
								<fieldset class="mt-3">
									<legend class="mb-2 text-sm text-muted">Who had this?</legend>
									<div class="flex flex-wrap gap-2">
										{#each people as person (person.id)}
											{@const had = item.assignedPersonIds.includes(person.id)}
											<button
												type="button"
												aria-pressed={had}
												onclick={() => toggleTag(item, person.id)}
												class="min-h-9 rounded-full border px-3.5 text-sm transition-colors pointer-coarse:min-h-11 {had
													? 'border-accent-edge bg-accent font-medium text-on-accent'
													: 'border-control-border hover:bg-surface'}"
											>
												{#if had}<Check class="mr-1 align-[-0.125em]" />{/if}{person.name}
											</button>
										{/each}
										<button
											type="button"
											onclick={() => toggleEveryone(item)}
											class="min-h-9 rounded-full px-3 text-sm text-muted underline underline-offset-4 hover:text-text pointer-coarse:min-h-11"
										>
											{everyoneHasIt(item) ? 'Nobody' : 'Everyone'}
										</button>
									</div>
									{#if (item.quantity ?? 1) > 1}
										<div class="mt-1 flex flex-wrap items-center gap-x-1">
											<button
												type="button"
												onclick={() => startCounting(item)}
												class="min-h-9 text-sm text-muted underline underline-offset-4 hover:text-text"
												>Count who had how many</button
											>
											<Toggletip
												label="About counting who had how many"
												text={SPLIT_BILL.explanations.counting}
											/>
										</div>
									{/if}
								</fieldset>
							{:else}
								<p class="mt-3 text-sm text-muted">Add people first, then tag who had this.</p>
							{/if}
						</li>
					{/each}
				</ul>
			{:else}
				<p class="mt-5 text-sm text-muted">No items yet. Add the items from the bill.</p>
			{/if}
		</section>

		<!-- Charges and adjustments, in the order a receipt prints them: after the items -->
		<section class={card} aria-labelledby="charges-heading">
			<h2 id="charges-heading" class={cardHeading}>Charges and adjustments</h2>
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label for="tax" class={label}>Tax (%)</label>
					<input
						id="tax"
						type="number"
						inputmode="decimal"
						min="0"
						max="100"
						step="0.5"
						bind:value={taxInput}
						class={field}
					/>
				</div>
				<div>
					<label for="service" class={label}>Service (%)</label>
					<input
						id="service"
						type="number"
						inputmode="decimal"
						min="0"
						max="100"
						step="0.5"
						bind:value={serviceInput}
						class={field}
					/>
				</div>
			</div>

			<div class="mt-4 space-y-1">
				<div class="flex flex-wrap items-center gap-x-1">
					<label class={checkRow}>
						<input
							type="checkbox"
							checked={taxIncluded}
							onchange={(event) => setTaxIncluded(event.currentTarget.checked)}
							class={checkbox}
						/>
						Prices include tax
					</label>
					<Toggletip
						label="About prices that include tax"
						text={SPLIT_BILL.explanations.taxIncluded}
					/>
				</div>
				<div class="flex flex-wrap items-center gap-x-1">
					<label class={checkRow}>
						<input type="checkbox" bind:checked={serviceIncluded} class={checkbox} />
						Prices include service
					</label>
				</div>
				<div class="flex flex-wrap items-center gap-x-1">
					<label class="{checkRow} {taxIncluded ? 'text-muted' : ''}">
						<input
							type="checkbox"
							checked={taxOnService && !taxIncluded}
							disabled={taxIncluded}
							onchange={(event) => setTaxOnService(event.currentTarget.checked)}
							class={checkbox}
						/>
						Tax is charged on service too
					</label>
					<Toggletip label="About tax on service" text={SPLIT_BILL.explanations.taxOnService} />
				</div>
			</div>

			<div class="mt-6 border-t border-border pt-5">
				<div class="flex flex-wrap items-center gap-x-1">
					<h3 class="text-base font-semibold">Adjustments</h3>
					<Toggletip label="About adjustments" text={SPLIT_BILL.explanations.adjustments} />
				</div>

				{#if adjustments.length}
					<ul class="mt-3 divide-y divide-border rounded-xl border border-border bg-bg">
						{#each adjustments as adjustment (adjustment.id)}
							{@const forSome =
								(adjustment.assignedPersonIds?.length ?? 0) > 0 || choosing.includes(adjustment.id)}
							<li class="py-2 pr-2 pl-4 text-sm">
								<div class="flex items-center justify-between gap-3">
									<span class="min-w-0">
										<span class="font-medium break-words">{adjustment.name}</span>
										<span class="text-muted"> · {KIND_NAMES[adjustment.kind]}</span>
									</span>
									<span class="flex shrink-0 items-center gap-1">
										{signed(adjustment.amount)}
										<button
											type="button"
											onclick={() => removeAdjustment(adjustment.id)}
											aria-label="Remove {adjustment.name}"
											class="inline-flex size-8 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-text pointer-coarse:size-11"
										>
											<svg
												class="size-4"
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
												stroke-width="2"
												aria-hidden="true"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													d="M6 18L18 6M6 6l12 12"
												/>
											</svg>
										</button>
									</span>
								</div>
								{#if people.length && forSome}
									<fieldset class="mt-2 mb-1">
										<legend class="mb-2 text-muted">Who is it for?</legend>
										<div class="flex flex-wrap gap-2">
											{#each people as person (person.id)}
												{@const isFor = adjustment.assignedPersonIds?.includes(person.id) ?? false}
												<button
													type="button"
													aria-pressed={isFor}
													onclick={() => toggleAdjustmentTag(adjustment, person.id)}
													class="min-h-9 rounded-full border px-3.5 transition-colors pointer-coarse:min-h-11 {isFor
														? 'border-accent-edge bg-accent font-medium text-on-accent'
														: 'border-control-border hover:bg-surface'}"
												>
													{#if isFor}<Check class="mr-1 align-[-0.125em]" />{/if}{person.name}
												</button>
											{/each}
										</div>
										{#if !adjustment.assignedPersonIds?.length}
											<p class="mt-2 text-muted">Until you pick someone, it's everyone's.</p>
										{/if}
										<button
											type="button"
											onclick={() => shareWithEveryone(adjustment)}
											class="mt-1 min-h-9 text-muted underline underline-offset-4 hover:text-text"
											>Share with everyone again</button
										>
									</fieldset>
								{:else if people.length}
									<button
										type="button"
										onclick={() => (choosing = [...choosing, adjustment.id])}
										class="min-h-9 text-muted underline underline-offset-4 hover:text-text"
										>Just for some people</button
									>
								{/if}
							</li>
						{/each}
					</ul>
				{:else}
					<p class="mt-2 text-sm text-muted">
						None. Add a discount or rounding if the receipt has one.
					</p>
				{/if}

				<!-- Radio buttons, not a <select>: WebKit's own styling for a select breaks this site's
				     style-src policy, and three choices are quicker to tap than a menu anyway. -->
				<form
					class="mt-4 space-y-3"
					onsubmit={(event) => {
						event.preventDefault();
						addAdjustment();
					}}
				>
					<fieldset>
						<legend class={label}>Type</legend>
						<div class="flex flex-wrap gap-x-5">
							{#each ADJUSTMENT_KINDS as kind (kind)}
								<label class={checkRow}>
									<input
										type="radio"
										name="adjustment-kind"
										value={kind}
										bind:group={newAdjustmentKind}
										class={checkbox}
									/>
									{KIND_NAMES[kind]}
								</label>
							{/each}
						</div>
					</fieldset>
					<div>
						<div class="grid gap-3 sm:grid-cols-[1fr_9rem]">
							<div>
								<label for="adjustment-name" class={label}>Name on the receipt</label>
								<input
									id="adjustment-name"
									type="text"
									autocomplete="off"
									placeholder={KIND_NAMES[newAdjustmentKind]}
									bind:value={newAdjustmentName}
									class={field}
								/>
							</div>
							<div>
								<label for="adjustment-amount" class={label}>Amount</label>
								<input
									id="adjustment-amount"
									type="text"
									inputmode={amountKeypad}
									autocomplete="off"
									bind:value={newAdjustmentText}
									aria-describedby="adjustment-amount-note"
									aria-invalid={newAdjustmentNote?.problem ? true : undefined}
									class={field}
								/>
							</div>
						</div>
						<p
							id="adjustment-amount-note"
							role="status"
							class="mt-2 text-sm empty:mt-0 {newAdjustmentNote?.problem
								? 'font-medium'
								: 'text-muted'}"
						>
							{#if newAdjustmentNote}{newAdjustmentNote.text}{/if}
						</p>
					</div>
					<div class="flex flex-wrap items-center justify-between gap-3">
						{#if newAdjustmentKind === 'discount'}
							<p class="text-sm text-muted">Comes off the bill.</p>
						{:else}
							<fieldset class="flex flex-wrap items-center gap-x-5">
								<legend class="sr-only">Does it take off or add?</legend>
								<label class={checkRow}>
									<input
										type="radio"
										name="adjustment-direction"
										checked={!newAdjustmentAdds}
										onchange={() => (newAdjustmentAdds = false)}
										class={checkbox}
									/>
									Takes off
								</label>
								<label class={checkRow}>
									<input
										type="radio"
										name="adjustment-direction"
										checked={newAdjustmentAdds}
										onchange={() => (newAdjustmentAdds = true)}
										class={checkbox}
									/>
									Adds
								</label>
							</fieldset>
						{/if}
						<button type="submit" disabled={!canAddAdjustment} class="{smallButton} {besideField}"
							>Add adjustment</button
						>
					</div>
				</form>
			</div>
		</section>

		<!-- The split -->
		{#if items.length}
			<section class={card} aria-labelledby="split-heading">
				<h2 id="split-heading" tabindex="-1" class={cardHeading}>The split</h2>

				<dl class="space-y-2 rounded-xl border border-border bg-bg p-4 text-sm">
					<div class="flex justify-between gap-4">
						<dt>Subtotal</dt>
						<dd>{money(totals.subtotal)}</dd>
					</div>
					{#each discountsOf(bill) as adjustment (adjustment.id)}
						<div class="flex justify-between gap-4 text-muted">
							<dt class="break-words">{adjustmentLabel(adjustment)}</dt>
							<dd class="shrink-0">{signed(adjustment.amount)}</dd>
						</div>
					{/each}
					{#if bill.servicePercentage > 0}
						<div class="flex justify-between gap-4 text-muted">
							<dt>Service ({bill.servicePercentage}%)</dt>
							<dd>{bill.serviceIncluded ? 'included' : money(totals.service)}</dd>
						</div>
					{/if}
					{#if bill.taxPercentage > 0}
						<div class="flex justify-between gap-4 text-muted">
							<dt>Tax ({bill.taxPercentage}%{bill.taxOnService ? ', on service too' : ''})</dt>
							<dd>{bill.taxIncluded ? 'included' : money(totals.tax)}</dd>
						</div>
					{/if}
					{#each lateAdjustmentsOf(bill) as adjustment (adjustment.id)}
						<div class="flex justify-between gap-4 text-muted">
							<dt class="break-words">{adjustmentLabel(adjustment)}</dt>
							<dd class="shrink-0">{signed(adjustment.amount)}</dd>
						</div>
					{/each}
					<div
						class="flex justify-between gap-4 border-t border-border pt-2 text-base font-semibold"
					>
						<dt>Total</dt>
						<dd>{money(totals.grandTotal)}</dd>
					</div>
				</dl>

				{#if totals.unassigned > 0}
					<p class="mt-4 rounded-lg border-l-4 border-accent-edge bg-bg p-3 text-sm">
						<strong>Not in anyone's share:</strong> items worth {money(totals.unassigned)} aren't tagged
						or counted for anyone, so they're left out of the split below.
						{#if totals.unshared !== totals.unassigned}{SPLIT_BILL.unsharedOfTotal(
								money(totals.unshared)
							)}{/if}
					</p>
				{/if}

				{#if people.length}
					<table class="mt-5 w-full text-left text-sm">
						<caption class="mb-2 text-left text-sm font-semibold">What each person owes</caption>
						<thead class="sr-only"
							><tr><th scope="col">Person</th><th scope="col">Owes</th></tr></thead
						>
						<tbody class="divide-y divide-border">
							{#each totals.shares as share (share.personId)}
								<tr>
									<th scope="row" class="py-3 pr-4 font-medium break-words"
										>{nameOf(share.personId)}</th
									>
									<td class="py-3 text-right">
										<span class="font-semibold">{money(share.total)}</span>
										{#if share.base !== share.total}
											<span class="block text-xs text-muted">
												{money(share.base)} before charges and adjustments
											</span>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{/if}
			</section>
		{/if}

		<!-- Share and clear -->
		{#if items.length || people.length}
			<div>
				<div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
					<button
						type="button"
						onclick={copyLink}
						disabled={sharing}
						class="{primaryButton} sm:flex-[2_1_auto]">Copy a link to this bill</button
					>
					{#if items.length && people.length}
						<button type="button" onclick={copyText} class="{secondaryButton} sm:flex-1"
							>Copy as text</button
						>
						{#if canShare}
							<button type="button" onclick={shareText} class="{secondaryButton} sm:flex-1"
								>Share</button
							>
						{/if}
					{/if}
				</div>
				<p class="mt-3 min-h-5 text-sm" role="status">
					{#if status?.kind === 'copied'}{SPLIT_BILL.sharing
							.copied}{:else if status?.kind === 'copied-updated'}{SPLIT_BILL.sharing
							.copiedUpdated}{:else if status?.kind === 'copied-new'}{SPLIT_BILL.sharing
							.copiedNew}{:else if status?.kind === 'copied-long'}{SPLIT_BILL.sharing
							.copiedLong}{:else if status?.kind === 'copy-failed'}{SPLIT_BILL.sharing
							.copyFailed}{:else if status?.kind === 'deleted'}{SPLIT_BILL.sharing
							.deleted}{:else if status?.kind === 'delete-failed'}{SPLIT_BILL.sharing
							.deleteFailed}{:else if status?.kind === 'text-copied'}{SPLIT_BILL.sharing
							.textCopied}{:else if status?.kind === 'text-copy-failed'}{SPLIT_BILL.sharing
							.textCopyFailed}{:else if status?.kind === 'share-failed'}{SPLIT_BILL.sharing
							.shareFailed}{/if}
				</p>
				{#if status?.kind === 'text-copy-failed'}
					<label for="split-text" class="sr-only">The split as text</label>
					<textarea
						id="split-text"
						readonly
						rows={status.text.split('\n').length}
						value={status.text}
						class="{field} mt-2"></textarea>
				{/if}
				{#if deletable}
					{#if confirmingDelete}
						<div class="mt-2 flex flex-wrap items-center gap-2" role="group" aria-label="Delete">
							<span class="text-sm">{SPLIT_BILL.sharing.deleteQuestion}</span>
							<button type="button" onclick={deleteShared} class={smallButton}>Yes, delete</button>
							<button type="button" onclick={() => (confirmingDelete = false)} class={smallButton}
								>Keep it</button
							>
						</div>
					{:else}
						<button
							type="button"
							onclick={() => (confirmingDelete = true)}
							class="mt-2 min-h-9 text-sm text-muted underline underline-offset-4 hover:text-text"
							>Delete the shared copy</button
						>
					{/if}
				{/if}
				<div class="mt-4">
					{#if confirmingClear}
						<div
							class="flex flex-wrap items-center gap-2"
							role="group"
							aria-label="Clear everything?"
						>
							<span class="text-sm">Clear everything?</span>
							<button type="button" onclick={clearEverything} class={smallButton}>Yes, clear</button
							>
							<button type="button" onclick={() => (confirmingClear = false)} class={smallButton}
								>Keep it</button
							>
						</div>
					{:else}
						<button
							type="button"
							onclick={() => (confirmingClear = true)}
							class="{secondaryButton} w-full sm:w-auto">Clear everything</button
						>
					{/if}
				</div>
				<p class="mt-3 text-sm text-muted">{SPLIT_BILL.privacy}</p>
			</div>
		{/if}

		<!-- On a phone the split is far below the tagging: the total and what isn't in anyone's share
		     stay at the bottom while the bill is made. It's sticky, not fixed, so it takes its own
		     space at the end of the page and never sits over the last of it. -->
		{#if items.length}
			<section
				aria-label="The bill so far"
				data-running-total
				class="sticky bottom-0 z-10 -mx-5 border-t border-border bg-surface px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:hidden"
			>
				<div class="flex items-center justify-between gap-3">
					<dl class="min-w-0 text-sm">
						<div class="flex flex-wrap gap-x-1.5">
							<dt>Total</dt>
							<dd class="font-semibold">{money(totals.grandTotal)}</dd>
						</div>
						<div class="flex flex-wrap gap-x-1.5 {totals.unshared > 0 ? '' : 'text-muted'}">
							<dt>Not in anyone's share yet</dt>
							<dd class={totals.unshared > 0 ? 'font-semibold' : ''}>{money(totals.unshared)}</dd>
						</div>
					</dl>
					<button
						type="button"
						onclick={showSplit}
						class="{smallButton} shrink-0 pointer-coarse:min-h-11">See the split</button
					>
				</div>
			</section>
		{/if}
	</div>
</section>
