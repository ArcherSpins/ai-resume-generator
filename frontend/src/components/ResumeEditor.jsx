import { useCallback, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { useTranslation } from '../i18n/LanguageContext';

const editorCss = `
  .ProseMirror {
    min-height: 420px;
    padding: 1rem 1.25rem;
    outline: none;
  }
  .ProseMirror p { margin: 0.5em 0; }
  .ProseMirror img {
    max-width: 100%;
    height: auto;
    display: block;
    cursor: default;
  }
  .ProseMirror img.ProseMirror-selectednode {
    outline: 2px solid rgb(16 185 129);
  }
  .ProseMirror-focused { outline: none; }
  .tiptap-placeholder::before {
    content: attr(data-placeholder);
    color: #94a3b8;
    pointer-events: none;
  }
  .dark .ProseMirror { color: #fafafa; }
  .dark .tiptap-placeholder::before { color: #a1a1aa; }
  .dark .ProseMirror img.ProseMirror-selectednode { outline-color: rgb(52 211 153); }
`;

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Not an image'));
      return;
    }
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export default function ResumeEditor({ initialHtml, onChange, placeholder }) {
  const { t } = useTranslation();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        allowBase64: true,
        inline: false,
        HTMLAttributes: { class: 'resume-editor-image' },
      }),
      Placeholder.configure({
        placeholder: placeholder || t('editorPlaceholder'),
      }),
    ],
    content: initialHtml || '',
    editorProps: {
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files;
        if (!files?.length) return false;
        const file = files[0];
        if (!file.type.startsWith('image/')) return false;
        event.preventDefault();
        fileToDataUrl(file).then((src) => {
          const { schema } = view.state;
          const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
          if (coordinates) {
            const node = schema.nodes.image.create({ src });
            const tr = view.state.tr.insert(coordinates.pos, node);
            view.dispatch(tr);
          }
        });
        return true;
      },
      handlePaste: (view, event) => {
        const files = event.clipboardData?.files;
        if (!files?.length) return false;
        const file = files[0];
        if (!file.type.startsWith('image/')) return false;
        event.preventDefault();
        fileToDataUrl(file).then((src) => {
          const { schema } = view.state;
          const node = schema.nodes.image.create({ src });
          const tr = view.state.tr.replaceSelectionWith(node);
          view.dispatch(tr);
        });
        return true;
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (initialHtml !== undefined && initialHtml !== editor.getHTML()) {
      editor.commands.setContent(initialHtml, false);
    }
  }, [initialHtml]);

  useEffect(() => {
    if (!editor || !onChange) return;
    const h = () => onChange(editor.getHTML());
    editor.on('update', h);
    return () => editor.off('update', h);
  }, [editor, onChange]);

  const addImage = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target?.files?.[0];
      if (!file) return;
      fileToDataUrl(file).then((src) => editor?.commands.setImage({ src }));
    };
    input.click();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="resume-editor rounded-xl border border-edge bg-surface overflow-hidden">
      <style>{editorCss}</style>
      <div className="flex items-center gap-2 border-b border-edge bg-surface-2 px-3 py-2">
        <button
          type="button"
          onClick={addImage}
          className="rounded-lg border border-edge bg-surface px-3 py-1.5 text-sm font-medium text-ink-muted hover:bg-surface-2"
        >
          {t('insertPhoto')}
        </button>
        <span className="text-xs text-ink-muted">{t('editorImageHint')}</span>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
