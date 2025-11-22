import { Color } from '@tiptap/extension-color';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import StarterKit from '@tiptap/starter-kit';
import Document from '@tiptap/extension-document';
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

export const extensions = [
  // Color.configure({ types: [TextStyle.name, ListItem.name] }),
  // TextStyle,
  Document,
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
    placeholder: 'Start typing...',
    showOnlyWhenEditable: true,
    emptyEditorClass: 'is-editor-empty',
  }),
  // TextAlign.configure({
  //   types: ['heading', 'paragraph', 'image'],
  // }),
  Link,
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
