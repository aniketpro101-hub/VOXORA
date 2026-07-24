'use client';

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Strikethrough, Code, Sparkles, Smile, AlertTriangle, AlertCircle } from 'lucide-react';

interface MessageEditorProps {
  text: string;
  onChange: (text: string) => void;
  onOpenSpintaxPreview?: () => void;
  hasButtons?: boolean;
}

export default function MessageEditor({
  text,
  onChange,
  onOpenSpintaxPreview,
  hasButtons = false,
}: MessageEditorProps) {
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
  const maxLength = hasButtons ? 1024 : 4096;
  const recommendedLength = hasButtons ? 500 : 1000;

  const isExceeded = charLength > maxLength;
  const isRecommendedExceeded = charLength > recommendedLength && !isExceeded;

  const counterColor = isExceeded
    ? 'text-rose-500 font-extrabold'
    : isRecommendedExceeded
    ? 'text-amber-500 font-bold'
    : 'text-emerald-500 font-bold';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase text-muted-foreground">
          Message Content {hasButtons && '(Interactive Mode: Max 1,024 chars)'}
        </label>
        <span className={`text-[11px] ${counterColor}`}>
          {charLength} / {maxLength.toLocaleString()} chars
        </span>
      </div>

      {/* Exceeded Warning Banner */}
      {isExceeded && (
        <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs text-rose-300 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">❌ WhatsApp Meta Message Limit Exceeded</p>
            <p className="mt-0.5">
              Your message is {charLength.toLocaleString()} characters. Maximum allowed is {maxLength.toLocaleString()} chars{' '}
              {hasButtons ? '(when buttons are attached)' : ''}. Please shorten by {(charLength - maxLength).toLocaleString()} characters.
            </p>
          </div>
        </div>
      )}

      {/* Recommended Exceeded Warning Banner */}
      {isRecommendedExceeded && (
        <div className="p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-300 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0" />
          <span>
            💡 <strong>Delivery Tip:</strong> Messages under {recommendedLength} chars yield 34% higher response & delivery rates.
          </span>
        </div>
      )}

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
        className={`w-full rounded-b-2xl border bg-card p-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
          isExceeded ? 'border-rose-500 focus:ring-rose-500' : 'border-border focus:ring-primary'
        }`}
      />
    </div>
  );
}
