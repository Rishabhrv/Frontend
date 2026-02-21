"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { useEffect, useState, useRef } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

const ToolbarButton = ({
  onClick, active, title, children,
}: {
  onClick: () => void; active?: boolean; title?: string; children: React.ReactNode;
}) => (
  <button
    type="button" title={title} onClick={onClick}
    style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: "30px", height: "30px", borderRadius: "6px", flexShrink: 0,
      border: active ? "1.5px solid #3b82f6" : "1.5px solid transparent",
      background: active ? "#eff6ff" : "transparent",
      color: active ? "#2563eb" : "#374151",
      fontSize: "13px", fontWeight: 600, fontFamily: "Georgia, serif",
      cursor: "pointer", transition: "all 0.15s ease",
    }}
    onMouseEnter={(e) => { if (!active) { (e.currentTarget as HTMLButtonElement).style.background = "#f3f4f6"; (e.currentTarget as HTMLButtonElement).style.color = "#111827"; } }}
    onMouseLeave={(e) => { if (!active) { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "#374151"; } }}
  >
    {children}
  </button>
);

const Divider = () => (
  <div style={{ width: "1px", height: "20px", background: "#e5e7eb", margin: "0 4px", flexShrink: 0 }} />
);

const BLOCK_OPTIONS = [
  { label: "Paragraph", tag: "p",  style: { fontSize: "13px", fontWeight: 400 } },
  { label: "Heading 2", tag: "h2", style: { fontSize: "17px", fontWeight: 700 } },
  { label: "Heading 3", tag: "h3", style: { fontSize: "15px", fontWeight: 700 } },
  { label: "Heading 4", tag: "h4", style: { fontSize: "13px", fontWeight: 700 } },
  { label: "Heading 5", tag: "h5", style: { fontSize: "12px", fontWeight: 600 } },
  { label: "Heading 6", tag: "h6", style: { fontSize: "11px", fontWeight: 600 } },
];

export default function RichTextEditor({ value, onChange }: Props) {
  const [linkPopover, setLinkPopover]     = useState(false);
  const [linkUrl, setLinkUrl]             = useState("");
  const [popoverPos, setPopoverPos]       = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [blockDropdown, setBlockDropdown] = useState(false);
  const [codeMode, setCodeMode]           = useState(false);
  const [codeValue, setCodeValue]         = useState("");

  const linkInputRef    = useRef<HTMLInputElement>(null);
  const wrapperRef      = useRef<HTMLDivElement>(null);
  const codeTextareaRef = useRef<HTMLTextAreaElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4, 5, 6] } }),
      Underline,
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: { attributes: { class: "rich-editor-content" } },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) editor.commands.setContent(value || "");
  }, [value, editor]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setLinkPopover(false);
        setBlockDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!editor) return null;

  const getActiveBlockLabel = () => {
    for (let i = 1; i <= 6; i++) {
      if (editor.isActive("heading", { level: i })) return `Heading ${i}`;
    }
    return "Paragraph";
  };

  const applyBlock = (tag: string) => {
    if (tag === "p") editor.chain().focus().setParagraph().run();
    else editor.chain().focus().toggleHeading({ level: parseInt(tag[1]) as 1|2|3|4|5|6 }).run();
    setBlockDropdown(false);
  };

  const openLinkPopover = () => {
    setLinkUrl(editor.getAttributes("link").href || "");
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const rect  = sel.getRangeAt(0).getBoundingClientRect();
      const wRect = wrapperRef.current?.getBoundingClientRect();
      if (wRect) setPopoverPos({ top: rect.bottom - wRect.top + 4, left: Math.max(0, rect.left - wRect.left) });
    }
    setLinkPopover(true);
    setTimeout(() => linkInputRef.current?.focus(), 50);
  };

  const applyLink = () => {
    if (!linkUrl.trim()) editor.chain().focus().unsetLink().run();
    else editor.chain().focus().setLink({ href: linkUrl.startsWith("http") ? linkUrl : `https://${linkUrl}` }).run();
    setLinkPopover(false);
    setLinkUrl("");
  };

  const enterCodeMode = () => {
    setCodeValue(editor.getHTML());
    setCodeMode(true);
    setTimeout(() => codeTextareaRef.current?.focus(), 50);
  };

  const exitCodeMode = () => {
    editor.commands.setContent(codeValue);
    onChange(codeValue);
    setCodeMode(false);
  };

  return (
    <>
      <style>{`
        .link-popover-input:focus { outline: none; }
        .rich-editor-content {
          min-height: 200px; padding: 14px 16px; outline: none;
          font-family: 'Georgia', serif; font-size: 14px; line-height: 1.75; color: #1f2937;
        }
        .rich-editor-content p  { margin: 0 0 10px; }
        .rich-editor-content h1 { font-size: 22px; font-weight: 700; margin: 0 0 10px; }
        .rich-editor-content h2 { font-size: 18px; font-weight: 700; margin: 0 0 10px; }
        .rich-editor-content h3 { font-size: 15px; font-weight: 700; margin: 0 0 10px; }
        .rich-editor-content h4 { font-size: 13px; font-weight: 700; margin: 0 0 10px; }
        .rich-editor-content h5 { font-size: 12px; font-weight: 600; margin: 0 0 10px; }
        .rich-editor-content h6 { font-size: 11px; font-weight: 600; margin: 0 0 10px; }
        .rich-editor-content ul { list-style: disc; padding-left: 20px; margin: 0 0 10px; }
        .rich-editor-content ol { list-style: decimal; padding-left: 20px; margin: 0 0 10px; }
        .rich-editor-content a  { color: #2563eb; text-decoration: underline; }
        .rich-editor-content blockquote { border-left: 3px solid #d1d5db; margin: 0 0 10px; padding-left: 12px; color: #6b7280; }
        .rich-editor-content code { background: #f3f4f6; border-radius: 3px; padding: 1px 5px; font-family: monospace; font-size: 13px; }
        .rich-editor-wrapper:focus-within { border-color: #3b82f6 !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.12) !important; }
        .block-dropdown-item:hover { background: #f3f4f6 !important; }
        .code-textarea {
          width: 100%; min-height: 200px; padding: 14px 16px; box-sizing: border-box;
          font-family: 'Fira Mono', 'Consolas', monospace; font-size: 12.5px; line-height: 1.7;
          color: #1e293b; background: #f8fafc; border: none; outline: none; resize: vertical; tab-size: 2;
        }
      `}</style>

      <div
        className="rich-editor-wrapper"
        ref={wrapperRef}
        style={{ border: "1.5px solid #d1d5db", borderRadius: "10px", overflow: "visible", background: "#fff", transition: "border-color 0.2s, box-shadow 0.2s", position: "relative" }}
      >
        {/* ── Toolbar ── */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "2px", padding: "8px 10px", borderBottom: "1.5px solid #e5e7eb", background: "#f9fafb", borderRadius: "10px 10px 0 0" }}>

          {/* Block type dropdown */}
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => { setBlockDropdown(v => !v); setLinkPopover(false); }}
              style={{
                display: "inline-flex", alignItems: "center", gap: "5px", height: "30px", padding: "0 8px",
                borderRadius: "6px", border: "1.5px solid #e5e7eb", background: blockDropdown ? "#eff6ff" : "#fff",
                color: "#374151", fontSize: "12px", fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap", minWidth: "105px", transition: "all 0.15s",
              }}
            >
              <span style={{ flex: 1, textAlign: "left" }}>{getActiveBlockLabel()}</span>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transform: blockDropdown ? "rotate(180deg)" : "none", transition: "transform 0.15s", flexShrink: 0 }}>
                <path d="M2 3.5L5 6.5L8 3.5" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {blockDropdown && (
              <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 100, background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", boxShadow: "0 8px 24px rgba(0,0,0,0.1)", overflow: "hidden", minWidth: "140px" }}>
                {BLOCK_OPTIONS.map((opt) => {
                  const isActive = opt.tag === "p"
                    ? editor.isActive("paragraph")
                    : editor.isActive("heading", { level: parseInt(opt.tag[1]) });
                  return (
                    <button
                      key={opt.tag} type="button" className="block-dropdown-item"
                      onClick={() => applyBlock(opt.tag)}
                      style={{ display: "block", width: "100%", padding: "7px 14px", textAlign: "left", border: "none", background: isActive ? "#eff6ff" : "transparent", color: isActive ? "#2563eb" : "#374151", cursor: "pointer", ...opt.style }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <Divider />

          {/* Text formatting */}
          <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold"><strong>B</strong></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic"><em>I</em></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline"><span style={{ textDecoration: "underline" }}>U</span></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough"><span style={{ textDecoration: "line-through" }}>S</span></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Inline Code">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M4.5 3.5L1 7L4.5 10.5M9.5 3.5L13 7L9.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </ToolbarButton>

          <Divider />

          {/* Lists */}
          <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet List">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="2" cy="3.5" r="1.2" fill="currentColor"/><rect x="5" y="2.8" width="8" height="1.4" rx="0.7" fill="currentColor"/>
              <circle cx="2" cy="7" r="1.2" fill="currentColor"/><rect x="5" y="6.3" width="8" height="1.4" rx="0.7" fill="currentColor"/>
              <circle cx="2" cy="10.5" r="1.2" fill="currentColor"/><rect x="5" y="9.8" width="8" height="1.4" rx="0.7" fill="currentColor"/>
            </svg>
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Ordered List">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <text x="0.5" y="4.5" fontSize="4.5" fontFamily="monospace" fill="currentColor">1.</text>
              <rect x="5" y="2.8" width="8" height="1.4" rx="0.7" fill="currentColor"/>
              <text x="0.5" y="8" fontSize="4.5" fontFamily="monospace" fill="currentColor">2.</text>
              <rect x="5" y="6.3" width="8" height="1.4" rx="0.7" fill="currentColor"/>
              <text x="0.5" y="11.5" fontSize="4.5" fontFamily="monospace" fill="currentColor">3.</text>
              <rect x="5" y="9.8" width="8" height="1.4" rx="0.7" fill="currentColor"/>
            </svg>
          </ToolbarButton>

          <Divider />

          {/* Blockquote + Link */}
          <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Blockquote">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1.5 3.5C1.5 2.67 2.17 2 3 2H5C5.83 2 6.5 2.67 6.5 3.5V5.5C6.5 7.43 5.2 9.1 3.5 9.8L2.5 8.8C3.7 8.3 4.5 7.1 4.5 5.8H3C2.17 5.8 1.5 5.13 1.5 4.3V3.5Z" fill="currentColor"/>
              <path d="M7.5 3.5C7.5 2.67 8.17 2 9 2H11C11.83 2 12.5 2.67 12.5 3.5V5.5C12.5 7.43 11.2 9.1 9.5 9.8L8.5 8.8C9.7 8.3 10.5 7.1 10.5 5.8H9C8.17 5.8 7.5 5.13 7.5 4.3V3.5Z" fill="currentColor"/>
            </svg>
          </ToolbarButton>
          <ToolbarButton onClick={openLinkPopover} active={editor.isActive("link")} title="Insert Link">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5.5 8.5L8.5 5.5M6.2 4.8L7.5 3.5C8.33 2.67 9.67 2.67 10.5 3.5C11.33 4.33 11.33 5.67 10.5 6.5L9.2 7.8M4.8 6.2L3.5 7.5C2.67 8.33 2.67 9.67 3.5 10.5C4.33 11.33 5.67 11.33 6.5 10.5L7.8 9.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </ToolbarButton>

          <Divider />

          {/* Undo / Redo */}
          <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 5H8C10.21 5 12 6.79 12 9C12 11.21 10.21 13 8 13H4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 2.5L2 5L4 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M12 5H6C3.79 5 2 6.79 2 9C2 11.21 3.79 13 6 13H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 2.5L12 5L10 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </ToolbarButton>

          <Divider />

          {/* Text alignment */}
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Align Left">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="2" width="12" height="1.5" rx="0.75" fill="currentColor"/>
              <rect x="1" y="5.5" width="8" height="1.5" rx="0.75" fill="currentColor"/>
              <rect x="1" y="9" width="12" height="1.5" rx="0.75" fill="currentColor"/>
              <rect x="1" y="12.5" width="6" height="1.5" rx="0.75" fill="currentColor"/>
            </svg>
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Align Center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="2" width="12" height="1.5" rx="0.75" fill="currentColor"/>
              <rect x="3" y="5.5" width="8" height="1.5" rx="0.75" fill="currentColor"/>
              <rect x="1" y="9" width="12" height="1.5" rx="0.75" fill="currentColor"/>
              <rect x="4" y="12.5" width="6" height="1.5" rx="0.75" fill="currentColor"/>
            </svg>
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Align Right">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="2" width="12" height="1.5" rx="0.75" fill="currentColor"/>
              <rect x="5" y="5.5" width="8" height="1.5" rx="0.75" fill="currentColor"/>
              <rect x="1" y="9" width="12" height="1.5" rx="0.75" fill="currentColor"/>
              <rect x="7" y="12.5" width="6" height="1.5" rx="0.75" fill="currentColor"/>
            </svg>
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("justify").run()} active={editor.isActive({ textAlign: "justify" })} title="Justify">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="2" width="12" height="1.5" rx="0.75" fill="currentColor"/>
              <rect x="1" y="5.5" width="12" height="1.5" rx="0.75" fill="currentColor"/>
              <rect x="1" y="9" width="12" height="1.5" rx="0.75" fill="currentColor"/>
              <rect x="1" y="12.5" width="12" height="1.5" rx="0.75" fill="currentColor"/>
            </svg>
          </ToolbarButton>

          <Divider />

          {/* HTML / Code edit toggle */}
          <button
            type="button"
            title={codeMode ? "Back to visual editor" : "Edit HTML source"}
            onClick={codeMode ? exitCodeMode : enterCodeMode}
            style={{
              display: "inline-flex", alignItems: "center", gap: "4px", height: "30px", padding: "0 10px",
              borderRadius: "6px", border: codeMode ? "1.5px solid #3b82f6" : "1.5px solid #e5e7eb",
              background: codeMode ? "#eff6ff" : "#fff", color: codeMode ? "#2563eb" : "#374151",
              fontSize: "11.5px", fontWeight: 600, fontFamily: "'Fira Mono', monospace",
              cursor: "pointer", transition: "all 0.15s", letterSpacing: "0.02em",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M3.5 3L1 6.5L3.5 10M9.5 3L12 6.5L9.5 10M7 2L6 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {codeMode ? "Visual" : "HTML"}
          </button>
        </div>

        {/* Link popover */}
        {linkPopover && (
          <div style={{ position: "absolute", top: popoverPos.top, left: popoverPos.left, zIndex: 50, background: "#fff", border: "1px solid #d1d5db", borderRadius: "6px", boxShadow: "0 4px 16px rgba(0,0,0,0.12)", padding: "6px 8px", display: "flex", alignItems: "center", gap: "6px", minWidth: "280px" }}>
            <span style={{ fontSize: "11px", color: "#6b7280", whiteSpace: "nowrap" }}>Paste URL or type to search</span>
            <input
              ref={linkInputRef} className="link-popover-input" type="text" value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") applyLink(); if (e.key === "Escape") setLinkPopover(false); }}
              placeholder="https://"
              style={{ flex: 1, border: "1px solid #d1d5db", borderRadius: "4px", padding: "3px 7px", fontSize: "13px", color: "#111827", background: "#f9fafb" }}
            />
            <button type="button" onClick={applyLink} title="Apply link" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "26px", height: "26px", borderRadius: "5px", background: "#2563eb", border: "none", cursor: "pointer", flexShrink: 0 }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 6.5H11M7 2.5L11 6.5L7 10.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            {editor.isActive("link") && (
              <button type="button" onClick={() => { editor.chain().focus().unsetLink().run(); setLinkPopover(false); }} title="Remove link" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "26px", height: "26px", borderRadius: "5px", background: "#fee2e2", border: "none", cursor: "pointer", flexShrink: 0 }}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2L11 11" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round"/><path d="M4 9C3.17 9.83 3.17 11.17 4 12C4.83 12.83 6.17 12.83 7 12L9 10M9 4L10 3C10.83 2.17 10.83 0.83 10 0C9.17 -0.83 7.83 -0.83 7 0L5 2" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            )}
          </div>
        )}

        {/* Visual editor OR HTML source */}
        {codeMode ? (
          <div style={{ position: "relative" }}>
            <textarea
              ref={codeTextareaRef} className="code-textarea" value={codeValue}
              onChange={(e) => setCodeValue(e.target.value)} spellCheck={false}
            />
            <div style={{ position: "absolute", top: "8px", right: "10px", background: "#fef3c7", border: "1px solid #fde68a", color: "#92400e", fontSize: "10.5px", fontWeight: 600, padding: "2px 7px", borderRadius: "4px", pointerEvents: "none" }}>
              HTML SOURCE
            </div>
          </div>
        ) : (
          <EditorContent editor={editor} />
        )}

        {/* Footer */}
        <div style={{ padding: "5px 14px", borderTop: "1px solid #f3f4f6", background: "#f9fafb", display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: "0 0 10px 10px" }}>
          <span style={{ fontSize: "11px", color: "#d1d5db", fontFamily: "monospace" }}>
            {codeMode ? "editing html" : getActiveBlockLabel().toLowerCase()}
          </span>
          <span style={{ fontSize: "11px", color: "#9ca3af" }}>
            {editor.getText().trim() === "" ? "0 words" : `${editor.getText().trim().split(/\s+/).length} words`}
          </span>
        </div>
      </div>
    </>
  );
}