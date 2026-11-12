<script lang="ts">
	// A minus or a plus, drawn with the arrow's stroke, for counting one fewer or one more. It's
	// decorative: the button around it is named for what it does.
	const { kind, class: className = '' }: { kind: 'fewer' | 'more'; class?: string } = $props();
</script>

<svg
	viewBox="0 0 20 20"
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="round"
	aria-hidden="true"
	class="inline-block size-[1em] shrink-0 {className}"
>
	<path d={kind === 'more' ? 'M4.5 10h11M10 4.5v11' : 'M4.5 10h11'} />
</svg>
