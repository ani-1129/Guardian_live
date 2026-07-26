import { WatermarkedImage } from '../types/incident';

export async function uploadWatermarkedImages(
  images: WatermarkedImage[]
): Promise<Array<{ filename: string; watermarkedDataUrl: string; timestamp: string }>> {
  return images.map((img) => ({
    filename: img.filename,
    watermarkedDataUrl: img.watermarkedDataUrl,
    timestamp: img.timestamp,
  }));
}
