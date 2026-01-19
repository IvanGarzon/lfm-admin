/**
 * Update and format the address string with the given components.
 * Parses the adr_address HTML string from Google Places API and updates it
 * with user-edited values.
 */
export function updateAndFormatAddress(
  addressString: string,
  addressComponents: {
    'street-address': string;
    address2: string;
    locality: string;
    region: string;
    'postal-code': string;
  },
) {
  let updatedAddressString = addressString;

  // Replace each class content with its corresponding value
  Object.entries(addressComponents).forEach(([key, value]) => {
    if (key !== 'address2') {
      const regex = new RegExp(`(<span class="${key}">)[^<]*(</span>)`, 'g');
      updatedAddressString = updatedAddressString.replace(regex, `$1${value}$2`);
    }
  });

  // Remove all span tags
  updatedAddressString = updatedAddressString.replace(/<\/?span[^>]*>/g, '');

  // Add address2 just after address1 if provided
  if (addressComponents.address2) {
    const address1Regex = new RegExp(`${addressComponents['street-address']}`);
    updatedAddressString = updatedAddressString.replace(
      address1Regex,
      `${addressComponents['street-address']}, ${addressComponents.address2}`,
    );
  }

  // Clean up any extra spaces or commas
  updatedAddressString = updatedAddressString
    .replace(/,\s*,/g, ',')
    .trim()
    .replace(/\s\s+/g, ' ')
    .replace(/,\s*$/, '');

  return updatedAddressString;
}
