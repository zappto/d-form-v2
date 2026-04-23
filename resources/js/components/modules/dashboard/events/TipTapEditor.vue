<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import { StarterKit } from '@tiptap/starter-kit'
import { Underline } from '@tiptap/extension-underline'
import { TextAlign } from '@tiptap/extension-text-align'
import { Highlight } from '@tiptap/extension-highlight'
import { Link } from '@tiptap/extension-link'
import { Image } from '@tiptap/extension-image'
import { Placeholder } from '@tiptap/extension-placeholder'
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table'
import { TextStyle, Color } from '@tiptap/extension-text-style'
import { Typography } from '@tiptap/extension-typography'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
    Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code,
    Heading1, Heading2, Heading3, List, ListOrdered, Quote,
    AlignLeft, AlignCenter, AlignRight,
    Link as LinkIcon, Image as ImageIcon, Table as TableIcon,
    Highlighter, Undo, Redo, Minus,
} from 'lucide-vue-next'

const props = defineProps<{ modelValue?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const editor = useEditor({
    content: props.modelValue ?? '',
    extensions: [
        StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
        Underline, TextAlign.configure({ types: ['heading', 'paragraph'] }),
        Highlight.configure({ multicolor: true }), Link.configure({ openOnClick: false }),
        Image.configure({ inline: true }), Placeholder.configure({ placeholder: 'Write your event description here...' }),
        Table.configure({ resizable: true }), TableRow, TableCell, TableHeader,
        TextStyle, Color, Typography,
    ],
    onUpdate: ({ editor: e }) => emit('update:modelValue', e.getHTML()),
    editorProps: {
        attributes: { class: 'prose prose-sm max-w-none min-h-[300px] focus:outline-none px-4 py-3' },
    },
})

function addImage() { const url = window.prompt('Image URL'); if (url && editor.value) editor.value.chain().focus().setImage({ src: url }).run() }
function addLink() { const url = window.prompt('Link URL'); if (url && editor.value) editor.value.chain().focus().setLink({ href: url }).run() }
function addTable() { if (editor.value) editor.value.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() }

const toolbarGroups = [
    [
        { icon: Bold, action: () => editor.value?.chain().focus().toggleBold().run(), active: () => editor.value?.isActive('bold') ?? false },
        { icon: Italic, action: () => editor.value?.chain().focus().toggleItalic().run(), active: () => editor.value?.isActive('italic') ?? false },
        { icon: UnderlineIcon, action: () => editor.value?.chain().focus().toggleUnderline().run(), active: () => editor.value?.isActive('underline') ?? false },
        { icon: Strikethrough, action: () => editor.value?.chain().focus().toggleStrike().run(), active: () => editor.value?.isActive('strike') ?? false },
        { icon: Highlighter, action: () => editor.value?.chain().focus().toggleHighlight().run(), active: () => editor.value?.isActive('highlight') ?? false },
        { icon: Code, action: () => editor.value?.chain().focus().toggleCode().run(), active: () => editor.value?.isActive('code') ?? false },
    ],
    [
        { icon: Heading1, action: () => editor.value?.chain().focus().toggleHeading({ level: 1 }).run(), active: () => editor.value?.isActive('heading', { level: 1 }) ?? false },
        { icon: Heading2, action: () => editor.value?.chain().focus().toggleHeading({ level: 2 }).run(), active: () => editor.value?.isActive('heading', { level: 2 }) ?? false },
        { icon: Heading3, action: () => editor.value?.chain().focus().toggleHeading({ level: 3 }).run(), active: () => editor.value?.isActive('heading', { level: 3 }) ?? false },
    ],
    [
        { icon: List, action: () => editor.value?.chain().focus().toggleBulletList().run(), active: () => editor.value?.isActive('bulletList') ?? false },
        { icon: ListOrdered, action: () => editor.value?.chain().focus().toggleOrderedList().run(), active: () => editor.value?.isActive('orderedList') ?? false },
        { icon: Quote, action: () => editor.value?.chain().focus().toggleBlockquote().run(), active: () => editor.value?.isActive('blockquote') ?? false },
        { icon: Minus, action: () => editor.value?.chain().focus().setHorizontalRule().run(), active: () => false },
    ],
    [
        { icon: AlignLeft, action: () => editor.value?.chain().focus().setTextAlign('left').run(), active: () => editor.value?.isActive({ textAlign: 'left' }) ?? false },
        { icon: AlignCenter, action: () => editor.value?.chain().focus().setTextAlign('center').run(), active: () => editor.value?.isActive({ textAlign: 'center' }) ?? false },
        { icon: AlignRight, action: () => editor.value?.chain().focus().setTextAlign('right').run(), active: () => editor.value?.isActive({ textAlign: 'right' }) ?? false },
    ],
    [
        { icon: LinkIcon, action: addLink, active: () => editor.value?.isActive('link') ?? false },
        { icon: ImageIcon, action: addImage, active: () => false },
        { icon: TableIcon, action: addTable, active: () => false },
    ],
    [
        { icon: Undo, action: () => editor.value?.chain().focus().undo().run(), active: () => false },
        { icon: Redo, action: () => editor.value?.chain().focus().redo().run(), active: () => false },
    ],
]
</script>

<template>
    <div class="overflow-hidden rounded-xl border">
        <div v-if="editor" class="flex flex-wrap items-center gap-0.5 border-b bg-muted/30 px-2 py-1.5">
            <template v-for="(group, gIdx) in toolbarGroups" :key="gIdx">
                <Separator v-if="gIdx > 0" orientation="vertical" class="mx-1 !h-5" />
                <Button
                    v-for="(tool, tIdx) in group" :key="tIdx"
                    variant="ghost" size="icon"
                    class="size-7"
                    :class="{ 'bg-primary/10 text-primary': tool.active() }"
                    @click="tool.action()"
                >
                    <component :is="tool.icon" class="size-3.5" />
                </Button>
            </template>
        </div>
        <EditorContent :editor="editor" />
    </div>
</template>

<style>
.tiptap p.is-editor-empty:first-child::before {
    color: var(--muted-foreground);
    content: attr(data-placeholder);
    float: left;
    height: 0;
    pointer-events: none;
}
.tiptap table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
.tiptap table td, .tiptap table th { border: 1px solid var(--border); padding: 0.5rem; min-width: 100px; }
.tiptap table th { background-color: var(--muted); font-weight: 600; }
</style>
