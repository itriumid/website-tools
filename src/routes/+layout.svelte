<script lang="ts">
	import '../app.css';
	import { resolve } from '$app/paths';
	import lockupOnDark from '#lib/itrium-lockup-on-dark.svg';
	import lockupOnLight from '#lib/itrium-lockup-on-light.svg';
	import {
		EMAIL,
		FOOTNOTE,
		GITHUB_URL,
		MAIN_SITE_URL,
		NO_TRACKING,
		SOURCE_URL
	} from '#lib/content.js';

	const { children } = $props();
</script>

<a
	href="#main"
	class="absolute -top-full left-4 z-20 rounded-b-lg bg-accent px-4 py-2 font-semibold text-on-accent focus:top-0"
>
	Skip to content
</a>

<header class="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-6 sm:px-8">
	<a href={MAIN_SITE_URL} class="shrink-0" aria-label="Itrium, home">
		<picture>
			<source srcset={lockupOnDark} media="(prefers-color-scheme: dark)" />
			<img src={lockupOnLight} alt="" width="131" height="40" class="h-10 w-auto" />
		</picture>
	</a>
	<nav aria-label="Main">
		<ul class="flex items-center gap-5 text-sm font-medium whitespace-nowrap text-muted sm:gap-7">
			<li><a href={resolve('/')} class="transition-colors hover:text-text">Free tools</a></li>
			<li><a href={MAIN_SITE_URL} class="transition-colors hover:text-text">About Itrium</a></li>
		</ul>
	</nav>
</header>

<main id="main">
	{@render children()}
</main>

<footer class="border-t border-border">
	<div
		class="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-10 text-sm text-muted sm:flex-row sm:justify-between sm:px-8"
	>
		<div class="space-y-2">
			<p>© {new Date().getFullYear()} Itrium</p>
			<p>{NO_TRACKING}</p>
			<p>{FOOTNOTE}</p>
		</div>
		<ul class="flex shrink-0 gap-5 sm:flex-col sm:gap-2 sm:text-right">
			<li><a href="mailto:{EMAIL}" class="transition-colors hover:text-text">{EMAIL}</a></li>
			<li>
				<a href={GITHUB_URL} rel="external" class="transition-colors hover:text-text">GitHub</a>
			</li>
			<li>
				<a href={SOURCE_URL} rel="external" class="transition-colors hover:text-text">
					This site's source
				</a>
			</li>
		</ul>
	</div>
</footer>
