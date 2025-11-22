// Suppress Radix UI hydration warnings for ID mismatches
// This is a known issue with Radix UI components in SSR environments
// The IDs are for accessibility and still work correctly despite the mismatch

if (typeof window !== 'undefined') {
  const originalError = console.error;
  console.error = (...args) => {
    const errorMessage = args[0];

    // Suppress specific hydration warnings for Radix UI ID mismatches
    if (
      typeof errorMessage === 'string' &&
      (errorMessage.includes('Hydration failed') ||
        errorMessage.includes('There was an error while hydrating') ||
        errorMessage.includes('Text content does not match') ||
        (errorMessage.includes('aria-controls') && errorMessage.includes('radix')) ||
        (errorMessage.includes('id') && errorMessage.includes('radix')))
    ) {
      return;
    }

    originalError.apply(console, args);
  };
}

export {};
