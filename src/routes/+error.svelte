<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import Arrow from '#lib/Arrow.svelte';
	import { SPLIT_BILL, WHATSAPP } from '#lib/content.js';

	// Where to go instead, as a ruled list in the panel, the same as itrium.id's error page.
	const destinations = [
		{ name: 'All the free tools', href: resolve('/') },
		{ name: SPLIT_BILL.name, href: resolve(SPLIT_BILL.path) },
		{ name: WHATSAPP.name, href: resolve(WHATSAPP.path) }
	];
</script>

<svelte:head>
	<title>{page.status === 404 ? 'Page not found' : 'Something went wrong'} · Itrium</title>
</svelte:head>

<section class="px-3 pb-16 sm:px-5 sm:pb-20">
	<div class="band mx-auto max-w-6xl rounded-3xl">
		<div class="mx-auto max-w-5xl px-6 py-14 sm:px-8 sm:py-20">
			<h1 class="text-5xl font-bold tracking-tight sm:text-7xl">
				{page.status === 404 ? "There's nothing here." : 'Something went wrong.'}
			</h1>
			<ul class="mt-10 max-w-2xl divide-y divide-border border-y border-border">
				{#each destinations as destination (destination.href)}
					<li>
						<a
							href={destination.href}
							class="group flex min-h-11 items-center justify-between gap-4 rounded-xl px-3 py-4 text-xl font-bold tracking-tight transition-colors hover:bg-surface"
							>{destination.name}<Arrow
								class="text-accent-text transition-transform duration-200 motion-safe:group-hover:translate-x-1"
							/></a
						>
					</li>
				{/each}
			</ul>
		</div>
	</div>
</section>
