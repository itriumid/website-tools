// The WhatsApp click-to-chat tool's rules, kept apart from the page so they can be tested.

/** Only the digits of what was typed or pasted: spaces, dashes and brackets go. */
export function digitsOnly(text: string): string {
	return text.replace(/\D/g, '');
}

export interface ChatTarget {
	/** The full number as WhatsApp wants it: country code and number, digits only. */
	number: string;
	/** The same number, for people to read: "+62 8119710096". */
	display: string;
	/** The link that opens the chat, with the message typed in if there is one. */
	link: string;
}

/**
 * The chat to open for a number typed or pasted into the box, in the country chosen.
 *
 * A number that starts with "+" already has its country code, so it's used as it is. Any other
 * is a local number: a leading 0, the "trunk prefix" many countries dial first, is dropped, and
 * the chosen country's code goes in front. Undefined until there's a digit to go on.
 */
export function chatTarget(
	countryCode: string,
	typed: string,
	message: string
): ChatTarget | undefined {
	const digits = digitsOnly(typed);
	if (!digits) return undefined;
	const international = typed.trim().startsWith('+');
	const local = digits.replace(/^0/, '');
	const number = international ? digits : `${countryCode}${local}`;
	if (!local && !international) return undefined;
	const text = message.trim();
	return {
		number,
		display: international ? `+${digits}` : `+${countryCode} ${local}`,
		link: `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ''}`
	};
}
