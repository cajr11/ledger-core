/**
 * A helper function that receives a country code and returns the ledger currency string.
 * Supported currencies: USD, MXN, COP, CAD, GHS, NGN (USDC intentionally skipped).
 * @param country - ISO 3166-1 alpha-2 country code
 * @returns Currency code string (e.g. 'USD')
 */

export default function convertCountryToCurrency(country: string): string {
  const code = country.trim().toUpperCase();

  switch (code) {
    // USD — United States and jurisdictions that use USD
    case 'US':
    case 'EC': // Ecuador
    case 'SV': // El Salvador
    case 'PA': // Panama
    case 'PR': // Puerto Rico
    case 'VI': // U.S. Virgin Islands
    case 'GU': // Guam
    case 'AS': // American Samoa
    case 'MP': // Northern Mariana Islands
    case 'UM': // U.S. Minor Outlying Islands
    case 'TL': // Timor-Leste
    case 'PW': // Palau
    case 'FM': // Micronesia
    case 'MH': // Marshall Islands
      return 'USD';

    case 'MX':
      return 'MXN';

    case 'CO':
      return 'COP';

    case 'CA':
      return 'CAD';

    case 'GH':
      return 'GHS';

    case 'NG':
      return 'NGN';

    default:
      throw new Error(`Unsupported country code: ${country}`);
  }
}

