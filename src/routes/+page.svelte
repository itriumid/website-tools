<script lang="ts">
	import { resolve } from '$app/paths';
	import Seo from '#lib/Seo.svelte';
	import { DESCRIPTION, HEADING, INTRODUCTION, TITLE, TOOLS } from '#lib/content.js';
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
</section>
