"use client";

import { useState } from "react";
import type { Asset } from "@/lib/database.types";
import { useLang } from "@/lib/lang-context";
import { translations, CATEGORY_LABELS, SUBCATEGORIES } from "@/lib/i18n";

interface Props {
  lineUserId: string;
  existingAssets?: Asset[];
  onSuccess: () => void;
}

const ITEM_PLACEHOLDERS: Record<string, string> = {
  Car: "e.g. Toyota Camry, Honda City, ฮอนด้าซิตี้",
  Home: "e.g. Bangkok Condo, Chiang Mai House, บ้านระยอง",
  Health: "e.g. Myself, Dad, Mom",
  Finance: "e.g. SCB account, KBank, Personal",
  Insurance: "e.g. Toyota Camry, Bangkok Condo",
};

const CATEGORY_KEYS = ["Car", "Home", "Health", "Finance", "Insurance", ""];

const RECURRENCE_VALUES = ["none", "monthly", "custom-3-months", "custom-6-months", "yearly", "custom-2-years"];

function parseRecurrence(val: string) {
  if (val === "none") return { recurrence: "none", recurrenceValue: 1, recurrenceUnit: "years" };
  if (val === "monthly") return { recurrence: "monthly", recurrenceValue: 1, recurrenceUnit: "months" };
  if (val === "yearly") return { recurrence: "yearly", recurrenceValue: 1, recurrenceUnit: "years" };
  if (val === "custom-3-months") return { recurrence: "custom", recurrenceValue: 3, recurrenceUnit: "months" };
  if (val === "custom-6-months") return { recurrence: "custom", recurrenceValue: 6, recurrenceUnit: "months" };
  if (val === "custom-2-years") return { recurrence: "custom", recurrenceValue: 2, recurrenceUnit: "years" };
  return { recurrence: "none", recurrenceValue: 1, recurrenceUnit: "years" };
}

export default function AddAssetForm({ lineUserId, existingAssets = [], onSuccess }: Props) {
  const [category, setCategory] = useState("Car");
  const [customCategory, setCustomCategory] = useState("");
  const [itemName, setItemName] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [customSubcategory, setCustomSubcategory] = useState("");
  const [name, setName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [recurrence, setRecurrence] = useState("yearly");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const lang = useLang();
  const tf = translations[lang].form;

  const isCustomCategory = category === "";
  const isCustomSubcat = subcategory === "__custom__";
  const subcats = SUBCATEGORIES[lang][category] ?? [];

  const existingItems = Array.from(
    new Set(
      existingAssets
        .filter((a) => a.category === category && a.item_name)
        .map((a) => a.item_name as string)
    )
  );

  function handleCategoryChange(val: string) {
    setCategory(val);
    setItemName("");
    setSubcategory("");
    setCustomSubcategory("");
    setName("");
  }

  function handleSubcatChange(val: string) {
    setSubcategory(val);
    if (val !== "__custom__") setName(val);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const finalCategory = isCustomCategory ? customCategory.trim() : category;
    const finalItem = itemName.trim() || null;
    const finalSubcategory = isCustomSubcat
      ? customSubcategory.trim() || null
      : subcategory || null;
    const finalName = name.trim() || finalSubcategory || "";

    if (!finalName) return setError(tf.errName);
    if (!finalCategory) return setError(tf.errCategory);
    if (!dueDate) return setError(tf.errDate);

    setSubmitting(true);
    const { recurrence: rec, recurrenceValue, recurrenceUnit } = parseRecurrence(recurrence);

    try {
      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lineUserId,
          name: finalName,
          category: finalCategory,
          item_name: finalItem,
          subcategory: finalSubcategory,
          notes: notes.trim() || null,
          dueDate,
          recurrence: rec,
          recurrenceValue,
          recurrenceUnit,
          advanceNoticeDays: [7, 1],
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? tf.errName);
        return;
      }
      onSuccess();
    } catch {
      setError(tf.errNetwork);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-gray-900">{tf.title}</h2>
        <p className="text-sm text-gray-500 mt-0.5">{tf.subtitle}</p>
      </div>

      {/* Step 1 — Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <span className="text-[#06C755] font-bold mr-1">1</span> {tf.step1}
        </label>
        <div className="grid grid-cols-3 gap-2">
          {CATEGORY_KEYS.map((value) => (
            <button key={value || "custom"} type="button" onClick={() => handleCategoryChange(value)}
              className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                category === value ? "bg-[#06C755] text-white border-[#06C755]" : "bg-white text-gray-700 border-gray-200"
              }`}>
              {CATEGORY_LABELS[lang][value || "Custom"]}
            </button>
          ))}
        </div>
        {isCustomCategory && (
          <input type="text" value={customCategory} onChange={(e) => setCustomCategory(e.target.value)}
            placeholder="Enter category name"
            className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#06C755]" />
        )}
      </div>

      {/* Step 2 — Which specific item */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <span className="text-[#06C755] font-bold mr-1">2</span>
          {tf.step2(isCustomCategory ? "item" : category)}
        </label>
        {existingItems.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {existingItems.map((item) => (
              <button key={item} type="button" onClick={() => setItemName(item)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  itemName === item ? "bg-[#06C755] text-white border-[#06C755]" : "bg-white text-gray-600 border-gray-200"
                }`}>
                {item}
              </button>
            ))}
          </div>
        )}
        <input type="text" value={itemName} onChange={(e) => setItemName(e.target.value)}
          placeholder={ITEM_PLACEHOLDERS[category] ?? "Which one?"}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#06C755]" />
        <p className="text-xs text-gray-400 mt-1">
          {tf.step2hint(isCustomCategory ? "item" : category)}
        </p>
      </div>

      {/* Step 3 — Subcategory */}
      {!isCustomCategory && subcats.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <span className="text-[#06C755] font-bold mr-1">3</span> {tf.step3}
          </label>
          <div className="flex flex-wrap gap-2">
            {subcats.map((s) => (
              <button key={s} type="button" onClick={() => handleSubcatChange(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  subcategory === s ? "bg-[#06C755] text-white border-[#06C755]" : "bg-white text-gray-600 border-gray-200"
                }`}>
                {s}
              </button>
            ))}
            <button type="button" onClick={() => handleSubcatChange("__custom__")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                isCustomSubcat ? "bg-[#06C755] text-white border-[#06C755]" : "bg-white text-gray-600 border-gray-200"
              }`}>
              {tf.other}
            </button>
          </div>
          {isCustomSubcat && (
            <input type="text" value={customSubcategory} onChange={(e) => setCustomSubcategory(e.target.value)}
              placeholder="Describe the task type"
              className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#06C755]" />
          )}
        </div>
      )}

      {/* Step 4 — Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <span className="text-[#06C755] font-bold mr-1">{isCustomCategory ? "3" : "4"}</span> {tf.step4}
        </label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)}
          placeholder={tf.taskPlaceholder}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#06C755]" />
        {subcategory && subcategory !== "__custom__" && name === subcategory && (
          <p className="text-xs text-gray-400 mt-1">{tf.autoFilled}</p>
        )}
      </div>

      {/* Due date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{tf.dueDate}</label>
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#06C755]" required />
      </div>

      {/* Recurrence */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{tf.repeat}</label>
        <div className="grid grid-cols-2 gap-2">
          {RECURRENCE_VALUES.map((val) => (
            <button key={val} type="button" onClick={() => setRecurrence(val)}
              className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                recurrence === val ? "bg-[#06C755] text-white border-[#06C755]" : "bg-white text-gray-700 border-gray-200"
              }`}>
              {tf.recurrence[val]}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{tf.notes}</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder={tf.notesPlaceholder}
          rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#06C755] resize-none" />
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <button type="submit" disabled={submitting}
        className="w-full bg-[#06C755] text-white font-semibold py-3 rounded-xl text-base disabled:opacity-60">
        {submitting ? tf.saving : tf.save}
      </button>
    </form>
  );
}
