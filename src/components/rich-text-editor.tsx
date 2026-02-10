'use client'

import { useEditor, EditorContent, Extension } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Underline from '@tiptap/extension-underline'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import { common, createLowlight } from 'lowlight'
import { useEffect, useState } from 'react'
import { Plugin } from '@tiptap/pm/state'
import { Button } from './ui/button'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading2,
  Heading3,
} from 'lucide-react'

const lowlight = createLowlight(common)

/**
 * Custom extension to detect and parse pasted content
 * Automatically handles Markdown, HTML, and plain text
 */
const AutoPasteParser = Extension.create({
  name: 'autoPasteParser',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handlePaste(view, event) {
            const text = event.clipboardData?.getData('text/plain')
            const html = event.clipboardData?.getData('text/html')

            if (!text && !html) {
              return false
            }

            // If HTML is available, let default handler process it
            if (html) {
              return false
            }

            // Check if text looks like Markdown
            if (looksLikeMarkdown(text)) {
              // Insert as a paragraph with preserved formatting
              const { state, dispatch } = view
              const { $from, $to } = state.selection
              const tr = state.tr

              // Parse Markdown-like syntax
              const parsedContent = parseMarkdownContent(text || '')
              tr.insertText(parsedContent, $from.pos, $to.pos)
              dispatch(tr)
              return true
            }

            return false
          },
        },
      }),
    ]
  },
})

/**
 * Detects if pasted text contains Markdown syntax
 */
function looksLikeMarkdown(text: string | undefined): boolean {
  if (!text) return false
  return (
    /^#{1,6}\s/.test(text) || // Headings
    /\*\*[^*]+\*\*/.test(text) || // Bold
    /_{2}[^_]+_{2}/.test(text) || // Bold underscore
    /\*[^*]+\*/.test(text) || // Italic
    /_[^_]+_/.test(text) || // Italic underscore
    /`[^`]+`/.test(text) || // Code
    /\[.+\]\(.+\)/.test(text) || // Links
    /^[-*+]\s/.test(text) || // Unordered lists
    /^\d+\.\s/.test(text) // Ordered lists
  )
}

/**
 * Simple Markdown parser for basic syntax
 */
function parseMarkdownContent(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1') // Remove markdown bold markers
    .replace(/_{2}(.+?)_{2}/g, '$1') // Remove bold underscore
    .replace(/\*(.+?)\*/g, '$1') // Remove markdown italic markers
    .replace(/_(.+?)_/g, '$1') // Remove italic underscore
    .replace(/`(.+?)`/g, '$1') // Remove inline code markers
}

interface RichTextEditorProps {
  value?: string
  onChange?: (content: Record<string, unknown>, html: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  onFocus?: () => void
  onBlur?: () => void
  onImageInsert?: (url: string) => void
}

/**
 * Rich Text Editor Component with Auto-Paste Parsing
 *
 * Features:
 * - Automatic Markdown and HTML detection on paste
 * - Full formatting toolbar (bold, italic, underline, etc.)
 * - Support for headings, lists, code blocks, quotes
 * - Link and image insertion
 * - Text alignment controls
 * - Responsive design with Tailwind CSS
 *
 * @example
 * ```tsx
 * <RichTextEditor
 *   value={content}
 *   onChange={(content, html) => setContent(content)}
 *   placeholder="Start typing or paste content..."
 * />
 * ```
 */
export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start typing or paste content...',
  className = '',
  disabled = false,
  onFocus,
  onBlur,
  onImageInsert,
}) => {
  const [mounted, setMounted] = useState(false)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false, // Use CodeBlockLowlight instead
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Underline,
      Link.configure({
        openOnClick: true,
        linkOnPaste: true,
      }),
      Image.configure({
        allowBase64: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder,
      }),
      AutoPasteParser,
    ],
    content: value || '<p></p>',
    editable: !disabled,
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getJSON(), editor.getHTML())
      }
    },
    onFocus: onFocus,
    onBlur: onBlur,
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (editor && value !== undefined && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  if (!mounted || !editor) {
    return (
      <div
        className={`flex flex-col border rounded-lg bg-background h-full w-full ${className}`}
      >
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          Loading editor...
        </div>
      </div>
    )
  }

  const toggleBold = () => editor.chain().focus().toggleBold().run()
  const toggleItalic = () => editor.chain().focus().toggleItalic().run()
  const toggleUnderline = () => editor.chain().focus().toggleUnderline().run()
  const toggleStrike = () => editor.chain().focus().toggleStrike().run()
  const toggleCode = () => editor.chain().focus().toggleCode().run()
  const toggleCodeBlock = () => editor.chain().focus().toggleCodeBlock().run()
  const toggleBulletList = () => editor.chain().focus().toggleBulletList().run()
  const toggleOrderedList = () =>
    editor.chain().focus().toggleOrderedList().run()
  const toggleBlockquote = () =>
    editor.chain().focus().toggleBlockquote().run()
  const toggleHeading2 = () =>
    editor.chain().focus().toggleHeading({ level: 2 }).run()
  const toggleHeading3 = () =>
    editor.chain().focus().toggleHeading({ level: 3 }).run()
  const setAlignLeft = () =>
    editor.chain().focus().setTextAlign('left').run()
  const setAlignCenter = () =>
    editor.chain().focus().setTextAlign('center').run()
  const setAlignRight = () =>
    editor.chain().focus().setTextAlign('right').run()

  const addLink = () => {
    const url = window.prompt('Enter URL:')
    if (url) {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: url })
        .run()
    }
  }

  const addImage = () => {
    const url = window.prompt('Enter image URL:')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
      onImageInsert?.(url)
    }
  }

  return (
    <div className={`flex flex-col border rounded-lg bg-background h-full w-full ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-3 border-b bg-muted/50">
        {/* Text Formatting */}
        <ToolbarButton
          onClick={toggleBold}
          isActive={editor.isActive('bold')}
          title="Bold (Ctrl+B)"
          disabled={disabled}
        >
          <Bold size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={toggleItalic}
          isActive={editor.isActive('italic')}
          title="Italic (Ctrl+I)"
          disabled={disabled}
        >
          <Italic size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={toggleUnderline}
          isActive={editor.isActive('underline')}
          title="Underline (Ctrl+U)"
          disabled={disabled}
        >
          <UnderlineIcon size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={toggleStrike}
          isActive={editor.isActive('strike')}
          title="Strikethrough"
          disabled={disabled}
        >
          <span className="font-bold">S</span>
        </ToolbarButton>

        <div className="w-px bg-border my-1" />

        {/* Headings */}
        <ToolbarButton
          onClick={toggleHeading2}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
          disabled={disabled}
        >
          <Heading2 size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={toggleHeading3}
          isActive={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
          disabled={disabled}
        >
          <Heading3 size={18} />
        </ToolbarButton>

        <div className="w-px bg-border my-1" />

        {/* Lists */}
        <ToolbarButton
          onClick={toggleBulletList}
          isActive={editor.isActive('bulletList')}
          title="Bullet List"
          disabled={disabled}
        >
          <List size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={toggleOrderedList}
          isActive={editor.isActive('orderedList')}
          title="Ordered List"
          disabled={disabled}
        >
          <ListOrdered size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={toggleBlockquote}
          isActive={editor.isActive('blockquote')}
          title="Quote"
          disabled={disabled}
        >
          <Quote size={18} />
        </ToolbarButton>

        <div className="w-px bg-border my-1" />

        {/* Code */}
        <ToolbarButton
          onClick={toggleCode}
          isActive={editor.isActive('code')}
          title="Inline Code"
          disabled={disabled}
        >
          <Code size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={toggleCodeBlock}
          isActive={editor.isActive('codeBlock')}
          title="Code Block"
          disabled={disabled}
        >
          <span className="font-mono text-sm font-bold">&lt;/&gt;</span>
        </ToolbarButton>

        <div className="w-px bg-border my-1" />

        {/* Alignment */}
        <ToolbarButton
          onClick={setAlignLeft}
          isActive={editor.isActive({ textAlign: 'left' })}
          title="Align Left"
          disabled={disabled}
        >
          <AlignLeft size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={setAlignCenter}
          isActive={editor.isActive({ textAlign: 'center' })}
          title="Align Center"
          disabled={disabled}
        >
          <AlignCenter size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={setAlignRight}
          isActive={editor.isActive({ textAlign: 'right' })}
          title="Align Right"
          disabled={disabled}
        >
          <AlignRight size={18} />
        </ToolbarButton>

        <div className="w-px bg-border my-1" />

        {/* Media */}
        <ToolbarButton
          onClick={addLink}
          title="Add Link"
          disabled={disabled}
        >
          <LinkIcon size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={addImage}
          title="Add Image"
          disabled={disabled}
        >
          <ImageIcon size={18} />
        </ToolbarButton>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-auto min-h-0">
        <EditorContent
          editor={editor}
          className={`prose dark:prose-invert max-w-none h-full w-full p-4 focus:outline-none [&>.tiptap]:h-full [&>.tiptap]:w-full [&>.tiptap]:outline-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
      </div>
    </div>
  )
}

/**
 * Reusable toolbar button component
 */
interface ToolbarButtonProps {
  onClick: () => void
  isActive?: boolean
  title?: string
  disabled?: boolean
  children: React.ReactNode
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  onClick,
  isActive,
  title,
  disabled,
  children,
}) => (
  <Button
    onClick={onClick}
    variant={isActive ? 'default' : 'ghost'}
    size="sm"
    title={title}
    disabled={disabled}
    className={`h-8 w-8 p-0 ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
  >
    {children}
  </Button>
)

export default RichTextEditor
