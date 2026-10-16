import { Link } from "react-router-dom";
import { useRecentlyViewed } from "../../lib/recentlyViewed.js";
import { Card } from "../ui/Card.jsx";

const TYPE_LABEL = {
  resource: "Study material",
  company: "Company",
  coding: "Coding problem",
  "mock-test": "Mock test",
};

/**
 * RecentlyViewed — shortcut list of items this student opened on this device.
 * Honest about its scope: it is device-local and not synced to the server.
 */
export default function RecentlyViewed({ limit = 5 }) {
  const items = useRecentlyViewed().slice(0, limit);

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-slate-900">Recently viewed</h2>
        <span className="text-[11px] text-slate-400">On this device</span>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-slate-500 leading-relaxed">
          Study materials, companies, coding problems and mock tests you open will show up here so you can jump back in.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((item) => (
            <li key={`${item.type}-${item.id}`}>
              <Link
                to={item.link}
                className="flex items-center justify-between gap-3 py-2.5 no-underline group"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-800 group-hover:text-primary truncate transition-colors">
                    {item.title}
                  </span>
                  <span className="block text-[11px] text-slate-500">{TYPE_LABEL[item.type] || "Item"}</span>
                </span>
                <span className="text-slate-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all" aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
