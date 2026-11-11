<script lang="ts">
	import SearchableSelect, { type Choice } from '#lib/SearchableSelect.svelte';
	import Seo from '#lib/Seo.svelte';
	import TitleBand from '#lib/TitleBand.svelte';
	import { WHATSAPP } from '#lib/content.js';
	import { COUNTRIES, DEFAULT_COUNTRY_NAME } from '#lib/countries.js';
	import { card, field, label, primaryButton, secondaryButton } from '#lib/styles.js';
	import { chatTarget } from '#lib/whatsapp.js';

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
	const target = $derived(result && 'link' in result ? result : undefined);
	const problem = $derived(result && 'problem' in result ? result.problem : undefined);

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
				placeholder="811 9710 096"
				aria-describedby="number-hint number-problem"
				aria-invalid={problem ? true : undefined}
				class={field}
			/>
			<p id="number-hint" class="mt-1.5 text-xs text-muted">
				A number that starts with + or 00 already has its country, so we use it as it is.
				{#if target}Chatting with <strong class="text-text">{target.display}</strong>.{/if}
			</p>
			<p id="number-problem" class="mt-1.5 text-sm font-medium empty:mt-0" role="status">
				{#if problem}{WHATSAPP.problems[problem]}{/if}
			</p>
		</div>

		<div>
			<label for="message" class={label}>Message <span class="text-muted">(optional)</span></label>
			<textarea
				id="message"
				bind:value={message}
				rows="3"
				placeholder="Hi! I'd like to ask about…"
				class="{field} resize-y"></textarea>
		</div>

		<div>
			<p class={label}>Your link</p>
			{#if target}
				<p class="rounded-lg border border-border bg-bg p-3 font-mono text-sm break-all select-all">
					{target.link}
				</p>
			{:else}
				<p class="rounded-lg border border-dashed border-control-border p-3 text-sm text-muted">
					Enter a phone number and the link appears here.
				</p>
			{/if}
		</div>

		<div class="flex flex-col gap-3 sm:flex-row">
			{#if target}
				<a
					href={target.link}
					target="_blank"
					rel="external noopener noreferrer"
					class="{primaryButton} flex-1"
				>
					Open in WhatsApp<span class="sr-only"> (opens in a new tab)</span>
				</a>
			{:else}
				<button type="button" disabled class="{primaryButton} flex-1">Open in WhatsApp</button>
			{/if}
			<button type="button" disabled={!target} onclick={copyLink} class="{secondaryButton} flex-1">
				Copy link
			</button>
		</div>
		<p class="min-h-5 text-sm" role="status">
			{#if copied === 'yes'}Link copied.{:else if copied === 'failed'}We couldn't copy it. Select
				the link above and copy it yourself.{/if}
		</p>
	</form>
</section>
