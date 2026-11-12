<script lang="ts">
	// A warning sign, drawn with the arrow's stroke, beside something to check. It's decorative:
	// the words beside it say what to check.
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
	<path
		d="M10 7.5v3.5M10 14h.01M8.6 3.2 2.1 15a1.6 1.6 0 0 0 1.4 2.4h13a1.6 1.6 0 0 0 1.4-2.4L11.4 3.2a1.6 1.6 0 0 0-2.8 0Z"
	/>
</svg>
