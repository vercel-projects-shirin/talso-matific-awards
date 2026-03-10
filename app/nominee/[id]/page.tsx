"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { fetchNomineeByUUID } from "@/app/actions";
import confetti from "canvas-confetti";

const CATEGORY_COLORS: Record<string, string> = {
  "Best Innovator Award": "bg-amber-100 text-amber-800 border-amber-200",
  "Rising Star Award": "bg-sky-100 text-sky-800 border-sky-200",
  "Outstanding Performance Award":
    "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Team Player Award": "bg-pink-100 text-pink-800 border-pink-200",
  "Leadership Excellence Award":
    "bg-violet-100 text-violet-800 border-violet-200",
};

const CATEGORY_ICONS: Record<string, string> = {
  "Best Innovator Award": "💡",
  "Rising Star Award": "⭐",
  "Outstanding Performance Award": "🏆",
  "Team Player Award": "🤝",
  "Leadership Excellence Award": "👑",
};

function categoryBadgeClass(category: string) {
  return CATEGORY_COLORS[category] ?? "bg-gray-100 text-gray-800 border-gray-200";
}

function categoryIcon(category: string) {
  return CATEGORY_ICONS[category] ?? "🎖️";
}

type NomineeData = {
  name: string;
  nominations: { category: string; reason: string; nominatorName: string }[];
};

type Stage = "intro" | "reveal" | "nominations";

function fireConfetti() {
  const duration = 3000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: ["#a855f7", "#6366f1", "#ec4899", "#f59e0b", "#10b981"],
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: ["#a855f7", "#6366f1", "#ec4899", "#f59e0b", "#10b981"],
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();
}

function fireBigBurst() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#a855f7", "#6366f1", "#ec4899", "#f59e0b", "#10b981", "#ffffff"],
  });
}

function IntroStage({
  nominee,
  onContinue,
}: {
  nominee: NomineeData;
  onContinue: () => void;
}) {
  const hasFired = useRef(false);

  useEffect(() => {
    if (!hasFired.current) {
      hasFired.current = true;
      setTimeout(() => fireConfetti(), 400);
    }
  }, []);

  const uniqueCategories = [
    ...new Set(nominee.nominations.map((n) => n.category)),
  ];

  return (
    <main className="fixed inset-0 flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-900 to-fuchsia-900">
      {/* Decorative background elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute -right-24 -bottom-24 h-96 w-96 rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute top-1/4 right-1/3 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-lg px-6 text-center">
        {/* Trophy icon */}
        <div
          className="animate-fade-in-scale mx-auto mb-8 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-5xl shadow-2xl animate-float"
          style={{ animationDelay: "0.2s" }}
        >
          🏆
        </div>

        {/* Main heading */}
        <h1
          className="animate-fade-in-up mb-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl"
          style={{ animationDelay: "0.4s", opacity: 0 }}
        >
          Congratulations, {nominee.name.split(" ")[0]}!
        </h1>

        {/* Sub message */}
        <p
          className="animate-fade-in-up mx-auto mb-6 max-w-md text-lg leading-relaxed text-purple-100/90"
          style={{ animationDelay: "0.7s", opacity: 0 }}
        >
          Your colleagues want to celebrate{" "}
          <span className="font-semibold text-white">you</span>. Your hard
          work, dedication, and spirit haven&apos;t gone unnoticed this year.
        </p>

        {/* Nomination count badge */}
        <div
          className="animate-fade-in-up mb-8"
          style={{ animationDelay: "1s", opacity: 0 }}
        >
          <div className="animate-pulse-glow mx-auto inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 backdrop-blur-sm">
            <span className="text-2xl font-bold text-white">
              {nominee.nominations.length}
            </span>
            <span className="text-sm font-medium text-purple-200">
              nomination{nominee.nominations.length !== 1 ? "s" : ""} from your
              peers
            </span>
          </div>
        </div>

        {/* Category pills */}
        <div
          className="animate-fade-in-up mb-10 flex flex-wrap justify-center gap-2"
          style={{ animationDelay: "1.3s", opacity: 0 }}
        >
          {uniqueCategories.map((cat) => (
            <span
              key={cat}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm"
            >
              <span>{categoryIcon(cat)}</span>
              {cat}
            </span>
          ))}
        </div>

        {/* CTA button */}
        <div
          className="animate-fade-in-up"
          style={{ animationDelay: "1.6s", opacity: 0 }}
        >
          <button
            onClick={onContinue}
            className="group relative inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold text-purple-900 shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl active:scale-95 cursor-pointer"
          >
            See what they said about you
            <svg
              className="h-5 w-5 transition-transform group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </button>
        </div>
      </div>
    </main>
  );
}

function NominationsStage({ nominee }: { nominee: NomineeData }) {
  const hasFired = useRef(false);

  useEffect(() => {
    if (!hasFired.current) {
      hasFired.current = true;
      fireBigBurst();
    }
  }, []);

  return (
    <main className="animate-stage-enter min-h-screen bg-gradient-to-b from-indigo-50 via-white to-purple-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <header className="mb-12 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-3xl font-bold text-white shadow-lg">
            {nominee.name.charAt(0)}
          </div>
          <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            {nominee.name}
          </h1>
          <p className="text-base text-gray-500">
            Here&apos;s what your colleagues had to say about you
          </p>
        </header>

        {/* Nomination cards */}
        <section>
          <div className="space-y-5">
            {nominee.nominations.map((nom, i) => (
              <div
                key={i}
                className="animate-card-enter rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                style={{
                  animationDelay: `${i * 150}ms`,
                  opacity: 0,
                }}
              >
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <span className="text-xl">{categoryIcon(nom.category)}</span>
                  <span
                    className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold ${categoryBadgeClass(
                      nom.category
                    )}`}
                  >
                    {nom.category}
                  </span>
                </div>
                <blockquote className="mb-4 text-base leading-relaxed text-gray-700 italic">
                  &ldquo;{nom.reason}&rdquo;
                </blockquote>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span>Nominated by {nom.nominatorName}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer message */}
        <footer className="mt-12 text-center">
          <div
            className="animate-card-enter inline-flex items-center gap-2 rounded-full bg-purple-50 px-6 py-3 text-sm font-medium text-purple-700"
            style={{
              animationDelay: `${nominee.nominations.length * 150 + 200}ms`,
              opacity: 0,
            }}
          >
            <span className="text-lg">✨</span>
            Thank you for making Matific a better place
          </div>
        </footer>
      </div>
    </main>
  );
}

export default function NomineePage() {
  const { id } = useParams<{ id: string }>();
  const [nominee, setNominee] = useState<NomineeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [stage, setStage] = useState<Stage>("intro");
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    fetchNomineeByUUID(id).then((found) => {
      if (!found) {
        setNotFound(true);
      } else {
        setNominee(found);
      }
      setLoading(false);
    });
  }, [id]);

  const goToNominations = useCallback(() => {
    setTransitioning(true);
    setTimeout(() => {
      setStage("nominations");
      setTransitioning(false);
    }, 400);
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-900 to-fuchsia-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/30 border-t-white" />
      </main>
    );
  }

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

  if (stage === "intro") {
    return (
      <div className={transitioning ? "animate-stage-exit" : ""}>
        <IntroStage nominee={nominee!} onContinue={goToNominations} />
      </div>
    );
  }

  return <NominationsStage nominee={nominee!} />;
}
