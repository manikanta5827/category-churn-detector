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
import type { BlindSpotItem } from "../types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Target, TrendingUp, Users } from "lucide-react";

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
      .catch(err => console.error("Error fetching blind spots:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-[400px] w-full" />
        {[1, 2].map(i => <Skeleton key={i} className="h-32 w-full" />)}
      </div>
    );
  }

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
      const p = payload[0].payload;
      return (
        <Card className="shadow-xl border-border bg-background/95 backdrop-blur-sm p-3 min-w-[200px]">
          <div className="font-bold text-sm mb-2 border-b pb-1">{p.name}</div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Potential:</span>
              <span className="font-medium">{p.x}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Attention:</span>
              <span className="font-medium">{p.y}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Revenue:</span>
              <span className="font-medium">${p.revenue.toLocaleString()}</span>
            </div>
            <div className="mt-2 pt-1 border-t">
              <Badge variant={p.isBlindSpot ? "destructive" : "outline"} className="w-full justify-center text-[10px] h-5">
                {getQuadrant(p.x, p.y)}
              </Badge>
            </div>
          </div>
        </Card>
      );
    }
    return null;
  };

  const blindSpotsCount = data.filter((d) => d.isBlindSpot).length;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className={blindSpotsCount > 0 ? "border-destructive/50 bg-destructive/5" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardDescription className="text-xs uppercase font-semibold">Critical Blind Spots</CardDescription>
            <AlertCircle className={`w-4 h-4 ${blindSpotsCount > 0 ? "text-destructive" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${blindSpotsCount > 0 ? "text-destructive" : ""}`}>{blindSpotsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">High potential buyers needing attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardDescription className="text-xs uppercase font-semibold">Total Analysis Scope</CardDescription>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Total active buyer portfolio</p>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Priority Matrix
          </CardTitle>
          <CardDescription>
            Bubble size represents total revenue. Top-left quadrant (High Potential, Low Attention) indicates blind spots.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="Potential Score"
                  domain={[0, 100]}
                  label={{ value: "Potential Score", position: "insideBottom", offset: -10, className: "fill-muted-foreground text-[10px] font-bold" }}
                  tick={{ fontSize: 10 }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="Attention Score"
                  domain={[0, 100]}
                  label={{ value: "Attention Score", angle: -90, position: "insideLeft", className: "fill-muted-foreground text-[10px] font-bold" }}
                  tick={{ fontSize: 10 }}
                />
                <ReferenceLine x={50} className="stroke-muted-foreground/50" strokeDasharray="5 5" />
                <ReferenceLine y={50} className="stroke-muted-foreground/50" strokeDasharray="5 5" />
                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: "3 3" }} />
                <Scatter
                  data={chartData}
                  fill="var(--primary)"
                  shape={(props: any) => {
                    const { cx, cy, payload } = props;
                    const p = payload as ChartDataPoint;
                    const size = Math.max(6, Math.min(25, p.revenue / 500));
                    const color = p.isBlindSpot
                      ? "oklch(0.577 0.245 27.325)" // destructive
                      : p.x > 50 && p.y > 50
                        ? "oklch(0.627 0.194 149.214)" // healthy green
                        : "oklch(0.708 0 0)"; // muted grey
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={size}
                        fill={color}
                        fillOpacity={0.7}
                        stroke={color}
                        strokeWidth={1}
                      />
                    );
                  }}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 px-4">
            <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-destructive" /> Blind Spots
            </div>
            <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-green-500" /> Well Attended
            </div>
            <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-muted-foreground" /> Other
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold px-1 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Buyer Priority List
        </h3>
        <div className="grid grid-cols-1 gap-4">
          {data.map((buyer) => (
            <Card key={buyer.id} className={`transition-shadow hover:shadow-md ${buyer.isBlindSpot ? "border-l-4 border-l-destructive" : ""}`}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                      buyer.isBlindSpot ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
                    }`}>
                      {buyer.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-lg">{buyer.name}</div>
                      <div className="text-sm text-muted-foreground">{buyer.email} · {buyer.city}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8 flex-1 max-w-2xl">
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Potential</div>
                      <div className="text-lg font-bold">{buyer.potentialScore}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Attention</div>
                      <div className={`text-lg font-bold ${buyer.attentionScore < 30 ? "text-destructive" : ""}`}>{buyer.attentionScore}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Revenue</div>
                      <div className="text-lg font-bold">${buyer.totalRevenue.toLocaleString()}</div>
                    </div>
                    <div className="flex flex-col justify-center items-end">
                      {buyer.isBlindSpot && (
                        <Badge variant="destructive" className="animate-pulse">Blind Spot</Badge>
                      )}
                      {!buyer.isBlindSpot && (
                        <Badge variant="outline">{getQuadrant(buyer.potentialScore, buyer.attentionScore)}</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BlindSpots;
