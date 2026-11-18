"use client";

import { useEffect, type ReactNode } from "react";
import { Star, X } from "lucide-react";

export const card = "bg-white ring-1 ring-gray-200 rounded-xl";
export const input =
  "ring-1 ring-gray-300 rounded-lg px-3 py-2 w-full text-sm bg-white focus:outline-none focus:ring-2 focus:ring-lama";
export const label = "text-xs font-medium text-gray-600 flex flex-col gap-1.5";
const base =
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium px-4 py-2 transition disabled:opacity-60 disabled:cursor-not-allowed";
export const btnPrimary = `${base} bg-lama text-white hover:opacity-90`;
export const btnGhost = `${base} ring-1 ring-gray-300 text-gray-700 hover:bg-gray-50`;
export const btnDanger = `${base} bg-red-600 text-white hover:bg-red-700`;

export const fmtDate = (d: string | Date) =>
  new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
export const fmtDateTime = (d: string | Date) =>
  new Date(d).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  requested: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
  refunded: "bg-green-100 text-green-800",
};

export const StatusBadge = ({ status }: { status: string }) => (
  <span
    className={`inline-block text-xs font-medium capitalize rounded-full px-2.5 py-0.5 ${
      STATUS_STYLE[status] ?? "bg-gray-100 text-gray-700"
    }`}
  >
    {status}
  </span>
);

export const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-100 rounded-lg ${className}`} />
);

export const SectionHeader = ({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) => (
  <div className="flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 className="text-2xl font-semibold">{title}</h1>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
    {action}
  </div>
);

export const EmptyState = ({
  icon,
  title,
  text,
  action,
}: {
  icon: ReactNode;
  title: string;
  text?: string;
  action?: ReactNode;
}) => (
  <div className={`${card} p-10 flex flex-col items-center text-center gap-3`}>
    <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center">{icon}</div>
    <div className="font-medium">{title}</div>
    {text && <p className="text-sm text-gray-500 max-w-sm">{text}</p>}
    {action}
  </div>
);

export const Modal = ({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/40 overflow-y-auto p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="fade-in bg-white rounded-xl max-w-lg mx-auto my-10 p-6"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export const Stars = ({ value, size = 16 }: { value: number; size?: number }) => (
  <span className="inline-flex gap-0.5 text-amber-400" aria-label={`${value} out of 5`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Star key={n} size={size} className={n <= Math.round(value) ? "fill-current" : "text-gray-300"} />
    ))}
  </span>
);

export const StarPicker = ({ value, onChange }: { value: number; onChange: (n: number) => void }) => (
  <span className="inline-flex gap-1">
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        onClick={() => onChange(n)}
        aria-label={`${n} star${n > 1 ? "s" : ""}`}
        className="text-amber-400 hover:scale-110 transition"
      >
        <Star size={26} className={n <= value ? "fill-current" : "text-gray-300"} />
      </button>
    ))}
  </span>
);

export const Toggle = ({
  on,
  onChange,
  disabled,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    disabled={disabled}
    onClick={() => onChange(!on)}
    className={`relative w-11 h-6 rounded-full transition shrink-0 disabled:opacity-60 ${on ? "bg-lama" : "bg-gray-300"}`}
  >
    <span
      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
        on ? "translate-x-5" : ""
      }`}
    />
  </button>
);