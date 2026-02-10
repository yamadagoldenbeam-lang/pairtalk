"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import { Bolt, Crown, ExternalLink, Gauge } from "lucide-react";

type VoteId = "main_service" | "buzz_site";
type Votes = Record<VoteId, number>;

const STORAGE_KEY = "pairtalk_next_action_vote";
const DEFAULT_VOTES: Votes = { main_service: 0, buzz_site: 0 };

const OPTION_META: Record<
  VoteId,
  { badge: string; title: string; description: string; link: string; actionLabel: string }
> = {
  main_service: {
    badge: "プロ向けメイン事業",
    title: "プロとして、さらに効率を極める",
    description: "実務に直結する導線へ。信頼感と成果を重視したルート。",
    link: "https://golden-beam.com",
    actionLabel: "メイン事業へ進む",
  },
  buzz_site: {
    badge: "バズサイト",
    title: "一度すべてを忘れて、脳をバグらせる",
    description: "カオスと勢い重視。直感で刺さる遊び場へジャンプ。",
    link: "https://writter-project.com",
    actionLabel: "バズサイトへ進む",
  },
};

let supabaseClientSingleton: SupabaseClient | null = null;

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  if (!supabaseClientSingleton) {
    supabaseClientSingleton = createClient(url, anonKey);
  }
  return supabaseClientSingleton;
}

export function NextActionDuel() {
  const [votes, setVotes] = useState<Votes>(DEFAULT_VOTES);
  const [isVoting, setIsVoting] = useState(false);
  const [votedChoice, setVotedChoice] = useState<VoteId | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "main_service" || stored === "buzz_site" ? stored : null;
  });
  const [justVoted, setJustVoted] = useState<VoteId | null>(null);

  const supabase = getSupabaseClient();
  const isRealtimeAvailable = !!supabase;

  const fetchVotes = useCallback(async () => {
    if (!supabase) return;

    const { data, error } = await supabase
      .from("votes")
      .select("id, count")
      .in("id", ["main_service", "buzz_site"]);

    if (error || !data) return;

    const nextVotes: Votes = { ...DEFAULT_VOTES };
    for (const row of data) {
      const id = row.id as string;
      if (id === "main_service" || id === "buzz_site") {
        nextVotes[id as VoteId] = Number(row.count) || 0;
      }
    }
    setVotes(nextVotes);
  }, [supabase]);

  useEffect(() => {
    if (!supabase) return;

    void fetchVotes();
    const channel = supabase
      .channel("votes-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "votes" }, () => {
        void fetchVotes();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchVotes, supabase]);

  const { mainPct, buzzPct, margin } = useMemo(() => {
    const total = votes.main_service + votes.buzz_site;
    if (total <= 0) return { mainPct: 50, buzzPct: 50, margin: 0 };

    const main = Math.round((votes.main_service / total) * 100);
    const buzz = 100 - main;
    return { mainPct: main, buzzPct: buzz, margin: Math.abs(main - buzz) };
  }, [votes]);

  const leadingSide: VoteId | null = useMemo(() => {
    if (mainPct === buzzPct) return null;
    return mainPct > buzzPct ? "main_service" : "buzz_site";
  }, [mainPct, buzzPct]);

  const isCloseBattle = margin <= 4;

  const handleVote = async (choice: VoteId) => {
    if (!supabase || isVoting || votedChoice) return;

    setIsVoting(true);
    setVotedChoice(choice);
    setJustVoted(choice);
    window.localStorage.setItem(STORAGE_KEY, choice);

    setVotes((prev) => ({ ...prev, [choice]: prev[choice] + 1 }));

    await supabase.rpc("increment_vote", { row_id: choice });
    await fetchVotes();

    setIsVoting(false);

    // リンク先を新しいタブで開く
    window.open(OPTION_META[choice].link, "_blank", "noopener,noreferrer");

    window.setTimeout(() => setJustVoted(null), 650);
  };

  const hasVoted = votedChoice !== null;

  const renderWinningBadge = (side: VoteId) => {
    if (!hasVoted || leadingSide !== side) return null;
    const label = "人気";
    return (
      <motion.div
        className="absolute top-3 right-3 px-3 py-1 rounded-full text-[11px] font-black tracking-wide bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-md"
        initial={{ scale: 0.8, opacity: 0, y: -4 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
      >
        {label}
      </motion.div>
    );
  };

  const renderRateBar = (side: VoteId) => {
    const pct = side === "main_service" ? mainPct : buzzPct;
    const barColor = side === "main_service"
      ? "bg-gradient-to-r from-cyan-400 to-blue-500"
      : "bg-gradient-to-r from-pink-400 to-rose-500";
    const barBg = side === "main_service" ? "bg-slate-100" : "bg-pink-50";
    const textColor = side === "main_service" ? "text-slate-500" : "text-pink-500";

    return (
      <div className={`mt-5 ${side === "buzz_site" ? "relative" : ""}`}>
        <div className="flex items-end justify-between mb-2">
          <span className={`text-xs ${textColor}`}>みんなの選択</span>
          <span className="text-2xl font-black">{hasVoted ? `${pct}%` : "???%"}</span>
        </div>
        <div className={`h-2.5 rounded-full ${barBg} overflow-hidden`}>
          {hasVoted ? (
            <motion.div
              className={`h-full ${barColor}`}
              initial={{ width: "0%" }}
              animate={{ width: `${pct}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            />
          ) : (
            <div className={`h-full ${barColor} opacity-30`} style={{ width: "50%" }} />
          )}
        </div>
      </div>
    );
  };

  return (
    <section className="py-16 w-full max-w-6xl mx-auto px-4">
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold shadow-md">
          <Gauge className="w-3.5 h-3.5" />
          人気投票
        </span>
        <h2 className="text-2xl md:text-3xl font-black mt-4 text-slate-800">次、何する？</h2>
        <p className="text-slate-500 mt-2 text-sm md:text-base font-medium">みんなが最初に選んだ方にリアルタイムで票が入るよ！</p>
      </div>

      {!isRealtimeAvailable && (
        <div className="mb-6 p-4 rounded-2xl border border-amber-200 bg-amber-50 text-amber-900 text-sm text-center">
          投票機能は現在準備中です。
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-stretch">
        <motion.article
          className="relative rounded-[2rem] p-6 md:p-8 border-4 border-white bg-gradient-to-br from-cyan-50 via-white to-blue-50 shadow-[0_10px_40px_-10px_rgba(34,211,238,0.3)] overflow-hidden group hover:shadow-[0_20px_50px_-10px_rgba(34,211,238,0.4)] hover:-translate-y-1 transition-all duration-300"
          animate={justVoted === "main_service" ? { scale: [1, 1.03, 1] } : { scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {renderWinningBadge("main_service")}
          <div className="flex items-center gap-2 text-cyan-600 text-sm font-bold bg-white/80 backdrop-blur-sm w-fit px-3 py-1 rounded-full shadow-sm">
            <Crown className="w-4 h-4 fill-cyan-100" />
            {OPTION_META.main_service.badge}
          </div>
          <h3 className="mt-4 text-xl md:text-2xl font-black text-slate-800">{OPTION_META.main_service.title}</h3>
          <p className="mt-3 text-slate-600 text-sm leading-relaxed font-medium">
            {OPTION_META.main_service.description}
          </p>

          <div className="mt-6 rounded-2xl overflow-hidden border-4 border-white shadow-md">
            <div className="aspect-video bg-slate-100 flex items-center justify-center text-xs tracking-widest text-slate-400 font-bold relative group-hover:scale-105 transition-transform duration-500">
              THUMBNAIL 16:9
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (votedChoice) {
                window.open(OPTION_META.main_service.link, "_blank", "noopener,noreferrer");
                return;
              }
              void handleVote("main_service");
            }}
            disabled={isVoting || !isRealtimeAvailable}
            className="mt-6 w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold py-4 hover:from-cyan-400 hover:to-blue-400 hover:shadow-xl hover:shadow-cyan-200/50 transition-all disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 shadow-lg shadow-cyan-200/30"
          >
            {votedChoice === "main_service" ? (
              <>{OPTION_META.main_service.actionLabel} <ExternalLink className="w-4 h-4" /></>
            ) : hasVoted ? (
              <>こっちも開く <ExternalLink className="w-4 h-4" /></>
            ) : (
              "こちらを選ぶ"
            )}
          </button>

          {renderRateBar("main_service")}
        </motion.article>

        <div className="flex md:flex-col items-center justify-center py-4">
          <motion.div
            className="w-16 h-16 rounded-full bg-white border-4 border-slate-100 shadow-lg text-slate-800 font-black text-xl flex items-center justify-center z-10"
            animate={isCloseBattle && hasVoted ? { rotate: [0, -8, 8, -6, 6, 0], scale: [1, 1.1, 1] } : { rotate: 0, scale: 1 }}
            transition={{ duration: 0.7, repeat: isCloseBattle && hasVoted ? Infinity : 0, repeatDelay: 0.6 }}
          >
            VS
          </motion.div>
        </div>

        <motion.article
          className="relative rounded-[2rem] p-6 md:p-8 border-4 border-white bg-gradient-to-br from-fuchsia-50 via-white to-pink-50 shadow-[0_10px_40px_-10px_rgba(232,121,249,0.3)] overflow-hidden group hover:shadow-[0_20px_50px_-10px_rgba(232,121,249,0.4)] hover:-translate-y-1 transition-all duration-300"
          animate={justVoted === "buzz_site" ? { scale: [1, 1.03, 1] } : { scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {renderWinningBadge("buzz_site")}
          <div className="relative flex items-center gap-2 text-pink-600 text-sm font-bold bg-white/80 backdrop-blur-sm w-fit px-3 py-1 rounded-full shadow-sm">
            <Bolt className="w-4 h-4 fill-pink-100" />
            {OPTION_META.buzz_site.badge}
          </div>
          <h3 className="relative mt-4 text-xl md:text-2xl font-black text-slate-800">{OPTION_META.buzz_site.title}</h3>
          <p className="relative mt-3 text-slate-600 text-sm leading-relaxed font-medium">
            {OPTION_META.buzz_site.description}
          </p>

          <div className="relative mt-6 rounded-2xl overflow-hidden border-4 border-white shadow-md">
            <div className="aspect-video bg-slate-100 flex items-center justify-center text-xs tracking-widest text-slate-400 font-bold relative group-hover:scale-105 transition-transform duration-500">
              THUMBNAIL 16:9
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (votedChoice) {
                window.open(OPTION_META.buzz_site.link, "_blank", "noopener,noreferrer");
                return;
              }
              void handleVote("buzz_site");
            }}
            disabled={isVoting || !isRealtimeAvailable}
            className="relative mt-6 w-full rounded-2xl bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white font-bold py-4 hover:from-fuchsia-400 hover:to-pink-400 hover:shadow-xl hover:shadow-pink-200/50 transition-all disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 shadow-lg shadow-pink-200/30"
          >
            {votedChoice === "buzz_site" ? (
              <>{OPTION_META.buzz_site.actionLabel} <ExternalLink className="w-4 h-4" /></>
            ) : hasVoted ? (
              <>こっちも開く <ExternalLink className="w-4 h-4" /></>
            ) : (
              "こちらを選ぶ"
            )}
          </button>

          {renderRateBar("buzz_site")}
        </motion.article>
      </div>
    </section>
  );
}
