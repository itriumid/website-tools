<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import SearchableSelect, { type Choice } from '#lib/SearchableSelect.svelte';
	import Seo from '#lib/Seo.svelte';
	import { SPLIT_BILL } from '#lib/content.js';
	import { CURRENCIES } from '#lib/countries.js';
	import {
		DEFAULT_CURRENCY_CODE,
		DEFAULT_SERVICE_PERCENTAGE,
		DEFAULT_TAX_PERCENTAGE,
		billFromHash,
		billToHash,
		calculateBill,
		formatAmount,
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
		type Shared
	} from '#lib/share.js';
	import {
		besideField,
		card,
		cardHeading,
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

	const percentage = (value: number | null) =>
		typeof value === 'number' && Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;

	const bill: BillState = $derived({
		people: $state.snapshot(people),
		items: $state.snapshot(items),
		taxPercentage: percentage(taxInput),
		servicePercentage: percentage(serviceInput),
		currencyCode
	});
	const totals = $derived(calculateBill(bill));
	const symbol = $derived(CURRENCIES.find((c) => c.code === currencyCode)?.symbol ?? currencyCode);
	const money = (amount: number) => `${symbol} ${formatAmount(amount, currencyCode)}`;
	const nameOf = (id: string) => people.find((person) => person.id === id)?.name ?? '';

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

	function removePerson(id: string) {
		people = people.filter((person) => person.id !== id);
		for (const item of items) {
			item.assignedPersonIds = item.assignedPersonIds.filter((tagged) => tagged !== id);
		}
	}

	/* ─── Items ─── */
	let newItem = $state('');
	let newPrice: number | null = $state(null);
	const canAddItem = $derived(newItem.trim() !== '' && newPrice !== null && newPrice > 0);

	function addItem() {
		if (!canAddItem || newPrice === null) return;
		items.push({ id: newId(), name: newItem.trim(), price: newPrice, assignedPersonIds: [] });
		newItem = '';
		newPrice = null;
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

	/* ─── Sharing ─── */
	type Status =
		| { kind: 'opening' }
		| { kind: 'gone' }
		| { kind: 'unreachable' }
		| { kind: 'copied' }
		| { kind: 'copied-long' }
		| { kind: 'copy-failed' }
		| { kind: 'deleted' }
		| { kind: 'delete-failed' };
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
	}

	// A link opens the bill it holds, now or if the address changes later: a short link fetches
	// it, and a long one (the only kind before short links) carries it whole.
	onMount(() => {
		const read = async () => {
			const code = codeFromHash(location.hash);
			if (!code) {
				const shared = billFromHash(location.hash);
				if (shared) open(shared);
				return;
			}
			status = { kind: 'opening' };
			const result = await openBill(code);
			if (codeFromHash(location.hash) !== code) return;
			if ('problem' in result) {
				status = { kind: result.problem === 'gone' ? 'gone' : 'unreachable' };
				return;
			}
			open(result);
			lastShared = { json: JSON.stringify(bill), code };
			deletable = sharedHere(code);
			status = undefined;
		};
		void read();
		addEventListener('hashchange', read);
		return () => removeEventListener('hashchange', read);
	});

	/** The short link to the bill as it is, sharing it if it changed; the long one if that fails. */
	async function linkToBill(): Promise<{ url: string; long: boolean }> {
		const json = JSON.stringify(bill);
		let hash: string;
		let long = false;
		if (lastShared?.json === json) {
			hash = `${SHORT_PREFIX}${lastShared.code}`;
		} else {
			const result = await shareBill(bill);
			if ('problem' in result) {
				hash = billToHash(bill);
				long = true;
			} else {
				remember(result);
				lastShared = { json, code: result.code };
				deletable = result;
				hash = `${SHORT_PREFIX}${result.code}`;
			}
		}
		// The address bar now holds the link too, so copying it from there works as well.
		history.replaceState(null, '', hash);
		return { url: `${location.origin}${location.pathname}${hash}`, long };
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
			status = { kind: (await link).long ? 'copied-long' : 'copied' };
		} catch {
			await link;
			status = { kind: 'copy-failed' };
		}
		sharing = false;
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
		history.replaceState(null, '', location.pathname);
		confirmingClear = false;
		deletable = undefined;
		confirmingDelete = false;
		status = undefined;
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
	<p class="mt-4 empty:hidden" role="status">
		{#if status?.kind === 'opening'}{SPLIT_BILL.sharing
				.opening}{:else if status?.kind === 'gone'}{SPLIT_BILL.sharing
				.gone}{:else if status?.kind === 'unreachable'}{SPLIT_BILL.sharing.unreachable}{/if}
	</p>

	<div class="mt-8 space-y-6">
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
				<button type="submit" disabled={!newPerson.trim()} class={`${smallButton} ${besideField}`}
					>Add person</button
				>
			</form>

			{#if people.length}
				<ul class="mt-4 flex flex-wrap gap-2">
					{#each people as person (person.id)}
						<li
							class="flex items-center gap-1 rounded-full border border-control-border py-1 pr-1 pl-3 text-sm"
						>
							{person.name}
							<button
								type="button"
								onclick={() => removePerson(person.id)}
								aria-label="Remove {person.name}"
								class="inline-flex size-7 items-center justify-center rounded-full text-muted hover:bg-bg hover:text-text"
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
				class="grid gap-3 sm:grid-cols-[1fr_9rem_auto] sm:items-end"
				onsubmit={(event) => {
					event.preventDefault();
					addItem();
				}}
			>
				<div>
					<label for="item" class={label}>Item</label>
					<input id="item" type="text" autocomplete="off" bind:value={newItem} class={field} />
				</div>
				<div>
					<label for="price" class={label}>Price</label>
					<input
						id="price"
						type="number"
						inputmode="decimal"
						min="0"
						step="any"
						bind:value={newPrice}
						class={field}
					/>
				</div>
				<button type="submit" disabled={!canAddItem} class={`${smallButton} ${besideField}`}
					>Add item</button
				>
			</form>

			{#if items.length}
				<ul class="mt-5 space-y-3">
					{#each items as item (item.id)}
						<li class="rounded-xl border border-border bg-bg p-4">
							<div class="flex items-start justify-between gap-3">
								<div class="min-w-0">
									<p class="font-medium break-words">{item.name}</p>
									<p class="text-sm text-muted">{money(item.price)}</p>
								</div>
								<button
									type="button"
									onclick={() => removeItem(item.id)}
									aria-label="Remove {item.name}"
									class="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-text"
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
										<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							</div>

							{#if people.length}
								<fieldset class="mt-3">
									<legend class="mb-2 text-sm text-muted">Who had this?</legend>
									<div class="flex flex-wrap gap-2">
										{#each people as person (person.id)}
											{@const had = item.assignedPersonIds.includes(person.id)}
											<button
												type="button"
												aria-pressed={had}
												onclick={() => toggleTag(item, person.id)}
												class="min-h-9 rounded-full border px-3.5 text-sm transition-colors {had
													? 'border-accent-edge bg-accent font-medium text-on-accent'
													: 'border-control-border hover:bg-surface'}"
											>
												{#if had}<span aria-hidden="true">✓ </span>{/if}{person.name}
											</button>
										{/each}
										<button
											type="button"
											onclick={() => toggleEveryone(item)}
											class="min-h-9 rounded-full px-3 text-sm text-muted underline underline-offset-4 hover:text-text"
										>
											{everyoneHasIt(item) ? 'Nobody' : 'Everyone'}
										</button>
									</div>
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

		<!-- Tax, service and currency -->
		<section class={card} aria-labelledby="extras-heading">
			<h2 id="extras-heading" class={cardHeading}>Tax, service and currency</h2>
			<div class="mb-4">
				<label for="currency" class={label}>Currency</label>
				<SearchableSelect
					id="currency"
					choices={currencyChoices}
					value={currencyCode}
					onchange={(value) => (currencyCode = value)}
					placeholder="Type a currency or a country"
				/>
			</div>
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
		</section>

		<!-- The split -->
		{#if items.length}
			<section class={card} aria-labelledby="split-heading">
				<h2 id="split-heading" class={cardHeading}>The split</h2>

				<dl class="space-y-2 rounded-xl border border-border bg-bg p-4 text-sm">
					<div class="flex justify-between gap-4">
						<dt>Subtotal</dt>
						<dd>{money(totals.subtotal)}</dd>
					</div>
					{#if bill.taxPercentage > 0}
						<div class="flex justify-between gap-4 text-muted">
							<dt>Tax ({bill.taxPercentage}%)</dt>
							<dd>{money(totals.tax)}</dd>
						</div>
					{/if}
					{#if bill.servicePercentage > 0}
						<div class="flex justify-between gap-4 text-muted">
							<dt>Service ({bill.servicePercentage}%)</dt>
							<dd>{money(totals.service)}</dd>
						</div>
					{/if}
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
						to anyone, so they're left out of the split below.
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
												{money(share.base)} before tax and service
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
				<div class="flex flex-col gap-3 sm:flex-row">
					<button type="button" onclick={copyLink} disabled={sharing} class="{primaryButton} flex-1"
						>Copy a link to this bill</button
					>
					{#if confirmingClear}
						<div
							class="flex flex-1 items-center justify-center gap-2"
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
							class="{secondaryButton} flex-1">Clear everything</button
						>
					{/if}
				</div>
				<p class="mt-3 min-h-5 text-sm" role="status">
					{#if status?.kind === 'copied'}{SPLIT_BILL.sharing
							.copied}{:else if status?.kind === 'copied-long'}{SPLIT_BILL.sharing
							.copiedLong}{:else if status?.kind === 'copy-failed'}{SPLIT_BILL.sharing
							.copyFailed}{:else if status?.kind === 'deleted'}{SPLIT_BILL.sharing
							.deleted}{:else if status?.kind === 'delete-failed'}{SPLIT_BILL.sharing
							.deleteFailed}{/if}
				</p>
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
				<p class="mt-3 text-sm text-muted">{SPLIT_BILL.privacy}</p>
			</div>
		{/if}
	</div>
</section>
