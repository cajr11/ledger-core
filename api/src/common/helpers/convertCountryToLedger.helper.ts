/**
 * A helper function that receives a country and converts it to a currency value
 * from the ledger type.
 * @param country - ISO 3166-1 alpha-2 country code
 * @returns
 */

import { Ledger } from 'src/types';

export default function convertCountryToLedger(country: string): Ledger {
  const code = country.trim().toUpperCase();

  switch (code) {
    // United States and jurisdictions that use USD as legal tender / primary
    case 'US':
    case 'EC': // Ecuador
    case 'SV': // El Salvador
    case 'PA': // Panama (USD alongside balboa)
    case 'PR': // Puerto Rico
      return Ledger.USD;

    case 'MX':
      return Ledger.MXN;

    case 'CO':
      return Ledger.COP;

    case 'CA':
      return Ledger.CAD;

    case 'GH':
      return Ledger.GHS;

    case 'NG':
      return Ledger.NGN;

    default:
      throw new Error(`Unsupported country code: ${country}`);
  }
}
