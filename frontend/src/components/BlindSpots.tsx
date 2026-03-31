import React, { useEffect, useState } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { BlindSpotItem, Status } from "../types";

interface ChartDataPoint {
  x: number;
  y: number;
  name: string;
  revenue: number;
  isBlindSpot: boolean;
}

const BlindSpots = () => {
  const [data, setData] = useState<BlindSpotItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3040/api/reps/1/blind-spots")
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-4 text-center">Loading...</div>;

  const chartData: ChartDataPoint[] = data.map((item) => ({
    x: item.potentialScore,
    y: item.attentionScore,
    name: item.name,
    revenue: item.totalRevenue,
    isBlindSpot: item.isBlindSpot,
  }));

  const getQuadrant = (x: number, y: number) => {
    if (x > 50 && y < 50) return "Blind Spot";
    if (x > 50 && y > 50) return "Well Attended";
    if (x < 50 && y < 50) return "Low Priority";
    return "Over Attended";
  };

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: { payload: ChartDataPoint }[];
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 p-3 rounded border border-gray-600 text-white">
          <p className="font-semibold">{data.name}</p>
          <p>Potential: {data.x}</p>
          <p>Attention: {data.y}</p>
          <p>Revenue: ${data.revenue}</p>
          <p>Quadrant: {getQuadrant(data.x, data.y)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Blind Spots Detector</h2>
      <div className="mb-8">
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              type="number"
              dataKey="x"
              name="Potential Score"
              domain={[0, 100]}
              stroke="#9CA3AF"
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Attention Score"
              domain={[0, 100]}
              stroke="#9CA3AF"
            />
            <ReferenceLine x={50} stroke="#6B7280" strokeDasharray="5 5" />
            <ReferenceLine y={50} stroke="#6B7280" strokeDasharray="5 5" />
            <Tooltip content={<CustomTooltip />} />
            <Scatter
              dataKey="y"
              fill="#8884d8"
              shape={(props: any) => {
                const { cx, cy, payload } = props;
                const p = payload as ChartDataPoint;
                const size = Math.max(4, Math.min(20, p.revenue / 1000));
                const color = p.isBlindSpot
                  ? "#EF4444"
                  : p.x > 50 && p.y > 50
                    ? "#10B981"
                    : "#6B7280";
                return React.createElement("circle", {
                  cx,
                  cy,
                  r: size,
                  fill: color,
                });
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-800 p-4 rounded">
          <div className="text-sm text-gray-400">
            Blind Spots (High Potential, Low Attention)
          </div>
          <div className="text-2xl font-bold text-red-400">
            {data.filter((d) => d.isBlindSpot).length}
          </div>
        </div>
        <div className="bg-gray-800 p-4 rounded">
          <div className="text-sm text-gray-400">Total Buyers</div>
          <div className="text-2xl font-bold">{data.length}</div>
        </div>
      </div>
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">All Buyers</h3>
        {data.map((buyer) => (
          <div
            key={buyer.id}
            className={`bg-gray-800 p-4 rounded-lg border-l-4 ${
              buyer.isBlindSpot
                ? "border-red-500"
                : buyer.potentialScore > 50 && buyer.attentionScore > 50
                  ? "border-green-500"
                  : "border-gray-500"
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-sm ${
                    buyer.isBlindSpot
                      ? "bg-red-900/50 text-red-400"
                      : "bg-gray-700 text-gray-300"
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
                <div className="text-sm text-gray-400">
                  Potential: {buyer.potentialScore} | Attention:{" "}
                  {buyer.attentionScore}
                </div>
                <div className="text-sm text-gray-400">
                  Revenue: ${buyer.totalRevenue} | Orders: {buyer.orderCount}
                </div>
                {buyer.isBlindSpot && (
                  <div className="text-xs text-red-400 mt-1">⚠ Blind Spot</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlindSpots;
