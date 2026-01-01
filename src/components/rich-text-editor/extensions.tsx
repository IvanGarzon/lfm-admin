import { Color } from '@tiptap/extension-color';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import StarterKit from '@tiptap/starter-kit';
// import ListItem from '@tiptap/extension-list-item';
// import TextStyle from '@tiptap/extension-text-style';

// import { Commands } from './Menus/SuggestionsMenu/commandsExtension';
// import { suggestions } from './Menus/SuggestionsMenu/suggestions';
// import {
//   Image,
//   ImageDialog,
//   Pdf,
//   PdfDialog,
//   Video,
//   VideoDialog,
// } from './Extensions/customExtensions';

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
  // StarterKit already includes Document, so we don't need to add it separately
  // This was causing "Duplicate extension names found: ['doc']" warning
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
  // StarterKit includes a basic Link extension, but we use a custom one for more control
  // We need to disable StarterKit's link to avoid duplicates
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      class: 'text-primary underline',
    },
  }),
  // TextAlign.configure({
  //   types: ['heading', 'paragraph', 'image'],
  // }),
  // Image,
  // Commands.configure({
  //   suggestions,
  // }),
  // ImageDialog,
  // Video,
  // VideoDialog,
  // Youtube,
  // Pdf,
  // PdfDialog,
];

// Deprecated: Use createExtensions() instead
// This export is kept for backwards compatibility but will be removed
export const extensions = createExtensions();
