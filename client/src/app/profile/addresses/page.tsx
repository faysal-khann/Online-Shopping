"use client";

import { useState } from "react";
import { apiFetch, errorMessage } from "@/lib/api";
import { Address, Profile, useProfile } from "@/lib/useProfile";

const input = "ring-1 ring-gray-300 rounded-md p-2 w-full text-sm";
const label = "text-xs font-medium text-gray-600 flex flex-col gap-1";

const empty = {
  label: "home" as Address["label"],
  fullName: "",
  phone: "",
  line1: "",
  city: "",
  postalCode: "",
  isDefault: false,
};

const AddressesPage = () => {
  const { profile, setProfile } = useProfile();
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!profile) return <p className="text-gray-500">Loading...</p>;

  const set = (k: keyof typeof empty) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const run = async (fn: () => Promise<{ profile: Profile }>) => {
    setError("");
    try {
      const d = await fn();
      setProfile(d.profile);
      return true;
    } catch (e) {
      setError(errorMessage(e));
      return false;
    }
  };

  const startAdd = () => {
    setForm(empty);
    setEditingId(null);
    setOpen(true);
    setError("");
  };

  const startEdit = (a: Address) => {
    setForm({
      label: a.label,
      fullName: a.fullName,
      phone: a.phone,
      line1: a.line1,
      city: a.city,
      postalCode: a.postalCode ?? "",
      isDefault: a.isDefault,
    });
    setEditingId(a._id);
    setOpen(true);
    setError("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const ok = await run(() =>
      editingId
        ? apiFetch(`/profile/addresses/${editingId}`, { method: "PUT", body: JSON.stringify(form) })
        : apiFetch("/profile/addresses", { method: "POST", body: JSON.stringify(form) })
    );
    setBusy(false);
    if (ok) setOpen(false);
  };

  const remove = (a: Address) => {
    if (!window.confirm("Delete this address?")) return;
    run(() => apiFetch(`/profile/addresses/${a._id}`, { method: "DELETE" }));
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Addresses</h1>
        {!open && profile.addresses.length < 5 && (
          <button onClick={startAdd} className="rounded-md bg-lama text-white text-sm px-4 py-2">
            Add address
          </button>
        )}
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {open && (
        <form onSubmit={submit} className="ring-1 ring-gray-200 rounded-md p-4 flex flex-col gap-4">
          <h2 className="font-semibold">{editingId ? "Edit address" : "New address"}</h2>
          <div className="grid grid-cols-2 gap-4">
            <label className={label}>
              Label
              <select className={input} value={form.label} onChange={set("label")}>
                <option value="home">Home</option>
                <option value="work">Work</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className={label}>
              Full name
              <input className={input} value={form.fullName} onChange={set("fullName")} required />
            </label>
          </div>
          <label className={label}>
            Phone
            <input className={input} value={form.phone} onChange={set("phone")} required />
          </label>
          <label className={label}>
            Street address
            <input className={input} value={form.line1} onChange={set("line1")} required />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className={label}>
              City
              <input className={input} value={form.city} onChange={set("city")} required />
            </label>
            <label className={label}>
              Postal code (optional)
              <input className={input} value={form.postalCode} onChange={set("postalCode")} />
            </label>
          </div>
          <label className="text-sm flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
            />
            Use as my default address
          </label>
          <div className="flex gap-3">
            <button disabled={busy} className="rounded-md bg-lama text-white text-sm px-4 py-2 disabled:opacity-60">
              {busy ? "Saving..." : "Save address"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="rounded-md text-sm px-4 py-2 ring-1 ring-gray-300">
              Cancel
            </button>
          </div>
        </form>
      )}

      {profile.addresses.length === 0 && !open ? (
        <p className="text-gray-500 text-sm">No saved addresses yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {profile.addresses.map((a) => (
            <div key={a._id} className="ring-1 ring-gray-200 rounded-md p-4 text-sm flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <span className="capitalize font-semibold">{a.label}</span>
                {a.isDefault && (
                  <span className="text-xs bg-green-100 text-green-800 rounded-full px-2 py-0.5">Default</span>
                )}
              </div>
              <div>{a.fullName}</div>
              <div className="text-gray-500">{a.line1}</div>
              <div className="text-gray-500">
                {a.city}
                {a.postalCode ? `, ${a.postalCode}` : ""}
              </div>
              <div className="text-gray-500">{a.phone}</div>
              <div className="flex gap-4 mt-3">
                <button onClick={() => startEdit(a)} className="underline">Edit</button>
                {!a.isDefault && (
                  <button
                    onClick={() => run(() => apiFetch(`/profile/addresses/${a._id}/default`, { method: "PATCH" }))}
                    className="underline"
                  >
                    Make default
                  </button>
                )}
                <button onClick={() => remove(a)} className="text-red-600 underline">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressesPage;