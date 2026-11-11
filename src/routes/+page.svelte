<script lang="ts">
	import { resolve } from '$app/paths';
	import Arrow from '#lib/Arrow.svelte';
	import Seo from '#lib/Seo.svelte';
	import {
		DESCRIPTION,
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

	// A card that is a link: it lifts and takes a pink edge when a pointer touches it, and its
	// arrow moves on. The lift and the move wait for people who haven't asked for less motion.
	const cardLink =
		'group block h-full rounded-2xl border border-border bg-surface p-6 transition duration-200 hover:border-accent-edge motion-safe:hover:-translate-y-1';
	const arrowMove = 'transition-transform duration-200 motion-safe:group-hover:translate-x-1';
</script>

<Seo title={TITLE} description={DESCRIPTION} path="/" />

<section class="px-3 sm:px-5">
	<div class="band mx-auto max-w-6xl rounded-3xl">
		<div class="mx-auto max-w-5xl px-6 py-10 sm:px-8 sm:py-16">
			<h1 class="text-5xl font-bold tracking-tight sm:text-7xl">{HEADING}</h1>
			<!-- The two jobs, in the text color: the first pink a visitor meets is something to press. -->
			<p class="mt-5 max-w-2xl text-2xl leading-snug font-medium sm:text-3xl">{TAGLINE}</p>
		</div>
	</div>
</section>

<div class="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-20">
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

	<h2 class="mt-20 {sectionHeading}">{ELSEWHERE_HEADING}</h2>
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
