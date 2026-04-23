"use client";
import { useState, useRef } from "react";
import { Upload, X, Loader2, ImagePlus } from "lucide-react";

const BODY = "var(--font-inter, 'system-ui', sans-serif)";
const C = {
  cream: "#FFFFFF", muted: "#EFE7DE", white: "#FFFFFF",
  terra: "#D87D6F", coffee: "#82554D", border: "rgba(130,85,77,0.14)",
};

interface Props {
  images: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
}

async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) throw new Error((await res.json()).error || "Error al subir");
  return (await res.json()).url;
}

export function ImageUploader({ images, onChange, maxImages = 8 }: Props) {
  const [uploading, setUploading] = useState<string[]>([]); // temp object URLs while uploading
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setError("");
    const remaining = maxImages - images.length;
    const toUpload = Array.from(files).slice(0, remaining);
    if (!toUpload.length) return;

    // Show local previews immediately
    const previews = toUpload.map(f => URL.createObjectURL(f));
    setUploading(prev => [...prev, ...previews]);

    try {
      const urls = await Promise.all(toUpload.map(uploadFile));
      onChange([...images, ...urls]);
    } catch (e: any) {
      setError(e.message || "Error al subir imágenes");
    } finally {
      previews.forEach(p => URL.revokeObjectURL(p));
      setUploading([]);
    }
  };

  const remove = (idx: number) => onChange(images.filter((_, i) => i !== idx));

  const allPreviews = [...images, ...uploading];
  const canAdd = images.length < maxImages && uploading.length === 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Thumbnails grid */}
      {allPreviews.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {allPreviews.map((src, i) => {
            const isUploading = i >= images.length;
            return (
              <div key={src} style={{ position: "relative", borderRadius: 12, overflow: "hidden", aspectRatio: "4/3", background: C.muted }}>
                <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                {isUploading && (
                  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Loader2 style={{ width: 20, height: 20, color: "#fff" }} className="animate-spin" />
                  </div>
                )}
                {!isUploading && (
                  <button type="button" onClick={() => remove(i)}
                    style={{ position: "absolute", top: 5, right: 5, width: 22, height: 22, borderRadius: 11, background: "rgba(0,0,0,0.55)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <X style={{ width: 12, height: 12, color: "#fff" }} />
                  </button>
                )}
                {i === 0 && !isUploading && (
                  <div style={{ position: "absolute", bottom: 5, left: 5, background: C.terra, borderRadius: 6, padding: "2px 6px" }}>
                    <span style={{ fontFamily: BODY, fontSize: 9, fontWeight: 700, color: "#fff", textTransform: "uppercase" }}>Portada</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Drop zone */}
      {canAdd && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
          style={{
            border: `2px dashed ${dragging ? C.terra : C.border}`,
            borderRadius: 16, padding: "22px 16px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
            cursor: "pointer", background: dragging ? `${C.terra}08` : C.cream,
            transition: "all 0.15s",
          }}
        >
          {allPreviews.length === 0
            ? <Upload style={{ width: 28, height: 28, color: C.coffee, opacity: 0.5 }} />
            : <ImagePlus style={{ width: 22, height: 22, color: C.terra }} />}
          <span style={{ fontFamily: BODY, fontSize: 13, fontWeight: 600, color: C.coffee }}>
            {allPreviews.length === 0 ? "Arrastra fotos aquí o toca para elegir" : `Agregar más (${images.length}/${maxImages})`}
          </span>
          <span style={{ fontFamily: BODY, fontSize: 11, color: C.coffee, opacity: 0.6 }}>
            JPG, PNG o WEBP · máx. 10 MB c/u
          </span>
          <input ref={inputRef} type="file" accept="image/*" multiple hidden
            onChange={e => handleFiles(e.target.files)} />
        </div>
      )}

      {error && (
        <p style={{ fontFamily: BODY, fontSize: 12, color: "#B91C1C" }}>{error}</p>
      )}
    </div>
  );
}
