<script lang="ts">
	// The site's one arrow, drawn rather than typed, the same as itrium.id's, so it has the same
	// stroke wherever it points. It's decorative: the link's own words say where it goes.
	const { class: className = '' }: { class?: string } = $props();
</script>

<svg
	viewBox="0 0 20 20"
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
	class="inline-block size-[1em] shrink-0 {className}"
>
	<path d="M3.5 10h13M11 4.5 16.5 10 11 15.5" />
</svg>
