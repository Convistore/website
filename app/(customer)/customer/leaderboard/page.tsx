"use client";

import { useEffect, useRef, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Gem, Calendar, Loader2, ChevronDown } from "lucide-react";
import LeaderNav from "@/app/components/LeaderNav";

type LeaderboardUser = {
  uid: string;
  name: string;
  photoURL?: string;
  totalSpent: number;
  totalOrders: number;
};

const months = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const getRankSuffix = (n: number) =>
  n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th";

// ─── In-memory cache: key = "YYYY-MM" ────────────────────────────────────────
const leaderboardCache = new Map<string, LeaderboardUser[]>();

export default function LeaderboardPage() {
  const [allUsers, setAllUsers]       = useState<LeaderboardUser[]>([]);
  const [visibleCount, setVisibleCount] = useState(10);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear,  setSelectedYear]  = useState(now.getFullYear());

  // Abort controller so fast filter switches don't race
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setVisibleCount(10);
    fetchLeaderboard(ctrl.signal);

    return () => ctrl.abort();
  }, [selectedMonth, selectedYear]);

const fetchLeaderboard = async (signal: AbortSignal) => {
  const cacheKey = `${selectedYear}-${selectedMonth}`;

  // CACHE
  if (leaderboardCache.has(cacheKey)) {
    setAllUsers(leaderboardCache.get(cacheKey)!);
    setLoading(false);
    return;
  }

  try {
    setLoading(true);

    const startDate = new Date(selectedYear, selectedMonth, 1);
    const endDate = new Date(selectedYear, selectedMonth + 1, 1);

    // FETCH PURCHASES
    const purchasesSnap = await getDocs(
      query(
        collection(db, "purchases"),
        where("status", "==", "delivered"),
        where("createdAt", ">=", Timestamp.fromDate(startDate)),
        where("createdAt", "<", Timestamp.fromDate(endDate))
      )
    );

    if (signal.aborted) return;

    const leaderboardMap = new Map<string, LeaderboardUser>();

    purchasesSnap.forEach((doc) => {
      const d = doc.data();

      const uid =
        d.customerUid ||
        d.customer?.uid ||
        d.customer?.customerUid;

      if (!uid) return;

      const totalAmount = Number(d.analytics?.totalAmount ?? 0);

      // PHOTO URL FALLBACKS
      const purchasePhoto =
        d.customer?.photoURL ||
        d.customer?.profileURL ||
        d.customer?.profileUrl ||
        d.customer?.profileImage ||
        d.customerPhotoURL ||
        "";

      // NAME FALLBACKS
      const purchaseName =
        d.customer?.name ||
        d.customerName ||
        d.name ||
        "Customer";

      if (!leaderboardMap.has(uid)) {
        leaderboardMap.set(uid, {
          uid,
          name: purchaseName,
          photoURL: purchasePhoto,
          totalSpent: 0,
          totalOrders: 0,
        });
      }

      const entry = leaderboardMap.get(uid)!;

      // UPDATE NAME IF BETTER
      if (
        (!entry.name || entry.name === "Customer") &&
        purchaseName
      ) {
        entry.name = purchaseName;
      }

      // UPDATE PHOTO IF MISSING
      if (!entry.photoURL && purchasePhoto) {
        entry.photoURL = purchasePhoto;
      }

      entry.totalSpent += totalAmount;
      entry.totalOrders += 1;
    });

    // FETCH MISSING CUSTOMER DATA
    const missingDataUids = Array.from(leaderboardMap.values())
      .filter(
        (u) =>
          !u.photoURL ||
          !u.name ||
          u.name === "Customer"
      )
      .map((u) => u.uid);

    if (missingDataUids.length > 0 && !signal.aborted) {
      const chunks: string[][] = [];

      for (let i = 0; i < missingDataUids.length; i += 30) {
        chunks.push(missingDataUids.slice(i, i + 30));
      }

      await Promise.all(
        chunks.map(async (chunk) => {
          const snap = await getDocs(
            query(
              collection(db, "customers"),
              where("uid", "in", chunk)
            )
          );

          snap.forEach((doc) => {
            const cd = doc.data();

            const uid = cd.uid;

            if (!uid) return;

            const entry = leaderboardMap.get(uid);

            if (!entry) return;

            // UPDATE NAME
            entry.name =
              cd.name ||
              cd.customerName ||
              entry.name;

            // UPDATE PHOTO
            entry.photoURL =
              cd.photoURL ||
              cd.profileURL ||
              cd.profileUrl ||
              cd.profileImage ||
              entry.photoURL ||
              "";
          });
        })
      );
    }

    if (signal.aborted) return;

    const sorted = Array.from(leaderboardMap.values()).sort(
      (a, b) => b.totalSpent - a.totalSpent
    );

    leaderboardCache.set(cacheKey, sorted);

    setAllUsers(sorted);
  } catch (err: any) {
    if (err?.name !== "AbortError") {
      console.error("Leaderboard Error:", err);
    }
  } finally {
    if (!signal.aborted) {
      setLoading(false);
    }
  }
};

  const topThree       = allUsers.slice(0, 3);
  const remainingUsers = allUsers.slice(3);
  const visibleRemaining = remainingUsers.slice(0, visibleCount);
  const hasMore        = visibleCount < remainingUsers.length;

  const handleLoadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + 10, remainingUsers.length));
      setLoadingMore(false);
    }, 400);
  };

const avatarUrl = (
  name: string,
  photoURL?: string,
  tint = "111",
  fg = "666"
) => {
  const cleaned = photoURL?.trim();

  if (
    cleaned &&
    typeof cleaned === "string" &&
    cleaned.startsWith("http")
  ) {
    return cleaned;
  }

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name || "User"
  )}&background=${tint}&color=${fg}&bold=true`;
};

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

        *{box-sizing:border-box;}

        :root{
          --gold:#C9A84C;--gold-light:#E8CC80;--gold-dim:#8A6E30;
          --silver:#A8B2C0;--bronze:#B87333;
          --bg:#0A0A0B;--surface:#111114;--surface2:#18181D;
          --border:rgba(255,255,255,0.07);--text:#F0EDE8;--muted:#6B6875;
        }

        .lb-root{
          min-height:100vh;background:var(--bg);color:var(--text);
          font-family:'DM Sans',sans-serif;padding:0 0 120px;
          position:relative;overflow-x:hidden;
        }
        .lb-root::before{
          content:'';position:fixed;top:-200px;left:50%;
          transform:translateX(-50%);width:800px;height:500px;
          background:radial-gradient(ellipse,rgba(201,168,76,0.08) 0%,transparent 70%);
          pointer-events:none;z-index:0;
        }

        /* HEADER */
        .lb-header{
          position:sticky;top:0;z-index:50;
          background:rgba(10,10,11,0.85);backdrop-filter:blur(20px);
          border-bottom:1px solid var(--border);
          padding:16px 24px;
          display:flex;align-items:center;justify-content:space-between;gap:12px;
        }
        .lb-title{
          font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:600;
          letter-spacing:0.04em;
          background:linear-gradient(135deg,var(--gold-light),var(--gold),var(--gold-dim));
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
          line-height:1;
        }
        .lb-subtitle{font-size:11px;color:var(--muted);letter-spacing:0.12em;text-transform:uppercase;margin-top:3px;}
        .lb-filter{
  display:flex;
  align-items:center;
  gap:6px;
  background:var(--surface2);
  border:1px solid var(--border);
  border-radius:12px;
  padding:6px 8px;
}

/* Small screens */
@media (max-width: 640px){
  .lb-filter{
    padding:4px 6px; /* smaller height & width */
    gap:4px;
    border-radius:10px;
  }

  .lb-filter select{
    font-size:12px;
  }
}

.lb-filter select{
  background:transparent;
  border:none;
  color:var(--text);
  font-family:'DM Sans',sans-serif;
  font-size:13px;
  outline:none;
  cursor:pointer;
}

.lb-filter option{
  background:#111114;
}
        .lb-body{max-width:680px;margin:0 auto;padding:0 20px;position:relative;z-index:1;}

        /* PODIUM */
        .podium-wrap{margin-top:32px;padding:40px 20px 0;position:relative;}
        .podium-label{text-align:center;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:var(--muted);margin-bottom:40px;}
        .podium-stage{display:flex;align-items:flex-end;justify-content:center;gap:0;}
        .podium-slot{display:flex;flex-direction:column;align-items:center;position:relative;}
        .podium-avatar-wrap{position:relative;margin-bottom:12px;}
        .podium-avatar{border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,0.1);display:block;}
        .podium-slot[data-rank="1"] .podium-avatar{width:76px;height:76px;border-color:var(--gold);box-shadow:0 0 0 4px rgba(201,168,76,0.15),0 8px 32px rgba(201,168,76,0.3);}
        .podium-slot[data-rank="2"] .podium-avatar,.podium-slot[data-rank="3"] .podium-avatar{width:60px;height:60px;}
        .podium-slot[data-rank="2"] .podium-avatar{border-color:var(--silver);box-shadow:0 0 0 3px rgba(168,178,192,0.12);}
        .podium-slot[data-rank="3"] .podium-avatar{border-color:var(--bronze);box-shadow:0 0 0 3px rgba(184,115,51,0.12);}
        .podium-badge{
          position:absolute;bottom:-4px;right:-4px;width:22px;height:22px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          font-family:'Cormorant Garamond',serif;font-size:11px;font-weight:700;border:2px solid var(--bg);
        }
        .podium-slot[data-rank="1"] .podium-badge{background:var(--gold);color:#000;}
        .podium-slot[data-rank="2"] .podium-badge{background:var(--silver);color:#000;}
        .podium-slot[data-rank="3"] .podium-badge{background:var(--bronze);color:#fff;}
        .podium-name{font-size:13px;font-weight:500;text-align:center;color:var(--text);white-space:nowrap;max-width:100px;overflow:hidden;text-overflow:ellipsis;}
        .podium-slot[data-rank="1"] .podium-name{font-size:15px;font-weight:600;}
        .podium-amount{display:flex;align-items:center;gap:4px;font-size:12px;margin-top:4px;margin-bottom:16px;}
        .podium-slot[data-rank="1"] .podium-amount{color:var(--gold);font-size:13px;font-weight:600;}
        .podium-slot[data-rank="2"] .podium-amount{color:var(--silver);}
        .podium-slot[data-rank="3"] .podium-amount{color:var(--bronze);}
        .podium-block{
          width:120px;border-radius:20px 20px 0 0;
          display:flex;flex-direction:column;align-items:center;justify-content:flex-start;
          padding-top:20px;position:relative;overflow:hidden;
        }
        .podium-slot[data-rank="1"] .podium-block{height:160px;background:linear-gradient(180deg,rgba(201,168,76,0.25) 0%,rgba(201,168,76,0.08) 100%);border:1px solid rgba(201,168,76,0.3);border-bottom:none;width:140px;}
        .podium-slot[data-rank="2"] .podium-block{height:110px;background:linear-gradient(180deg,rgba(168,178,192,0.15) 0%,rgba(168,178,192,0.04) 100%);border:1px solid rgba(168,178,192,0.2);border-bottom:none;}
        .podium-slot[data-rank="3"] .podium-block{height:88px;background:linear-gradient(180deg,rgba(184,115,51,0.15) 0%,rgba(184,115,51,0.04) 100%);border:1px solid rgba(184,115,51,0.2);border-bottom:none;}
        .podium-rank-num{font-family:'Cormorant Garamond',serif;font-size:48px;font-weight:300;line-height:1;opacity:0.9;}
        .podium-slot[data-rank="1"] .podium-rank-num{color:var(--gold);font-size:56px;}
        .podium-slot[data-rank="2"] .podium-rank-num{color:var(--silver);}
        .podium-slot[data-rank="3"] .podium-rank-num{color:var(--bronze);}
        .podium-rank-tag{font-size:8px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.6;margin-top:-2px;}
        .podium-slot[data-rank="1"] .podium-rank-tag{color:var(--gold);}
        .podium-slot[data-rank="2"] .podium-rank-tag{color:var(--silver);}
        .podium-slot[data-rank="3"] .podium-rank-tag{color:var(--bronze);}

        /* DIVIDER */
        .lb-divider{display:flex;align-items:center;gap:16px;margin:36px 0 24px;}
        .lb-divider-line{flex:1;height:1px;background:var(--border);}
        .lb-divider-text{font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:var(--muted);}

        /* LIST ROWS */
        .lb-row{
          display:flex;align-items:center;gap:14px;padding:14px 16px;
          background:var(--surface);border:1px solid var(--border);border-radius:16px;
          margin-bottom:10px;transition:border-color 0.2s,background 0.2s;cursor:default;
        }
        .lb-row:hover{background:var(--surface2);border-color:rgba(255,255,255,0.12);}
        .lb-row-rank{font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:600;color:var(--muted);min-width:36px;text-align:center;line-height:1;}
        .lb-row-rank sup{font-size:10px;font-weight:400;vertical-align:super;}
        .lb-row-avatar{width:44px;height:44px;border-radius:12px;object-fit:cover;border:1px solid var(--border);flex-shrink:0;}
        .lb-row-info{flex:1;min-width:0;}
        .lb-row-name{font-size:14px;font-weight:500;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .lb-row-meta{font-size:11px;color:var(--muted);margin-top:2px;}
        .lb-row-amount{text-align:right;flex-shrink:0;}
        .lb-row-spent{display:flex;align-items:center;justify-content:flex-end;gap:4px;font-size:15px;font-weight:600;color:var(--text);font-family:'Cormorant Garamond',serif;}
        .lb-row-orders{font-size:10px;color:var(--muted);text-align:right;margin-top:2px;letter-spacing:0.06em;text-transform:uppercase;}

        /* LOAD MORE */
        .load-more-wrap{display:flex;flex-direction:column;align-items:center;margin-top:28px;gap:10px;}
        .load-more-btn{
          display:flex;align-items:center;gap:8px;
          background:var(--surface2);border:1px solid var(--border);
          color:var(--text);font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;
          padding:12px 32px;border-radius:100px;cursor:pointer;
          transition:border-color 0.2s,background 0.2s;letter-spacing:0.04em;
        }
        .load-more-btn:hover{border-color:rgba(201,168,76,0.4);background:rgba(201,168,76,0.06);color:var(--gold-light);}
        .load-more-count{font-size:11px;color:var(--muted);letter-spacing:0.08em;}

        /* LOADING / EMPTY */
        .lb-loading{height:60vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;}
        .lb-loading-text{font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:var(--muted);}
        .lb-empty{text-align:center;padding:80px 24px;}
        .lb-empty-title{font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:400;color:var(--muted);margin-bottom:8px;}
        .lb-empty-sub{font-size:13px;color:#3a3a42;}

        .hot-dot{width:6px;height:6px;border-radius:50%;background:var(--gold);flex-shrink:0;box-shadow:0 0 6px var(--gold);}

        @keyframes fadeUp{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);}}
        @keyframes spin{to{transform:rotate(360deg);}}
        .animate-fadeup{animation:fadeUp 0.4s ease both;}

        /* TABLET */
        @media(min-width:768px){
          .lb-header{padding:20px 36px;}
          .lb-title{font-size:36px;}
          .lb-subtitle{font-size:12px;margin-top:5px;}
          .lb-filter{padding:10px 18px;border-radius:14px;gap:10px;}
          .lb-filter select{font-size:14px;}
          .lb-body{max-width:820px;padding:0 32px;}
          .podium-wrap{margin-top:44px;padding:48px 28px 0;}
          .podium-label{font-size:11px;margin-bottom:48px;}
          .podium-slot[data-rank="1"] .podium-avatar{width:96px;height:96px;}
          .podium-slot[data-rank="2"] .podium-avatar,.podium-slot[data-rank="3"] .podium-avatar{width:76px;height:76px;}
          .podium-badge{width:26px;height:26px;font-size:13px;}
          .podium-slot[data-rank="1"] .podium-name{font-size:18px;max-width:130px;}
          .podium-name{font-size:15px;max-width:110px;}
          .podium-slot[data-rank="1"] .podium-amount{font-size:15px;}
          .podium-amount{font-size:13px;}
          .podium-slot[data-rank="1"] .podium-block{height:200px;width:170px;padding-top:24px;}
          .podium-slot[data-rank="2"] .podium-block{height:140px;width:140px;}
          .podium-slot[data-rank="3"] .podium-block{height:110px;width:140px;}
          .podium-slot[data-rank="1"] .podium-rank-num{font-size:72px;}
          .podium-rank-num{font-size:60px;}
          .podium-rank-tag{font-size:9px;}
          .lb-divider{margin:44px 0 28px;}
          .lb-divider-text{font-size:11px;}
          .lb-row{padding:18px 20px;gap:18px;border-radius:18px;margin-bottom:12px;}
          .lb-row-rank{font-size:24px;min-width:44px;}
          .lb-row-rank sup{font-size:12px;}
          .lb-row-avatar{width:54px;height:54px;border-radius:14px;}
          .lb-row-name{font-size:16px;}
          .lb-row-meta{font-size:12px;margin-top:3px;}
          .lb-row-spent{font-size:18px;}
          .lb-row-orders{font-size:11px;}
          .load-more-btn{font-size:14px;padding:14px 40px;}
          .load-more-count{font-size:12px;}
          .lb-empty-title{font-size:34px;}
          .lb-loading-text{font-size:12px;}
          .hot-dot{width:7px;height:7px;}
        }

        /* DESKTOP */
        @media(min-width:1200px){
          .lb-header{padding:24px 48px;}
          .lb-title{font-size:44px;}
          .lb-subtitle{font-size:13px;margin-top:6px;}
          .lb-filter{padding:12px 22px;gap:12px;border-radius:16px;}
          .lb-filter select{font-size:15px;}
          .lb-body{max-width:960px;padding:0 40px;}
          .podium-wrap{margin-top:56px;padding:56px 40px 0;}
          .podium-label{font-size:12px;letter-spacing:0.25em;margin-bottom:56px;}
          .podium-slot[data-rank="1"] .podium-avatar{width:112px;height:112px;box-shadow:0 0 0 5px rgba(201,168,76,0.18),0 12px 40px rgba(201,168,76,0.35);}
          .podium-slot[data-rank="2"] .podium-avatar,.podium-slot[data-rank="3"] .podium-avatar{width:88px;height:88px;}
          .podium-badge{width:30px;height:30px;font-size:14px;bottom:-5px;right:-5px;}
          .podium-slot[data-rank="1"] .podium-name{font-size:22px;max-width:160px;}
          .podium-name{font-size:17px;max-width:130px;}
          .podium-slot[data-rank="1"] .podium-amount{font-size:17px;margin-bottom:20px;}
          .podium-amount{font-size:14px;margin-bottom:20px;}
          .podium-slot[data-rank="1"] .podium-block{height:240px;width:200px;padding-top:28px;border-radius:24px 24px 0 0;}
          .podium-slot[data-rank="2"] .podium-block{height:168px;width:168px;border-radius:22px 22px 0 0;}
          .podium-slot[data-rank="3"] .podium-block{height:132px;width:168px;border-radius:22px 22px 0 0;}
          .podium-slot[data-rank="1"] .podium-rank-num{font-size:88px;}
          .podium-rank-num{font-size:72px;}
          .podium-rank-tag{font-size:10px;letter-spacing:0.22em;}
          .lb-divider{margin:52px 0 32px;}
          .lb-divider-text{font-size:12px;letter-spacing:0.25em;}
          .lb-row{padding:22px 28px;gap:22px;border-radius:20px;margin-bottom:14px;}
          .lb-row-rank{font-size:28px;min-width:52px;}
          .lb-row-rank sup{font-size:13px;}
          .lb-row-avatar{width:62px;height:62px;border-radius:16px;}
          .lb-row-name{font-size:18px;}
          .lb-row-meta{font-size:13px;margin-top:4px;}
          .lb-row-spent{font-size:22px;}
          .lb-row-orders{font-size:12px;}
          .load-more-btn{font-size:15px;padding:16px 48px;}
          .load-more-count{font-size:13px;}
          .lb-empty-title{font-size:40px;}
          .lb-empty-sub{font-size:15px;}
          .lb-loading-text{font-size:13px;}
          .hot-dot{width:8px;height:8px;}
        }
      `}</style>

      <div className="lb-root">
        <LeaderNav />

        {/* Header */}
        <div className="lb-header">
          <div>
            <div className="lb-title">Leaderboard</div>
            <div className="lb-subtitle">Elite Customers · {months[selectedMonth]} {selectedYear}</div>
          </div>
          <div className="lb-filter">
            <Calendar size={13} color="var(--gold)" />
            <select   value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
              {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
              {[2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <div className="lb-body">
          {loading ? (
            <div className="lb-loading">
              <Loader2 size={28} color="var(--gold)" style={{ animation: "spin 1s linear infinite" }} />
              <div className="lb-loading-text">Fetching rankings</div>
            </div>
          ) : topThree.length === 0 ? (
            <div className="lb-empty">
              <div className="lb-empty-title">No rankings yet</div>
              <div className="lb-empty-sub">No delivered purchases found for this period.</div>
            </div>
          ) : (
            <>
              {/* Podium */}
              <div className="podium-wrap">
                <div className="podium-label">Top Customers</div>
                <div className="podium-stage">

                  {/* 2nd */}
                  {topThree[1] && (
                    <div className="podium-slot" data-rank="2">
                      <div className="podium-avatar-wrap">
                        <img className="podium-avatar" src={avatarUrl(topThree[1].name, topThree[1].photoURL, "222", "aaa")} alt={topThree[1].name} referrerPolicy="no-referrer" />
                        <div className="podium-badge">2</div>
                      </div>
                      <div className="podium-name">{topThree[1].name.split(" ")[0]}</div>
                      <div className="podium-amount"><Gem size={10} />₹{topThree[1].totalSpent.toLocaleString()}</div>
                      <div className="podium-block">
                        <div className="podium-rank-num">2</div>
                        <div className="podium-rank-tag">Prestige</div>
                      </div>
                    </div>
                  )}

                  {/* 1st */}
                  {topThree[0] && (
                    <div className="podium-slot" data-rank="1">
                      <div className="podium-avatar-wrap">
                        <img className="podium-avatar" src={avatarUrl(topThree[0].name, topThree[0].photoURL, "2a2200", "C9A84C")} alt={topThree[0].name} referrerPolicy="no-referrer" />
                        <div className="podium-badge">1</div>
                      </div>
                      <div className="podium-name">{topThree[0].name.split(" ")[0]}</div>
                      <div className="podium-amount"><Gem size={11} />₹{topThree[0].totalSpent.toLocaleString()}</div>
                      <div className="podium-block">
                        <div className="podium-rank-num">1</div>
                        <div className="podium-rank-tag">Elite</div>
                      </div>
                    </div>
                  )}

                  {/* 3rd */}
                  {topThree[2] && (
                    <div className="podium-slot" data-rank="3">
                      <div className="podium-avatar-wrap">
                        <img className="podium-avatar" src={avatarUrl(topThree[2].name, topThree[2].photoURL, "1a0e00", "B87333")} alt={topThree[2].name} referrerPolicy="no-referrer" />
                        <div className="podium-badge">3</div>
                      </div>
                      <div className="podium-name">{topThree[2].name.split(" ")[0]}</div>
                      <div className="podium-amount"><Gem size={10} />₹{topThree[2].totalSpent.toLocaleString()}</div>
                      <div className="podium-block">
                        <div className="podium-rank-num">3</div>
                        <div className="podium-rank-tag">Prime</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Remaining list */}
              {remainingUsers.length > 0 && (
                <>
                  <div className="lb-divider">
                    <div className="lb-divider-line" />
                    <div className="lb-divider-text">Rankings</div>
                    <div className="lb-divider-line" />
                  </div>

                  {visibleRemaining.map((user, index) => {
                    const rank  = index + 4;
                    const isHot = index < 7;
                    return (
                      <div
                        key={user.uid}
                        className="lb-row animate-fadeup"
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <div className="lb-row-rank">
                          {rank}<sup>{getRankSuffix(rank)}</sup>
                        </div>
                        <img
                          className="lb-row-avatar"
                          src={avatarUrl(user.name, user.photoURL)}
                          alt={user.name}
                          referrerPolicy="no-referrer"
                        />
                        <div className="lb-row-info">
                          <div className="lb-row-name" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            {isHot && <div className="hot-dot" />}
                            {user.name}
                          </div>
                          <div className="lb-row-meta">{user.totalOrders} order{user.totalOrders !== 1 ? "s" : ""}</div>
                        </div>
                        <div className="lb-row-amount">
                          <div className="lb-row-spent">
                            <Gem size={12} color="var(--gold)" />
                            ₹{user.totalSpent.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {hasMore && (
                    <div className="load-more-wrap">
                      <button className="load-more-btn" onClick={handleLoadMore} disabled={loadingMore}>
                        {loadingMore
                          ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                          : <ChevronDown size={14} />}
                        {loadingMore ? "Loading…" : "Load More"}
                      </button>
                      <div className="load-more-count">
                        Showing {visibleCount} of {remainingUsers.length} · #{4}–#{3 + visibleCount}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}