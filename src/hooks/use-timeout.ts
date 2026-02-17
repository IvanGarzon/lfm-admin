'use client';

import { useEffect, useRef, useCallback } from 'react';

interface UseTimeoutReturn {
  /**
   * Set a timeout that will be automatically cleared on unmount.
   * Calling set() again will clear the previous timeout.
   */
  set: (callback: () => void, delay: number) => void;
  /** Clear the current timeout */
  clear: () => void;
}

/**
 * A hook that provides a safe setTimeout with automatic cleanup on unmount.
 * Prevents memory leaks and state updates on unmounted components.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const timeout = useTimeout();
 *
 *   const handleClick = () => {
 *     timeout.set(() => {
 *       // This won't run if component unmounts
 *       setSomeState(true);
 *     }, 1000);
 *   };
 *
 *   return <button onClick={handleClick}>Click me</button>;
 * }
 * ```
 */
export function useTimeout(): UseTimeoutReturn {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const set = useCallback(
    (callback: () => void, delay: number) => {
      clear();
      timeoutRef.current = setTimeout(callback, delay);
    },
    [clear],
  );

  return { set, clear };
}

/**
 * A hook that executes a callback after a delay, automatically cleaning up.
 * The callback runs once after the specified delay, unless dependencies change.
 *
 * @param callback - Function to execute after delay
 * @param delay - Delay in milliseconds. Pass null to disable the timeout.
 * @param deps - Additional dependencies that will reset the timeout
 *
 * @example
 * ```tsx
 * // Run once after 2 seconds
 * useTimeoutEffect(() => {
 *   console.log('2 seconds passed!');
 * }, 2000);
 *
 * // Disable timeout conditionally
 * useTimeoutEffect(() => {
 *   console.log('This runs if enabled');
 * }, isEnabled ? 1000 : null);
 * ```
 */
export function useTimeoutEffect(
  callback: () => void,
  delay: number | null,
  deps: React.DependencyList = [],
) {
  const savedCallback = useRef(callback);

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const id = setTimeout(() => savedCallback.current(), delay);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delay, ...deps]);
}
