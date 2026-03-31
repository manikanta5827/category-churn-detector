import { useEffect, useState } from "react";
import type { BuyerCategoryChurnItem, Category, Status } from "../types";

const CategoryChurn = () => {
  const [data, setData] = useState<BuyerCategoryChurnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiMessages, setAiMessages] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("http://localhost:3040/api/reps/1/category-churn")
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const generateMessage = async (buyerId: number, categoryName: string) => {
    const key = `${buyerId}-${categoryName}`;
    if (aiMessages[key]) return;

    const category = data
      .find((b) => b.id === buyerId)
      ?.categories.find((c) => c.name === categoryName);
    if (!category) return;

    const response = await fetch(
      `http://localhost:3040/api/reps/1/category-churn/${buyerId}/${categoryName}/message`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          daysSince: category.daysSinceLastOrder,
          avgCycle: category.avgCycleDays,
          totalOrders: category.totalOrders,
        }),
      },
    );
    const result: { message: string } = await response.json();
    setAiMessages((prev) => ({ ...prev, [key]: result.message }));
  };

  if (loading) return <div className="p-4 text-center">Loading...</div>;

  const total = data.length;
  const high = data.filter((d) => d.buyerStatus === "red").length;
  const medium = data.filter((d) => d.buyerStatus === "yellow").length;
  const active = data.filter((d) => d.buyerStatus === "green").length;

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
              buyer.buyerStatus === "red"
                ? "border-red-500"
                : buyer.buyerStatus === "yellow"
                  ? "border-yellow-500"
                  : "border-green-500"
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-sm ${
                    buyer.buyerStatus === "red"
                      ? "bg-red-900/50 text-red-400"
                      : buyer.buyerStatus === "yellow"
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
                    buyer.buyerStatus === "red"
                      ? "bg-red-900/50 text-red-400 border border-red-500"
                      : buyer.buyerStatus === "yellow"
                        ? "bg-yellow-900/50 text-yellow-400 border border-yellow-500"
                        : "bg-green-900/50 text-green-400 border border-green-500"
                  }`}
                >
                  {buyer.buyerStatus === "red"
                    ? "High Risk"
                    : buyer.buyerStatus === "yellow"
                      ? "Medium"
                      : "Active"}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Cold: {buyer.coldCount} | Warm: {buyer.warmCount}
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {buyer.categories.map((category) => (
                <div
                  key={category.name}
                  className={`p-3 rounded border-l-4 ${
                    category.status === "red"
                      ? "border-red-500 bg-red-900/20"
                      : category.status === "yellow"
                        ? "border-yellow-500 bg-yellow-900/20"
                        : "border-green-500 bg-green-900/20"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{category.name}</div>
                      <div className="text-sm text-gray-400">
                        Last:{" "}
                        {new Date(category.lastOrderDate).toLocaleDateString()}{" "}
                        | Days since: {category.daysSinceLastOrder} | Avg cycle:{" "}
                        {category.avgCycleDays} | Orders: {category.totalOrders}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded text-xs uppercase ${
                          category.status === "red"
                            ? "bg-red-500 text-black"
                            : category.status === "yellow"
                              ? "bg-yellow-500 text-black"
                              : "bg-green-500 text-black"
                        }`}
                      >
                        {category.status}
                      </span>
                      <button
                        onClick={() => generateMessage(buyer.id, category.name)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        Generate AI Message
                      </button>
                    </div>
                  </div>
                  {aiMessages[`${buyer.id}-${category.name}`] && (
                    <div className="mt-3 p-3 bg-gray-700 rounded text-sm">
                      <div className="font-medium mb-1">
                        AI Generated Message:
                      </div>
                      <div className="whitespace-pre-wrap">
                        {aiMessages[`${buyer.id}-${category.name}`]}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryChurn;
