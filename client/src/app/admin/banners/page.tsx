/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { apiFetch, errorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { canWrite, isAdmin } from "@/lib/roles";
import ImageUploader from "@/components/admin/ImageUploader";
import { btnDanger, btnGhost, btnPrimary, card, input, label, Modal, Skeleton, Toggle } from "@/components/dashboard/ui";

type Banner = {
  _id: string; title: string; subtitle: string; image: string; link: string; buttonText: string; active: boolean; position: number;
};

const blank = { title: "", subtitle: "", link: "/list", buttonText: "Shop now", position: "0", active: true };

const AdminBanners = () => {
  const { user } = useAuth();
  const write = canWrite(user?.role);
  const admin = isAdmin(user?.role);

  const [banners, setBanners] = useState<Banner[] | null>(null);
  const [editing, setEditing] = useState<Banner | "new" | null>(null);
  const [f, setF] = useState(blank);
  const [image, setImage] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<Banner | null>(null);

  const load = useCallback(() => {
    apiFetch<{ banners: Banner[] }>("/admin/banners").then((d) => setBanners(d.banners)).catch((e) => toast.error(errorMessage(e)));
  }, []);
  useEffect(load, [load]);

  const open = (b: Banner | "new") => {
    setEditing(b);
    if (b === "new") { setF(blank); setImage([]); }
    else {
      setF({ title: b.title, subtitle: b.subtitle, link: b.link, buttonText: b.buttonText, position: String(b.position), active: b.active });
      setImage([b.image]);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image[0]) return toast.error("Add a banner image");
    setBusy(true);
    const body = JSON.stringify({ ...f, position: Number(f.position), image: image[0] });
    try {
      if (editing === "new") await apiFetch("/admin/banners", { method: "POST", body });
      else if (editing) await apiFetch(`/admin/banners/${editing._id}`, { method: "PUT", body });
      toast.success("Banner saved");
      setEditing(null);
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (b: Banner) => {
    try {
      await apiFetch(`/admin/banners/${b._id}`, { method: "PUT", body: JSON.stringify({ ...b, active: !b.active }) });
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const remove = async () => {
    if (!deleting) return;
    try {
      await apiFetch(`/admin/banners/${deleting._id}`, { method: "DELETE" });
      toast.success("Banner deleted");
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-semibold">Banners</h1>
        {write && <button className={btnPrimary} onClick={() => open("new")}>New banner</button>}
      </div>
      <p className="text-sm text-gray-500 mb-6">Active banners rotate on the home page, lowest position first. With none active, the default slider shows.</p>

      {!banners ? <Skeleton className="h-48" /> : banners.length === 0 ? (
        <p className="text-gray-500 text-sm">No banners yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {banners.map((b) => (
            <div key={b._id} className={`${card} overflow-hidden ${b.active ? "" : "opacity-60"}`}>
              <img src={b.image} alt="" className="w-full h-40 object-cover bg-gray-100" />
              <div className="p-4 text-sm flex flex-col gap-1">
                <div className="font-semibold">{b.title}</div>
                <div className="text-gray-500">{b.subtitle}</div>
                <div className="text-xs text-gray-400">Position {b.position} · links to {b.link}</div>
                {write && (
                  <div className="flex items-center gap-4 mt-3">
                    <Toggle on={b.active} onChange={() => toggle(b)} />
                    <button className="underline" onClick={() => open(b)}>Edit</button>
                    {admin && <button className="text-red-600 underline" onClick={() => setDeleting(b)}>Delete</button>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!editing} title={editing === "new" ? "New banner" : "Edit banner"} onClose={() => setEditing(null)}>
        <form onSubmit={save} className="flex flex-col gap-4">
          <div className={label}>Image (wide images look best, e.g. 1600×600)<ImageUploader images={image} onChange={(i) => setImage(i.slice(-1))} max={1} /></div>
          <label className={label}>Title<input className={input} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required maxLength={80} /></label>
          <label className={label}>Subtitle<input className={input} value={f.subtitle} onChange={(e) => setF({ ...f, subtitle: e.target.value })} maxLength={160} /></label>
          <div className="grid grid-cols-3 gap-4">
            <label className={label}>Link<input className={input} value={f.link} onChange={(e) => setF({ ...f, link: e.target.value })} /></label>
            <label className={label}>Button text<input className={input} value={f.buttonText} onChange={(e) => setF({ ...f, buttonText: e.target.value })} maxLength={24} /></label>
            <label className={label}>Position<input className={input} type="number" value={f.position} onChange={(e) => setF({ ...f, position: e.target.value })} /></label>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" className={btnGhost} onClick={() => setEditing(null)}>Cancel</button>
            <button disabled={busy} className={btnPrimary}>{busy ? "Saving..." : "Save banner"}</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleting} title="Delete banner?" onClose={() => setDeleting(null)}>
        <p className="text-sm text-gray-600 mb-5">&quot;{deleting?.title}&quot; will be removed from the home page.</p>
        <div className="flex justify-end gap-3">
          <button className={btnGhost} onClick={() => setDeleting(null)}>Cancel</button>
          <button className={btnDanger} onClick={remove}>Delete</button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminBanners;