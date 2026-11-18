"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { FileText, RotateCcw, Search, ShoppingBag, Star, XCircle } from "lucide-react";
import { apiFetch, errorMessage, money } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import Pager from "@/components/admin/Pager";
import { ReturnModal, ReviewModal, type Order } from "./OrderModals";
import { btnDanger, btnGhost, card, EmptyState, fmtDate, input, Modal, SectionHeader, Skeleton, StatusBadge } from "./ui";

type Resp = { orders: Order[]; total: number; page: number; pages: number };

const FILTERS = ["all", "pending", "paid", "shipped", "delivered", "cancelled"];
const FLOW = ["pending", "paid", "shipped", "delivered"];

const Progress = ({ status }: { status: string }) => {
  if (status === "cancelled") return <div className="h-2 rounded-full bg-red-200" title="Cancelled" />;
  const idx = FLOW.indexOf(status);
  return (
    <div className="flex gap-1.5" aria-label={`Order status: ${status}`}>
      {FLOW.map((s, i) => (
        <div key={s} title={s} className={`h-2 flex-1 rounded-full ${i <= idx ? "bg-green-500" : "bg-gray-200"}`} />
      ))}
    </div>
  );
};

const returnable = (o: Order) => {
  if (o.status !== "delivered") return false;
  const at = o.statusHistory?.find((h) => h.status === "delivered")?.at ?? o.createdAt;
  return Date.now() - new Date(at).getTime() <= 14 * 86400000;
};

const Orders = () => {
  const { reload: reloadCart } = useCart();
  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [tick, setTick] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<Order | null>(null);
  const [returning, setReturning] = useState<Order | null>(null);
  const [reviewing, setReviewing] = useState<Order | null>(null);
  const [reviewed, setReviewed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const t = setTimeout(() => {
      setQ(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    apiFetch<{ reviews: { product?: { _id: string } | null }[] }>("/reviews/mine")
      .then((d) => setReviewed(new Set(d.reviews.map((r) => r.product?._id).filter(Boolean) as string[])))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const qs = new URLSearchParams({ page: String(page), limit: "5" });
    if (status !== "all") qs.set("status", status);
    if (q) qs.set("q", q);
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    apiFetch<Resp>(`/orders?${qs}`)
      .then((d) => alive && setData(d))
      .catch((e) => alive && toast.error(errorMessage(e)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [page, status, q, from, to, tick]);

  const filtered = status !== "all" || !!q || !!from || !!to;
  const clear = () => {
    setStatus("all");
    setSearch("");
    setQ("");
    setFrom("");
    setTo("");
    setPage(1);
  };

  const reorder = async (o: Order) => {
    setBusyId(o._id);
    try {
      const d = await apiFetch<{ added: number; skipped: number }>(`/orders/${o._id}/reorder`, { method: "POST" });
      await reloadCart();
      if (d.added === 0) toast.error("None of these items are available right now");
      else
        toast.success(
          `${d.added} item${d.added > 1 ? "s" : ""} added to your cart` +
            (d.skipped ? `, ${d.skipped} unavailable` : "")
        );
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const cancel = async () => {
    if (!cancelling) return;
    setBusyId(cancelling._id);
    try {
      await apiFetch(`/orders/${cancelling._id}/cancel`, { method: "POST" });
      toast.success("Order cancelled");
      setCancelling(null);
      setTick((t) => t + 1);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title="My orders" subtitle="Track, reorder, return or review your purchases" />

      {/* FILTERS */}
      <div className={`${card} p-4 flex flex-col gap-4`}>
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-52">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className={`${input} pl-9`}
              placeholder="Search by product or order number"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <input type="date" aria-label="From date" className={`${input} !w-auto`} value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
          <input type="date" aria-label="To date" className={`${input} !w-auto`} value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} />
          {filtered && <button className={btnGhost} onClick={clear}>Clear</button>}
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1); }}
              className={`rounded-full px-4 py-1.5 text-sm capitalize whitespace-nowrap transition ${
                status === s ? "bg-lama text-white" : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* LIST */}
      {loading && !data ? (
        <div className="flex flex-col gap-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-40" />)}</div>
      ) : data && data.orders.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag size={22} />}
          title={filtered ? "No orders match your filters" : "No orders yet"}
          text={filtered ? "Try a different search or clear the filters." : "When you place an order it will show up here."}
          action={
            filtered ? (
              <button className={btnGhost} onClick={clear}>Clear filters</button>
            ) : (
              <Link href="/list" className="rounded-lg bg-lama text-white text-sm px-4 py-2">Start shopping</Link>
            )
          }
        />
      ) : (
        <div className={`flex flex-col gap-4 transition-opacity ${loading ? "opacity-60" : ""}`}>
          {data?.orders.map((o) => (
            <div key={o._id} className={`${card} p-5 flex flex-col gap-4`}>
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <div className="font-semibold">Order #{o._id.slice(-8)}</div>
                  <div className="text-xs text-gray-500">Placed {fmtDate(o.createdAt)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={o.status} />
                  <span className="font-semibold">{money(o.total)}</span>
                </div>
              </div>

              <Progress status={o.status} />

              <div className="text-sm divide-y">
                {o.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between py-1.5">
                    <span>
                      {i.name} × {i.quantity}
                      {[i.color, i.size].filter(Boolean).length > 0 && (
                        <span className="text-gray-400"> ({[i.color, i.size].filter(Boolean).join(" / ")})</span>
                      )}
                    </span>
                    <span className="text-gray-600">{money(i.price * i.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <Link href={`/orders/${o._id}`} className={btnGhost}>Details</Link>
                <Link href={`/orders/${o._id}/invoice`} className={btnGhost}>
                  <FileText size={16} /> Invoice
                </Link>
                <button className={btnGhost} disabled={busyId === o._id} onClick={() => reorder(o)}>
                  <RotateCcw size={16} /> Buy again
                </button>
                {o.status === "pending" && (
                  <button className={`${btnGhost} !text-red-600 !ring-red-200`} onClick={() => setCancelling(o)}>
                    <XCircle size={16} /> Cancel order
                  </button>
                )}
                {returnable(o) && (
                  <button className={btnGhost} onClick={() => setReturning(o)}>Return items</button>
                )}
                {o.status === "delivered" && (
                  <button className={btnGhost} onClick={() => setReviewing(o)}>
                    <Star size={16} /> Review
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {data && <Pager page={data.page} pages={data.pages} onPage={setPage} />}

      {/* MODALS */}
      <Modal open={!!cancelling} title="Cancel this order?" onClose={() => setCancelling(null)}>
        <p className="text-sm text-gray-600 mb-5">
          Order #{cancelling?._id.slice(-8)} will be cancelled and the items returned to stock. This can&apos;t be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button className={btnGhost} onClick={() => setCancelling(null)}>Keep order</button>
          <button className={btnDanger} disabled={busyId === cancelling?._id} onClick={cancel}>
            {busyId === cancelling?._id ? "Cancelling..." : "Yes, cancel it"}
          </button>
        </div>
      </Modal>

      <ReturnModal
        order={returning}
        onClose={() => setReturning(null)}
        onDone={() => setReturning(null)}
      />
      <ReviewModal
        order={reviewing}
        reviewed={reviewed}
        onClose={() => setReviewing(null)}
        onSaved={(id) => setReviewed((s) => new Set(s).add(id))}
      />
    </div>
  );
};

export default Orders;