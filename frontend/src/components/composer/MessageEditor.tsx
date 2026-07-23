'use client';

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Strikethrough, Code, Sparkles, Smile } from 'lucide-react';

interface MessageEditorProps {
  text: string;
  onChange: (text: string) => void;
  onOpenSpintaxPreview?: () => void;
}

export default function MessageEditor({ text, onChange, onOpenSpintaxPreview }: MessageEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const insertFormat = (prefix: string, suffix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = text.substring(start, end);
    const replacement = `${prefix}${selected || 'text'}${suffix}`;

    const newText = text.substring(0, start) + replacement + text.substring(end);
    onChange(newText);
  };

  const insertTextAtCursor = (insertion: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(`${text} ${insertion}`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = text.substring(0, start) + insertion + text.substring(end);
    onChange(newText);
  };

  const emojis = ['😊', '🎉', '🚀', '🔥', '⚡', '✅', '🎁', '📦', '📞', '📍', '💯', '⭐', '👇', '👉', '🔔'];

  const variables = [
    { label: 'Name', value: 'name' },
    { label: 'First Name', value: 'firstName' },
    { label: 'Last Name', value: 'lastName' },
    { label: 'Phone', value: 'phone' },
    { label: 'City', value: 'city' },
    { label: 'Company', value: 'company' },
    { label: 'Date', value: 'date' },
  ];

  const charLength = text.length;
  const counterColor = charLength < 500 ? 'text-emerald-500 font-bold' : charLength < 1000 ? 'text-amber-500 font-bold' : 'text-rose-500 font-bold';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase text-muted-foreground">Message Content</label>
        <span className={`text-[11px] ${counterColor}`}>
          {charLength} / 65,536 chars {charLength >= 1000 && '(Long Message Warning)'}
        </span>
      </div>

      {/* Editor Formatting Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-t-2xl border border-b-0 border-border bg-accent/40">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => insertFormat('*', '*')}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-card hover:text-foreground"
            title="Bold (*text*)"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormat('_', '_')}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-card hover:text-foreground"
            title="Italic (_text_)"
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormat('~', '~')}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-card hover:text-foreground"
            title="Strikethrough (~text~)"
          >
            <Strikethrough className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormat('```', '```')}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-card hover:text-foreground"
            title="Monospace (```text```)"
          >
            <Code className="h-4 w-4" />
          </button>

          {/* Emoji Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1.5 rounded-lg text-amber-500 hover:bg-card"
              title="Insert Emoji"
            >
              <Smile className="h-4 w-4" />
            </button>
            {showEmojiPicker && (
              <div className="absolute top-8 left-0 z-20 p-2 rounded-2xl border border-border bg-card shadow-2xl flex flex-wrap gap-1 w-48">
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      insertTextAtCursor(emoji);
                      setShowEmojiPicker(false);
                    }}
                    className="p-1.5 text-base hover:bg-accent rounded-lg"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => insertTextAtCursor('{Hi|Hello|Hey}')}
            className="px-2 py-1 text-xs font-bold rounded-lg text-primary bg-primary/10 hover:bg-primary/20"
            title="Insert SpinTax ({Hi|Hello})"
          >
            {`{A|B}`} SpinTax
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Variables Dropdown */}
          <select
            onChange={(e) => {
              if (e.target.value) {
                insertTextAtCursor(`{{${e.target.value}}}`);
                e.target.value = '';
              }
            }}
            className="h-8 rounded-lg border border-border bg-card px-2 text-xs text-foreground focus:outline-none"
            defaultValue=""
          >
            <option value="" disabled>
              + Insert Variable
            </option>
            {variables.map((v) => (
              <option key={v.value} value={v.value}>
                {`{{${v.value}}}`} ({v.label})
              </option>
            ))}
          </select>

          {onOpenSpintaxPreview && (
            <Button type="button" size="sm" variant="outline" onClick={onOpenSpintaxPreview}>
              <Sparkles className="mr-1.5 h-3.5 w-3.5 text-amber-500" /> Preview Variations
            </Button>
          )}
        </div>
      </div>

      {/* Main Textarea */}
      <textarea
        ref={textareaRef}
        rows={6}
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder="{Hi|Hello|Hey} {{name}}, we have a special discount for customers in {{city}}! Check our latest offers."
        className="w-full rounded-b-2xl border border-border bg-card p-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  );
}
