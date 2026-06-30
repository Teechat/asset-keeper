"use client";

import { useState } from "react";
import type { AssetWithReminder } from "@/lib/database.types";
import { CATEGORY_EMOJI } from "@/lib/constants";
import { useLang } from "@/lib/lang-context";
import { translations } from "@/lib/i18n";

interface Props {
  asset: AssetWithReminder;
  onRefresh: () => void;
  lineUserId: string;
  showAll?: boolean;
}

function getDaysUntil(dueDateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr);
  return Math.round((due.getTime() - today.getTime()) / 86400000);
}

function formatDate(str: string): string {
  return new Date(str).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AssetCard({ asset, onRefresh, lineUserId, showAll }: Props) {
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const lang = useLang();
  const tc = translations[lang].card;

  const activeReminders = asset.reminders?.filter((r) => !r.is_completed) ?? [];
  const nextReminder = activeReminders[0];
  const daysUntil = nextReminder ? getDaysUntil(nextReminder.due_date) : null;

  const urgency =
    daysUntil === null
      ? "none"
      : daysUntil < 0
        ? "overdue"
        : daysUntil <= 7
          ? "soon"
          : daysUntil <= 30
            ? "upcoming"
            : "ok";

  const urgencyColor = {
    overdue: "text-red-600 bg-red-50",
    soon: "text-orange-600 bg-orange-50",
    upcoming: "text-yellow-700 bg-yellow-50",
    ok: "text-green-700 bg-green-50",
    none: "text-gray-500 bg-gray-50",
  }[urgency];

  const urgencyLabel =
    daysUntil === null
      ? tc.noReminder
      : daysUntil < 0
        ? tc.overdue(Math.abs(daysUntil))
        : daysUntil === 0
          ? tc.today
          : daysUntil === 1
            ? tc.tomorrow
            : tc.days(daysUntil);

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    await fetch(`/api/assets/${asset.id}`, { method: "DELETE" });
    onRefresh();
  }

  async function handleMarkDone(reminderId: string) {
    await fetch(`/api/assets/${asset.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reminderId, action: "done" }),
    });
    onRefresh();
  }

  if (!showAll && activeReminders.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl flex-shrink-0">
              {CATEGORY_EMOJI[asset.category.toLowerCase()] ?? "📦"}
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 truncate">{asset.name}</p>
              <p className="text-xs text-gray-400">
                {asset.category}
                {asset.item_name && (
                  <span className="text-gray-600 font-medium"> · {asset.item_name}</span>
                )}
                {asset.subcategory && asset.subcategory !== asset.name && (
                  <span className="text-gray-400"> · {asset.subcategory}</span>
                )}
              </p>
            </div>
          </div>
          {daysUntil !== null && (
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${urgencyColor}`}
            >
              {urgencyLabel}
            </span>
          )}
        </div>

        {/* Due date */}
        {nextReminder && (
          <div className="mt-3 flex items-center gap-1.5 text-sm text-gray-600">
            <span>📅</span>
            <span>{formatDate(nextReminder.due_date)}</span>
            <span className="text-gray-400 text-xs">
              ({nextReminder.recurrence === "none" ? tc.oneTime : nextReminder.recurrence})
            </span>
          </div>
        )}

        {/* Notes */}
        {asset.notes && (
          <p className="mt-2 text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">
            {asset.notes}
          </p>
        )}

        {/* Actions */}
        <div className="mt-3 flex gap-2">
          {nextReminder && (
            <button
              onClick={() => handleMarkDone(nextReminder.id)}
              className="flex-1 bg-[#06C755] text-white text-sm font-medium py-2 rounded-lg"
            >
              {tc.markDone}
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              confirmDelete
                ? "bg-red-500 text-white"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {deleting ? "…" : confirmDelete ? tc.confirm : "🗑️"}
          </button>
          {confirmDelete && (
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-3 py-2 rounded-lg text-sm bg-gray-100 text-gray-500"
            >
              {tc.cancel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
