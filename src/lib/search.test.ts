import { describe, expect, it } from 'vitest';
import { COUNTRIES, searchNames } from './countries';
import { matchChoices } from './search';

const countries = [
	{ label: '+502 Guatemala', searchTerms: 'Guatemala' },
	{ label: '+60 Malaysia', searchTerms: 'Malaysia' },
	{ label: '+960 Maldives', searchTerms: 'Maldives' },
	{ label: '+356 Malta', searchTerms: 'Malta' },
	{ label: '+62 Indonesia', searchTerms: 'Indonesia' },
	{ label: '+262 Réunion', searchTerms: 'Réunion' }
];
const labels = (typed: string) => matchChoices(countries, typed).map((choice) => choice.label);

describe('matchChoices', () => {
	it('puts names that start with what was typed first', () => {
		expect(labels('mal')).toEqual([
			'+60 Malaysia',
			'+960 Maldives',
			'+356 Malta',
			'+502 Guatemala'
		]);
	});

	it('puts a code that starts with the digits before one that only holds them', () => {
		expect(labels('62')).toEqual(['+62 Indonesia', '+262 Réunion']);
		expect(labels('+62')).toEqual(['+62 Indonesia']);
	});

	it('shows everything for nothing typed, and nothing for what nobody has', () => {
		expect(matchChoices(countries, '  ')).toHaveLength(countries.length);
		expect(labels('xyz')).toEqual([]);
	});

	it('ignores case and the space around what was typed', () => {
		expect(labels(' MALAY ')).toEqual(['+60 Malaysia']);
	});
});

describe('matchChoices with the names countries go by', () => {
	const choices = COUNTRIES.map((country) => ({
		label: country.name,
		searchTerms: searchNames(country.name)
	}));
	const first = (typed: string) => matchChoices(choices, typed)[0]?.label;

	it('finds a country by what people call it', () => {
		expect(first('uk')).toBe('United Kingdom');
		expect(first('usa')).toBe('United States');
		expect(first('uae')).toBe('United Arab Emirates');
		expect(first('holland')).toBe('Netherlands');
	});

	it('finds a country by its name in Indonesian', () => {
		expect(first('jepang')).toBe('Japan');
		expect(first('inggris')).toBe('United Kingdom');
		expect(first('korea selatan')).toBe('South Korea');
	});

	it('still lists a country whose own name starts with what was typed', () => {
		expect(matchChoices(choices, 'uk').map((choice) => choice.label)).toContain('Ukraine');
	});
});
