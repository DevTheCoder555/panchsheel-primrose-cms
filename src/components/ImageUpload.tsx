import { useState, useRef } from 'react';

interface Props {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSizeMb?: number;
  preview?: string | null;
  label?: string;
}

export default function ImageUpload({ onFileSelect, accept = 'image/*', maxSizeMb = 5, preview, label = 'Upload Image' }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayPreview = preview || localPreview;

  function handleFile(file: File) {
    setError(null);
    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`File must be under ${maxSizeMb}MB`);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setLocalPreview(e.target?.result as string);
    reader.readAsDataURL(file);
    onFileSelect(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-navy-500 bg-navy-50' : 'border-slate-300 hover:border-navy-400 hover:bg-slate-50'
        }`}
      >
        {displayPreview ? (
          <img src={displayPreview} alt="Preview" className="max-h-32 mx-auto rounded" />
        ) : (
          <div className="py-2">
            <svg className="w-8 h-8 mx-auto text-slate-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="text-xs text-slate-400">Click or drag & drop</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
