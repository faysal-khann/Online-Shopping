"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Monitor, Smartphone } from "lucide-react";
import { apiFetch, errorMessage } from "@/lib/api";
import { btnGhost, card, fmtDateTime, Skeleton } from "./ui";

type S = {
  _id: string;
  device: string;
  ip?: string;
  createdAt: string;
  lastSeenAt: string;
  current: boolean;
};

const Sessions = () => {
  const [sessions, setSessions] = useState<S[] | null>(null);

  const load = useCallback(async () => {
    try {
      const d = await apiFetch<{ sessions: S[] }>("/profile/sessions");
      setSessions(d.sessions);
    } catch (e) {
      toast.error(errorMessage(e));
      setSessions([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const end = async (id: string) => {
    try {
      await apiFetch(`/profile/sessions/${id}`, { method: "DELETE" });
      toast.success("Device signed out");
      load();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const endOthers = async () => {
    try {
      await apiFetch("/profile/sessions/revoke-others", { method: "POST" });
      toast.success("Signed out everywhere else");
      load();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <div className="flex flex-col gap-4 mt-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Login activity</h2>
          <p className="text-sm text-gray-500">Devices that are signed in to your account</p>
        </div>
        {sessions && sessions.length > 1 && (
          <button onClick={endOthers} className={`${btnGhost} !text-red-600 !ring-red-200`}>
            Sign out everywhere else
          </button>
        )}
      </div>

      {!sessions ? (
        <Skeleton className="h-24" />
      ) : (
        <div className={`${card} divide-y`}>
          {sessions.map((s) => {
            const Icon = /Android|iOS/.test(s.device) ? Smartphone : Monitor;
            return (
              <div key={s._id} className="flex items-center gap-4 p-4">
                <span className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
                  <Icon size={20} />
                </span>
                <div className="flex-1 min-w-0 text-sm">
                  <div className="font-medium flex items-center gap-2">
                    {s.device}
                    {s.current && (
                      <span className="text-xs bg-green-100 text-green-800 rounded-full px-2 py-0.5">This device</span>
                    )}
                  </div>
                  <div className="text-gray-500 truncate">
                    {s.ip?.replace("::ffff:", "") || "Unknown IP"} · Signed in {fmtDateTime(s.createdAt)} · Active {fmtDateTime(s.lastSeenAt)}
                  </div>
                </div>
                {!s.current && (
                  <button onClick={() => end(s._id)} className="text-sm text-red-600 underline whitespace-nowrap">
                    Sign out
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Sessions;