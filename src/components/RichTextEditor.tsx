import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { useEffect } from "react";
import {
  Bold, Italic, Underline as UnderlineIcon, Heading1, Heading2, Heading3,
  List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Pilcrow,
  Highlighter, Palette, Type,
} from "lucide-react";

const FONT_SIZES = ["12px", "14px", "16px", "18px", "20px", "24px", "30px", "36px"];
const TEXT_COLORS = ["#000000", "#dc2626", "#ea580c", "#ca8a04", "#16a34a", "#0891b2", "#2563eb", "#9333ea", "#db2777"];
const HIGHLIGHTS = ["#fef08a", "#bbf7d0", "#bfdbfe", "#fbcfe8", "#fed7aa", "#e9d5ff"];

// Simple font-size mark using TextStyle (we apply inline style via setMark)
function setFontSize(editor: Editor, size: string) {
  editor.chain().focus().setMark("textStyle", { style: `font-size: ${size}` } as any).run();
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write something...",
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[120px] px-3 py-2 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (!editor) return null;

  const Btn = ({ active, onClick, title, children }: any) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`rounded p-1.5 hover:bg-muted transition ${active ? "bg-primary/10 text-primary" : "text-foreground"}`}
    >
      {children}
    </button>
  );

  return (
    <div className="rounded-xl border border-border bg-background overflow-hidden">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/40 p-1">
        <Btn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold"><Bold className="h-3.5 w-3.5" /></Btn>
        <Btn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic"><Italic className="h-3.5 w-3.5" /></Btn>
        <Btn active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline"><UnderlineIcon className="h-3.5 w-3.5" /></Btn>
        <div className="w-px h-5 bg-border mx-1" />
        <Btn active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Title"><Heading1 className="h-3.5 w-3.5" /></Btn>
        <Btn active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Header"><Heading2 className="h-3.5 w-3.5" /></Btn>
        <Btn active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Subtitle"><Heading3 className="h-3.5 w-3.5" /></Btn>
        <Btn active={editor.isActive("paragraph")} onClick={() => editor.chain().focus().setParagraph().run()} title="Paragraph"><Pilcrow className="h-3.5 w-3.5" /></Btn>
        <div className="w-px h-5 bg-border mx-1" />
        <Btn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list"><List className="h-3.5 w-3.5" /></Btn>
        <Btn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list"><ListOrdered className="h-3.5 w-3.5" /></Btn>
        <select
          onChange={(e) => {
            const v = e.target.value;
            if (!v) return;
            const node = editor.state.selection.$head.parent;
            if (node.type.name === "orderedList") {
              // user picks alphabetical / roman list style
            }
            // toggle ordered list and apply CSS list-style via wrapper class
            editor.chain().focus().toggleOrderedList().updateAttributes("orderedList", { type: v }).run();
            e.target.value = "";
          }}
          className="rounded border border-border bg-background px-1 py-0.5 text-xs"
          title="Numbered list type"
          defaultValue=""
        >
          <option value="">List type</option>
          <option value="1">1, 2, 3</option>
          <option value="a">a, b, c</option>
          <option value="A">A, B, C</option>
          <option value="i">i, ii, iii</option>
        </select>
        <div className="w-px h-5 bg-border mx-1" />
        <Btn active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} title="Align left"><AlignLeft className="h-3.5 w-3.5" /></Btn>
        <Btn active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} title="Align center"><AlignCenter className="h-3.5 w-3.5" /></Btn>
        <Btn active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} title="Align right"><AlignRight className="h-3.5 w-3.5" /></Btn>
        <div className="w-px h-5 bg-border mx-1" />
        <select
          onChange={(e) => { if (e.target.value) { setFontSize(editor, e.target.value); e.target.value = ""; } }}
          className="rounded border border-border bg-background px-1 py-0.5 text-xs"
          title="Font size"
          defaultValue=""
        >
          <option value="">Size</option>
          {FONT_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="inline-flex items-center gap-0.5 px-1" title="Text color">
          <Palette className="h-3.5 w-3.5 text-muted-foreground" />
          {TEXT_COLORS.map((c) => (
            <button key={c} type="button" onClick={() => editor.chain().focus().setColor(c).run()}
              className="h-4 w-4 rounded border border-border" style={{ background: c }} aria-label={`Color ${c}`} />
          ))}
          <button type="button" onClick={() => editor.chain().focus().unsetColor().run()} className="text-[10px] px-1 hover:underline">x</button>
        </div>
        <div className="inline-flex items-center gap-0.5 px-1" title="Highlight">
          <Highlighter className="h-3.5 w-3.5 text-muted-foreground" />
          {HIGHLIGHTS.map((c) => (
            <button key={c} type="button" onClick={() => editor.chain().focus().toggleHighlight({ color: c }).run()}
              className="h-4 w-4 rounded border border-border" style={{ background: c }} aria-label={`Highlight ${c}`} />
          ))}
          <button type="button" onClick={() => editor.chain().focus().unsetHighlight().run()} className="text-[10px] px-1 hover:underline">x</button>
        </div>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
