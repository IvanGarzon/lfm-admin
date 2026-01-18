import { AddressSchema, type AddressInput } from '@/schemas/address';

/**
 * Checks if the autocomplete address is valid. Change to your own validation logic.
 * @param {AddressInput} address - The address object to validate.
 * @param {string} searchInput - The search input string.
 * @returns {boolean} - Returns true if the autocomplete address is valid, otherwise false.
 */
export const isValidAutocomplete = (address: AddressInput, searchInput: string): boolean => {
  if (searchInput.trim() === '') {
    return true;
  }

  const result = AddressSchema.safeParse(address);
  return result.success;
};
