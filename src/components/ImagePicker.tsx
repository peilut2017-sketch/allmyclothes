import { useRef, useState } from 'react';
import { useData } from '../context/DataContext';

interface ImagePickerProps {
  imagePath: string | null;
  onChange: (path: string | null) => void;
}

export function ImagePicker({ imagePath, onChange }: ImagePickerProps) {
  const { uploadImage, imageUrls } = useData();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const url = imagePath ? imageUrls[imagePath] : null;

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const path = await uploadImage(file);
      onChange(path);
    } catch {
      setError('העלאת התמונה נכשלה, נסו שוב');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />

      {url ? (
        <div className="relative overflow-hidden rounded-2xl">
          <img src={url} alt="" className="aspect-square w-full object-cover" />
          <div className="absolute bottom-2 end-2 flex gap-2">
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              className="rounded-full bg-white/90 px-3 py-1.5 text-sm font-medium shadow"
            >
              החלפה
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="rounded-full bg-white/90 px-3 py-1.5 text-sm font-medium text-rose-600 shadow"
            >
              הסרה
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={uploading}
            onClick={() => cameraRef.current?.click()}
            className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 text-amber-700 transition active:scale-[0.98] disabled:opacity-50"
          >
            <span className="text-3xl">📷</span>
            <span className="text-sm font-semibold">{uploading ? 'מעלה...' : 'צילום'}</span>
          </button>
          <button
            type="button"
            disabled={uploading}
            onClick={() => galleryRef.current?.click()}
            className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-600 transition active:scale-[0.98] disabled:opacity-50"
          >
            <span className="text-3xl">🖼️</span>
            <span className="text-sm font-semibold">{uploading ? 'מעלה...' : 'מהגלריה'}</span>
          </button>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
    </div>
  );
}
