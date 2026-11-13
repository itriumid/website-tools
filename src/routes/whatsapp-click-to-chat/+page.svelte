<script lang="ts">
	import SearchableSelect, { type Choice } from '#lib/SearchableSelect.svelte';
	import Seo from '#lib/Seo.svelte';
	import TitleBand from '#lib/TitleBand.svelte';
	import { WHATSAPP } from '#lib/content.js';
	import { COUNTRIES, DEFAULT_COUNTRY_NAME, searchNames } from '#lib/countries.js';
	import { card, field, label, primaryButton, secondaryButton } from '#lib/styles.js';
	import { chatTarget, countriesWithCode, waitsForTyping } from '#lib/whatsapp.js';
	import Caution from '#lib/Caution.svelte';
	import Arrow from '#lib/Arrow.svelte';
	import { drawnSize, qrFileName, qrModules, qrPath } from '#lib/qr.js';

	// Chosen by name, since countries share codes: the United States and Canada are both +1, and
	// people look for their country, not its code.
	const choices: Choice[] = COUNTRIES.map((country) => ({
		value: country.name,
		label: `+${country.phoneCode}${country.areaCodes ? ` ${country.areaCodes.join('/')}` : ''} ${country.name}`,
		searchTerms: searchNames(country.name)
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
	// The example is Indonesian: shown only for Indonesia, where it's the shape people write.
	const placeholder = $derived(countryName === DEFAULT_COUNTRY_NAME ? WHATSAPP.placeholder : '');
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

	// The code is only drawn once someone opens it: most people came to message a number.
	let qrOpen = $state(false);
	const modules = $derived(qrOpen && target ? qrModules(target.link) : undefined);

	/**
	 * The code as a PNG, drawn on a canvas here and handed over as a file: nothing is uploaded.
	 * Under it, below its white margin (which scanners need clear), what it's for and the number,
	 * so a printed code can be checked by eye and used by someone without a camera.
	 */
	async function saveQr() {
		if (!modules || !target) return;
		const scale = 24;
		const width = drawnSize(modules) * scale;
		const labelHeight = 176;
		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = width + labelHeight;
		const context = canvas.getContext('2d');
		if (!context) return;
		const font = 'Plus Jakarta Sans Variable';
		await Promise.all([
			document.fonts.load(`600 40px "${font}"`),
			document.fonts.load(`700 60px "${font}"`)
		]);
		context.fillStyle = '#ffffff';
		context.fillRect(0, 0, canvas.width, canvas.height);
		context.fillStyle = '#2b2b2b';
		context.textAlign = 'center';
		context.font = `600 40px "${font}", sans-serif`;
		// Both lines below the code's white margin (the image's top `width` pixels), which scanners
		// need clear: the first line's capitals start about 10px under it.
		context.fillText(WHATSAPP.qr.printLabel, width / 2, width + 40);
		context.font = `700 60px "${font}", sans-serif`;
		context.fillText(target.display, width / 2, width + 120, width - 2 * scale);
		// The path is in modules; each module is `scale` pixels.
		context.scale(scale, scale);
		context.fill(new Path2D(qrPath(modules)));
		const name = qrFileName(target.number);
		canvas.toBlob((blob) => {
			if (!blob) return;
			const url = URL.createObjectURL(blob);
			const link = Object.assign(document.createElement('a'), { href: url, download: name });
			link.click();
			setTimeout(() => URL.revokeObjectURL(url), 1000);
		}, 'image/png');
	}

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

<TitleBand
	title={WHATSAPP.name}
	introduction={WHATSAPP.introduction}
	width="max-w-xl"
	bandWidth="max-w-2xl"
/>

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
			<!-- One slot under the field, two lines tall, for whichever line has something to say: how a
			     number with its country is read (before anything's typed), what the number reads as, or
			     what's wrong. The result under it doesn't move when one gives way to another. -->
			<div class="mt-1.5 min-h-10 text-sm">
				{#if !typed.trim()}
					<p id="number-hint" class="text-muted">{WHATSAPP.hint}</p>
				{/if}
				<!-- What the number reads as: on a phone the keyboard covers the result below, and this
				     is the line to check against what was typed. -->
				{#if target}
					<p id="number-reads" class="text-muted tabular-nums">
						{WHATSAPP.reads(target.display, countryOfTarget)}
					</p>
				{/if}
				<p id="number-problem" class="font-medium" role="status">
					{#if problem}{WHATSAPP.problems[problem]}{/if}
				</p>
			</div>
		</div>

		<!-- The message goes in the link, so it comes before it: typed after the result, it changed a
		     link (and a QR code) above the person, out of sight. -->
		<div>
			<label for="message" class={label}>Message <span class="text-muted">(optional)</span></label>
			<textarea
				id="message"
				bind:value={message}
				rows="3"
				placeholder="Hi! I'd like to ask about…"
				class="{field} resize-y"></textarea>
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
					<!-- Side by side, each as wide as its words need, with less padding than a button on its
					     own (px-4! wins over the shared px-6) so both fit a phone; on the narrowest phones
					     Copy moves under Open rather than either breaking onto two lines. -->
					<div class="mt-4 flex flex-wrap gap-3">
						<a
							href={target.link}
							target="_blank"
							rel="external noopener noreferrer"
							class="{primaryButton} grow px-4! whitespace-nowrap"
						>
							Open in WhatsApp<span class="sr-only"> (opens in a new tab)</span>
						</a>
						<button
							type="button"
							onclick={copyLink}
							class="{secondaryButton} grow px-4! whitespace-nowrap"
						>
							<!-- Says it worked where the press was: the line under the result is far below
							     once the QR code is open, and stays for screen readers. -->
							{copied === 'yes' ? WHATSAPP.result.copied : WHATSAPP.result.copy}
						</button>
					</div>
					<p class="mt-3 font-mono text-xs break-all text-muted select-all">{target.link}</p>
					<!-- For someone making a link for their own number: where it goes, and a check before
					     it's printed, since a printed mistake can't be fixed. -->
					<p class="mt-3 text-sm text-muted">{WHATSAPP.result.useIt}</p>
					<details bind:open={qrOpen} class="group mt-2">
						<summary
							class="flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm font-medium [&::-webkit-details-marker]:hidden"
						>
							<Arrow class="group-open:rotate-90 motion-safe:transition-transform" />
							{WHATSAPP.qr.heading}
						</summary>
						{#if modules}
							<!-- Graphite on white in both themes: scanners read dark on light, and it's what prints. -->
							<svg
								viewBox="0 0 {drawnSize(modules)} {drawnSize(modules)}"
								role="img"
								aria-label={WHATSAPP.qr.alt(target.display)}
								shape-rendering="crispEdges"
								class="mt-2 w-full max-w-56 rounded-lg border border-border bg-white text-on-accent"
							>
								<path d={qrPath(modules)} fill="currentColor" />
							</svg>
							<button type="button" onclick={() => void saveQr()} class="{secondaryButton} mt-3"
								>{WHATSAPP.qr.save}</button
							>
						{/if}
					</details>
				</div>
			{:else}
				<p class="rounded-xl border border-dashed border-control-border p-4 text-sm text-muted">
					{WHATSAPP.result.empty}
				</p>
			{/if}
		</section>
		<!-- Takes no room until it has something to say: it's the last thing in the card. -->
		<p class="-mt-2 text-sm empty:mt-0" role="status">
			{#if copied === 'yes'}{WHATSAPP.result.linkCopied}{:else if copied === 'failed'}{WHATSAPP
					.result.copyFailed}{/if}
		</p>
	</form>
</section>
