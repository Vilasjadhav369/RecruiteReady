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
export default function RecentlyViewed({ limit = 4, bare = false }) {
  const items = useRecentlyViewed().slice(0, limit);

  const content = (
    <>
      {items.length === 0 ? (
        <p className="text-xs text-ink-2 leading-relaxed m-0 py-2">
          Study materials, companies, coding problems and mock tests you open will show up here so you can jump back in.
        </p>
      ) : (
        <ul className="divide-y divide-border m-0 p-0 list-none">
          {items.map((item) => (
            <li key={`${item.type}-${item.id}`}>
              <Link
                to={item.link}
                className="flex items-center justify-between gap-3 py-2 no-underline group"
              >
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-ink group-hover:text-primary truncate transition-colors">
                    {item.title}
                  </span>
                  <span className="block text-[11px] text-ink-2">{TYPE_LABEL[item.type] || "Item"}</span>
                </span>
                <span className="text-ink-2 group-hover:text-primary group-hover:translate-x-0.5 transition-all" aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
  if (bare) return content;
  return (
    <Card className="p-3.5 sm:p-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-ink-2 m-0">Recently viewed</h2>
        <span className="text-[11px] text-ink-2">On this device</span>
      </div>
      {content}
    </Card>
  );
}
