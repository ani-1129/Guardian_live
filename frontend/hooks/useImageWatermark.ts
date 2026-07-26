import { useCallback } from 'react';
import { WatermarkedImage } from '../types/incident';

export function useImageWatermark() {
  const formatCoordinates = (lat: number | null, lng: number | null) => {
    if (lat === null || lng === null) return 'GPS N/A';
    const latDir = lat >= 0 ? 'N' : 'S';
    const lngDir = lng >= 0 ? 'E' : 'W';
    return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`;
  };

  const applyWatermark = useCallback(
    async (
      file: File,
      lat: number | null,
      lng: number | null,
      customTimestamp?: string
    ): Promise<WatermarkedImage> => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      const timeStr = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      const timestampText = customTimestamp || `${dateStr} • ${timeStr}`;
      const gpsText = formatCoordinates(lat, lng);
      const fullWatermarkText = `GUARDIAN LIVE | ${timestampText} | ${gpsText}`;

      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
          const img = new Image();
          img.src = e.target?.result as string;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
              const preview = URL.createObjectURL(file);
              return resolve({
                id: Math.random().toString(36).substring(2, 9),
                originalFile: file,
                previewUrl: preview,
                watermarkedDataUrl: img.src,
                watermarkedBlob: null,
                filename: file.name,
                size: file.size,
                progress: 100,
                timestamp: timestampText,
              });
            }

            // Draw original image
            ctx.drawImage(img, 0, 0);

            // Watermark Styling
            const fontSize = Math.max(16, Math.floor(canvas.height / 28));
            const padding = Math.max(12, Math.floor(fontSize * 0.7));
            const font = `600 ${fontSize}px sans-serif, system-ui`;
            ctx.font = font;

            const line1 = `📅 ${timestampText}`;
            const line2 = `📍 ${gpsText}`;
            const line3 = `🛡️ GUARDIAN EMERGENCY DISPATCH VERIFIED`;

            const textWidth1 = ctx.measureText(line1).width;
            const textWidth2 = ctx.measureText(line2).width;
            const textWidth3 = ctx.measureText(line3).width;
            const maxWidth = Math.max(textWidth1, textWidth2, textWidth3);

            const boxWidth = maxWidth + padding * 2;
            const boxHeight = fontSize * 3.6 + padding * 2;

            const x = canvas.width - boxWidth - padding;
            const y = canvas.height - boxHeight - padding;

            // Semi-transparent dark background card
            ctx.fillStyle = 'rgba(9, 9, 11, 0.82)';
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
            ctx.lineWidth = Math.max(2, Math.floor(fontSize / 10));

            // Rounded rectangle background
            const radius = 8;
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + boxWidth - radius, y);
            ctx.quadraticCurveTo(x + boxWidth, y, x + boxWidth, y + radius);
            ctx.lineTo(x + boxWidth, y + boxHeight - radius);
            ctx.quadraticCurveTo(x + boxWidth, y + boxHeight, x + boxWidth - radius, y + boxHeight);
            ctx.lineTo(x + radius, y + boxHeight);
            ctx.quadraticCurveTo(x, y + boxHeight, x, y + boxHeight - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Text Rendering
            ctx.fillStyle = '#FFFFFF';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';

            ctx.fillText(line1, x + padding, y + padding);
            ctx.fillStyle = '#EF4444';
            ctx.fillText(line2, x + padding, y + padding + fontSize * 1.2);
            ctx.fillStyle = '#94A3B8';
            ctx.font = `500 ${Math.floor(fontSize * 0.75)}px sans-serif`;
            ctx.fillText(line3, x + padding, y + padding + fontSize * 2.5);

            const watermarkedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
            const previewUrl = URL.createObjectURL(file);

            canvas.toBlob(
              (blob) => {
                resolve({
                  id: Math.random().toString(36).substring(2, 9),
                  originalFile: file,
                  previewUrl,
                  watermarkedDataUrl,
                  watermarkedBlob: blob,
                  filename: file.name,
                  size: file.size,
                  progress: 100,
                  timestamp: `${dateStr} ${timeStr}`,
                });
              },
              'image/jpeg',
              0.9
            );
          };
        };
      });
    },
    []
  );

  return { applyWatermark, formatCoordinates };
}
