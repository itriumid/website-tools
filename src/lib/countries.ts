export interface Country {
	name: string;
	phoneCode: string;
	currencyCode: string;
	currencySymbol: string;
}

export const COUNTRIES: Country[] = [
	{ name: 'Afghanistan', phoneCode: '93', currencyCode: 'AFN', currencySymbol: '؋' },
	{ name: 'Albania', phoneCode: '355', currencyCode: 'ALL', currencySymbol: 'L' },
	{ name: 'Algeria', phoneCode: '213', currencyCode: 'DZD', currencySymbol: 'د.ج' },
	{ name: 'Argentina', phoneCode: '54', currencyCode: 'ARS', currencySymbol: '$' },
	{ name: 'Armenia', phoneCode: '374', currencyCode: 'AMD', currencySymbol: '֏' },
	{ name: 'Australia', phoneCode: '61', currencyCode: 'AUD', currencySymbol: 'A$' },
	{ name: 'Austria', phoneCode: '43', currencyCode: 'EUR', currencySymbol: '€' },
	{ name: 'Azerbaijan', phoneCode: '994', currencyCode: 'AZN', currencySymbol: '₼' },
	{ name: 'Bahrain', phoneCode: '973', currencyCode: 'BHD', currencySymbol: '.د.ب' },
	{ name: 'Bangladesh', phoneCode: '880', currencyCode: 'BDT', currencySymbol: '৳' },
	{ name: 'Belarus', phoneCode: '375', currencyCode: 'BYN', currencySymbol: 'Br' },
	{ name: 'Belgium', phoneCode: '32', currencyCode: 'EUR', currencySymbol: '€' },
	{ name: 'Bolivia', phoneCode: '591', currencyCode: 'BOB', currencySymbol: 'Bs.' },
	{
		name: 'Bosnia and Herzegovina',
		phoneCode: '387',
		currencyCode: 'BAM',
		currencySymbol: 'KM'
	},
	{ name: 'Brazil', phoneCode: '55', currencyCode: 'BRL', currencySymbol: 'R$' },
	{ name: 'Brunei', phoneCode: '673', currencyCode: 'BND', currencySymbol: 'B$' },
	{ name: 'Bulgaria', phoneCode: '359', currencyCode: 'BGN', currencySymbol: 'лв' },
	{ name: 'Cambodia', phoneCode: '855', currencyCode: 'KHR', currencySymbol: '៛' },
	{ name: 'Canada', phoneCode: '1', currencyCode: 'CAD', currencySymbol: 'C$' },
	{ name: 'Chile', phoneCode: '56', currencyCode: 'CLP', currencySymbol: '$' },
	{ name: 'China', phoneCode: '86', currencyCode: 'CNY', currencySymbol: '¥' },
	{ name: 'Colombia', phoneCode: '57', currencyCode: 'COP', currencySymbol: '$' },
	{ name: 'Costa Rica', phoneCode: '506', currencyCode: 'CRC', currencySymbol: '₡' },
	{ name: 'Croatia', phoneCode: '385', currencyCode: 'EUR', currencySymbol: '€' },
	{ name: 'Cuba', phoneCode: '53', currencyCode: 'CUP', currencySymbol: '$' },
	{ name: 'Cyprus', phoneCode: '357', currencyCode: 'EUR', currencySymbol: '€' },
	{
		name: 'Czech Republic',
		phoneCode: '420',
		currencyCode: 'CZK',
		currencySymbol: 'Kč'
	},
	{ name: 'Denmark', phoneCode: '45', currencyCode: 'DKK', currencySymbol: 'kr' },
	{
		name: 'Dominican Republic',
		phoneCode: '1809',
		currencyCode: 'DOP',
		currencySymbol: 'RD$'
	},
	{ name: 'Ecuador', phoneCode: '593', currencyCode: 'USD', currencySymbol: '$' },
	{ name: 'Egypt', phoneCode: '20', currencyCode: 'EGP', currencySymbol: 'E£' },
	{ name: 'Estonia', phoneCode: '372', currencyCode: 'EUR', currencySymbol: '€' },
	{ name: 'Ethiopia', phoneCode: '251', currencyCode: 'ETB', currencySymbol: 'Br' },
	{ name: 'Finland', phoneCode: '358', currencyCode: 'EUR', currencySymbol: '€' },
	{ name: 'France', phoneCode: '33', currencyCode: 'EUR', currencySymbol: '€' },
	{ name: 'Georgia', phoneCode: '995', currencyCode: 'GEL', currencySymbol: '₾' },
	{ name: 'Germany', phoneCode: '49', currencyCode: 'EUR', currencySymbol: '€' },
	{ name: 'Ghana', phoneCode: '233', currencyCode: 'GHS', currencySymbol: 'GH₵' },
	{ name: 'Greece', phoneCode: '30', currencyCode: 'EUR', currencySymbol: '€' },
	{ name: 'Guatemala', phoneCode: '502', currencyCode: 'GTQ', currencySymbol: 'Q' },
	{ name: 'Hong Kong', phoneCode: '852', currencyCode: 'HKD', currencySymbol: 'HK$' },
	{ name: 'Hungary', phoneCode: '36', currencyCode: 'HUF', currencySymbol: 'Ft' },
	{ name: 'Iceland', phoneCode: '354', currencyCode: 'ISK', currencySymbol: 'kr' },
	{ name: 'India', phoneCode: '91', currencyCode: 'INR', currencySymbol: '₹' },
	{ name: 'Indonesia', phoneCode: '62', currencyCode: 'IDR', currencySymbol: 'Rp' },
	{ name: 'Iran', phoneCode: '98', currencyCode: 'IRR', currencySymbol: '﷼' },
	{ name: 'Iraq', phoneCode: '964', currencyCode: 'IQD', currencySymbol: 'ع.د' },
	{ name: 'Ireland', phoneCode: '353', currencyCode: 'EUR', currencySymbol: '€' },
	{ name: 'Israel', phoneCode: '972', currencyCode: 'ILS', currencySymbol: '₪' },
	{ name: 'Italy', phoneCode: '39', currencyCode: 'EUR', currencySymbol: '€' },
	{ name: 'Jamaica', phoneCode: '1876', currencyCode: 'JMD', currencySymbol: 'J$' },
	{ name: 'Japan', phoneCode: '81', currencyCode: 'JPY', currencySymbol: '¥' },
	{ name: 'Jordan', phoneCode: '962', currencyCode: 'JOD', currencySymbol: 'د.ا' },
	{ name: 'Kazakhstan', phoneCode: '7', currencyCode: 'KZT', currencySymbol: '₸' },
	{ name: 'Kenya', phoneCode: '254', currencyCode: 'KES', currencySymbol: 'KSh' },
	{ name: 'Kuwait', phoneCode: '965', currencyCode: 'KWD', currencySymbol: 'د.ك' },
	{ name: 'Laos', phoneCode: '856', currencyCode: 'LAK', currencySymbol: '₭' },
	{ name: 'Latvia', phoneCode: '371', currencyCode: 'EUR', currencySymbol: '€' },
	{ name: 'Lebanon', phoneCode: '961', currencyCode: 'LBP', currencySymbol: 'ل.ل' },
	{ name: 'Libya', phoneCode: '218', currencyCode: 'LYD', currencySymbol: 'ل.د' },
	{ name: 'Lithuania', phoneCode: '370', currencyCode: 'EUR', currencySymbol: '€' },
	{ name: 'Luxembourg', phoneCode: '352', currencyCode: 'EUR', currencySymbol: '€' },
	{ name: 'Macau', phoneCode: '853', currencyCode: 'MOP', currencySymbol: 'MOP$' },
	{ name: 'Malaysia', phoneCode: '60', currencyCode: 'MYR', currencySymbol: 'RM' },
	{ name: 'Maldives', phoneCode: '960', currencyCode: 'MVR', currencySymbol: 'Rf' },
	{ name: 'Malta', phoneCode: '356', currencyCode: 'EUR', currencySymbol: '€' },
	{ name: 'Mexico', phoneCode: '52', currencyCode: 'MXN', currencySymbol: 'MX$' },
	{ name: 'Mongolia', phoneCode: '976', currencyCode: 'MNT', currencySymbol: '₮' },
	{ name: 'Morocco', phoneCode: '212', currencyCode: 'MAD', currencySymbol: 'د.م.' },
	{ name: 'Myanmar', phoneCode: '95', currencyCode: 'MMK', currencySymbol: 'K' },
	{ name: 'Nepal', phoneCode: '977', currencyCode: 'NPR', currencySymbol: 'रू' },
	{ name: 'Netherlands', phoneCode: '31', currencyCode: 'EUR', currencySymbol: '€' },
	{ name: 'New Zealand', phoneCode: '64', currencyCode: 'NZD', currencySymbol: 'NZ$' },
	{ name: 'Nigeria', phoneCode: '234', currencyCode: 'NGN', currencySymbol: '₦' },
	{ name: 'North Korea', phoneCode: '850', currencyCode: 'KPW', currencySymbol: '₩' },
	{ name: 'Norway', phoneCode: '47', currencyCode: 'NOK', currencySymbol: 'kr' },
	{ name: 'Oman', phoneCode: '968', currencyCode: 'OMR', currencySymbol: 'ر.ع.' },
	{ name: 'Pakistan', phoneCode: '92', currencyCode: 'PKR', currencySymbol: '₨' },
	{ name: 'Palestine', phoneCode: '970', currencyCode: 'ILS', currencySymbol: '₪' },
	{ name: 'Panama', phoneCode: '507', currencyCode: 'PAB', currencySymbol: 'B/.' },
	{ name: 'Paraguay', phoneCode: '595', currencyCode: 'PYG', currencySymbol: '₲' },
	{ name: 'Peru', phoneCode: '51', currencyCode: 'PEN', currencySymbol: 'S/.' },
	{ name: 'Philippines', phoneCode: '63', currencyCode: 'PHP', currencySymbol: '₱' },
	{ name: 'Poland', phoneCode: '48', currencyCode: 'PLN', currencySymbol: 'zł' },
	{ name: 'Portugal', phoneCode: '351', currencyCode: 'EUR', currencySymbol: '€' },
	{ name: 'Qatar', phoneCode: '974', currencyCode: 'QAR', currencySymbol: 'ر.ق' },
	{ name: 'Romania', phoneCode: '40', currencyCode: 'RON', currencySymbol: 'lei' },
	{ name: 'Russia', phoneCode: '7', currencyCode: 'RUB', currencySymbol: '₽' },
	{
		name: 'Saudi Arabia',
		phoneCode: '966',
		currencyCode: 'SAR',
		currencySymbol: 'ر.س'
	},
	{ name: 'Serbia', phoneCode: '381', currencyCode: 'RSD', currencySymbol: 'din.' },
	{ name: 'Singapore', phoneCode: '65', currencyCode: 'SGD', currencySymbol: 'S$' },
	{ name: 'Slovakia', phoneCode: '421', currencyCode: 'EUR', currencySymbol: '€' },
	{ name: 'Slovenia', phoneCode: '386', currencyCode: 'EUR', currencySymbol: '€' },
	{ name: 'South Africa', phoneCode: '27', currencyCode: 'ZAR', currencySymbol: 'R' },
	{ name: 'South Korea', phoneCode: '82', currencyCode: 'KRW', currencySymbol: '₩' },
	{ name: 'Spain', phoneCode: '34', currencyCode: 'EUR', currencySymbol: '€' },
	{ name: 'Sri Lanka', phoneCode: '94', currencyCode: 'LKR', currencySymbol: 'Rs' },
	{ name: 'Sweden', phoneCode: '46', currencyCode: 'SEK', currencySymbol: 'kr' },
	{ name: 'Switzerland', phoneCode: '41', currencyCode: 'CHF', currencySymbol: 'CHF' },
	{ name: 'Taiwan', phoneCode: '886', currencyCode: 'TWD', currencySymbol: 'NT$' },
	{ name: 'Tanzania', phoneCode: '255', currencyCode: 'TZS', currencySymbol: 'TSh' },
	{ name: 'Thailand', phoneCode: '66', currencyCode: 'THB', currencySymbol: '฿' },
	{ name: 'Timor-Leste', phoneCode: '670', currencyCode: 'USD', currencySymbol: '$' },
	{ name: 'Turkey', phoneCode: '90', currencyCode: 'TRY', currencySymbol: '₺' },
	{ name: 'UAE', phoneCode: '971', currencyCode: 'AED', currencySymbol: 'د.إ' },
	{ name: 'Uganda', phoneCode: '256', currencyCode: 'UGX', currencySymbol: 'USh' },
	{ name: 'Ukraine', phoneCode: '380', currencyCode: 'UAH', currencySymbol: '₴' },
	{ name: 'United Kingdom', phoneCode: '44', currencyCode: 'GBP', currencySymbol: '£' },
	{ name: 'United States', phoneCode: '1', currencyCode: 'USD', currencySymbol: '$' },
	{ name: 'Uruguay', phoneCode: '598', currencyCode: 'UYU', currencySymbol: '$U' },
	{ name: 'Uzbekistan', phoneCode: '998', currencyCode: 'UZS', currencySymbol: "so'm" },
	{ name: 'Venezuela', phoneCode: '58', currencyCode: 'VES', currencySymbol: 'Bs.' },
	{ name: 'Vietnam', phoneCode: '84', currencyCode: 'VND', currencySymbol: '₫' },
	{ name: 'Yemen', phoneCode: '967', currencyCode: 'YER', currencySymbol: '﷼' },
	{ name: 'Zimbabwe', phoneCode: '263', currencyCode: 'ZWL', currencySymbol: 'Z$' }
];

/**
 * Deduplicated list of currencies derived from the countries list.
 * Useful for currency selector dropdowns.
 */
export const CURRENCIES = (() => {
	const seen = new Set<string>();
	const result: { code: string; symbol: string; countries: string[] }[] = [];

	for (const country of COUNTRIES) {
		if (!seen.has(country.currencyCode)) {
			seen.add(country.currencyCode);
			result.push({
				code: country.currencyCode,
				symbol: country.currencySymbol,
				countries: [country.name]
			});
		} else {
			const existing = result.find((currency) => currency.code === country.currencyCode);
			if (existing) {
				existing.countries.push(country.name);
			}
		}
	}

	return result;
})();

/** The country chosen before anyone chooses. */
export const DEFAULT_COUNTRY_NAME = 'Indonesia';

/** Default currency code for Indonesia */
export const DEFAULT_CURRENCY_CODE = 'IDR';
