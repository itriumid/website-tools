<script lang="ts">
	import { resolve } from '$app/paths';
	import Seo from '#lib/Seo.svelte';
	import {
		DESCRIPTION,
		ELSEWHERE,
		ELSEWHERE_HEADING,
		HEADING,
		INTRODUCTION,
		TITLE,
		TOOLS
	} from '#lib/content.js';
</script>

<Seo title={TITLE} description={DESCRIPTION} path="/" />

<section class="mx-auto max-w-5xl px-5 pt-10 pb-20 sm:px-8">
	<h1 class="text-4xl font-bold tracking-tight sm:text-5xl">{HEADING}</h1>
	<p class="mt-5 max-w-2xl text-lg text-muted">{INTRODUCTION}</p>

	<ul class="mt-12 grid gap-5 sm:grid-cols-2">
		{#each TOOLS as tool (tool.path)}
			<li>
				<a
					href={resolve(tool.path)}
					class="block h-full rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-accent-edge"
				>
					<h2 class="text-xl font-semibold">{tool.name}</h2>
					<p class="mt-2 text-muted">{tool.summary}</p>
					<span class="mt-5 inline-block font-medium underline underline-offset-4"
						>Open the tool</span
					>
				</a>
			</li>
		{/each}
	</ul>

	<h2 class="mt-16 text-sm font-semibold tracking-widest text-muted uppercase">
		{ELSEWHERE_HEADING}
	</h2>
	<ul class="mt-6 grid gap-5 sm:grid-cols-2">
		{#each ELSEWHERE as app (app.url)}
			<li>
				<a
					href={app.url}
					rel="external"
					class="block h-full rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-accent-edge"
				>
					<h3 class="text-xl font-semibold">{app.name}</h3>
					<p class="mt-2 text-muted">{app.summary}</p>
					<span class="mt-5 inline-block font-medium underline underline-offset-4"
						><span aria-hidden="true">{app.label}</span><span class="sr-only"
							>{app.label} at {new URL(app.url).host}</span
						></span
					>
				</a>
			</li>
		{/each}
	</ul>
</section>
