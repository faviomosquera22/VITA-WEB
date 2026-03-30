"use client";

import Link from "next/link";
import { startTransition, useMemo, useState } from "react";

import {
  getNotificationSummary,
  portalNotifications,
  type PortalNotification,
  type PortalNotificationPriority,
} from "../_data/portal-notifications";

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState(portalNotifications);
  const unreadCount = useMemo(() => items.filter((item) => !item.read).length, [items]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="relative rounded-full border border-slate-200 bg-white px-3 py-2 text-slate-700 transition hover:bg-slate-50"
        aria-label="Abrir centro de notificaciones"
      >
        <span className="text-sm">Notificaciones</span>
        {unreadCount > 0 ? (
          <span className="ml-2 inline-flex min-w-6 justify-center rounded-full bg-sky-600 px-1.5 py-0.5 text-[11px] font-semibold text-white">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 z-20 mt-3 w-[360px] rounded-[26px] border border-slate-200 bg-white p-4 shadow-xl">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-950">Centro de notificaciones</p>
              <p className="text-xs text-slate-500">Recordatorios y eventos listos para seguimiento.</p>
            </div>
            <button
              type="button"
              onClick={() =>
                startTransition(() => {
                  setItems((current) => current.map((item) => ({ ...item, read: true })));
                })
              }
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-700"
            >
              Marcar todo leido
            </button>
          </div>

          <NotificationFeed
            items={items}
            compact
            onMarkAsRead={(id) =>
              startTransition(() => {
                setItems((current) =>
                  current.map((item) => (item.id === id ? { ...item, read: true } : item))
                );
              })
            }
          />
        </div>
      ) : null}
    </div>
  );
}

export function NotificationInboxPanel() {
  const summary = getNotificationSummary();

  return (
    <section className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <MiniMetric label="Eventos" value={summary.total} />
        <MiniMetric label="Sin leer" value={summary.unread} tone="sky" />
        <MiniMetric label="Criticas" value={summary.critical} tone="rose" />
      </div>

      <NotificationFeed items={portalNotifications} />
    </section>
  );
}

function NotificationFeed({
  items,
  compact = false,
  onMarkAsRead,
}: {
  items: PortalNotification[];
  compact?: boolean;
  onMarkAsRead?: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <article
          key={item.id}
          className={[
            "rounded-[22px] border px-4 py-3",
            item.read ? "border-slate-200 bg-slate-50/80" : "border-sky-100 bg-sky-50/70",
          ].join(" ")}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                <PriorityPill priority={item.priority} />
              </div>
              <p className="mt-1 text-sm text-slate-600">{item.description}</p>
              <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-slate-400">{item.timestamp}</p>
            </div>

            {!compact && onMarkAsRead ? (
              <button
                type="button"
                onClick={() => onMarkAsRead(item.id)}
                className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700"
              >
                Leida
              </button>
            ) : null}
          </div>

          {item.href ? (
            <div className="mt-3">
              <Link
                href={item.href}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {item.actionLabel ?? "Abrir"}
              </Link>
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function PriorityPill({ priority }: { priority: PortalNotificationPriority }) {
  const className =
    priority === "critical"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : priority === "high"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : priority === "medium"
          ? "border-sky-200 bg-sky-50 text-sky-700"
          : "border-slate-200 bg-white text-slate-600";

  return (
    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${className}`}>
      {priority}
    </span>
  );
}

function MiniMetric({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "sky" | "rose";
}) {
  const className =
    tone === "sky"
      ? "border-sky-200 bg-sky-50"
      : tone === "rose"
        ? "border-rose-200 bg-rose-50"
        : "border-slate-200 bg-white";

  return (
    <div className={`rounded-[22px] border px-4 py-3 ${className}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}
