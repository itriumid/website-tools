<script lang="ts">
	import SearchableSelect, { type Choice } from '#lib/SearchableSelect.svelte';
	import Seo from '#lib/Seo.svelte';
	import TitleBand from '#lib/TitleBand.svelte';
	import { WHATSAPP } from '#lib/content.js';
	import { COUNTRIES, DEFAULT_COUNTRY_NAME } from '#lib/countries.js';
	import { card, field, label, primaryButton, secondaryButton } from '#lib/styles.js';
	import { chatTarget, countriesWithCode, waitsForTyping } from '#lib/whatsapp.js';
	import Caution from '#lib/Caution.svelte';

	// Chosen by name, since countries share codes: the United States and Canada are both +1, and
	// people look for their country, not its code.
	const choices: Choice[] = COUNTRIES.map((country) => ({
		value: country.name,
		label: `+${country.phoneCode}${country.areaCodes ? ` ${country.areaCodes.join('/')}` : ''} ${country.name}`,
		searchTerms: country.name
	}));

	let countryName = $state(DEFAULT_COUNTRY_NAME);
	const countryCode = $derived(
		COUNTRIES.find((country) => country.name === countryName)?.phoneCode ?? ''
	);
	let typed = $state('');
	let message = $state('');
	let copied: 'yes' | 'failed' | undefined = $state();
	let copiedTimer: ReturnType<typeof setTimeout> | undefined;

	const result = $derived(chatTarget(countryCode, typed, message));
	// The example number is Indonesian: shown only for Indonesia, where it's a real shape.
	const placeholder = $derived(countryName === DEFAULT_COUNTRY_NAME ? '811 9710 096' : '');
	const target = $derived(result && 'link' in result ? result : undefined);
	// A problem every number has halfway through waits until the typing stops, or the field is
	// left; one that can't come right however the number ends is said at once.
	const WAIT_FOR = 800;
	let typingStopped = $state(true);
	let typingTimer: ReturnType<typeof setTimeout> | undefined;
	function typing() {
		typingStopped = false;
		clearTimeout(typingTimer);
		typingTimer = setTimeout(stoppedTyping, WAIT_FOR);
	}
	function stoppedTyping() {
		clearTimeout(typingTimer);
		typingStopped = true;
	}
	const problem = $derived.by(() => {
		const found = result && 'problem' in result ? result.problem : undefined;
		return found && waitsForTyping(found) && !typingStopped ? undefined : found;
	});
	// Which country the number is for: the one chosen, or, for a number typed with its own code,
	// the countries that code belongs to.
	const countryOfTarget = $derived.by(() => {
		if (!target) return '';
		if (target.countryCode === countryCode) return countryName;
		return countriesWithCode(target.countryCode).join(' or ');
	});
	// What was decided on the person's behalf, for them to check.
	const notes = $derived(
		target
			? [
					target.lettersDropped && WHATSAPP.result.lettersDropped,
					target.extension && WHATSAPP.result.extension(target.extension),
					target.short && WHATSAPP.result.short
				].filter((note): note is string => Boolean(note))
			: []
	);

	async function copyLink() {
		if (!target) return;
		try {
			await navigator.clipboard.writeText(target.link);
			copied = 'yes';
		} catch {
			copied = 'failed';
		}
		clearTimeout(copiedTimer);
		copiedTimer = setTimeout(() => (copied = undefined), 3000);
	}
</script>

<Seo
	title="{WHATSAPP.name} · Itrium"
	description={WHATSAPP.description}
	path={WHATSAPP.path}
	structuredData={{
		'@context': 'https://schema.org',
		'@type': 'WebApplication',
		name: WHATSAPP.name,
		description: WHATSAPP.description,
		url: `https://tools.itrium.id${WHATSAPP.path}`,
		applicationCategory: 'UtilitiesApplication',
		operatingSystem: 'Any',
		isAccessibleForFree: true,
		offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
		publisher: { '@type': 'Organization', name: 'Itrium', url: 'https://itrium.id' }
	}}
/>

<TitleBand title={WHATSAPP.name} introduction={WHATSAPP.introduction} width="max-w-xl" />

<section class="mx-auto max-w-xl px-5 pt-6 pb-20 sm:px-8">
	<form class="{card} space-y-5" onsubmit={(event) => event.preventDefault()}>
		<div>
			<label for="country" class={label}>Country</label>
			<SearchableSelect
				id="country"
				{choices}
				value={countryName}
				onchange={(value) => (countryName = value)}
				placeholder="Type a country or a code"
			/>
		</div>

		<div>
			<label for="number" class={label}>Phone number</label>
			<input
				id="number"
				type="tel"
				inputmode="tel"
				autocomplete="off"
				bind:value={typed}
				oninput={typing}
				onblur={stoppedTyping}
				{placeholder}
				aria-describedby="number-hint number-reads number-problem"
				aria-invalid={problem ? true : undefined}
				class={field}
			/>
			<!-- Before anything's typed, how a number with its country is read; after, what's wrong. -->
			{#if !typed.trim()}
				<p id="number-hint" class="mt-1.5 text-sm text-muted">{WHATSAPP.hint}</p>
			{/if}
			<!-- What the number reads as, right under it: on a phone the keyboard covers the result
			     below, and this is the line to check against what was typed. -->
			{#if target}
				<p id="number-reads" class="mt-1.5 text-sm text-muted tabular-nums">
					{WHATSAPP.reads(target.display, countryOfTarget)}
				</p>
			{/if}
			<p id="number-problem" class="mt-1.5 text-sm font-medium empty:mt-0" role="status">
				{#if problem}{WHATSAPP.problems[problem]}{/if}
			</p>
		</div>

		<!-- The result: who the chat is with, as people read a number, and which country that is;
		     anything to check; the two actions; then the link itself, small. Everything about the
		     answer sits together, right under the field it comes from. -->
		<section aria-labelledby="result-heading">
			<h2 id="result-heading" class={label}>{WHATSAPP.result.heading}</h2>
			{#if target}
				<div class="rounded-xl border border-border bg-bg p-4">
					<p class="text-2xl font-bold tracking-tight break-words tabular-nums">
						{target.display}
					</p>
					{#if countryOfTarget}<p class="text-sm text-muted">{countryOfTarget}</p>{/if}
					{#if message.trim()}
						<p class="mt-2 text-sm break-words whitespace-pre-line text-muted">
							{message.trim()}
						</p>
					{/if}
					{#if notes.length}
						<ul class="mt-3 space-y-1.5 text-sm font-medium">
							{#each notes as note (note)}
								<li class="flex gap-2"><Caution class="mt-0.5" />{note}</li>
							{/each}
						</ul>
					{/if}
					<div class="mt-4 flex gap-3">
						<a
							href={target.link}
							target="_blank"
							rel="external noopener noreferrer"
							class="{primaryButton} flex-1 px-4"
						>
							Open in WhatsApp<span class="sr-only"> (opens in a new tab)</span>
						</a>
						<button type="button" onclick={copyLink} class="{secondaryButton} flex-1 px-4">
							Copy link
						</button>
					</div>
					<p class="mt-3 font-mono text-xs break-all text-muted select-all">{target.link}</p>
					<!-- For someone making a link for their own number: where it goes, and a check before
					     it's printed, since a printed mistake can't be fixed. -->
					<p class="mt-3 text-sm text-muted">{WHATSAPP.result.useIt}</p>
				</div>
			{:else}
				<p class="rounded-xl border border-dashed border-control-border p-4 text-sm text-muted">
					{WHATSAPP.result.empty}
				</p>
			{/if}
		</section>
		<p class="-mt-2 min-h-5 text-sm" role="status">
			{#if copied === 'yes'}Link copied.{:else if copied === 'failed'}We couldn't copy it. Select
				the link above and copy it yourself.{/if}
		</p>

		<div>
			<label for="message" class={label}>Message <span class="text-muted">(optional)</span></label>
			<textarea
				id="message"
				bind:value={message}
				rows="3"
				placeholder="Hi! I'd like to ask about…"
				class="{field} resize-y"></textarea>
		</div>
	</form>
</section>
