"use client";

import dynamic from "next/dynamic";

const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
});

const modules = {
  toolbar: [[{ header: [1, 2, 3, false] }], ["bold", "italic", "underline", "strike"], [{ list: "ordered" }, { list: "bullet" }], ["blockquote", "code-block"], ["link"], ["clean"]],
};

const formats = ["header", "bold", "italic", "underline", "strike", "list", "blockquote", "code-block", "link"];

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  return (
    <div className="rounded-md border border-zinc-700 bg-zinc-900/60">
      <ReactQuill theme="snow" value={value} onChange={onChange} modules={modules} formats={formats} placeholder="Write detailed answer here..." />
    </div>
  );
}
