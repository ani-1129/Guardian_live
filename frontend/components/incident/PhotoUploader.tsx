'use client';

import React, { useRef, useState } from 'react';
import { Camera, Upload, Trash2, ShieldCheck, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { WatermarkedImage } from '../../types/incident';
import { useImageCompression } from '../../hooks/useImageCompression';
import { useImageWatermark } from '../../hooks/useImageWatermark';

interface PhotoUploaderProps {
  images: WatermarkedImage[];
  onChange: (images: WatermarkedImage[]) => void;
  latitude: number | null;
  longitude: number | null;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  images,
  onChange,
  latitude,
  longitude,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { compressImage } = useImageCompression();
  const { applyWatermark } = useImageWatermark();

  const handleFiles = async (files: FileList | File[]) => {
    setErrorMsg(null);
    const validFiles: File[] = [];
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/webp'];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (allowedTypes.includes(file.type.toLowerCase()) || file.name.match(/\.(jpg|jpeg|png|heic|webp)$/i)) {
        validFiles.push(file);
      }
    }

    if (validFiles.length === 0) {
      setErrorMsg('Please upload valid image files (JPG, JPEG, PNG, HEIC, WEBP).');
      return;
    }

    if (images.length + validFiles.length > 10) {
      setErrorMsg(`Maximum 10 images allowed. You can only add ${10 - images.length} more.`);
      return;
    }

    setIsProcessing(true);

    try {
      const newProcessedImages: WatermarkedImage[] = [];
      for (const rawFile of validFiles) {
        // Step 1: Compress
        const compressed = await compressImage(rawFile, 1920, 1920, 0.85);
        // Step 2: Apply Canvas Watermark with Timestamp and GPS
        const watermarked = await applyWatermark(compressed, latitude, longitude);
        newProcessedImages.push(watermarked);
      }

      onChange([...images, ...newProcessedImages]);
    } catch (err) {
      console.error('Error processing images:', err);
      setErrorMsg('Failed to process image watermark. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemove = (id: string) => {
    onChange(images.filter((img) => img.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Camera className="w-5 h-5 text-red-500" />
          Step 3 — Upload Photo Evidence
        </h3>
        <p className="text-slate-400 text-sm mt-1">
          Upload up to 10 images. Photos are automatically timestamped and watermarked with live GPS coordinates via HTML5 Canvas.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Upload Drag & Drop Area */}
      <div className="border-2 border-dashed border-zinc-700/80 hover:border-red-500/60 rounded-2xl p-6 sm:p-8 text-center bg-zinc-900/50 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/heic,image/webp"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
        />

        <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 mx-auto flex items-center justify-center mb-4">
          <Upload className="w-7 h-7" />
        </div>

        <h4 className="text-slate-200 font-semibold text-base mb-1">
          Drag & drop images here or click to browse
        </h4>
        <p className="text-slate-400 text-xs mb-4">
          Supports JPG, JPEG, PNG, HEIC (Max 10 photos, auto-compressed & watermarked)
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            disabled={isProcessing || images.length >= 10}
            onClick={() => fileInputRef.current?.click()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium text-sm transition-all shadow-md"
          >
            {isProcessing ? 'Watermarking...' : 'Choose Photos'}
          </button>

          <button
            type="button"
            disabled={isProcessing || images.length >= 10}
            onClick={() => cameraInputRef.current?.click()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-slate-200 border border-zinc-700 font-medium text-sm transition-all inline-flex items-center justify-center gap-2"
          >
            <Camera className="w-4 h-4 text-red-400" />
            Take Photo (Mobile)
          </button>
        </div>
      </div>

      {/* Watermarked Photo Preview Grid */}
      {images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-slate-300">
              Attached Evidence ({images.length} / 10)
            </span>
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              HTML5 Canvas Watermarked
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {images.map((img) => (
              <div
                key={img.id}
                className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center gap-3 relative group"
              >
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-zinc-950 shrink-0 border border-zinc-800 relative">
                  <img
                    src={img.watermarkedDataUrl || img.previewUrl}
                    alt={img.filename}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ImageIcon className="w-4 h-4 text-white" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-200 truncate">{img.filename}</p>
                  <p className="text-xs text-slate-400">{formatFileSize(img.size)}</p>
                  <p className="text-[11px] text-red-400 font-mono mt-1 truncate">
                    {img.timestamp}
                  </p>

                  {/* Progress Bar */}
                  <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{ width: `${img.progress}%` }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemove(img.id)}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Remove image"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
