// Digits as people type them, whatever their keyboard: Arabic and Persian keyboards type their own
// digits, and Chinese and Japanese ones can type full-width ones. Both parsers read only 0 to 9.

const ZEROS = [
	0x0660, // Arabic-Indic: ٠ to ٩
	0x06f0, // Eastern Arabic, as Persian and Urdu write them: ۰ to ۹
	0xff10 // Full-width: ０ to ９
];

// The marks typed beside those digits: the Arabic decimal and thousands marks, and full-width
// punctuation.
const MARKS: Record<string, string> = {
	'٫': '.',
	'٬': ',',
	'．': '.',
	'，': ',',
	'＋': '+',
	'－': '-'
};

/** The text with every digit as 0 to 9, and the marks typed with them as their usual ones. */
export function asciiDigits(text: string): string {
	return text.replace(/[٠-٩۰-۹０-９٫٬．，＋－]/g, (character) => {
		const point = character.codePointAt(0)!;
		const zero = ZEROS.find((start) => point >= start && point <= start + 9);
		return zero === undefined ? MARKS[character] : String(point - zero);
	});
}
