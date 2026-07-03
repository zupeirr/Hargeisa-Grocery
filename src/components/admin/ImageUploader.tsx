import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, GripVertical, Image as ImageIcon, Star } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://hargeisa-grocery-2.onrender.com/api';

export interface UploadedImage {
  id: string;      // local unique id
  url: string;     // final URL after upload
  preview: string; // object URL for local preview
  filename?: string;
}

interface UploadingFile {
  id: string;
  name: string;
  progress: number;
  error?: string;
}

interface ImageUploaderProps {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  maxImages?: number;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  images,
  onChange,
  maxImages = 8,
}) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [dragReorderIdx, setDragReorderIdx] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Upload Logic ──────────────────────────────────────────────────────────
  const uploadFiles = useCallback(
    async (files: File[]) => {
      const remaining = maxImages - images.length;
      const toUpload = files.slice(0, remaining);
      if (toUpload.length === 0) return;

      // Create uploading state entries
      const uploadEntries: UploadingFile[] = toUpload.map((f) => ({
        id: `upload-${Date.now()}-${Math.random()}`,
        name: f.name,
        progress: 0,
      }));
      setUploading((prev) => [...prev, ...uploadEntries]);

      // Upload each file individually so we can show per-file progress
      const results: UploadedImage[] = [];

      for (let i = 0; i < toUpload.length; i++) {
        const file = toUpload[i];
        const entry = uploadEntries[i];
        const preview = URL.createObjectURL(file);

        try {
          const formData = new FormData();
          formData.append('images', file);

          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', `${API_BASE}/upload`);

            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) {
                const pct = Math.round((e.loaded / e.total) * 100);
                setUploading((prev) =>
                  prev.map((u) => (u.id === entry.id ? { ...u, progress: pct } : u))
                );
              }
            };

            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                const data = JSON.parse(xhr.responseText);
                results.push({
                  id: entry.id,
                  url: data.urls[0],
                  preview,
                  filename: data.urls[0].split('/').pop(),
                });
                resolve();
              } else {
                reject(new Error('Upload failed'));
              }
            };

            xhr.onerror = () => reject(new Error('Network error'));
            xhr.send(formData);
          });

          // Mark as done
          setUploading((prev) =>
            prev.map((u) => (u.id === entry.id ? { ...u, progress: 100 } : u))
          );
        } catch (err) {
          setUploading((prev) =>
            prev.map((u) =>
              u.id === entry.id ? { ...u, error: 'Upload failed' } : u
            )
          );
        }
      }

      // After all done, add results and clear uploading entries
      onChange([...images, ...results]);
      setTimeout(() => {
        setUploading((prev) =>
          prev.filter((u) => !uploadEntries.find((e) => e.id === u.id))
        );
      }, 600);
    },
    [images, maxImages, onChange]
  );

  // ─── Drop Zone ─────────────────────────────────────────────────────────────
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDraggingOver(false);
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith('image/')
      );
      uploadFiles(files);
    },
    [uploadFiles]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      uploadFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  // ─── Remove ────────────────────────────────────────────────────────────────
  const removeImage = (id: string) => {
    onChange(images.filter((img) => img.id !== id));
  };

  // ─── Reorder (drag-and-drop within grid) ───────────────────────────────────
  const handleReorderDragStart = (e: React.DragEvent, idx: number) => {
    setDragReorderIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleReorderDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (dragReorderIdx === null || dragReorderIdx === targetIdx) return;
    const reordered = [...images];
    const [moved] = reordered.splice(dragReorderIdx, 1);
    reordered.splice(targetIdx, 0, moved);
    onChange(reordered);
    setDragReorderIdx(null);
  };

  const setAsMain = (idx: number) => {
    if (idx === 0) return;
    const reordered = [...images];
    const [main] = reordered.splice(idx, 1);
    reordered.unshift(main);
    onChange(reordered);
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      {images.length < maxImages && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
          onDragLeave={() => setIsDraggingOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200 ${
            isDraggingOver
              ? 'border-green-400 bg-green-500/10 scale-[1.01]'
              : 'border-gray-700 bg-gray-800/30 hover:border-gray-600 hover:bg-gray-800/50'
          }`}
        >
          <div className={`p-3 rounded-full transition-colors ${isDraggingOver ? 'bg-green-500/20' : 'bg-gray-800'}`}>
            <Upload size={24} className={isDraggingOver ? 'text-green-400' : 'text-gray-400'} />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-300">
              {isDraggingOver ? 'Drop images here!' : 'Drag & drop images here'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              or click to browse · JPG, PNG, WebP, GIF · Max 5MB each · {images.length}/{maxImages} uploaded
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileInput}
          />
        </div>
      )}

      {/* Upload Progress */}
      {uploading.length > 0 && (
        <div className="space-y-2">
          {uploading.map((u) => (
            <div key={u.id} className="bg-gray-800 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-gray-300 truncate max-w-[200px]">{u.name}</span>
                {u.error ? (
                  <span className="text-xs text-red-400">{u.error}</span>
                ) : (
                  <span className="text-xs text-green-400">{u.progress}%</span>
                )}
              </div>
              <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    u.error ? 'bg-red-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${u.error ? 100 : u.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((img, idx) => (
            <div
              key={img.id}
              draggable
              onDragStart={(e) => handleReorderDragStart(e, idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleReorderDrop(e, idx)}
              onDragEnd={() => setDragReorderIdx(null)}
              className={`relative group aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-grab active:cursor-grabbing ${
                dragReorderIdx === idx
                  ? 'border-green-400 opacity-50 scale-95'
                  : idx === 0
                  ? 'border-green-500'
                  : 'border-gray-700 hover:border-gray-500'
              }`}
            >
              <img
                src={img.preview || img.url}
                alt={`Product image ${idx + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = img.url;
                }}
              />

              {/* Main badge */}
              {idx === 0 && (
                <div className="absolute top-1 left-1 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <Star size={8} fill="white" />
                  Main
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                <div className="flex items-center gap-1.5">
                  <GripVertical size={14} className="text-gray-300" />
                  <span className="text-xs text-gray-300">Drag to reorder</span>
                </div>
                <div className="flex gap-2 mt-1">
                  {idx !== 0 && (
                    <button
                      type="button"
                      onClick={() => setAsMain(idx)}
                      className="text-xs bg-green-600 hover:bg-green-500 text-white px-2 py-1 rounded-md transition-colors"
                    >
                      Set Main
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(img.id)}
                    className="bg-red-600 hover:bg-red-500 text-white p-1 rounded-md transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Add more slot */}
          {images.length < maxImages && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-gray-700 hover:border-gray-500 bg-gray-800/30 hover:bg-gray-800/60 transition-all flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-gray-300"
            >
              <ImageIcon size={20} />
              <span className="text-xs">Add more</span>
            </button>
          )}
        </div>
      )}

      {images.length > 0 && (
        <p className="text-xs text-gray-500">
          💡 Drag images to reorder · First image is the main display image
        </p>
      )}
    </div>
  );
};

export default ImageUploader;
