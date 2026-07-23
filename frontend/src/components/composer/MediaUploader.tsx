'use client';

import React, { useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';
import { Upload, X, FileText, Image as ImageIcon, Video, Music, Loader2, Plus } from 'lucide-react';

export interface AttachmentItem {
  id: string;
  url: string;
  type: string;
  fileName: string;
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

  // Sync legacy single mediaUrl into items if provided
  const items: AttachmentItem[] =
    attachments.length > 0
      ? attachments
      : mediaUrl
      ? [{ id: 'legacy', url: mediaUrl, type: mediaType || 'image', fileName: fileName || 'Attachment' }]
      : [];

  const handleUploadFile = async (file: File) => {
    if (items.length >= 5) {
      toast.error('Maximum 5 media attachments allowed');
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
      let detectedType = 'image';
      if (file.type.startsWith('video/')) detectedType = 'video';
      else if (file.type.startsWith('audio/')) detectedType = 'audio';
      else if (!file.type.startsWith('image/')) detectedType = 'document';

      const newItem: AttachmentItem = {
        id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        url: data.url,
        type: detectedType,
        fileName: data.fileName || file.name,
      };

      const updated = [...items, newItem];
      if (onAttachmentsChange) onAttachmentsChange(updated);
      if (onUploadSuccess) onUploadSuccess(data.url, detectedType, data.fileName || file.name);

      toast.success(`Attached ${file.name}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'File upload failed');
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
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase text-muted-foreground">Media Attachments ({items.length}/5)</label>
        <span className="text-[11px] text-muted-foreground">Max 5 files (Images, Videos, PDFs, Audio)</span>
      </div>

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
                  <p className="text-[10px] text-muted-foreground capitalize">{item.type} File</p>
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
              <Loader2 className="h-5 w-5 animate-spin" /> Uploading media file...
            </div>
          ) : (
            <>
              <Upload className="h-6 w-6 text-muted-foreground group-hover:text-primary mb-1.5 transition-colors" />
              <span className="text-xs font-bold text-foreground">Drag & Drop or Click to Add Attachment</span>
              <span className="text-[10px] text-muted-foreground mt-0.5">Images, Videos, PDFs, Voice Notes</span>
            </>
          )}
          <input type="file" onChange={handleFileChange} className="hidden" disabled={isUploading} />
        </label>
      )}
    </div>
  );
}
