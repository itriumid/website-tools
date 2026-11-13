import { describe, expect, it } from 'vitest';
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
