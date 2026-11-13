<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import Arrow from '#lib/Arrow.svelte';
	import Seo from '#lib/Seo.svelte';
	import {
		DESCRIPTION,
		IN_PROGRESS,
		ELSEWHERE,
		ELSEWHERE_HEADING,
		HEADING,
		PROMISE,
		PROMISE_HEADING,
		SOURCE_LABEL,
		SOURCE_URL,
		SPLIT_BILL,
		TAGLINE,
		TITLE,
		TOOLS
	} from '#lib/content.js';
	import { actionLine, secondaryButton, sectionHeading } from '#lib/styles.js';
	import { loadDraft } from '#lib/draft.js';
	import { sharedFromHere } from '#lib/share.js';

	// A bill this visitor was in the middle of: the draft in this tab, or else the bills this
	// device shared. Read from what the browser already keeps, after the page loads: nothing new is
	// kept, and nothing is sent anywhere. The page is the same for everyone until then.
	// A draft is just said: the Split bill card right under it already opens it, and a second way
	// to the same place was noise. A shared bill gets its own way in, since it opens that bill.
	let inProgress: { text: string; action?: string; href?: string } | undefined = $state();
	// With a draft in this tab, Split bill's card is the way back to it, and says so.
	let hasDraft = $state(false);
	onMount(() => {
		if (loadDraft()) {
			inProgress = { text: IN_PROGRESS.draft };
			hasDraft = true;
			return;
		}
		const shared = sharedFromHere();
		if (shared.length) {
			inProgress = {
				text: IN_PROGRESS.shared(shared.length),
				action: shared.length === 1 ? IN_PROGRESS.openIt : IN_PROGRESS.openLatest,
				href: `${resolve('/split-bill')}#bill=${shared[0]}`
			};
		}
	});

	// A card that is a link: it lifts and takes a pink edge when a pointer touches it, and its
	// arrow moves on. The lift and the move wait for people who haven't asked for less motion.
	const cardLink =
		'group block h-full rounded-2xl border border-border bg-surface p-6 transition duration-200 hover:border-accent-edge motion-safe:hover:-translate-y-1';
	const arrowMove = 'transition-transform duration-200 motion-safe:group-hover:translate-x-1';
</script>

<Seo title={TITLE} description={DESCRIPTION} path="/" />

<section class="px-3 sm:px-5">
	<div class="band mx-auto max-w-6xl rounded-3xl">
		<!-- On a short phone (667px tall) the panel and the gap under it tighten, so the first card's
		     action is still on the first screen. -->
		<div class="mx-auto max-w-5xl px-6 py-8 sm:px-8 sm:py-16 [@media(max-height:44rem)]:py-6">
			<h1 class="text-5xl font-bold tracking-tight sm:text-7xl">{HEADING}</h1>
			<!-- The two jobs, in the text color: the first pink a visitor meets is something to press. -->
			<p
				class="mt-4 max-w-2xl text-xl leading-snug font-medium sm:mt-5 sm:text-3xl [@media(max-height:44rem)]:mt-3"
			>
				{TAGLINE}
			</p>
		</div>
	</div>
</section>

<div class="mx-auto max-w-5xl px-5 pb-16 sm:px-8 sm:pb-20">
	<!-- The space above the cards is this line's: it's there for everyone, and a returning visitor's
	     line appears in it after the page loads, so the cards never move under a finger reaching for
	     one. Up to two lines fit on a phone; on a short one the space is kept for the first card. -->
	<div
		class="flex min-h-16 items-center py-2 sm:min-h-20 [@media(max-height:44rem)]:min-h-8 [@media(max-height:44rem)]:py-1"
	>
		{#if inProgress}
			<p class="flex flex-wrap items-center gap-x-3">
				{inProgress.text}
				{#if inProgress.href}<a href={inProgress.href} class="group {actionLine}"
						>{inProgress.action}<Arrow class={arrowMove} /></a
					>{/if}
			</p>
		{/if}
	</div>
	<ul class="grid gap-5 sm:grid-cols-2">
		{#each TOOLS as tool (tool.path)}
			<li>
				<a href={resolve(tool.path)} class={cardLink}>
					<h2 class="text-xl font-semibold">{tool.name}</h2>
					<p class="mt-2 text-muted">{tool.summary}</p>
					<!-- What the tool makes, as it looks in the tool. It's a picture, so screen readers
					     skip it: the summary already says it. -->
					<!-- Under 36rem of height (an iPhone SE in Safari shows about 548px) the sample gives way,
					     so the card's action is still on the first screen; the summary says the same. -->
					<div class="mt-5 [@media(max-height:36rem)]:hidden" aria-hidden="true">
						<p class="text-sm text-muted">{tool.sampleCaption}</p>
						<div class="mt-2 divide-y divide-border rounded-xl bg-bg px-4 text-sm tabular-nums">
							{#each tool.sample as line (line.value)}
								<div class="flex justify-between gap-4 py-2">
									{#if line.label}<span>{line.label}</span>{/if}
									<span class={line.label ? 'font-semibold' : 'min-w-0 truncate'}>{line.value}</span
									>
								</div>
							{/each}
						</div>
					</div>
					<span class="mt-5 {actionLine}" aria-hidden="true"
						>{hasDraft && tool.path === SPLIT_BILL.path
							? IN_PROGRESS.continue
							: `Open ${tool.name}`}<Arrow class={arrowMove} /></span
					>
				</a>
			</li>
		{/each}
	</ul>

	<h2 class="mt-20 text-2xl font-bold tracking-tight sm:text-3xl">{ELSEWHERE_HEADING}</h2>
	<ul class="mt-8 grid gap-5 sm:grid-cols-2">
		<!-- While there's only one, it takes the whole row, text on one side and the way onward on the
		     other, instead of leaving half the row empty. -->
		{#each ELSEWHERE as app (app.url)}
			<li class={ELSEWHERE.length === 1 ? 'sm:col-span-2' : ''}>
				<a
					href={app.url}
					rel="external"
					class="{cardLink} {ELSEWHERE.length === 1
						? 'sm:flex sm:items-end sm:justify-between sm:gap-10'
						: ''}"
				>
					<div>
						<h3 class="text-xl font-semibold">{app.name}</h3>
						<p class="mt-2 max-w-2xl text-muted">{app.summary}</p>
					</div>
					<!-- Where it goes, shown: a site of its own, so the address is under the action. -->
					<span class="mt-5 block shrink-0 {ELSEWHERE.length === 1 ? 'sm:mt-0' : ''}">
						<span class={actionLine}>{app.label}<Arrow class={arrowMove} /></span>
						<span class="block text-sm text-muted">{new URL(app.url).host}</span>
					</span>
				</a>
			</li>
		{/each}
	</ul>
</div>

<!-- The closing panel: the promise, and the source that proves it. -->
<section class="px-3 pb-16 sm:px-5 sm:pb-20">
	<div class="band mx-auto max-w-6xl rounded-3xl">
		<div class="mx-auto max-w-5xl px-6 py-14 sm:px-8 sm:py-20">
			<h2 class={sectionHeading}>{PROMISE_HEADING}</h2>
			<ul class="mt-8 max-w-2xl divide-y divide-border border-y border-border text-lg">
				{#each PROMISE as line (line)}
					<li class="py-4 leading-relaxed">{line}</li>
				{/each}
			</ul>
			<a href={SOURCE_URL} rel="external" class="group mt-10 {secondaryButton}"
				>{SOURCE_LABEL}<Arrow class={arrowMove} /></a
			>
		</div>
	</div>
</section>
