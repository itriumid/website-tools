<script lang="ts">
	import '../app.css';
	import { onNavigate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import lockupOnDark from '#lib/itrium-lockup-on-dark.svg';
	import lockupOnLight from '#lib/itrium-lockup-on-light.svg';
	import {
		EMAIL,
		GITHUB_URL,
		MAIN_SITE_URL,
		NO_TRACKING,
		NO_TRACKING_BILLS,
		SOURCE_URL
	} from '#lib/content.js';

	const { children } = $props();

	/** The header's and footer's links: small text, but 44px tall to a finger. */
	const link = 'inline-flex items-center transition-colors hover:text-text pointer-coarse:min-h-11';

	// Pages cross-fade into each other, like itrium.id's, for people who haven't asked for less
	// motion and in browsers that can.
	onNavigate((navigation) => {
		if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) {
			return;
		}
		return new Promise((done) => {
			document.startViewTransition(async () => {
				done();
				await navigation.complete;
			});
		});
	});
</script>

<a
	href="#main"
	class="absolute -top-full left-4 z-20 rounded-b-lg bg-accent px-4 py-2 font-semibold text-on-accent focus:top-0"
>
	Skip to content
</a>

<header class="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-6 sm:px-8">
	<a href={MAIN_SITE_URL} class="shrink-0" aria-label="Itrium's main site">
		<picture>
			<source srcset={lockupOnDark} media="(prefers-color-scheme: dark)" />
			<img src={lockupOnLight} alt="" width="131" height="40" class="h-10 w-auto" />
		</picture>
	</a>
	<nav aria-label="Main">
		<ul class="flex items-center gap-5 text-sm font-medium whitespace-nowrap text-muted sm:gap-7">
			<li>
				<a
					href={resolve('/')}
					aria-current={page.url.pathname === '/' ? 'page' : undefined}
					class="{link} aria-[current=page]:text-text">Free tools</a
				>
			</li>
			<li><a href={MAIN_SITE_URL} class={link}>About Itrium</a></li>
		</ul>
	</nav>
</header>

<!-- A size container, so a page can reach the screen's edges from inside its column (cqw), which
     100vw can't do without a desktop scrollbar's width of overflow. -->
<main id="main" class="@container">
	{@render children()}
</main>

<footer class="border-t border-border">
	<div
		class="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-10 text-sm text-muted sm:flex-row sm:justify-between sm:px-8"
	>
		<div class="space-y-2">
			<p>© {new Date().getFullYear()} Itrium</p>
			<!-- On the index, the closing panel says this in full, right above. -->
			{#if page.url.pathname === resolve('/split-bill')}<p>{NO_TRACKING_BILLS}</p>
			{:else if page.url.pathname !== '/'}<p>{NO_TRACKING}</p>{/if}
		</div>
		<ul class="flex shrink-0 gap-5 sm:flex-col sm:gap-2 sm:text-right">
			<li><a href="mailto:{EMAIL}" class={link}>{EMAIL}</a></li>
			<li>
				<a href={GITHUB_URL} rel="external" class={link}>GitHub</a>
			</li>
			<li>
				<a href={SOURCE_URL} rel="external" class={link}> This site's source </a>
			</li>
		</ul>
	</div>
</footer>
