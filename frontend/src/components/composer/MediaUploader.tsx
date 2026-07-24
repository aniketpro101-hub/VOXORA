'use client';

import React, { useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';
import { Upload, X, FileText, Image as ImageIcon, Video, Music, Loader2, Info, Clock, AlertTriangle } from 'lucide-react';

export interface AttachmentItem {
  id: string;
  url: string;
  type: string;
  fileName: string;
  sizeMB?: number;
}

interface MediaUploaderProps {
  attachments?: AttachmentItem[];
  mediaUrl?: string;
  mediaType?: string;
  fileName?: string;
  onAttachmentsChange?: (attachments: AttachmentItem[]) => void;
  onUploadSuccess?: (url: string, type: string, name: string) => void;
  onRemove?: () => void;
}

const META_LIMITS = {
  image: { maxMB: 5, recMB: 2, label: 'Image (Max 5 MB)' },
  video: { maxMB: 16, recMB: 10, label: 'Video (Max 16 MB)' },
  audio: { maxMB: 16, recMB: 5, label: 'Audio (Max 16 MB)' },
  document: { maxMB: 100, recMB: 20, label: 'Document (Max 100 MB)' },
};

export default function MediaUploader({
  attachments = [],
  mediaUrl,
  mediaType,
  fileName,
  onAttachmentsChange,
  onUploadSuccess,
  onRemove,
}: MediaUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);

  // Sync legacy single mediaUrl into items if provided
  const items: AttachmentItem[] =
    attachments.length > 0
      ? attachments
      : mediaUrl
      ? [{ id: 'legacy', url: mediaUrl, type: mediaType || 'image', fileName: fileName || 'Attachment' }]
      : [];

  const handleUploadFile = async (file: File) => {
    if (items.length >= 5) {
      toast.error('Maximum 5 media attachments allowed per message');
      return;
    }

    setWarnings([]);

    // Client-side quick size validation
    const fileSizeMB = file.size / (1024 * 1024);
    let category = 'document';
    if (file.type.startsWith('image/')) category = 'image';
    else if (file.type.startsWith('video/')) category = 'video';
    else if (file.type.startsWith('audio/')) category = 'audio';

    const limitConfig = META_LIMITS[category as keyof typeof META_LIMITS] || META_LIMITS.document;

    if (fileSizeMB > limitConfig.maxMB) {
      toast.error(
        `${category.toUpperCase()} exceeds Meta official limit of ${limitConfig.maxMB} MB (${fileSizeMB.toFixed(
          1
        )} MB). Please compress.`
      );
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    try {
      const res = await apiClient.post('/upload/media', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = res.data.data;
      if (res.data.suggestions && res.data.suggestions.length > 0) {
        setWarnings(res.data.suggestions);
      }

      let detectedType = category;
      const newItem: AttachmentItem = {
        id: data.attachment?.id || `att_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        url: data.attachment?.url || data.url,
        type: detectedType,
        fileName: data.attachment?.fileName || data.fileName || file.name,
        sizeMB: data.attachment?.fileSizeMB || parseFloat(fileSizeMB.toFixed(2)),
      };

      const updated = [...items, newItem];
      if (onAttachmentsChange) onAttachmentsChange(updated);
      if (onUploadSuccess) onUploadSuccess(newItem.url, newItem.type, newItem.fileName);

      toast.success(`Attached ${newItem.fileName} (${newItem.sizeMB || fileSizeMB.toFixed(1)} MB)`);
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'File upload failed';
      const suggestions = err.response?.data?.suggestions;
      toast.error(errMsg);
      if (suggestions && suggestions.length > 0) {
        setWarnings(suggestions);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUploadFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUploadFile(file);
  };

  const handleRemoveItem = (id: string) => {
    const updated = items.filter((it) => it.id !== id);
    if (onAttachmentsChange) onAttachmentsChange(updated);
    if (updated.length === 0 && onRemove) onRemove();
  };

  return (
    <div className="space-y-3">
      {/* Header & Meta Limits Info Callout */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5 text-primary" /> Media Attachments ({items.length}/5)
        </label>
        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3 text-amber-400" /> 48h Auto-Cleanup Storage
        </span>
      </div>

      {/* Meta WhatsApp File Limits Banner */}
      <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 text-xs grid grid-cols-2 gap-2 text-muted-foreground">
        <div><strong className="text-foreground">📷 Images:</strong> Max 5 MB</div>
        <div><strong className="text-foreground">🎥 Videos:</strong> Max 16 MB</div>
        <div><strong className="text-foreground">🎵 Audio:</strong> Max 16 MB</div>
        <div><strong className="text-foreground">📄 Documents:</strong> Max 100 MB</div>
      </div>

      {/* Warnings / Suggestions */}
      {warnings.length > 0 && (
        <div className="p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-300 space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertTriangle className="h-4 w-4 text-amber-400" /> Optimization Tip:
          </div>
          {warnings.map((warn, i) => (
            <p key={i}>• {warn}</p>
          ))}
        </div>
      )}

      {/* Uploaded Attachments List */}
      {items.length > 0 && (
        <div className="space-y-2 mb-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 rounded-2xl border border-border bg-card">
              <div className="flex items-center gap-3">
                {item.type === 'image' && <ImageIcon className="h-5 w-5 text-primary" />}
                {item.type === 'video' && <Video className="h-5 w-5 text-purple-400" />}
                {item.type === 'audio' && <Music className="h-5 w-5 text-cyanAccent" />}
                {item.type === 'document' && <FileText className="h-5 w-5 text-amber-500" />}
                <div className="truncate max-w-xs">
                  <p className="text-xs font-bold text-foreground truncate">{item.fileName}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">
                    {item.type} • {item.sizeMB ? `${item.sizeMB} MB` : 'Validated'} • <span className="text-amber-400">48h retention</span>
                  </p>
                </div>
              </div>
              <button onClick={() => handleRemoveItem(item.id)} className="p-1 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 rounded-lg">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drag & Drop Zone */}
      {items.length < 5 && (
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center p-5 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
            isDragging ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50 bg-accent/20'
          }`}
        >
          {isUploading ? (
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              <Loader2 className="h-5 w-5 animate-spin" /> Uploading & Validating Meta Specs...
            </div>
          ) : (
            <>
              <Upload className="h-6 w-6 text-muted-foreground group-hover:text-primary mb-1.5 transition-colors" />
              <span className="text-xs font-bold text-foreground">Drag & Drop or Click to Add Attachment</span>
              <span className="text-[10px] text-muted-foreground mt-0.5">Images, Videos, PDFs, Voice Notes (Auto-deletes in 48 hours)</span>
            </>
          )}
          <input type="file" onChange={handleFileChange} className="hidden" disabled={isUploading} />
        </label>
      )}
    </div>
  );
}
