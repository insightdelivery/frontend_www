'use client'

import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { useEffect } from 'react'
import { cn } from '@/lib/utils'

export interface RichTextEditorProps {
  /** 초기 HTML 내용 */
  content?: string
  /** 내용 변경 시 (HTML) */
  onChange?: (html: string) => void
  placeholder?: string
  className?: string
  editable?: boolean
  /** 확장: 이미지 업로드 등 추가 시 사용 */
  onImageUpload?: (file: File) => Promise<string>
}

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) return null
  return (
    <div className="flex flex-wrap gap-1 border-b border-gray-200 p-2">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={cn(
          'rounded px-2 py-1 text-sm font-medium',
          editor.isActive('bold') ? 'bg-gray-200' : 'hover:bg-gray-100'
        )}
      >
        B
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={cn(
          'rounded px-2 py-1 text-sm italic',
          editor.isActive('italic') ? 'bg-gray-200' : 'hover:bg-gray-100'
        )}
      >
        I
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={cn(
          'rounded px-2 py-1 text-sm',
          editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : 'hover:bg-gray-100'
        )}
      >
        H1
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={cn(
          'rounded px-2 py-1 text-sm',
          editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : 'hover:bg-gray-100'
        )}
      >
        H2
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={cn(
          'rounded px-2 py-1 text-sm',
          editor.isActive('heading', { level: 3 }) ? 'bg-gray-200' : 'hover:bg-gray-100'
        )}
      >
        H3
      </button>
      {/* Image: 확장 가능 - onImageUpload 연동 시 이미지 URL 삽입 */}
    </div>
  )
}

export function RichTextEditor({
  content = '',
  onChange,
  placeholder = '내용을 입력하세요…',
  className,
  editable = true,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
      }),
    ],
    content,
    editable,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[200px] px-3 py-2 focus:outline-none',
      },
    },
  })

  useEffect(() => {
    if (!editor) return
    const h = () => onChange?.(editor.getHTML())
    editor.on('update', h)
    return () => editor.off('update', h)
  }, [editor, onChange])

  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    if (current === '<p></p>' && content) editor.commands.setContent(content, false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor])

  return (
    <div className={cn('rounded-md border border-gray-300 bg-white', className)}>
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}

export default RichTextEditor
