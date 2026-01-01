'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
// import StarterKit from '@tiptap/starter-kit';
// import Placeholder from '@tiptap/extension-placeholder';
// import Document from '@tiptap/extension-document';

import { createExtensions } from './extensions';
import { Header } from './header';

// import {
//   Bold,
//   Italic,
//   List,
//   ListOrdered,
//   Heading2,
//   Quote,
//   Strikethrough,
//   Redo,
//   Undo,
// } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  editable?: boolean;
}

export function RichTextEditor({
  value = '',
  onChange,
  onBlur,
  placeholder = 'Start typing...',
  className,
  editable = true,
}: RichTextEditorProps) {
  const initialValueSet = useRef(false);

  // extensions: [
  //   Document,
  //   StarterKit.configure({
  //     heading: {
  //       levels: [2, 3],
  //     },
  //     bulletList: {
  //       keepMarks: true,
  //       keepAttributes: false,
  //     },
  //     orderedList: {
  //       keepMarks: true,
  //       keepAttributes: false,
  //     },
  //   }),
  //   Placeholder.configure({
  //     placeholder,
  //     showOnlyWhenEditable: true,
  //     emptyEditorClass: 'is-editor-empty',
  //   }),
  // ],

  const editor = useEditor({
    extensions: createExtensions(placeholder),
    content: value || '',
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html === '<p></p>' ? '' : html);
    },
    onBlur: () => {
      onBlur?.();
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[100px] px-4 py-3',
          'prose-headings:font-semibold prose-h2:text-lg prose-h2:mt-4 prose-h2:mb-2',
          'prose-h3:text-base prose-h3:mt-3 prose-h3:mb-1',
          'prose-p:my-2 prose-p:leading-relaxed',
          'prose-ul:my-2 prose-ul:list-disc prose-ul:pl-6',
          'prose-ol:my-2 prose-ol:list-decimal prose-ol:pl-6',
          'prose-li:my-1',
          'prose-blockquote:border-l-4 prose-blockquote:border-gray-300 dark:prose-blockquote:border-gray-700',
          'prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:my-2',
          'prose-strong:font-semibold prose-em:italic',
          !editable && 'cursor-default',
        ),
      },
    },
  });

  // Only set initial value once when editor is first created
  useEffect(() => {
    if (!editor || initialValueSet.current) {
      return;
    }

    if (editor && value) {
      editor.commands.setContent(value);
      initialValueSet.current = true;
    }
  }, [editor, value]);

  if (!editor) {
    return null;
  }

  return (
    <div
      className={cn(
        'border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-white dark:bg-gray-950',
        'focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all',
        className,
      )}
    >
      {editable ? <Header editor={editor} /> : null}
      <EditorContent editor={editor} />
    </div>
  );
}
