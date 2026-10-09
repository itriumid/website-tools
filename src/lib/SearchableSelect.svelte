<script lang="ts" module>
	export interface Choice {
		value: string;
		label: string;
		/** A second line in muted text, such as the countries that use a currency. */
		detail?: string;
		/** What typing matches against, besides the label. */
		searchTerms: string;
	}
</script>

<script lang="ts">
	import { field } from '#lib/styles.js';

	interface Props {
		/** The id of the box, so a <label for> can name it. */
		id: string;
		choices: Choice[];
		value: string;
		onchange: (value: string) => void;
		placeholder?: string;
	}

	const { id, choices, value, onchange, placeholder = 'Type to search' }: Props = $props();

	const listId = $derived(`${id}-list`);
	const optionId = (index: number) => `${id}-option-${index}`;

	const selected = $derived(choices.find((choice) => choice.value === value));

	let open = $state(false);
	let text = $state('');
	// Until someone types, the list shows every choice: the box holds the current one as a reminder.
	let typed = $state(false);
	let active = $state(-1);

	const shown = $derived.by(() => {
		const query = text.trim().toLowerCase();
		if (!typed || !query) return choices;
		return choices.filter((choice) =>
			`${choice.label} ${choice.searchTerms}`.toLowerCase().includes(query)
		);
	});

	function openList(select?: HTMLInputElement) {
		open = true;
		typed = false;
		text = selected?.label ?? '';
		active = Math.max(
			0,
			choices.findIndex((choice) => choice.value === value)
		);
		select?.select();
	}

	function closeList() {
		open = false;
		typed = false;
		active = -1;
	}

	function choose(choice: Choice) {
		onchange(choice.value);
		closeList();
	}

	function onkeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			if (!open) openList(event.currentTarget as HTMLInputElement);
			else active = Math.min(active + 1, shown.length - 1);
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			if (open) active = Math.max(active - 1, 0);
		} else if (event.key === 'Enter' && open) {
			// Enter inside a form would otherwise submit it.
			event.preventDefault();
			if (shown[active]) choose(shown[active]);
		} else if (event.key === 'Escape' && open) {
			event.preventDefault();
			closeList();
		}
	}

	// Keep the highlighted choice in view as the arrow keys move through a long list.
	$effect(() => {
		if (open && active >= 0) {
			document.getElementById(optionId(active))?.scrollIntoView({ block: 'nearest' });
		}
	});
</script>

<div class="relative">
	<input
		{id}
		type="text"
		role="combobox"
		autocomplete="off"
		spellcheck="false"
		aria-autocomplete="list"
		aria-expanded={open}
		aria-controls={listId}
		aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
		{placeholder}
		class="{field} pr-9"
		value={open ? text : (selected?.label ?? '')}
		onfocus={(event) => event.currentTarget.select()}
		onclick={(event) => !open && openList(event.currentTarget)}
		oninput={(event) => {
			open = true;
			typed = true;
			text = event.currentTarget.value;
			active = 0;
		}}
		{onkeydown}
		onblur={closeList}
	/>
	<svg
		class="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted"
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		viewBox="0 0 24 24"
		stroke="currentColor"
		stroke-width="2"
		aria-hidden="true"
	>
		<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
	</svg>

	<!-- Pressing a choice must not take focus from the box, or the list would close before the press. -->
	<ul
		id={listId}
		role="listbox"
		aria-label="Choices"
		hidden={!open}
		class="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-control-border bg-surface p-1 shadow-lg"
		onmousedown={(event) => event.preventDefault()}
	>
		{#each shown as choice, index (choice.value)}
			<li
				id={optionId(index)}
				role="option"
				tabindex="-1"
				aria-selected={choice.value === value}
				class="cursor-pointer rounded-md px-3 py-2 text-sm {index === active
					? 'bg-accent text-on-accent'
					: 'hover:bg-bg'}"
				onmousedown={() => choose(choice)}
				onmouseenter={() => (active = index)}
			>
				<span class={choice.value === value ? 'font-semibold' : ''}>
					{#if choice.value === value}<span aria-hidden="true">✓ </span>{/if}{choice.label}
				</span>
				{#if choice.detail}
					<span class="block text-xs {index === active ? 'text-on-accent' : 'text-muted'}">
						{choice.detail}
					</span>
				{/if}
			</li>
		{:else}
			<li class="px-3 py-4 text-center text-sm text-muted" role="presentation">No match</li>
		{/each}
	</ul>
	<p class="sr-only" role="status">{open ? `${shown.length} choices` : ''}</p>
</div>
