<script lang="ts">
	// A check mark, drawn with the arrow's stroke, for what's selected or what matched. It's
	// decorative: the control's own state (aria-pressed, aria-selected) or words carry the meaning.
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
	<path d="M4 10.5 8 14.5 16 5.5" />
</svg>
