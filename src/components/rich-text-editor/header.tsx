import { useCallback } from 'react';
import { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Quote,
  Strikethrough,
  Redo,
  Undo,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const Header = ({ editor }: { editor: Editor }) => {
  const toggleRedo = useCallback(() => {
    editor?.chain().focus().redo().run();
  }, [editor]);

  const toggleUndo = useCallback(() => {
    editor?.chain().focus().undo().run();
  }, [editor]);

  const toggleBold = useCallback(() => {
    editor?.chain().focus().toggleBold().run();
  }, [editor]);

  const toggleItalic = useCallback(() => {
    editor?.chain().focus().toggleItalic().run();
  }, [editor]);

  const toggleStrike = useCallback(() => {
    editor?.chain().focus().toggleStrike().run();
  }, [editor]);

  const toggleHeading = useCallback(() => {
    editor?.chain().focus().toggleHeading({ level: 2 }).run();
  }, [editor]);

  const toggleBulletList = useCallback(() => {
    editor?.chain().focus().toggleBulletList().run();
  }, [editor]);

  const toggleOrderedList = useCallback(() => {
    editor?.chain().focus().toggleOrderedList().run();
  }, [editor]);

  const toggleBlockquote = useCallback(() => {
    editor?.chain().focus().toggleBlockquote().run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 p-2 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
      <button
        type="button"
        onClick={toggleUndo}
        disabled={!editor.can().undo()}
        className={cn(
          'p-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
          'hover:bg-gray-200 dark:hover:bg-gray-800',
          'text-gray-600 dark:text-gray-400',
        )}
        title="Undo"
      >
        <Undo className="size-4" />
      </button>

      <button
        type="button"
        onClick={toggleRedo}
        disabled={!editor.can().redo()}
        className={cn(
          'p-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
          'hover:bg-gray-200 dark:hover:bg-gray-800',
          'text-gray-600 dark:text-gray-400',
        )}
        title="Redo"
      >
        <Redo className="size-4" />
      </button>

      <div className="w-px h-4 bg-gray-300 dark:bg-gray-700 mx-1" />

      <button
        type="button"
        onClick={toggleBold}
        className={cn(
          'p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors',
          editor.isActive('bold')
            ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-50'
            : 'text-gray-600 dark:text-gray-400',
        )}
        title="Bold"
      >
        <Bold className="size-4" />
      </button>

      <button
        type="button"
        onClick={toggleItalic}
        className={cn(
          'p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors',
          editor.isActive('italic')
            ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-50'
            : 'text-gray-600 dark:text-gray-400',
        )}
        title="Italic"
      >
        <Italic className="size-4" />
      </button>

      <button
        type="button"
        onClick={toggleStrike}
        className={cn(
          'p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors',
          editor.isActive('strike')
            ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-50'
            : 'text-gray-600 dark:text-gray-400',
        )}
        title="Strikethrough"
      >
        <Strikethrough className="size-4" />
      </button>

      <div className="w-px h-4 bg-gray-300 dark:bg-gray-700 mx-1" />

      <button
        type="button"
        onClick={toggleHeading}
        className={cn(
          'p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors',
          editor.isActive('heading', { level: 2 })
            ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-50'
            : 'text-gray-600 dark:text-gray-400',
        )}
        title="Heading 2"
      >
        <Heading2 className="size-4" />
      </button>

      <div className="w-px h-4 bg-gray-300 dark:bg-gray-700 mx-1" />

      <button
        type="button"
        onClick={toggleBulletList}
        className={cn(
          'p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors',
          editor.isActive('bulletList')
            ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-50'
            : 'text-gray-600 dark:text-gray-400',
        )}
        title="Bullet List"
      >
        <List className="size-4" />
      </button>

      <button
        type="button"
        onClick={toggleOrderedList}
        className={cn(
          'p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors',
          editor.isActive('orderedList')
            ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-50'
            : 'text-gray-600 dark:text-gray-400',
        )}
        title="Numbered List"
      >
        <ListOrdered className="size-4" />
      </button>

      <button
        type="button"
        onClick={toggleBlockquote}
        className={cn(
          'p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors',
          editor.isActive('blockquote')
            ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-50'
            : 'text-gray-600 dark:text-gray-400',
        )}
        title="Quote"
      >
        <Quote className="size-4" />
      </button>
    </div>
  );
};
