"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { type Nomination, type NomineeStats, type CategoryLeaderboard, parseCSV } from "@/lib/data";
import {
  type DashboardData,
  loadDashboardData,
  uploadNominations,
  resetNominations,
  mergeNomineesAction,
} from "@/app/actions";

const MEDAL = ["\u{1F947}", "\u{1F948}", "\u{1F949}"];

function CopyLinkButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    const url = `${window.location.origin}${path}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [path]);

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium shadow-sm transition-colors ${
        copied
          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
      }`}
    >
      {copied ? (
        <>
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy link
        </>
      )}
    </button>
  );
}

export default function Home() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [mergeMode, setMergeMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showMergePrompt, setShowMergePrompt] = useState(false);
  const [mergedName, setMergedName] = useState("");
  const mergeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDashboardData()
      .then((data) => setDashboard(data))
      .finally(() => setHydrated(true));
  }, []);

  const handleCSVLoaded = useCallback(async (noms: Nomination[]) => {
    const data = await uploadNominations(noms);
    setDashboard(data);
  }, []);

  const handleReset = useCallback(async () => {
    await resetNominations();
    setDashboard(null);
  }, []);

  const toggleSelect = useCallback((name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const exitMergeMode = useCallback(() => {
    setMergeMode(false);
    setSelected(new Set());
    setShowMergePrompt(false);
    setMergedName("");
  }, []);

  const openMergePrompt = useCallback(() => {
    const firstSelected = Array.from(selected)[0] ?? "";
    setMergedName(firstSelected);
    setShowMergePrompt(true);
    setTimeout(() => mergeInputRef.current?.select(), 50);
  }, [selected]);

  const handleMerge = useCallback(async () => {
    if (!dashboard || selected.size < 2 || !mergedName.trim()) return;
    const data = await mergeNomineesAction(
      Array.from(selected),
      mergedName.trim()
    );
    setDashboard(data);
    exitMergeMode();
  }, [dashboard, selected, mergedName, exitMergeMode]);

  if (!hydrated) return null;

  if (!dashboard) {
    return <UploadView onCSVLoaded={handleCSVLoaded} />;
  }

  const { leaderboard, categoryBoards } = dashboard;

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero + Reset */}
      <header className="mb-14 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900">
          Matific Awards
        </h1>
        <p className="mt-3 text-lg text-gray-500">
          Celebrating the people who make Matific great
        </p>
        <button
          onClick={handleReset}
          className="mt-5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Upload New CSV
        </button>
      </header>

      {/* General Leaderboard */}
      <section className="mb-14">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">
            General Leaderboard
          </h2>
          {!mergeMode ? (
            <button
              onClick={() => setMergeMode(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Merge Nominees
            </button>
          ) : (
            <button
              onClick={exitMergeMode}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
        </div>

        {mergeMode && (
          <p className="mb-3 text-sm text-gray-500">
            Select the nominees you want to merge, then click &quot;Merge into one&quot;.
          </p>
        )}

        <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                {mergeMode && <th className="w-10 px-4 py-3" />}
                <th className="px-6 py-3 text-sm font-semibold">#</th>
                <th className="px-6 py-3 text-sm font-semibold">Nominee</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">
                  Nominations
                </th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, i) => {
                const isSelected = selected.has(entry.name);
                return (
                  <tr
                    key={entry.id}
                    onClick={mergeMode ? () => toggleSelect(entry.name) : undefined}
                    className={`border-t border-gray-100 transition-colors ${
                      mergeMode ? "cursor-pointer" : ""
                    } ${
                      isSelected
                        ? "bg-indigo-100"
                        : i < 3
                        ? "bg-indigo-50/40 font-semibold hover:bg-indigo-50"
                        : "hover:bg-indigo-50"
                    }`}
                  >
                    {mergeMode && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 pointer-events-none"
                        />
                      </td>
                    )}
                    <td className="px-6 py-3 text-sm text-gray-500">
                      {i < 3 ? MEDAL[i] : i + 1}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-900">
                      {entry.name}
                    </td>
                    <td className="px-6 py-3 text-right text-sm">
                      <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-0.5 text-indigo-700">
                        {entry.count}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {mergeMode && selected.size >= 2 && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={openMergePrompt}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
            >
              Merge {selected.size} nominees into one
            </button>
          </div>
        )}
      </section>

      {/* Merge Name Prompt Modal */}
      {showMergePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">Merge Nominees</h3>
            <p className="mt-2 text-sm text-gray-500">
              Merging: {Array.from(selected).join(", ")}
            </p>
            <label className="mt-4 block text-sm font-medium text-gray-700">
              New nominee name
            </label>
            <input
              ref={mergeInputRef}
              type="text"
              value={mergedName}
              onChange={(e) => setMergedName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && mergedName.trim()) handleMerge();
                if (e.key === "Escape") setShowMergePrompt(false);
              }}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setShowMergePrompt(false)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleMerge}
                disabled={!mergedName.trim()}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-50"
              >
                Confirm Merge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Leaderboards */}
      <section className="mb-14">
        <h2 className="mb-6 text-2xl font-bold text-gray-800">
          Awards by Category
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categoryBoards.map((board) => (
            <div
              key={board.category}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <h3 className="mb-4 text-lg font-bold text-indigo-700">
                {board.category}
              </h3>
              <ol className="space-y-3">
                {board.nominees.map((entry, i) => (
                  <li key={entry.id} className="flex items-center gap-3">
                    <span className="text-xl">{MEDAL[i] ?? `${i + 1}.`}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {entry.name}
                      </p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700">
                      {entry.count}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      {/* All Nominees Table */}
      <section>
        <h2 className="mb-6 text-2xl font-bold text-gray-800">All Nominees</h2>
        <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">
                  Nominee
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-600">
                  Nominations
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-600">
                  Profile
                </th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-t border-gray-100 transition-colors hover:bg-gray-50"
                >
                  <td className="px-6 py-3 text-sm font-medium text-gray-900">
                    {entry.name}
                  </td>
                  <td className="px-6 py-3 text-right text-sm text-gray-500">
                    {entry.count}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <CopyLinkButton path={`/nominee/${entry.id}`} />
                      <Link
                        href={`/nominee/${entry.id}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
                      >
                        View →
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function UploadView({
  onCSVLoaded,
}: {
  onCSVLoaded: (nominations: Nomination[]) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    (file: File) => {
      setError(null);
      if (!file.name.endsWith(".csv")) {
        setError("Please upload a .csv file.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const nominations = parseCSV(text);
        if (nominations.length === 0) {
          setError("The CSV file appears to be empty or invalid.");
          return;
        }
        onCSVLoaded(nominations);
      };
      reader.onerror = () => setError("Failed to read the file.");
      reader.readAsText(file);
    },
    [onCSVLoaded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-lg text-center">
        <h1 className="mb-2 text-5xl font-extrabold tracking-tight text-gray-900">
          Matific Awards
        </h1>
        <p className="mb-10 text-lg text-gray-500">
          Upload a nominations CSV to get started
        </p>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-12 transition-colors ${
            dragging
              ? "border-indigo-500 bg-indigo-50"
              : "border-gray-300 bg-white hover:border-indigo-400 hover:bg-gray-50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
            <svg
              className="h-8 w-8 text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>

          <p className="text-sm font-medium text-gray-700">
            Drag & drop your CSV file here
          </p>
          <p className="mt-1 text-xs text-gray-500">or click to browse</p>
        </div>

        {error && (
          <p className="mt-4 text-sm font-medium text-red-600">{error}</p>
        )}
      </div>
    </main>
  );
}
