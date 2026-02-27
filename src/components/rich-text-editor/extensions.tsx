import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import StarterKit from '@tiptap/starter-kit';

/**
 * Creates a fresh set of TipTap extensions for each editor instance.
 * This prevents duplicate extension warnings and performance issues.
 *
 * IMPORTANT: Extensions must be created fresh for each editor to avoid:
 * - Duplicate extension name warnings
 * - Shared state between editors
 * - Memory leaks
 */
export const createExtensions = (placeholder?: string) => [
  StarterKit.configure({
    heading: {
      levels: [2, 3],
    },
    bulletList: {
      keepMarks: true,
      keepAttributes: false,
    },
    orderedList: {
      keepMarks: true,
      keepAttributes: false,
    },
  }),
  Placeholder.configure({
    placeholder: placeholder || 'Start typing...',
    showOnlyWhenEditable: true,
    emptyEditorClass: 'is-editor-empty',
  }),
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      class: 'text-primary underline',
    },
  }),
];

export const extensions = createExtensions();
