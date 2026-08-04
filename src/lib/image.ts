/**
 * דחיסת תמונה בצד הלקוח לפני העלאה: הקטנה ל-1200px מקסימום והמרה ל-JPEG.
 * חוסך זמן העלאה ומקום אחסון, במיוחד בצילום מהנייד.
 */
export async function compressImage(file: File, maxSize = 1200, quality = 0.82): Promise<Blob> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;

  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', quality),
  );
  return blob ?? file;
}
