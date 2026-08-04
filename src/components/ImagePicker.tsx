import { useRef, useState } from 'react';
import { useData } from '../context/DataContext';

const MAX_IMAGES = 4;

interface ImagePickerProps {
  images: string[];
  onChange: (images: string[]) => void;
}

/** בחירת עד 4 תמונות לפריט: הראשונה היא התמונה הראשית */
export function ImagePicker({ images, onChange }: ImagePickerProps) {
  const { uploadImage, imageUrls } = useData();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const picked = Array.from(files).slice(0, MAX_IMAGES - images.length);
      const paths: string[] = [];
      for (const file of picked) {
        const path = await uploadImage(file);
        if (path) paths.push(path);
      }
      onChange([...images, ...paths]);
    } catch {
      setError('העלאת התמונה נכשלה, נסו שוב');
    } finally {
      setUploading(false);
    }
  };

  const remove = (path: string) => onChange(images.filter((p) => p !== path));
  const makeCover = (path: string) => onChange([path, ...images.filter((p) => p !== path)]);

  return (
    <div>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.target.value = '';
        }}
      />

      {images.length === 0 ? (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={uploading}
            onClick={() => cameraRef.current?.click()}
            className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 text-amber-700 transition active:scale-[0.98] disabled:opacity-50 dark:bg-amber-500/15 dark:text-amber-300"
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
      ) : (
        <>
          <div className="grid grid-cols-4 gap-2">
            {images.map((path, idx) => {
              const url = imageUrls[path];
              return (
                <div key={path} className="relative">
                  <button
                    type="button"
                    onClick={() => makeCover(path)}
                    className="block w-full overflow-hidden rounded-xl"
                    title={idx === 0 ? 'תמונה ראשית' : 'הפיכה לראשית'}
                  >
                    {url ? (
                      <img src={url} alt="" className="aspect-square w-full object-cover" />
                    ) : (
                      <div className="flex aspect-square w-full items-center justify-center bg-gray-100 text-2xl">👕</div>
                    )}
                  </button>
                  {idx === 0 && (
                    <span className="absolute bottom-1 start-1 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      ראשית
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(path)}
                    aria-label="הסרת תמונה"
                    className="absolute -top-1.5 -end-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white shadow"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
            {images.length < MAX_IMAGES && (
              <div className="flex aspect-square flex-col gap-1">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => cameraRef.current?.click()}
                  className="flex flex-1 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 text-lg active:scale-95 disabled:opacity-50"
                  aria-label="צילום תמונה נוספת"
                >
                  📷
                </button>
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => galleryRef.current?.click()}
                  className="flex flex-1 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 text-lg active:scale-95 disabled:opacity-50"
                  aria-label="הוספה מהגלריה"
                >
                  🖼️
                </button>
              </div>
            )}
          </div>
          <p className="mt-1.5 text-xs text-gray-400">
            {uploading ? 'מעלה תמונה...' : `עד ${MAX_IMAGES} תמונות · לחיצה על תמונה הופכת אותה לראשית`}
          </p>
        </>
      )}
      {error && <p className="mt-2 text-sm text-rose-600 dark:text-rose-300">{error}</p>}
    </div>
  );
}
