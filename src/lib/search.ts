// How a searchable list answers what's typed: kept apart from the component so it can be tested.

interface Searchable {
	label: string;
	searchTerms: string;
}

/**
 * The choices that hold what's typed, those with a word starting with it first: "mal" finds
 * Malaysia, the Maldives and Malta before Guatemala, and "62" finds "+62 Indonesia" before any
 * code that only has 62 inside it. Within each group the list keeps its own order.
 */
export function matchChoices<T extends Searchable>(choices: T[], typed: string): T[] {
	const query = typed.trim().toLowerCase();
	if (!query) return choices;
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
		(atWordStart ? words : inside).push(choice);
	}
	return [...words, ...inside];
}
