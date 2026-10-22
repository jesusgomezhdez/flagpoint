import type { Transition } from 'motion/react';

/** Resortes compartidos para que toda la UI se mueva con el mismo carácter. */
export const labelSpring: Transition = { type: 'spring', stiffness: 380, damping: 32, mass: 0.7 };
export const itemSpring: Transition = { type: 'spring', stiffness: 460, damping: 36, mass: 0.6 };
