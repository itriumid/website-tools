// How a searchable list answers what's typed: kept apart from the component so it can be tested.

interface Searchable {
	label: string;
	searchTerms: string;
}

/**
 * The choices that hold what's typed: first those with a word that is exactly it ("uk" finds the
 * United Kingdom, by its other name UK, before Ukraine), then those with a word starting with it
 * ("mal" finds Malaysia, the Maldives and Malta before Guatemala, and "62" finds "+62 Indonesia"
 * before any code that only has 62 inside it), then the rest. Within each group the list keeps
 * its own order.
 */
export function matchChoices<T extends Searchable>(choices: T[], typed: string): T[] {
	const query = typed.trim().toLowerCase();
	if (!query) return choices;
	const exact: T[] = [];
	const words: T[] = [];
	const inside: T[] = [];
	for (const choice of choices) {
		const text = `${choice.label} ${choice.searchTerms}`.toLowerCase();
		if (!text.includes(query)) continue;
		// A word starts at the beginning, or after a space, a plus, a bracket, a slash or a dash.
		const atWordStart = text
			.split(query)
			.slice(0, -1)
			.some((before) => before === '' || /[\s+(/-]$/.test(before));
		const isWord = text.split(/[\s+(/-]+/).includes(query);
		(isWord ? exact : atWordStart ? words : inside).push(choice);
	}
	return [...exact, ...words, ...inside];
}
