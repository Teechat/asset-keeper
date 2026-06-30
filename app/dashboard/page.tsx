"use client";

import { useEffect, useState, useCallback } from "react";
import type { AssetWithReminder } from "@/lib/database.types";
import AssetCard from "@/components/AssetCard";
import AddAssetForm from "@/components/AddAssetForm";
import { LangContext } from "@/lib/lang-context";
import { translations, type Lang } from "@/lib/i18n";

const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID!;

type Tab = "upcoming" | "all" | "add";

export default function Dashboard() {
  const [lineUserId, setLineUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>("");
  const [pictureUrl, setPictureUrl] = useState<string>("");
  const [assets, setAssets] = useState<AssetWithReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("upcoming");
  const [liffReady, setLiffReady] = useState(false);
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    const saved = localStorage.getItem("ak_lang") as Lang | null;
    if (saved === "th" || saved === "en") setLang(saved);
  }, []);

  function toggleLang() {
    const next: Lang = lang === "en" ? "th" : "en";
    setLang(next);
    localStorage.setItem("ak_lang", next);
  }

  const tr = translations[lang];

  // Initialize LIFF
  useEffect(() => {
    async function initLiff() {
      // Check URL param first — bot sends ?uid= to bypass LIFF auth
      const params = new URLSearchParams(window.location.search);
      const uid = params.get("uid");
      if (uid) {
        setLineUserId(uid);
        setLiffReady(true);
        setLoading(false);
        return;
      }

      try {
        // @ts-expect-error - liff is loaded from CDN
        const liff = window.liff;
        if (!liff) {
          setLiffReady(true);
          setLoading(false);
          return;
        }
        await liff.init({ liffId: LIFF_ID });

        if (!liff.isLoggedIn()) {
          liff.login({ redirectUri: window.location.href });
          return;
        }

        const profile = await liff.getProfile();
        setLineUserId(profile.userId);
        setDisplayName(profile.displayName);
        setPictureUrl(profile.pictureUrl ?? "");
        setLiffReady(true);
      } catch (err) {
        console.error("LIFF init error:", err);
        setLiffReady(true);
        setLoading(false);
      }
    }
    initLiff();
  }, []);

  const fetchAssets = useCallback(async () => {
    if (!lineUserId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/assets?lineUserId=${encodeURIComponent(lineUserId)}`);
      const data = await res.json();
      setAssets(data.assets ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [lineUserId]);

  useEffect(() => {
    if (liffReady && lineUserId) fetchAssets();
  }, [liffReady, lineUserId, fetchAssets]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("action") === "add") setTab("add");
    if (params.get("edit")) setTab("all");
  }, []);

  const sortedAssets = [...assets].sort((a, b) => {
    const aDate = a.reminders?.[0]?.due_date ?? "9999";
    const bDate = b.reminders?.[0]?.due_date ?? "9999";
    return aDate.localeCompare(bDate);
  });

  const upcomingAssets = sortedAssets.filter((a) => {
    const r = a.reminders?.[0];
    if (!r || r.is_completed) return false;
    const days =
      (new Date(r.due_date).getTime() - new Date().setHours(0, 0, 0, 0)) /
      86400000;
    return days <= 30;
  });

  if (!liffReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">{tr.loading}</p>
        </div>
      </div>
    );
  }

  if (!lineUserId) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">🔧</div>
          <h1 className="text-2xl font-bold mb-2">AssetKeeper</h1>
          <p className="text-gray-500 mb-4">{tr.noAuth.msg}</p>
          <p className="text-sm text-gray-400">
            {tr.noAuth.hint}{" "}
            <code className="bg-gray-100 px-1 rounded">/dashboard</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <LangContext.Provider value={lang}>
      <div className="max-w-md mx-auto pb-20">
        {/* Header */}
        <div className="bg-[#06C755] text-white px-4 py-4 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            {pictureUrl && (
              <img
                src={pictureUrl}
                alt={displayName}
                className="w-9 h-9 rounded-full border-2 border-white"
              />
            )}
            <div>
              <h1 className="font-bold text-lg leading-tight">AssetKeeper</h1>
              <p className="text-green-100 text-xs">{displayName}</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-green-100 text-xs">
                {assets.length} {tr.header.assets}
              </span>
              <button
                onClick={toggleLang}
                className="text-xs font-semibold bg-white/20 hover:bg-white/30 transition-colors px-2 py-1 rounded-full"
                aria-label="Toggle language"
              >
                {lang === "en" ? "ภาษาไทย" : "English"}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-white sticky top-[68px] z-10">
          {(
            [
              { key: "upcoming", label: tr.tabs.upcoming },
              { key: "all", label: tr.tabs.all },
              { key: "add", label: tr.tabs.add },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                tab === key
                  ? "border-b-2 border-[#06C755] text-[#06C755]"
                  : "text-gray-500"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4">
          {loading && (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#06C755] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && tab === "upcoming" && (
            <div>
              {upcomingAssets.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">✅</div>
                  <p className="text-gray-500 font-medium">{tr.upcoming.empty}</p>
                  <p className="text-gray-400 text-sm mt-1">{tr.upcoming.emptySub}</p>
                  <button
                    onClick={() => setTab("add")}
                    className="mt-4 bg-[#06C755] text-white px-6 py-2 rounded-full text-sm font-medium"
                  >
                    {tr.upcoming.addBtn}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                    {tr.upcoming.label(upcomingAssets.length)}
                  </p>
                  {upcomingAssets.map((asset) => (
                    <AssetCard
                      key={asset.id}
                      asset={asset}
                      onRefresh={fetchAssets}
                      lineUserId={lineUserId}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {!loading && tab === "all" && (
            <div>
              {sortedAssets.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">📦</div>
                  <p className="text-gray-500">{tr.all.empty}</p>
                  <button
                    onClick={() => setTab("add")}
                    className="mt-4 bg-[#06C755] text-white px-6 py-2 rounded-full text-sm font-medium"
                  >
                    {tr.all.addBtn}
                  </button>
                </div>
              ) : (
                (() => {
                  const groups = new Map<string, typeof sortedAssets>();
                  for (const asset of sortedAssets) {
                    const key = asset.item_name
                      ? `${asset.category} · ${asset.item_name}`
                      : asset.category;
                    if (!groups.has(key)) groups.set(key, []);
                    groups.get(key)!.push(asset);
                  }
                  return (
                    <div className="space-y-6">
                      {Array.from(groups.entries()).map(([groupKey, groupAssets]) => (
                        <div key={groupKey}>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                            {groupKey}
                          </p>
                          <div className="space-y-3">
                            {groupAssets.map((asset) => (
                              <AssetCard
                                key={asset.id}
                                asset={asset}
                                onRefresh={fetchAssets}
                                lineUserId={lineUserId}
                                showAll
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()
              )}
            </div>
          )}

          {tab === "add" && (
            <AddAssetForm
              lineUserId={lineUserId}
              existingAssets={assets}
              onSuccess={() => {
                fetchAssets();
                setTab("all");
              }}
            />
          )}
        </div>
      </div>
    </LangContext.Provider>
  );
}
