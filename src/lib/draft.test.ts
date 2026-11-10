import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DRAFT_VERSION, clearDraft, draftToOpen, loadDraft, saveDraft } from './draft';
import type { BillState } from './split-bill';

const bill: BillState = {
	people: [{ id: 'a', name: 'Ayu' }],
	items: [{ id: 'i', name: 'Nasi', price: 25000, assignedPersonIds: ['a'] }],
	taxPercentage: 10,
	servicePercentage: 5,
	currencyCode: 'IDR',
	taxOnService: true
};
const empty: BillState = { ...bill, people: [], items: [] };

let kept: Map<string, string>;

beforeEach(() => {
	kept = new Map();
	vi.stubGlobal('sessionStorage', {
		getItem: (key: string) => kept.get(key) ?? null,
		setItem: (key: string, value: string) => void kept.set(key, value),
		removeItem: (key: string) => void kept.delete(key)
	});
});

describe('the draft', () => {
	it('keeps the bill and gives it back as it was', () => {
		saveDraft(bill, '');
		expect(loadDraft()).toEqual({ address: '', bill });
		saveDraft(bill, '#bill=0123456789ABCDEF');
		expect(loadDraft()?.address).toBe('#bill=0123456789ABCDEF');
	});

	it('keeps nothing for an empty bill, and drops what was kept', () => {
		saveDraft(bill, '');
		saveDraft(empty, '');
		expect(kept.size).toBe(0);
		expect(loadDraft()).toBeUndefined();
	});

	it('is gone once cleared', () => {
		saveDraft(bill, '');
		clearDraft();
		expect(loadDraft()).toBeUndefined();
	});

	it('marks what it keeps with its version, and ignores any other', () => {
		saveDraft(bill, '');
		const [value] = kept.values();
		expect(JSON.parse(value).version).toBe(DRAFT_VERSION);
		const other = (version: unknown) =>
			kept.set('split-bill-draft', JSON.stringify({ version, address: '', bill }));
		other(DRAFT_VERSION + 1);
		expect(loadDraft()).toBeUndefined();
		other(undefined);
		expect(loadDraft()).toBeUndefined();
	});

	it("ignores what isn't a draft, or isn't a bill", () => {
		const keep = (value: string) => kept.set('split-bill-draft', value);
		for (const value of [
			'not json',
			'null',
			'[]',
			JSON.stringify({ version: DRAFT_VERSION, address: 3, bill }),
			JSON.stringify({ version: DRAFT_VERSION, address: '', bill: { people: 'Ayu' } }),
			JSON.stringify({ version: DRAFT_VERSION, address: '', bill: empty })
		]) {
			keep(value);
			expect(loadDraft()).toBeUndefined();
		}
	});

	it('works without anywhere to keep it', () => {
		const blocked = () => {
			throw new Error('blocked');
		};
		vi.stubGlobal('sessionStorage', { getItem: blocked, setItem: blocked, removeItem: blocked });
		expect(() => saveDraft(bill, '')).not.toThrow();
		expect(() => clearDraft()).not.toThrow();
		expect(loadDraft()).toBeUndefined();
	});
});

describe('which bill opens', () => {
	const draft = { address: '', bill };

	it('opens the draft when the address has no link', () => {
		expect(draftToOpen(draft, '', false)).toBe(bill);
		expect(draftToOpen(undefined, '', false)).toBeUndefined();
	});

	it('lets a link in the address win over the draft', () => {
		expect(draftToOpen(draft, '#bill=0123456789ABCDEF', true)).toBeUndefined();
	});

	it('keeps the changes made to that same link in this tab', () => {
		const changed = { address: '#bill=0123456789ABCDEF', bill };
		expect(draftToOpen(changed, '#bill=0123456789ABCDEF', true)).toBe(bill);
		expect(draftToOpen(changed, '#bill=FEDCBA9876543210', true)).toBeUndefined();
	});
});
