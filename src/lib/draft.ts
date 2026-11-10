// The bill being made, kept in this tab so it survives the page being reloaded: a phone often
// drops a page in the background while someone uses the camera or a text-recognition app, and
// the bill shouldn't go with it. It's kept in sessionStorage, on this device only: the browser
// clears it when the tab closes, and it's never sent anywhere. Storage can be missing or full (a
// private window, blocked site data): the tool still works without it, there's just no draft.

import { readBill, type BillState } from './split-bill';

const STORAGE_KEY = 'split-bill-draft';

/**
 * The shape of what's kept. A draft of any other version is ignored, so a later change to the
 * shape can't break a page that finds an old one: bump this when the shape changes, and read the
 * old version too if it's worth keeping.
 */
export const DRAFT_VERSION = 1;

export interface Draft {
	/** The address fragment when the draft was kept: a link's, when the bill came from one. */
	address: string;
	bill: BillState;
}

const isEmpty = (bill: BillState) =>
	bill.people.length === 0 && bill.items.length === 0 && !bill.adjustments?.length;

/** Keeps the bill as the tab's draft, or drops the draft when there's nothing on the bill. */
export function saveDraft(bill: BillState, address: string) {
	try {
		if (isEmpty(bill)) sessionStorage.removeItem(STORAGE_KEY);
		else
			sessionStorage.setItem(
				STORAGE_KEY,
				JSON.stringify({ version: DRAFT_VERSION, address, bill })
			);
	} catch {
		// Nowhere to keep it: see above.
	}
}

/** The tab's draft, checked like a link, or undefined if there's none it can read. */
export function loadDraft(): Draft | undefined {
	try {
		const kept: unknown = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null');
		if (typeof kept !== 'object' || kept === null) return undefined;
		const { version, address, bill } = kept as Record<string, unknown>;
		if (version !== DRAFT_VERSION || typeof address !== 'string') return undefined;
		const read = readBill(bill);
		return read && !isEmpty(read) ? { address, bill: read } : undefined;
	} catch {
		return undefined;
	}
}

export function clearDraft() {
	try {
		sessionStorage.removeItem(STORAGE_KEY);
	} catch {
		// Nothing was kept, then.
	}
}

/**
 * Which bill to show when the page opens: a link in the address wins over the draft, unless the
 * draft was made from that same link in this tab, and so is that bill with the changes made since.
 */
export function draftToOpen(draft: Draft | undefined, address: string, hasLink: boolean) {
	if (!draft) return undefined;
	if (hasLink && draft.address !== address) return undefined;
	return draft.bill;
}
