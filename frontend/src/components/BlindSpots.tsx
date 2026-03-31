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
import { AlertCircle, Target, TrendingUp, Users, DollarSign, Activity } from "lucide-react";

interface ChartDataPoint {
  x: number;
  y: number;
  name: string;
  revenue: number;
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
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
        <Skeleton className="h-[450px] w-full rounded-2xl" />
        {[1, 2].map(i => <Skeleton key={i} className="h-36 w-full rounded-2xl" />)}
      </div>
    );
  }

  const chartData: ChartDataPoint[] = data.map((item) => ({
    x: item.potentialScore,
    y: item.attentionScore,
    name: item.name,
    revenue: item.totalRevenue,
  }));

  const getQuadrant = (x: number, y: number) => {
    if (x >= 50 && y < 50) return "Blind Spot";
    if (x >= 50 && y >= 50) return "Strategic";
    if (x < 50 && y < 50) return "Low Priority";
    return "Maintenance";
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
      const quadrant = getQuadrant(p.x, p.y);
      const isBlindSpot = quadrant === "Blind Spot";

      return (
        <Card className="shadow-2xl border-primary/10 bg-card/90 backdrop-blur-xl p-4 min-w-[220px] rounded-2xl">
          <div className="font-black text-sm mb-3 border-b border-primary/5 pb-2 uppercase tracking-tight">{p.name}</div>
          <div className="space-y-2.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-muted-foreground uppercase tracking-widest text-[10px] font-black opacity-60">Potential</span>
              <span className="font-bold text-sm">{p.x}</span>
            </div>
            <div className="flex justify-between text-xs font-medium">
              <span className="text-muted-foreground uppercase tracking-widest text-[10px] font-black opacity-60">Attention</span>
              <span className="font-bold text-sm">{p.y}</span>
            </div>
            <div className="flex justify-between text-xs font-medium">
              <span className="text-muted-foreground uppercase tracking-widest text-[10px] font-black opacity-60">Revenue</span>
              <span className="font-bold text-sm">${p.revenue.toLocaleString()}</span>
            </div>
            <div className="mt-4 pt-2 border-t border-primary/5">
              <Badge variant={isBlindSpot ? "destructive" : "outline"} className="w-full justify-center text-[10px] font-black uppercase tracking-widest h-6 rounded-lg">
                {quadrant}
              </Badge>
            </div>
          </div>
        </Card>
      );
    }
    return null;
  };

  const blindSpotsCount = data.filter((d) => d.potentialScore >= 50 && d.attentionScore < 50).length;

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className={`rounded-2xl border-primary/5 backdrop-blur-sm relative overflow-hidden transition-all duration-500 shadow-xl shadow-black/5 dark:shadow-primary/5 hover:scale-[1.02] ${blindSpotsCount > 0 ? "border-destructive/30 bg-destructive/[0.03] shadow-destructive/5" : "bg-card/50"}`}>
          {blindSpotsCount > 0 && (
            <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/10 rounded-full -mr-16 -mt-16 blur-3xl animate-pulse" />
          )}
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardDescription className="text-[10px] uppercase font-black tracking-widest text-muted-foreground flex items-center gap-2">
              <AlertCircle className={`w-3.5 h-3.5 ${blindSpotsCount > 0 ? "text-destructive" : ""}`} /> Critical Blind Spots
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-4xl font-black ${blindSpotsCount > 0 ? "text-destructive" : ""}`}>{blindSpotsCount}</div>
            <p className="text-xs font-medium text-muted-foreground mt-1.5 opacity-70">High-potential accounts needing immediate focus</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-primary/5 bg-card/50 backdrop-blur-sm shadow-xl shadow-black/5 dark:shadow-primary/5 hover:scale-[1.02] transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardDescription className="text-[10px] uppercase font-black tracking-widest text-muted-foreground flex items-center gap-2">
              <Users className="w-3.5 h-3.5" /> Total Active Portfolio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black">{data.length}</div>
            <p className="text-xs font-medium text-muted-foreground mt-1.5 opacity-70">Buyers analyzed across the matrix</p>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden rounded-3xl border-primary/5 bg-card/40 backdrop-blur-md shadow-2xl shadow-black/10 dark:shadow-primary/5">
        <CardHeader className="border-b border-primary/5 pb-8 pt-8 px-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shadow-inner">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                Growth Matrix
              </CardTitle>
              <CardDescription className="font-medium text-sm">
                Relationship depth vs. business potential. Circle size indicates annual revenue.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 pt-12">
          <div className="h-[450px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" vertical={false} />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="Potential"
                  domain={[0, 100]}
                  axisLine={false}
                  tickLine={false}
                  label={{ value: "BUSINESS POTENTIAL SCORE", position: "insideBottom", offset: -30, className: "fill-muted-foreground text-[9px] font-black tracking-[0.2em]" }}
                  tick={{ fontSize: 10, fontWeight: 700, fill: "oklch(var(--muted-foreground))" }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="Attention"
                  domain={[0, 100]}
                  axisLine={false}
                  tickLine={false}
                  label={{ value: "ATTENTION SCORE", angle: -90, position: "insideLeft", className: "fill-muted-foreground text-[9px] font-black tracking-[0.2em]" }}
                  tick={{ fontSize: 10, fontWeight: 700, fill: "oklch(var(--muted-foreground))" }}
                />
                <ReferenceLine x={50} className="stroke-muted/30" strokeDasharray="6 6" />
                <ReferenceLine y={50} className="stroke-muted/30" strokeDasharray="6 6" />
                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: "3 3", strokeOpacity: 0.2 }} />
                <Scatter
                  data={chartData}
                  fill="var(--primary)"
                  shape={(props: any) => {
                    const { cx, cy, payload } = props;
                    const p = payload as ChartDataPoint;
                    const size = Math.max(8, Math.min(30, p.revenue / 400));
                    const quadrant = getQuadrant(p.x, p.y);
                    
                    const color = quadrant === "Blind Spot"
                      ? "oklch(0.6 0.2 25)" // primary destructive
                      : quadrant === "Strategic"
                        ? "oklch(0.65 0.15 150)" // healthy green
                        : "oklch(0.5 0 0)"; // neutral
                    
                    return (
                      <g className="filter drop-shadow-sm transition-all duration-300 hover:brightness-110 cursor-pointer">
                        <circle
                          cx={cx}
                          cy={cy}
                          r={size}
                          fill={color}
                          fillOpacity={0.6}
                          stroke={color}
                          strokeWidth={2}
                          strokeOpacity={0.4}
                        />
                        <circle
                          cx={cx}
                          cy={cy}
                          r={size * 0.4}
                          fill={color}
                          fillOpacity={0.8}
                        />
                      </g>
                    );
                  }}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-10 mt-6 pt-6 border-t border-primary/5">
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              <div className="w-3 h-3 rounded-full bg-destructive/60 border border-destructive/30 shadow-sm shadow-destructive/20" /> Blind Spots
            </div>
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              <div className="w-3 h-3 rounded-full bg-green-500/60 border border-green-500/30 shadow-sm shadow-green-500/20" /> Strategic Accounts
            </div>
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              <div className="w-3 h-3 rounded-full bg-muted-foreground/40 border border-muted-foreground/20 shadow-sm shadow-black/5" /> Maintenance
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <h3 className="text-2xl font-bold tracking-tight px-1 flex items-center gap-3">
          <Activity className="w-6 h-6 text-primary" />
          Strategic Priority List
        </h3>
        <div className="grid grid-cols-1 gap-4">
          {data.map((buyer) => {
            const quadrant = getQuadrant(buyer.potentialScore, buyer.attentionScore);
            const isBlindSpot = quadrant === "Blind Spot";
            
            return (
              <Card key={buyer.id} className={`group overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 border-primary/5 bg-card/40 backdrop-blur-md shadow-lg shadow-black/5 dark:shadow-primary/5 ${isBlindSpot ? "border-l-4 border-l-destructive shadow-lg shadow-destructive/5" : ""}`}>
                <CardContent className="p-7">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 transition-transform group-hover:scale-105 shadow-inner ${
                        isBlindSpot ? "bg-destructive/10 text-destructive border border-destructive/20" : "bg-muted text-muted-foreground"
                      }`}>
                        {buyer.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-xl tracking-tight leading-none mb-1.5">{buyer.name}</div>
                        <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <span>{buyer.email}</span>
                          <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                          <span>{buyer.city}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 flex-1 max-w-3xl">
                      <div className="space-y-1">
                        <div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-60 flex items-center gap-1.5">
                          <TrendingUp className="w-3 h-3" /> Potential
                        </div>
                        <div className="text-xl font-black">{buyer.potentialScore}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-60 flex items-center gap-1.5">
                          <Activity className="w-3 h-3" /> Attention
                        </div>
                        <div className={`text-xl font-black ${buyer.attentionScore < 30 ? "text-destructive" : ""}`}>{buyer.attentionScore}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-60 flex items-center gap-1.5">
                          <DollarSign className="w-3 h-3" /> Revenue
                        </div>
                        <div className="text-xl font-black">${buyer.totalRevenue.toLocaleString()}</div>
                      </div>
                      <div className="flex flex-col justify-center items-end">
                        {isBlindSpot ? (
                          <Badge variant="destructive" className="animate-pulse px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-destructive/20">Critical Blind Spot</Badge>
                        ) : (
                          <Badge variant="outline" className="px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-primary/10 shadow-sm">{quadrant}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BlindSpots;