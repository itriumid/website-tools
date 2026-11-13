<script lang="ts">
	import { onMount, tick } from 'svelte';
	import SearchableSelect, { type Choice } from '#lib/SearchableSelect.svelte';
	import Arrow from '#lib/Arrow.svelte';
	import Caution from '#lib/Caution.svelte';
	import Check from '#lib/Check.svelte';
	import Step from '#lib/Step.svelte';
	import Seo from '#lib/Seo.svelte';
	import TitleBand from '#lib/TitleBand.svelte';
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
		firstUnsharedItem,
		partlyNobodys,
		formatMoney,
		missingForItem,
		parseAmount,
		roundingSteps,
		settleBill,
		whatEachHad,
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
		isBrokenLink,
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
	// Whether "More on the receipt" is open: it opens itself when the bill has anything in it.
	let moreOpen = $state(false);
	// Who paid, and the step each share rounds up to: both optional, as in a link.
	let paidBy: string | undefined = $state();
	let roundTo: number | undefined = $state();

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
		if (paidBy && people.some((person) => person.id === paidBy)) state.paidBy = paidBy;
		if (roundTo) state.roundTo = roundTo;
		return state;
	});
	const totals = $derived(calculateBill(bill));
	const settledUp = $derived(settleBill(bill, totals));
	const steps = $derived(roundingSteps(currencyCode));
	const money = (amount: number) => formatMoney(amount, currencyCode);
	const nameOf = (id: string) => people.find((person) => person.id === id)?.name ?? '';
	$effect(() => {
		// Tax on service only says something when there's service to charge it on, and it isn't the
		// currency's usual way: a receipt read with neither has nothing behind this to show.
		const unusualTaxOnService =
			percentage(serviceInput) > 0 && taxOnService !== taxOnServiceByDefault(currencyCode);
		if (taxIncluded || serviceIncluded || unusualTaxOnService || adjustments.length)
			moreOpen = true;
	});
	const anyTagged = $derived(
		items.some(
			(item) =>
				item.assignedPersonIds.length > 0 ||
				Object.values(item.counts ?? {}).some((count) => count > 0)
		)
	);
	const payerName = $derived(bill.paidBy ? nameOf(bill.paidBy) : undefined);
	// What's in each share, item by item, for the split's rows to open to.
	const had = $derived(whatEachHad(bill));

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

	/**
	 * Where focus goes once a change has drawn: the control that took the press is often gone (the
	 * form it was in closed, the row it was on removed), and focus left on nothing falls back to
	 * the top of the page, for a keyboard or a screen reader in the middle of the bill.
	 */
	async function focusAfter(id: string, scroll = false) {
		await tick();
		const element = document.getElementById(id);
		element?.focus({ preventScroll: !scroll });
		if (scroll) element?.scrollIntoView({ block: 'center' });
	}

	/* ─── People ─── */
	let newPerson = $state('');

	// Not a secret and not for security: just a name for a row that doesn't change when others do.
	const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

	// Why "Add person" or "Add item" can't be pressed yet is said when someone presses or reaches
	// it, not under the empty form all the time: at rest it was noise, and as a live region it was
	// read out again after every add, like an error right after a success.
	let explainPerson = $state(false);
	/** Looks like a disabled button but can still be pressed or reached, to say why it can't add. */
	const unavailable = 'aria-disabled:cursor-not-allowed aria-disabled:opacity-50';
	let explainItem = $state(false);

	function addPerson() {
		const name = newPerson.trim();
		if (!name) {
			explainPerson = true;
			return;
		}
		people.push({ id: newId(), name });
		newPerson = '';
		explainPerson = false;
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

	/* ─── Undoing a removal ─── */
	// Removing someone or something is one tap, so it can be undone: the bill as it was is kept
	// until the bill changes some other way. There's no countdown: an undo that races the person
	// is no undo for someone slower.
	interface Removal {
		/** Which card says so: the one the removal was made from. */
		from: 'people' | 'items';
		/** The person's or item's, so focus can go back to it when it's brought back. */
		id: string;
		name: string;
		/** For a person: how many items they shared with others, now split among fewer. */
		shared?: number;
		/** For a person: what only they had, now in nobody's share. */
		alone?: number;
		before: Pick<BillState, 'people' | 'items'> & {
			adjustments: BillAdjustment[];
			paidBy?: string;
		};
		/** The bill right after the removal: any other change makes the undo stale. */
		after: string;
	}
	let removal: Removal | undefined = $state();

	function undoable(from: Removal['from'], id: string, name: string, change: () => void) {
		const before = {
			people: $state.snapshot(people),
			items: $state.snapshot(items),
			adjustments: $state.snapshot(adjustments),
			paidBy
		};
		change();
		removal = { from, id, name, before, after: JSON.stringify(bill) };
		void focusAfter(`undo-${from}`);
	}

	function undoRemoval() {
		if (!removal) return;
		// An item brought back opens, so its edit button is there to take focus.
		if (removal.from === 'items') openItem = removal.id;
		void focusAfter(removal.from === 'people' ? `rename-${removal.id}` : `edit-${removal.id}`);
		people = removal.before.people;
		items = removal.before.items;
		adjustments = removal.before.adjustments;
		paidBy = removal.before.paidBy;
		removal = undefined;
	}

	$effect(() => {
		if (removal && JSON.stringify(bill) !== removal.after) removal = undefined;
	});

	function removePerson(id: string) {
		const shared = items.filter(
			(item) =>
				item.assignedPersonIds.includes(id) &&
				item.assignedPersonIds.some((other) => other !== id && people.some((p) => p.id === other))
		).length;
		const unsharedBefore = totals.unshared;
		undoable('people', id, nameOf(id), () => forgetPerson(id));
		if (removal) {
			removal.shared = shared;
			// Read after the change: the split as it is without them.
			const alone = totals.unshared - unsharedBefore;
			if (alone >= coin / 2) removal.alone = alone;
		}
	}

	function forgetPerson(id: string) {
		if (paidBy === id) paidBy = undefined;
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
	// Once there are items read from a receipt, the form for another waits behind a button, under
	// the list: the items are what's next, not an empty form above them. Typed in, it stays open.
	let addingByHand = $state(false);
	async function startAddingByHand() {
		addingByHand = true;
		await focusAfter('item');
	}

	function addItem() {
		if (!canAddItem || newPrice === null) {
			explainItem = true;
			return;
		}
		explainItem = false;
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
		// Someone typing the items in has more to come: the form stays open under them, ready for
		// the next one's name.
		addingByHand = true;
		void focusAfter('item');
	}

	/* ─── Folding tagged items ─── */
	// Once an item is someone's and the person has moved on to another, it folds to one line: a big
	// table's list of items was a long scroll of cards that were already done. The item last
	// touched stays open, so tagging a second person on it doesn't fold it under the finger.
	let openItem: string | undefined = $state();
	const peopleIds = $derived(new Set(people.map((person) => person.id)));
	const folded = (item: BillItem) =>
		item.id !== openItem && editing?.id !== item.id && !partlyNobodys(item, peopleIds);
	/** Who had a folded item: names, with counts when it was counted. */
	const whoHad = (item: BillItem) =>
		item.counts && (item.quantity ?? 1) > 1
			? Object.entries(item.counts)
					.filter(([id, count]) => peopleIds.has(id) && count > 0)
					.map(([id, count]) => `${nameOf(id)} ${count}`)
					.join(', ')
			: item.assignedPersonIds
					.filter((id) => peopleIds.has(id))
					.map(nameOf)
					.join(', ');

	/**
	 * Items above this one may fold or open as it becomes the open one: it stays where it was on
	 * screen, under the finger that pressed it, rather than moving with them.
	 */
	async function holdStill(id: string, change: () => void) {
		const before = document.getElementById(`item-${id}`)?.getBoundingClientRect().top;
		change();
		await tick();
		const after = document.getElementById(`item-${id}`)?.getBoundingClientRect().top;
		if (before !== undefined && after !== undefined && after !== before) {
			// At once, not with the page's smooth scrolling: it has to look as if nothing moved.
			window.scrollBy({ top: after - before, behavior: 'instant' });
		}
	}
	function touchItem(id: string) {
		if (openItem !== id) void holdStill(id, () => (openItem = id));
	}
	async function unfold(id: string) {
		await holdStill(id, () => (openItem = id));
		// Focus on its first name, where the change is made.
		const card = document.getElementById(`item-${id}`);
		(card?.querySelector<HTMLElement>('button[aria-pressed]') ?? card)?.focus();
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
		const name = items.find((item) => item.id === id)?.name ?? '';
		undoable('items', id, name, () => {
			items = items.filter((item) => item.id !== id);
		});
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
		// A step in one currency means nothing in another: Rp 500 isn't $500.
		if (code !== currencyCode) roundTo = undefined;
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

	function startScan() {
		scanning = true;
		// The photo comes first in the form: focusing it opens no keyboard over the rest.
		void focusAfter('receipt-photo');
	}

	function cancelScan() {
		closeScan();
		void focusAfter('scan-open');
	}

	function readScan() {
		void focusAfter('review-heading');
		scanned = readReceipt(receiptText, currencyCode);
		reviewLines = scanned.items.map((item) => ({
			id: newId(),
			name: item.name,
			// Grouped the way the receipt printed it ("45.000"); the field reads it back the same.
			priceText: item.price === undefined ? '' : formatAmount(item.price, currencyCode),
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
	const unpriced = (line: ReviewLine) => {
		const price = priceOf(line);
		return price === null || !(price > 0);
	};
	/** Lines without a price are often not items at all (a heading, a note): one press drops them. */
	function removeUnpriced() {
		reviewLines = reviewLines.filter((line) => !unpriced(line));
	}
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
		// Tagging needs people: with nobody yet, that's the next thing to do.
		if (people.length === 0) void focusAfter('person', true);
		else void focusAfter('items-heading');
	}

	/* ─── Sharing ─── */
	type Status =
		| { kind: 'opening' }
		| { kind: 'opened'; version?: Version }
		| { kind: 'gone' }
		| { kind: 'unreachable' }
		| { kind: 'broken' }
		| { kind: 'copied' }
		| { kind: 'copied-updated' }
		| { kind: 'copied-new' }
		| { kind: 'copied-long' }
		| { kind: 'copy-failed' }
		| { kind: 'deleted' }
		| { kind: 'delete-failed' }
		| { kind: 'text-copied' }
		| { kind: 'text-copy-failed'; text: string }
		| { kind: 'share-failed' }
		| { kind: 'link-copied' }
		| { kind: 'cleared' };
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
		paidBy = state.paidBy;
		roundTo = state.roundTo;
		removal = undefined;
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

	/**
	 * A link that can't open a bill, after one that did in this tab: the bill on screen is the old
	 * link's, still headed as shared with you, so it goes. The address stays, so "Try again" can
	 * still reach a server that was only out of reach. Someone's own bill, not one they were
	 * shown, stays as it is.
	 */
	function forgetViewedBill() {
		if (!viewing) return;
		open({
			people: [],
			items: [],
			taxPercentage: DEFAULT_TAX_PERCENTAGE,
			servicePercentage: DEFAULT_SERVICE_PERCENTAGE,
			currencyCode: DEFAULT_CURRENCY_CODE
		});
		viewing = false;
		deletable = undefined;
		lastShared = undefined;
	}

	async function readLink() {
		const code = codeFromHash(location.hash);
		if (!code) {
			const shared = billFromHash(location.hash);
			if (shared) open(shared);
			else if (isBrokenLink(location.hash)) {
				forgetViewedBill();
				status = { kind: 'broken' };
			}
			settled = true;
			if (shared) await landOnSplit();
			return;
		}
		settled = false;
		openedFromLink = true;
		status = { kind: 'opening' };
		const result = await openBill(code);
		if (codeFromHash(location.hash) !== code) return;
		if ('problem' in result) {
			forgetViewedBill();
			status = { kind: result.problem === 'gone' ? 'gone' : 'unreachable' };
			return;
		}
		open(result.bill);
		lastShared = { json: JSON.stringify(bill), code };
		deletable = sharedHere(code);
		status = { kind: 'opened', version: result.version };
		settled = true;
		await landOnSplit();
	}

	// Someone who opened a bill shared with them, not from this device, sees the split on its own:
	// they came for their share, and the editor (with a pink button that would make a new link) isn't
	// theirs until they ask for it.
	let viewing = $state(false);

	/** Whoever opens a shared bill came for their share: take them to it. */
	async function landOnSplit() {
		viewing = !deletable && items.length > 0;
		await tick();
		if (!items.length) return;
		// Seen on its own, the split is already at the top, under the line that says what this is.
		if (viewing) document.getElementById('split-heading')?.focus({ preventScroll: true });
		else showSplit();
	}

	/** The editor, for someone who opened a shared bill and wants to change it. */
	async function makeChanges() {
		viewing = false;
		await tick();
		const heading = document.getElementById('bill-heading');
		heading?.focus({ preventScroll: true });
		heading?.scrollIntoView({ block: 'start' });
	}

	/** The link that was opened, as it is: copying it shares nothing new. */
	async function copyOpenedLink() {
		status = undefined;
		try {
			await navigator.clipboard.writeText(location.href);
			status = { kind: 'link-copied' };
		} catch {
			status = { kind: 'copy-failed' };
		}
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
		// The draft was this tab's own; the link it came with still says it didn't open.
		if (isBrokenLink(location.hash)) status = { kind: 'broken' };
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

	// The running total's "Not in anyone's share yet" takes someone to where it comes from: on a big
	// table that's somewhere in a long list of items.
	const unsharedItem = $derived(firstUnsharedItem(bill));
	function showUnshared() {
		if (unsharedItem) void focusAfter(`item-${unsharedItem}`, true);
	}

	function showSplit() {
		const heading = document.getElementById('split-heading');
		heading?.focus({ preventScroll: true });
		// From 1024px the split has a column of its own and is already in view: scrolling would only
		// push the top of its card out of that column.
		if (!matchMedia('(min-width: 64rem)').matches) heading?.scrollIntoView({ block: 'start' });
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

	/**
	 * "Yes, clear": the button, and the card it was in, go with the bill, so focus goes to the top
	 * of the new one, and the line there says it's done.
	 */
	function confirmClear() {
		clearEverything();
		status = { kind: 'cleared' };
		void focusAfter('bill-heading', true);
	}

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
		paidBy = undefined;
		roundTo = undefined;
		removal = undefined;
		addingByHand = false;
		choosing = [];
		renaming = undefined;
		editing = undefined;
		history.replaceState(null, '', location.pathname);
		confirmingClear = false;
		viewing = false;
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

<!-- For a friend who opened a link, the band says what this bill is, not how to make one. -->
<TitleBand
	title={SPLIT_BILL.name}
	introduction={viewing
		? SPLIT_BILL.sharedWithYou.band(money(totals.grandTotal), payerName)
		: SPLIT_BILL.introduction}
	width="max-w-2xl lg:max-w-6xl"
/>

<section class="mx-auto max-w-2xl px-5 pt-6 pb-20 sm:px-8 lg:max-w-6xl">
	<div class="mb-6 {openedFromLink ? 'min-h-6' : 'empty:mb-0'}" role="status">
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
		{:else if status?.kind === 'cleared'}
			<p class="text-sm text-muted">{SPLIT_BILL.cleared}</p>
		{:else if status?.kind === 'opened'}
			<p class="text-sm text-muted">
				<span class="sr-only">{SPLIT_BILL.sharing.opened}</span>
				{#if status.version}{(status.version.updated
						? SPLIT_BILL.sharing.updatedAt
						: SPLIT_BILL.sharing.sharedAt)(when(status.version.updatedAt))}{/if}
			</p>
		{:else if status?.kind === 'gone' || status?.kind === 'unreachable' || status?.kind === 'broken'}
			<!-- A link that didn't open a bill: said with the warning sign and some weight, so it doesn't
			     read as one more line of instructions above an empty bill. -->
			<p class="flex gap-2 font-medium">
				<Caution class="mt-1 shrink-0" />{status.kind === 'gone'
					? SPLIT_BILL.sharing.gone
					: status.kind === 'unreachable'
						? SPLIT_BILL.sharing.unreachable
						: SPLIT_BILL.sharing.broken}
			</p>
		{/if}
	</div>
	{#if status?.kind === 'gone' || status?.kind === 'unreachable' || status?.kind === 'broken'}
		<div class="mt-3 mb-6 flex flex-wrap gap-3">
			<!-- When the server can't be reached, trying again is the way forward: the bill is still
			     there. Starting a new one is for a bill that's gone, or a link that can't open one. -->
			{#if status.kind === 'unreachable'}
				<button type="button" onclick={readLink} class={smallButton}
					>{SPLIT_BILL.sharing.retry}</button
				>
			{:else}
				<button type="button" onclick={clearEverything} class={smallButton}
					>{SPLIT_BILL.sharing.startNew}</button
				>
			{/if}
		</div>
	{/if}

	<!-- While a shared bill opens, the empty one under it can't be changed: it's about to be replaced. -->
	<!-- From 1024px the split sits beside the bill and stays in view while it's made; below that it
	     follows the bill, and the running total keeps the answer in reach. -->
	<div
		class="space-y-6 motion-safe:transition-opacity {viewing
			? 'mx-auto max-w-2xl'
			: 'lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-start lg:space-y-0 lg:gap-x-10'} {opening
			? 'opacity-50'
			: ''}"
		aria-busy={opening}
		inert={opening}
	>
		<div class="space-y-6 {viewing ? 'hidden' : ''}">
			<!-- The bill: what's decided before any price is typed -->
			<section class={card} aria-labelledby="bill-heading">
				<h2 id="bill-heading" tabindex="-1" class={cardHeading}>The bill</h2>
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
						id="scan-open"
						type="button"
						onclick={startScan}
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
							class="block w-full text-sm text-muted file:mr-3 file:min-h-9 file:cursor-pointer file:rounded-full file:border file:border-control-border file:bg-transparent file:px-4 file:text-sm file:font-medium file:text-text hover:file:bg-bg pointer-coarse:file:min-h-11"
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
							<!-- Reading the receipt is this form's one main action, so it's the pink one. -->
							<button type="submit" disabled={!receiptText.trim()} class={primaryButton}
								>{SPLIT_BILL.scanning.read}</button
							>
							<button type="button" onclick={cancelScan} class={secondaryButton}
								>{SPLIT_BILL.scanning.cancel}</button
							>
						</div>
					</form>
				{:else}
					<div class="mt-5 border-t border-border pt-5">
						<div class="flex flex-wrap items-center gap-x-1">
							<h3 id="review-heading" tabindex="-1" class="text-base font-semibold">
								{SPLIT_BILL.scanning.review}
							</h3>
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
							{#if reviewLines.length && items.length}
								<p>{SPLIT_BILL.scanning.itemsStay(items.length)}</p>
							{/if}
							{#if reviewLines.length && scanned.servicePercentage !== undefined && scanned.taxPercentage !== undefined}
								<p>
									{SPLIT_BILL.scanning.rates(
										scanned.servicePercentage,
										scanned.taxPercentage,
										scanned.taxOnService
									)}
									{#if scanned.servicePercentage !== percentage(serviceInput) || scanned.taxPercentage !== percentage(taxInput)}
										{SPLIT_BILL.scanning.ratesUntilNow(
											percentage(serviceInput),
											percentage(taxInput)
										)}
									{/if}
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
									<p class="rounded-lg border border-accent-edge bg-bg p-3">
										{SPLIT_BILL.scanning.itemsOff(money(Math.abs(reviewGap)), reviewGap < 0)}
									</p>
								{/if}
							{/if}
							{#if totalDiffers && reviewed?.total !== undefined && reviewTotal !== undefined}
								<p class="rounded-lg border border-accent-edge bg-bg p-3">
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
							{#if pricesMissing && reviewLines.length}
								<button type="button" onclick={removeUnpriced} class={secondaryButton}
									>{SPLIT_BILL.scanning.removeUnpriced}</button
								>
							{/if}
							<button type="button" onclick={cancelScan} class={secondaryButton}
								>{SPLIT_BILL.scanning.cancel}</button
							>
						</div>
					</div>
				{/if}
			</section>

			<!-- People -->
			<section class={card} aria-labelledby="people-heading">
				<h2 id="people-heading" class={cardHeading}>
					People {#if people.length}<span class="font-normal text-muted">({people.length})</span
						>{/if}
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
						<input
							id="person"
							type="text"
							autocomplete="off"
							bind:value={newPerson}
							class={field}
						/>
					</div>
					<button
						type="submit"
						aria-disabled={!newPerson.trim()}
						aria-describedby="add-person-reason"
						onfocus={() => (explainPerson = !newPerson.trim())}
						class={`${smallButton} ${besideField} ${unavailable}`}>Add person</button
					>
				</form>
				<p id="add-person-reason" role="status" class="mt-2 text-sm text-muted empty:mt-0">
					{#if explainPerson && !newPerson.trim()}{SPLIT_BILL.missing.personName}{/if}
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
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												d="M6 18L18 6M6 6l12 12"
											/>
										</svg>
									</button>
								</li>
							{/if}
						{/each}
					</ul>
				{:else}
					<p class="mt-4 text-sm text-muted">Nobody yet. Add the people splitting this bill.</p>
				{/if}
				<!-- After a removal from this card: what went, and the way back. -->
				<p
					class="flex flex-wrap items-center gap-x-3 text-sm {removal?.from === 'people'
						? 'mt-3 min-h-11'
						: ''}"
					role="status"
				>
					{#if removal?.from === 'people'}{SPLIT_BILL.removedPerson(
							removal.name,
							removal.shared ?? 0,
							removal.alone ? money(removal.alone) : undefined
						)}<button
							id="undo-people"
							type="button"
							onclick={undoRemoval}
							class="min-h-11 font-medium underline underline-offset-4 hover:text-accent-text"
							>{SPLIT_BILL.undo}</button
						>{/if}
				</p>
			</section>

			<!-- Items -->
			<section class={card} aria-labelledby="items-heading">
				<h2 id="items-heading" tabindex="-1" class={cardHeading}>
					Items {#if items.length}<span class="font-normal text-muted">({items.length})</span>{/if}
				</h2>

				{#if items.length}
					<!-- The list keeps the item being tagged still itself (holdStill), so the browser's own
					     scroll anchoring is off here: the two would move it twice. -->
					<ul class="mt-5 space-y-3 [overflow-anchor:none]">
						{#each items as item (item.id)}
							<li
								id="item-{item.id}"
								tabindex="-1"
								onclickcapture={() => touchItem(item.id)}
								class="rounded-xl border border-border bg-bg p-3 sm:p-4"
							>
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
								{:else if folded(item)}
									<!-- Tagged and not the one being worked on: one line, who had it, a tap to open. -->
									<button
										type="button"
										onclick={() => unfold(item.id)}
										class="-my-1 flex min-h-11 w-full items-center justify-between gap-3 text-left"
									>
										<span class="min-w-0 break-words"
											><span class="sr-only">{`${SPLIT_BILL.changeWhoHad} `}</span><span
												class="font-medium">{nameWithQuantity(item)}</span
											><span class="text-muted">{` · ${whoHad(item)}`}</span></span
										>
										<span class="shrink-0 text-sm text-muted tabular-nums">{money(item.price)}</span
										>
									</button>
								{:else}
									<div class="flex items-start justify-between gap-3">
										<div class="min-w-0">
											<p class="font-medium break-words">{nameWithQuantity(item)}</p>
											<p class="text-sm text-muted">
												{money(item.price)}{(item.quantity ?? 1) > 1
													? ` ·\u00a0${money(item.price / (item.quantity ?? 1))} each`
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

								<!-- A folded item's who-had-it is on its one line. -->
								{#if folded(item)}{:else if people.length && item.counts}
									{@const quantity = item.quantity ?? 1}
									{@const counted = countedOf(item)}
									<fieldset class="mt-2 sm:mt-3">
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
														<!-- Counted shows like tagged: the check mark, not only the pink. -->
														<Check class="mr-1 align-[-0.125em]" />{person.name}
														<button
															type="button"
															onclick={() => changeCount(item, person.id, -1)}
															aria-label="One fewer for {person.name}"
															class="ml-1.5 inline-flex size-8 items-center justify-center rounded-full text-base hover:bg-on-accent/10 pointer-coarse:size-11"
															><Step kind="fewer" /></button
														>
														<span class="min-w-5 text-center tabular-nums">{count}</span>
														<button
															type="button"
															onclick={() => changeCount(item, person.id, 1)}
															aria-label="One more for {person.name}"
															class="inline-flex size-8 items-center justify-center rounded-full text-base hover:bg-on-accent/10 pointer-coarse:size-11"
															><Step kind="more" /></button
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
											class="mt-1 min-h-9 text-sm text-muted underline underline-offset-4 hover:text-text pointer-coarse:min-h-11"
											>Share evenly instead</button
										>
									</fieldset>
								{:else if people.length}
									<fieldset class="mt-2 sm:mt-3">
										<legend class="sr-only">Who had this?</legend>
										<!-- "Everyone" sits on the question's line, not in the row of names: at six people
										     it took a row of its own under them on most items. -->
										<div
											class="mb-1 flex min-h-9 items-center justify-between gap-3 pointer-coarse:min-h-11"
										>
											<span class="text-sm text-muted" aria-hidden="true">Who had this?</span>
											<button
												type="button"
												onclick={() => toggleEveryone(item)}
												class="min-h-9 shrink-0 text-sm text-muted underline underline-offset-4 hover:text-text pointer-coarse:min-h-11"
											>
												{everyoneHasIt(item) ? 'Nobody' : 'Everyone'}
											</button>
										</div>
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
										</div>
										{#if (item.quantity ?? 1) > 1}
											<div class="mt-1 flex flex-wrap items-center gap-x-1">
												<button
													type="button"
													onclick={() => startCounting(item)}
													class="min-h-9 text-sm text-muted underline underline-offset-4 hover:text-text pointer-coarse:min-h-11"
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
				<!-- After a removal from this card: what went, and the way back. -->
				<p
					class="flex flex-wrap items-center gap-x-3 text-sm {removal?.from === 'items'
						? 'mt-3 min-h-11'
						: ''}"
					role="status"
				>
					{#if removal?.from === 'items'}{SPLIT_BILL.removed(removal.name)}<button
							id="undo-items"
							type="button"
							onclick={undoRemoval}
							class="min-h-11 font-medium underline underline-offset-4 hover:text-accent-text"
							>{SPLIT_BILL.undo}</button
						>{/if}
				</p>
				<!-- One more item: the form, while there are none or once asked for; otherwise the button
				     that opens it, under the list. -->
				{#if items.length === 0 || addingByHand}
					<div class={items.length ? 'mt-5 border-t border-border pt-5' : 'mt-5'}>
						<form
							class="grid grid-cols-[6rem_1fr] gap-3 sm:grid-cols-[1fr_6rem_9rem_auto] sm:items-end"
							onsubmit={(event) => {
								event.preventDefault();
								addItem();
							}}
						>
							<div class="col-span-2 sm:col-span-1">
								<label for="item" class={label}>Item</label>
								<input
									id="item"
									type="text"
									autocomplete="off"
									bind:value={newItem}
									class={field}
								/>
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
								aria-disabled={!canAddItem}
								aria-describedby="add-item-reason price-note"
								onfocus={() => (explainItem = !canAddItem)}
								class="{smallButton} {besideField} {unavailable} col-span-2 sm:col-span-1"
								>Add item</button
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
							{#if explainItem && addItemReason}{addItemReason}{/if}
						</p>
					</div>
				{:else}
					<button type="button" onclick={startAddingByHand} class="{secondaryButton} mt-5 w-full"
						>{SPLIT_BILL.addByHand}</button
					>
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

				<!-- Most bills need only the two rates. What else a receipt can say waits here, and opens
				     itself when a scan or a link brings any of it. -->
				<details bind:open={moreOpen} class="group mt-4">
					<summary
						class="grid min-h-11 cursor-pointer list-none grid-cols-[auto_1fr] items-center gap-x-2 py-1 text-sm font-medium [&::-webkit-details-marker]:hidden"
					>
						<Arrow class="group-open:rotate-90 motion-safe:transition-transform" />
						<span>{SPLIT_BILL.moreOnReceipt}</span>
						<span class="col-start-2 font-normal text-muted">{SPLIT_BILL.moreOnReceiptHint}</span>
					</summary>
					<div class="mt-2 space-y-1">
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
										(adjustment.assignedPersonIds?.length ?? 0) > 0 ||
										choosing.includes(adjustment.id)}
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
														{@const isFor =
															adjustment.assignedPersonIds?.includes(person.id) ?? false}
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
													class="mt-1 min-h-9 text-muted underline underline-offset-4 hover:text-text pointer-coarse:min-h-11"
													>Share with everyone again</button
												>
											</fieldset>
										{:else if people.length}
											<button
												type="button"
												onclick={() => (choosing = [...choosing, adjustment.id])}
												class="min-h-9 text-muted underline underline-offset-4 hover:text-text pointer-coarse:min-h-11"
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
								<button
									type="submit"
									disabled={!canAddAdjustment}
									class="{smallButton} {besideField}">Add adjustment</button
								>
							</div>
						</form>
					</div>
				</details>
			</section>
		</div>

		<div
			class="space-y-6 lg:sticky lg:top-6 lg:-m-2 lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto lg:overscroll-contain lg:p-2"
		>
			<!-- For a friend opening the link: what this is, then straight to the split; changing it
			     waits under it, so their own row is on a phone's first screen. -->
			{#if viewing}
				<p>{SPLIT_BILL.sharedWithYou.line}</p>
			{/if}
			<!-- The split -->
			{#if items.length}
				<section class={card} aria-labelledby="split-heading">
					<h2 id="split-heading" tabindex="-1" class={cardHeading}>The split</h2>
					<!-- A removal changes the split, so it says so here too, with the way back: on a wide
					     screen the card it was made in is in the other column. Not a second live region:
					     the card's own line already announces it. -->
					{#if removal}
						<p class="-mt-2 mb-3 flex flex-wrap items-center gap-x-3 text-sm">
							{removal.from === 'people'
								? SPLIT_BILL.removedPerson(
										removal.name,
										removal.shared ?? 0,
										removal.alone ? money(removal.alone) : undefined
									)
								: SPLIT_BILL.removed(removal.name)}<button
								type="button"
								onclick={undoRemoval}
								class="min-h-11 font-medium underline underline-offset-4 hover:text-accent-text"
								>{SPLIT_BILL.undo}</button
							>
						</p>
					{/if}

					{#if people.length}
						<!-- What each person hands over comes first, and largest: it's what the table asked. -->
						<ul class="divide-y divide-border" aria-label="What each person owes">
							{#each settledUp.settlements as settlement, index (settlement.personId)}
								{@const share = totals.shares[index]}
								{@const parts = had.get(settlement.personId) ?? []}
								{@const charges = share.total - share.base}
								{@const roundedUp = settlement.paidTheBill ? 0 : settlement.amount - share.total}
								{#snippet row()}
									<!-- The arrow follows the name rather than coming before it: an indent would take the width the
									     muted line under it needs ("Paid the bill", beside "comes back" and the amount). -->
									<span class="min-w-0">
										<span class="block font-medium break-words"
											>{nameOf(settlement.personId)}{#if parts.length}<Arrow
													class="ml-1.5 align-[-0.125em] text-muted group-open/share:rotate-90 motion-safe:transition-transform"
												/>{/if}</span
										>
										<!-- Every row keeps one short line here, even an empty one, so choosing who paid
											     never changes a row's height and moves the choices below. -->
										<span class="block min-h-5 text-sm text-muted">
											{#if settlement.paidTheBill}{SPLIT_BILL.split
													.paidTheBill}{:else if settlement.amount === 0}{SPLIT_BILL.split
													.nothingTagged}{:else if payerName}{SPLIT_BILL.split.to(
													payerName
												)}{:else if share.base !== share.total}{SPLIT_BILL.split.ordered(
													money(share.base)
												)}{/if}
										</span>
									</span>
									<!-- Whoever paid hands nothing over: their big number is what comes back, and says so
									     beside it, on the same line, so choosing who paid never makes the row taller. -->
									<span class="flex shrink-0 items-baseline gap-2">
										{#if settlement.paidTheBill}<span class="text-sm text-muted"
												>{SPLIT_BILL.split.comesBack}</span
											>{/if}
										<span
											class="text-2xl font-bold tracking-tight tabular-nums {settlement.amount ===
												0 && !settlement.paidTheBill
												? 'text-muted'
												: ''}"
										>
											{money(settlement.paidTheBill ? settledUp.back : settlement.amount)}
										</span>
									</span>
								{/snippet}
								<li>
									<!-- A row opens to what's in that share: tapping a name answers "why that much?", for
									     a friend opening the link above all. Someone with nothing tagged has nothing to
									     open, so theirs is a plain row. -->
									{#if parts.length}
										<details class="group/share">
											<summary
												class="flex cursor-pointer list-none items-center justify-between gap-4 py-3 [&::-webkit-details-marker]:hidden"
											>
												{@render row()}
											</summary>
											<div class="mb-3 rounded-lg bg-bg p-3 text-sm tabular-nums">
												<dl class="space-y-1">
													{#each parts as part (part.itemId)}
														<div class="flex justify-between gap-4">
															<dt class="min-w-0 break-words">
																{part.name}{#if part.part}<span class="text-muted"
																		>, {part.part}</span
																	>{/if}
															</dt>
															<dd class="shrink-0">{money(part.amount)}</dd>
														</div>
													{/each}
													{#if Math.abs(charges) >= coin / 2}
														<div class="flex justify-between gap-4 text-muted">
															<dt>{SPLIT_BILL.split.charges}</dt>
															<dd class="shrink-0">{money(charges)}</dd>
														</div>
													{/if}
													{#if roundedUp >= coin / 2}
														<div class="flex justify-between gap-4 text-muted">
															<dt>{SPLIT_BILL.split.roundedUp}</dt>
															<dd class="shrink-0">{money(roundedUp)}</dd>
														</div>
													{/if}
												</dl>
												<!-- Whoever paid: the subtraction, shown. What the rest rounded up comes back to them;
												     anything in nobody's share is theirs to cover for now. What's left is what they're
												     out once everyone has paid them, the total less what comes back. -->
												{#if settlement.paidTheBill}
													{@const payer = nameOf(settlement.personId)}
													<dl class="mt-1 space-y-1">
														{#if settledUp.extra > 0}
															<div class="flex justify-between gap-4 text-muted">
																<dt>{SPLIT_BILL.split.roundingBack}</dt>
																<dd class="shrink-0">−{money(settledUp.extra)}</dd>
															</div>
														{/if}
														{#if totals.unshared > 0}
															<div class="flex justify-between gap-4 text-muted">
																<dt>{SPLIT_BILL.split.unsharedOnPayer(payer)}</dt>
																<dd class="shrink-0">{money(totals.unshared)}</dd>
															</div>
														{/if}
														<div
															class="flex justify-between gap-4 border-t border-border pt-1 font-semibold"
														>
															<dt>{SPLIT_BILL.split.paysInTheEnd(payer)}</dt>
															<dd class="shrink-0">{money(settlement.amount + totals.unshared)}</dd>
														</div>
													</dl>
													<!-- The same amount the other way, joining it to the row's "comes back": what they
													     paid at the table, less what everyone else hands them. -->
													<p class="mt-1 text-muted">
														{SPLIT_BILL.split.paidLessBack(
															money(totals.grandTotal),
															payer,
															money(settledUp.back)
														)}
													</p>
												{/if}
											</div>
										</details>
									{:else}
										<div class="flex items-center justify-between gap-4 py-3">{@render row()}</div>
									{/if}
								</li>
							{/each}
						</ul>

						<!-- Who paid and rounding are the bill's maker's choices: shown as their result in the
						     rows above, and changed only after "Make changes". -->
						{#if !viewing}
							<fieldset class="mt-5">
								<legend class="mb-1 text-sm font-medium">{SPLIT_BILL.split.paidBy}</legend>
								<div class="flex flex-wrap gap-x-5">
									<label class={checkRow}>
										<input
											type="radio"
											name="paid-by"
											checked={!payerName}
											onchange={() => (paidBy = undefined)}
											class={checkbox}
										/>
										{SPLIT_BILL.split.nobody}
									</label>
									{#each people as person (person.id)}
										<label class="{checkRow} break-all">
											<input
												type="radio"
												name="paid-by"
												checked={paidBy === person.id}
												onchange={() => (paidBy = person.id)}
												class={checkbox}
											/>
											{person.name}
										</label>
									{/each}
								</div>
							</fieldset>

							<fieldset class="mt-3">
								<legend class="mb-1 text-sm font-medium">{SPLIT_BILL.split.roundUp}</legend>
								<div class="flex flex-wrap gap-x-5">
									<label class={checkRow}>
										<input
											type="radio"
											name="round-to"
											checked={!roundTo}
											onchange={() => (roundTo = undefined)}
											class={checkbox}
										/>
										{SPLIT_BILL.split.noRounding}
									</label>
									{#each steps as step (step)}
										<label class={checkRow}>
											<input
												type="radio"
												name="round-to"
												checked={roundTo === step}
												onchange={() => (roundTo = step)}
												class={checkbox}
											/>
											{SPLIT_BILL.split.roundTo(money(step))}
										</label>
									{/each}
								</div>
								<!-- Two lines are kept even when empty (the note wraps on a phone and in the side column), so choosing a step doesn't shift what's below. -->
								<p class="mt-1 min-h-10 text-sm text-muted">
									{#if settledUp.extra > 0}{payerName
											? SPLIT_BILL.split.extraToPayer(money(settledUp.extra), payerName)
											: SPLIT_BILL.split.extraOnTop(money(settledUp.extra))}{/if}
								</p>
							</fieldset>
						{/if}
					{/if}

					{#if totals.unassigned > 0}
						<!-- Pink once tagging's begun and something's still left out; gray before that, when
						     nothing's tagged yet only because nobody's started. -->
						<p
							class="mt-4 rounded-lg border bg-bg p-3 text-sm {anyTagged
								? 'border-accent-edge'
								: 'border-border text-muted'}"
						>
							<strong>Not in anyone's share:</strong> items worth {money(totals.unassigned)} aren't tagged
							or counted for anyone, so they're left out of the shares.
							{#if totals.unshared !== totals.unassigned}{SPLIT_BILL.unsharedOfTotal(
									money(totals.unshared)
								)}{/if}
						</p>
					{/if}

					<dl
						class="mt-5 space-y-2 rounded-xl border border-border bg-bg p-4 text-sm"
						aria-label="How it adds up"
					>
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
				</section>
			{:else}
				<p class="hidden rounded-2xl border border-border p-6 text-sm text-muted lg:block">
					{SPLIT_BILL.split.empty}
				</p>
			{/if}

			{#if viewing}
				<div>
					<button type="button" onclick={makeChanges} class={smallButton}
						>{SPLIT_BILL.sharedWithYou.makeChanges}</button
					>
					<p class="mt-2 text-sm text-muted">{SPLIT_BILL.sharedWithYou.note}</p>
				</div>
			{/if}
			<!-- Share and clear -->
			{#if items.length || people.length}
				<div>
					<!-- Each as wide as its words, sharing what's left over; a row too narrow for them all wraps a
					     whole button, never its label. -->
					<div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:flex-col">
						{#if viewing}
							<button
								type="button"
								onclick={copyOpenedLink}
								class="{secondaryButton} whitespace-nowrap sm:grow-[2]"
								>{SPLIT_BILL.sharedWithYou.copyLink}</button
							>
						{:else}
							<button
								type="button"
								onclick={copyLink}
								disabled={sharing}
								class="{primaryButton} whitespace-nowrap sm:grow-[2]"
								>Copy a link to this bill</button
							>
						{/if}
						{#if items.length && people.length}
							<button
								type="button"
								onclick={copyText}
								class="{secondaryButton} whitespace-nowrap sm:grow">Copy as text</button
							>
							{#if canShare}
								<button
									type="button"
									onclick={shareText}
									class="{secondaryButton} whitespace-nowrap sm:grow">Share</button
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
								.shareFailed}{:else if status?.kind === 'link-copied'}{SPLIT_BILL.sharedWithYou
								.copied}{/if}
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
								<button type="button" onclick={deleteShared} class={smallButton}>Yes, delete</button
								>
								<button type="button" onclick={() => (confirmingDelete = false)} class={smallButton}
									>Keep it</button
								>
							</div>
						{:else}
							<button
								type="button"
								onclick={() => (confirmingDelete = true)}
								class="mt-2 min-h-9 text-sm text-muted underline underline-offset-4 hover:text-text pointer-coarse:min-h-11"
								>Delete the shared copy</button
							>
						{/if}
					{/if}
					<!-- What sharing keeps on our server: for whoever shares, not for a friend reading a
					     link, whose long link keeps nothing there at all. -->
					<!-- What sharing keeps on our server: for whoever shares, not for a friend reading a
					     link, and not right after a long link was copied, which keeps nothing there. -->
					{#if !viewing && status?.kind !== 'copied-long'}
						<p class="mt-3 max-w-prose text-sm text-muted">{SPLIT_BILL.privacy}</p>
					{/if}
					<!-- Clearing is apart from sharing, under it and quieter: it undoes everything, and sat right
					     under the share buttons at the same weight. -->
					<div class="mt-6 border-t border-border pt-3 {viewing ? 'hidden' : ''}">
						{#if confirmingClear}
							<div
								class="flex flex-wrap items-center gap-2"
								role="group"
								aria-label="Clear everything?"
							>
								<span class="text-sm">Clear everything?</span>
								<button type="button" onclick={confirmClear} class={smallButton}>Yes, clear</button>
								<button type="button" onclick={() => (confirmingClear = false)} class={smallButton}
									>Keep it</button
								>
							</div>
						{:else}
							<button
								type="button"
								onclick={() => (confirmingClear = true)}
								class="min-h-9 text-sm text-muted underline underline-offset-4 hover:text-text pointer-coarse:min-h-11"
								>Clear everything</button
							>
						{/if}
					</div>
				</div>
			{/if}
		</div>

		<!-- On a phone the split is far below the tagging: the total and what isn't in anyone's share
		     stay at the bottom while the bill is made. It's sticky, not fixed, so it takes its own
		     space at the end of the page and never sits over the last of it. Not while the split is
		     seen on its own: it's already in view. Edge to edge at
		     every width (50cqw is half the page's width, from the container on <main>), its contents
		     in line with the column's. -->
		{#if items.length && !viewing}
			<section
				aria-label="The bill so far"
				data-running-total
				class="sticky bottom-0 z-10 mx-[calc(50%-50cqw)] border-t border-border bg-surface px-[calc(50cqw-50%)] pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden"
			>
				<div class="flex items-center justify-between gap-3">
					{#if unsharedItem && totals.unshared > 0}
						<!-- With something in nobody's share, the two lines are a way to it: a press goes to the
						     first item it comes from. -->
						<button
							type="button"
							onclick={showUnshared}
							class="-m-1 min-w-0 rounded-lg p-1 text-left text-sm hover:bg-bg"
						>
							<span class="flex flex-wrap gap-x-1.5">
								<span>Total</span>
								<span class="font-semibold">{money(totals.grandTotal)}</span>
							</span>
							<span class="flex flex-wrap items-center gap-x-1.5">
								<span>Not in anyone's share yet</span>
								<span class="inline-flex items-center gap-1 font-semibold"
									>{money(totals.unshared)}<Arrow /></span
								>
							</span>
							<span class="sr-only">{SPLIT_BILL.goToUnshared}</span>
						</button>
					{:else}
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
					{/if}
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
