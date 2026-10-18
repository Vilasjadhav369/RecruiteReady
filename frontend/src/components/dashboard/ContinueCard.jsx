import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "../ui/Card.jsx";
import { getAptitudeHistory } from "../../services/aptitudeService.js";
import { getMockHistory } from "../../services/mockTestService.js";

/**
 * ContinueCard — "pick up where you left off". Built ONLY from the student's real history:
 * any attempt whose status is `in_progress`. Renders nothing when there is none (no filler),
 * and nothing if either request fails (it is an enhancement, not a dependency).
 */
export default function ContinueCard() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [apt, mock] = await Promise.allSettled([getAptitudeHistory({ limit: 10 }), getMockHistory({ limit: 10 })]);
      if (cancelled) return;
      const out = [];
      if (apt.status === "fulfilled") {
        (apt.value?.attempts || []).filter((a) => a.status === "in_progress").slice(0, 2).forEach((a) =>
          out.push({ key: `a-${a._id}`, kind: "Aptitude practice", title: [a.category, a.topic].filter(Boolean).join(" · ") || "Practice session", link: `/aptitude/session/${a._id}`, at: a.startedAt || a.createdAt })
        );
      }
      if (mock.status === "fulfilled") {
        (mock.value?.attempts || []).filter((a) => a.status === "in_progress").slice(0, 2).forEach((a) =>
          out.push({ key: `m-${a._id}`, kind: "Mock test", title: a.mockTest?.title || "Mock test", link: `/mock-tests/session/${a._id}`, at: a.startedAt || a.createdAt })
        );
      }
      out.sort((x, y) => new Date(y.at || 0) - new Date(x.at || 0));
      setItems(out.slice(0, 3));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (items.length === 0) return null;
  const first = items[0];
  return (
    <Link to={first.link} className="rr-no-print flex items-center justify-between gap-3 rounded-xl border border-slate-300 bg-white px-4 py-2.5 no-underline group hover:border-slate-900 transition-colors">
      <span className="min-w-0 flex items-center gap-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 shrink-0">Continue</span>
        <span className="text-sm font-semibold text-slate-900 truncate">{first.title}</span>
        <span className="hidden sm:inline text-xs text-slate-500 shrink-0">{first.kind}{items.length > 1 ? ` · +${items.length - 1} more unfinished` : ""}</span>
      </span>
      <span className="text-xs font-bold text-slate-900 shrink-0 group-hover:translate-x-0.5 transition-transform">Resume →</span>
    </Link>
  );
}
