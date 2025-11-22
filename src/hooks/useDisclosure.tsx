// import { useState, useCallback } from 'react';

// type UseDisclosureReturn = {
//   isOpen: boolean;
//   onOpen: () => void;
//   onClose: () => void;
//   toggle: () => void;
// };

// export function useDisclosure(initialState = false): UseDisclosureReturn {
//   const [isOpen, setIsOpen] = useState(initialState);

//   const onOpen = useCallback(() => setIsOpen(true), []);
//   const onClose = useCallback(() => setIsOpen(false), []);
//   const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

//   return { isOpen, onOpen, onClose, toggle };
// }

'use client';

import { useState, useCallback } from 'react';

interface UseDisclosureProps {
  isOpen?: boolean;
}

export function useDisclosure({ isOpen: defaultIsOpen = false }: UseDisclosureProps = {}) {
  const [isOpen, setIsOpen] = useState(defaultIsOpen);

  const onOpen = useCallback(() => setIsOpen(true), []);
  const onClose = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return { isOpen, onOpen, onClose, toggle };
}
