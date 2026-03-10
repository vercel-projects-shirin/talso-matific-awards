"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { loadNominations, getNomineeByUUID } from "@/lib/data";

const CATEGORY_COLORS: Record<string, string> = {
  "Best Innovator Award": "bg-amber-100 text-amber-800",
  "Rising Star Award": "bg-sky-100 text-sky-800",
  "Outstanding Performance Award": "bg-emerald-100 text-emerald-800",
  "Team Player Award": "bg-pink-100 text-pink-800",
  "Leadership Excellence Award": "bg-violet-100 text-violet-800",
};

function categoryBadgeClass(category: string) {
  return CATEGORY_COLORS[category] ?? "bg-gray-100 text-gray-800";
}

export default function NomineePage() {
  const { id } = useParams<{ id: string }>();
  const [nominee, setNominee] = useState<{
    name: string;
    nominations: { category: string; reason: string; nominatorName: string }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const nominations = loadNominations();
    if (!nominations) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    const found = getNomineeByUUID(nominations, id);
    if (!found) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setNominee(found);
    setLoading(false);
  }, [id]);

  if (loading) return null;

  if (notFound) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Nominee not found
          </h1>
          <p className="mt-2 text-gray-500">
            This link may be invalid or the data is no longer available.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-10">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-2xl font-bold text-white shadow-lg">
            {nominee!.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
              {nominee!.name}
            </h1>
            <p className="text-sm text-gray-500">
              {nominee!.nominations.length} nomination
              {nominee!.nominations.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </header>

      <section>
        <h2 className="mb-5 text-xl font-bold text-gray-800">Nominations</h2>
        <div className="space-y-4">
          {nominee!.nominations.map((nom, i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${categoryBadgeClass(
                    nom.category
                  )}`}
                >
                  {nom.category}
                </span>
                <span className="text-xs text-gray-400">
                  Nominated by {nom.nominatorName}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-gray-700">
                &ldquo;{nom.reason}&rdquo;
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
