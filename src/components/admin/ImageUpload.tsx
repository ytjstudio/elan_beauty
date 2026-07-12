import { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
}

export function ImageUpload({ images, onChange }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);

    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('product-images').upload(fileName, file);
      if (!error) {
        const { data: url } = supabase.storage.from('product-images').getPublicUrl(fileName);
        uploaded.push(url.publicUrl);
      }
    }

    onChange([...images, ...uploaded]);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (idx: number) => {
    onChange(images.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleUpload(e.dataTransfer.files); }}
        className="border-2 border-dashed border-secondary-200 rounded-xl p-6 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-colors"
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
            <p className="text-sm text-secondary-600">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-6 h-6 text-secondary-400" />
            <p className="text-sm text-secondary-600">Click to upload or drag and drop</p>
            <p className="text-xs text-secondary-400">PNG, JPG, WEBP up to 5MB</p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
      </div>

      {images.length > 0 && (
        <div className="flex flex-wrap gap-3 mt-3">
          {images.map((img, i) => (
            <div key={i} className="relative w-20 h-20 group">
              <img src={img} alt={`Product ${i + 1}`} className="w-full h-full object-cover rounded-lg border border-secondary-200" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute -top-2 -right-2 bg-error-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
              {i === 0 && <span className="absolute bottom-0 left-0 right-0 bg-primary-600 text-white text-xs text-center py-0.5 rounded-b-lg">Main</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
