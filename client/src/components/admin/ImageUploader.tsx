/* eslint-disable @next/next/no-img-element */
"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, UploadCloud, X } from "lucide-react";
import { API_URL } from "@/lib/api";
import { btnGhost, input } from "@/components/dashboard/ui";

const ImageUploader = ({
  images,
  onChange,
  max = 8,
}: {
  images: string[];
  onChange: (next: string[]) => void;
  max?: number;
}) => {
  const [busy, setBusy] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [over, setOver] = useState(false);
  const [url, setUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async (files: FileList | File[]) => {
    const list = Array.from(files).slice(0, max - images.length);
    if (!list.length) return toast.error(`You can add up to ${max} image${max > 1 ? "s" : ""}`);
    const fd = new FormData();
    list.forEach((f) => fd.append("files", f));
    setBusy(true);
    try {
      const res = await fetch(`${API_URL}/admin/upload`, { method: "POST", body: fd, credentials: "include" });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.message || "Upload failed");
      onChange([...images, ...d.urls]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= images.length || from === to) return;
    const next = [...images];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    onChange(next);
  };

  const addUrl = () => {
    const u = url.trim();
    if (!/^(https?:\/\/|\/)/.test(u)) return toast.error("Enter a link starting with https://");
    if (images.length >= max) return toast.error(`You can add up to ${max} images`);
    onChange([...images, u]);
    setUrl("");
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          if (e.dataTransfer.files.length) upload(e.dataTransfer.files);
        }}
        onClick={() => fileRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center text-sm transition ${
          over ? "border-lama bg-pink-50" : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <UploadCloud className="mx-auto mb-2 text-gray-400" />
        {busy ? "Uploading..." : "Drop images here or click to browse"}
        <div className="text-xs text-gray-500 mt-1">JPG, PNG, GIF or WebP, up to 5 MB each</div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          multiple={max > 1}
          hidden
          onChange={(e) => e.target.files && upload(e.target.files)}
        />
      </div>

      {images.length > 0 && (
        <>
          <ul className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {images.map((src, i) => (
              <li
                key={src + i}
                draggable
                onDragStart={() => setDragIdx(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (dragIdx !== null) move(dragIdx, i);
                  setDragIdx(null);
                }}
                className={`relative group rounded-lg overflow-hidden ring-1 ring-gray-200 bg-gray-50 ${
                  dragIdx === i ? "opacity-40" : ""
                }`}
              >
                <img src={src} alt="" className="w-full aspect-[3/4] object-cover" />
                {i === 0 && (
                  <span className="absolute top-1 left-1 text-[10px] bg-lama text-white rounded px-1.5 py-0.5">Main</span>
                )}
                <button
                  type="button"
                  onClick={() => onChange(images.filter((_, x) => x !== i))}
                  aria-label="Remove image"
                  className="absolute top-1 right-1 bg-white/90 rounded-full p-0.5 text-gray-700 hover:text-red-600"
                >
                  <X size={14} />
                </button>
                <div className="absolute bottom-0 inset-x-0 flex justify-between bg-black/50 text-white opacity-0 group-hover:opacity-100 transition">
                  <button type="button" aria-label="Move left" onClick={() => move(i, i - 1)} className="p-1.5"><ArrowLeft size={14} /></button>
                  <button type="button" aria-label="Move right" onClick={() => move(i, i + 1)} className="p-1.5"><ArrowRight size={14} /></button>
                </div>
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-500">The first image is the main one. Drag to reorder, or use the arrows.</p>
        </>
      )}

      <div className="flex gap-2">
        <input className={input} placeholder="Or paste an image link" value={url} onChange={(e) => setUrl(e.target.value)} />
        <button type="button" onClick={addUrl} className={btnGhost}>Add</button>
      </div>
    </div>
  );
};

export default ImageUploader;