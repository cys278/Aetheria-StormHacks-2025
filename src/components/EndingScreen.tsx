// src/components/EndingScreen.tsx
import { useEffect, useMemo, useState } from "react";
import type { MoodType } from "../types";
import { getSessionId } from "../utils/helpers";

type EndingPayload = {
  title: string;
  content: string; // plain text with \n\n between paragraphs
};

export default function EndingScreen({
  endingKey,
  sentiment,
  onClose,
}: {
  endingKey: string;
  sentiment: MoodType;
  onClose: () => void;
}) {
  const [data, setData] = useState<EndingPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // 🎨 match the rest of your app’s mood palette
  const palette = useMemo(() => {
    switch (sentiment) {
      case "positive":
        return {
          bg: "from-emerald-900/70 via-emerald-800/60 to-teal-900/70",
          card: "bg-white/10 border-emerald-400/40",
          button: "from-emerald-400 to-teal-400 border-emerald-300",
          shadow: "shadow-emerald-500/30",
        };
      case "negative":
        return {
          bg: "from-rose-900/70 via-red-900/60 to-amber-900/70",
          card: "bg-white/10 border-rose-400/40",
          button: "from-rose-500 to-amber-400 border-rose-300",
          shadow: "shadow-rose-500/30",
        };
      default:
        return {
          bg: "from-sky-900/70 via-blue-900/60 to-cyan-900/70",
          card: "bg-white/10 border-sky-400/40",
          button: "from-sky-400 to-cyan-400 border-sky-300",
          shadow: "shadow-sky-500/30",
        };
    }
  }, [sentiment]);

  // 🔗 fetch the ending text
  useEffect(() => {
    const ac = new AbortController();
    async function run() {
      try {
        setLoading(true);
        setErr(null);

        let endpoint = `/api/ending?key=${encodeURIComponent(endingKey)}`;
        let isReflection = endingKey === "reflection";

        // If it's the final reflection, call the new endpoint
        if (isReflection) {
          endpoint = `/api/reflect`;
        }

        // ⬇️ change this to your real endpoint if needed
        const res = await fetch(import.meta.env.VITE_API_BASE_URL + endpoint, {
          signal: ac.signal,
          // For /reflect, we need to send the session ID
          method: isReflection ? "POST" : "GET",
          headers: isReflection ? { "Content-Type": "application/json" } : {},
          body: isReflection
            ? JSON.stringify({ sessionId: getSessionId() })
            : null,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as EndingPayload;

        // Temporary local mock until backend is ready
        // const localMap: Record<string, EndingPayload> = {
        //   regret: {
        //     title: "An Echo of Regret",
        //     content:
        //       "You arrive at a quiet balcony. The wind carries names you forgot to say out loud.\n\n" +
        //       "The city sleeps beneath you, but one window stays lit — the one you never opened.",
        //   },
        //   truth: {
        //     title: "A Small, Sharp Truth",
        //     content:
        //       "There was never a lock on the door, only the fear of turning the handle.\n\n" +
        //       "You turn it now.",
        //   },
        //   default: {
        //     title: "The Page Turns",
        //     content:
        //       "Endings do not end. They bend into beginnings.\n\n" +
        //       "Walk on, a little lighter.",
        //   },
        // };

        // // Simulate a delay for realism
        // await new Promise((r) => setTimeout(r, 1000));
        // const json = localMap[endingKey] || localMap.default;

        // very defensive fallbacks
        setData({
          title: json?.title || "An Ending",
          content:
            json?.content ||
            "Silence settles. You understand something you didn’t before.\n\nPerhaps that is enough.",
        });
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          setErr("Could not load the ending. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    }
    run();
    return () => ac.abort();
  }, [endingKey]);

  // helper to split paragraphs nicely
  const paragraphs = data?.content?.split(/\n\s*\n/g).filter(Boolean) ?? [];

  return (
    <div className={`absolute inset-0 z-50 overflow-y-auto no-scrollbar`}>
      {/* soft gradient backdrop */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${palette.bg} backdrop-blur-xl`}
      />

      {/* center the card */}
      <div className="relative min-h-full flex items-center justify-center p-6 md:p-10">
        <div
          className={`w-full max-w-3xl rounded-3xl ${palette.card} border p-6 md:p-10 shadow-2xl ${palette.shadow}`}
        >
          {/* title */}
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-6">
            {loading ? "Revealing your ending…" : data?.title}
          </h1>

          {/* content */}
          <div className="text-gray-200/95 leading-relaxed tracking-wide text-lg md:text-xl">
            {loading && (
              <div className="flex items-center gap-3 text-gray-300">
                <span className="h-4 w-4 rounded-full animate-pulse bg-white/60" />
                <span className="h-4 w-4 rounded-full animate-pulse bg-white/50" />
                <span className="h-4 w-4 rounded-full animate-pulse bg-white/40" />
              </div>
            )}

            {!loading && err && <p className="text-rose-300">{err}</p>}

            {!loading && !err && (
              <div className="space-y-5">
                {paragraphs.map((p, i) => (
                  <p key={i} className="whitespace-pre-wrap break-words">
                    {p.trim()}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* buttons */}
          <div className="mt-8 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className={`px-5 py-2.5 rounded-xl bg-gradient-to-r ${palette.button} text-white border shadow-md hover:scale-[1.02] active:scale-100 transition`}
            >
              Return to Loki
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
