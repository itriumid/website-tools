<!--
	An explanation that stays out of the way until someone asks for it: an ⓘ button that shows a
	short text below it. Not a hover tooltip, which a phone can't open and a keyboard can't reach;
	a press, a tap or Enter opens it, and the same again or Escape closes it. The text appears in a
	polite live region, so screen readers say it when it opens.

	Put it in a row with `flex flex-wrap`: the text takes the whole width, on the line below.
-->
<script lang="ts">
	interface Props {
		/** What the button is called: "About tax on service". */
		label: string;
		text: string;
	}

	const { label, text }: Props = $props();
	const id = $props.id();

	let open = $state(false);
	let button: HTMLButtonElement | undefined = $state();
	let region: HTMLElement | undefined = $state();

	function close(event: Event) {
		if (!open) return;
		if (event instanceof KeyboardEvent) {
			if (event.key !== 'Escape') return;
			open = false;
			button?.focus();
			return;
		}
		const target = event.target as Node;
		if (!button?.contains(target) && !region?.contains(target)) open = false;
	}
</script>

<svelte:window onkeydown={close} onclick={close} />

<button
	bind:this={button}
	type="button"
	aria-label={label}
	aria-expanded={open}
	aria-controls={id}
	onclick={() => (open = !open)}
	class="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-bg hover:text-text {open
		? 'text-text'
		: ''}"
>
	<svg
		class="size-4.5"
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		viewBox="0 0 24 24"
		stroke="currentColor"
		stroke-width="1.8"
		aria-hidden="true"
	>
		<circle cx="12" cy="12" r="9" />
		<path stroke-linecap="round" d="M12 11v5" />
		<circle cx="12" cy="7.75" r="0.6" fill="currentColor" />
	</svg>
</button>
<span
	bind:this={region}
	{id}
	role="status"
	class="block basis-full text-sm text-muted empty:hidden {open
		? 'mt-1 rounded-lg border-l-4 border-control-border bg-bg p-3'
		: ''}"
	>{#if open}{text}{/if}</span
>
