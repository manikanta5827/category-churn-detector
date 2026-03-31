import { useEffect, useState } from "react";
import type { BuyerChurnItem, Status } from "../types";

const OverallChurn = () => {
  const [data, setData] = useState<BuyerChurnItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3040/api/reps/1/churn")
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-4 text-center">Loading...</div>;

  const total = data.length;
  const high = data.filter((d) => d.status === "red").length;
  const medium = data.filter((d) => d.status === "yellow").length;
  const active = data.filter((d) => d.status === "green").length;

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800 p-4 rounded border-t-4 border-gray-500">
          <div className="text-xs text-gray-400 uppercase tracking-wide">
            Total Buyers
          </div>
          <div className="text-3xl font-bold mt-2">{total}</div>
        </div>
        <div className="bg-gray-800 p-4 rounded border-t-4 border-red-500">
          <div className="text-xs text-gray-400 uppercase tracking-wide">
            High Risk
          </div>
          <div className="text-3xl font-bold mt-2 text-red-400">{high}</div>
        </div>
        <div className="bg-gray-800 p-4 rounded border-t-4 border-yellow-500">
          <div className="text-xs text-gray-400 uppercase tracking-wide">
            Medium
          </div>
          <div className="text-3xl font-bold mt-2 text-yellow-400">
            {medium}
          </div>
        </div>
        <div className="bg-gray-800 p-4 rounded border-t-4 border-green-500">
          <div className="text-xs text-gray-400 uppercase tracking-wide">
            Active
          </div>
          <div className="text-3xl font-bold mt-2 text-green-400">{active}</div>
        </div>
      </div>
      <div className="space-y-4">
        {data.map((buyer) => (
          <div
            key={buyer.id}
            className={`bg-gray-800 p-4 rounded-lg border-l-4 transition hover:shadow-lg ${
              buyer.status === "red"
                ? "border-red-500"
                : buyer.status === "yellow"
                  ? "border-yellow-500"
                  : "border-green-500"
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-sm ${
                    buyer.status === "red"
                      ? "bg-red-900/50 text-red-400"
                      : buyer.status === "yellow"
                        ? "bg-yellow-900/50 text-yellow-400"
                        : "bg-green-900/50 text-green-400"
                  }`}
                >
                  {buyer.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-lg">{buyer.name}</div>
                  <div className="text-sm text-gray-400">
                    {buyer.email} · {buyer.city}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide ${
                    buyer.status === "red"
                      ? "bg-red-900/50 text-red-400 border border-red-500"
                      : buyer.status === "yellow"
                        ? "bg-yellow-900/50 text-yellow-400 border border-yellow-500"
                        : "bg-green-900/50 text-green-400 border border-green-500"
                  }`}
                >
                  {buyer.status === "red"
                    ? "High Risk"
                    : buyer.status === "yellow"
                      ? "Medium"
                      : "Active"}
                </div>
                {buyer.daysSinceLastOrder > 0 && buyer.status !== "green" && (
                  <div className="text-xs text-gray-400 mt-1">
                    +{buyer.daysSinceLastOrder}d overdue
                  </div>
                )}
              </div>
            </div>
            {buyer.status !== "green" && (
              <div className="grid grid-cols-5 gap-4 mt-6 pt-4 border-t border-gray-700">
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide">
                    Avg reorder gap
                  </div>
                  <div className="text-lg font-semibold mt-1">
                    {buyer.avgCycleDays} days
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide">
                    Days since last
                  </div>
                  <div className="text-lg font-semibold mt-1 text-red-400">
                    {buyer.daysSinceLastOrder} days
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide">
                    Overdue by
                  </div>
                  <div className="text-lg font-semibold mt-1 text-red-400">
                    {Math.max(0, buyer.daysSinceLastOrder - buyer.avgCycleDays)}{" "}
                    days
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide">
                    Last order
                  </div>
                  <div className="text-lg font-semibold mt-1">
                    {buyer.lastOrderDate
                      ? new Date(buyer.lastOrderDate).toLocaleDateString()
                      : "N/A"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide">
                    Status
                  </div>
                  <div className="text-lg font-semibold mt-1 capitalize">
                    {buyer.status}
                  </div>
                </div>
              </div>
            )}
            {buyer.status === "green" && (
              <div className="mt-4 pt-4 border-t border-gray-700 text-sm text-gray-400">
                ✓ No action needed — buyer is within normal ordering window.
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default OverallChurn;
