/**
 * Motion utilities for framer-motion with reduced motion support
 * Ensures WCAG 2.3.3 compliance by respecting prefers-reduced-motion
 */

import type { Variants, Transition } from 'framer-motion';

/**
 * Get animation variants that respect reduced motion preference
 * When reduced motion is preferred, returns instant transitions
 */
export function getMotionVariants(variants: Variants, prefersReducedMotion: boolean): Variants {
  if (prefersReducedMotion) {
    // Return variants with no animation - instant state changes
    return Object.keys(variants).reduce((acc, key) => {
      acc[key] = {
        ...(typeof variants[key] === 'object' ? variants[key] : {}),
        transition: { duration: 0 },
      };
      return acc;
    }, {} as Variants);
  }
  return variants;
}

/**
 * Get transition config that respects reduced motion preference
 * When reduced motion is preferred, returns instant transition
 */
export function getMotionTransition(
  transition: Transition | undefined,
  prefersReducedMotion: boolean,
): Transition | undefined {
  if (prefersReducedMotion) {
    return { duration: 0 };
  }
  return transition;
}

/**
 * Common animation variants
 */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const slideDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0 },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
};
