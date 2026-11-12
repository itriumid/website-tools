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
	let inProgress: { text: string; action: string; href: string } | undefined = $state();
	onMount(() => {
		if (loadDraft()) {
			inProgress = {
				text: IN_PROGRESS.draft,
				action: IN_PROGRESS.carryOn,
				href: resolve('/split-bill')
			};
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
		<div class="mx-auto max-w-5xl px-6 py-10 sm:px-8 sm:py-16 [@media(max-height:44rem)]:py-6">
			<h1 class="text-5xl font-bold tracking-tight sm:text-7xl">{HEADING}</h1>
			<!-- The two jobs, in the text color: the first pink a visitor meets is something to press. -->
			<p
				class="mt-5 max-w-2xl text-2xl leading-snug font-medium sm:text-3xl [@media(max-height:44rem)]:mt-3"
			>
				{TAGLINE}
			</p>
		</div>
	</div>
</section>

<div class="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-20 [@media(max-height:44rem)]:pt-8">
	{#if inProgress}
		<p class="mb-5 flex flex-wrap items-center gap-x-3 gap-y-1">
			{inProgress.text}
			<a href={inProgress.href} class="group {actionLine}"
				>{inProgress.action}<Arrow class={arrowMove} /></a
			>
		</p>
	{/if}
	<ul class="grid gap-5 sm:grid-cols-2">
		{#each TOOLS as tool (tool.path)}
			<li>
				<a href={resolve(tool.path)} class={cardLink}>
					<h2 class="text-xl font-semibold">{tool.name}</h2>
					<p class="mt-2 text-muted">{tool.summary}</p>
					<!-- What the tool makes, as it looks in the tool. It's a picture, so screen readers
					     skip it: the summary already says it. -->
					<div class="mt-5" aria-hidden="true">
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
						>Open {tool.name}<Arrow class={arrowMove} /></span
					>
				</a>
			</li>
		{/each}
	</ul>

	<h2 class="mt-20 text-2xl font-bold tracking-tight sm:text-3xl">{ELSEWHERE_HEADING}</h2>
	<ul class="mt-8 grid gap-5 sm:grid-cols-2">
		{#each ELSEWHERE as app (app.url)}
			<li>
				<a href={app.url} rel="external" class={cardLink}>
					<h3 class="text-xl font-semibold">{app.name}</h3>
					<p class="mt-2 text-muted">{app.summary}</p>
					<span class="mt-5 {actionLine}"
						><span aria-hidden="true">{app.label}</span><span class="sr-only"
							>{app.label} at {new URL(app.url).host}</span
						><Arrow class={arrowMove} /></span
					>
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
