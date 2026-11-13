<script lang="ts">
	interface Props {
		title: string;
		introduction: string;
		/** The width of the tool under the band, so the title lines up with it: a max-w-* class. */
		width: string;
		/**
		 * How wide the band itself goes: a max-w-* class. Wide by default; a tool that's one narrow
		 * column narrows it, or on a wide screen it's a slab with a small form lost under it.
		 */
		bandWidth?: string;
	}

	const { title, introduction, width, bandWidth = 'max-w-6xl' }: Props = $props();
</script>

<!-- The top of a tool page: a slim graphite band holding the title and what the tool does, and
     nothing above the title. It's slim so the tool's first field stays on a phone's first screen. -->
<section class="px-3 sm:px-5">
	<div class="band mx-auto {bandWidth} rounded-3xl">
		<div class="mx-auto {width} px-5 py-8 sm:px-8 sm:py-12">
			<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
			<p class="mt-3 leading-relaxed text-muted">{introduction}</p>
		</div>
	</div>
</section>
