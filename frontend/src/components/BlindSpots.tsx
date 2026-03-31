import { useEffect, useState } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { BlindSpotItem } from "../types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Target, ChevronRight, ArrowLeft, TrendingUp, Clock, DollarSign } from "lucide-react";

const BlindSpots = () => {
  const [data, setData] = useState<BlindSpotItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBuyer, setSelectedBuyer] = useState<BlindSpotItem | null>(null);

  useEffect(() => {
    fetch("http://localhost:3040/api/reps/1/blind-spots")
      .then((res) => res.json())
      .then(setData)
      .catch(err => console.error("Error fetching blind spots:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
      </div>
    );
  }

  const chartData = data.map((item) => ({
    x: item.potentialScore,
    y: item.attentionScore,
    z: item.totalRevenue,
    name: item.name,
  }));

  const blindSpots = data.filter((d) => d.potentialScore >= 50 && d.attentionScore < 50);

  // LEVEL 2: Detail View
  if (selectedBuyer) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex items-center gap-4 px-2">
          <Button variant="ghost" size="icon" onClick={() => setSelectedBuyer(null)} className="rounded-full h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-xl font-bold tracking-tight">{selectedBuyer.name}</h2>
            <p className="text-xs text-muted-foreground">{selectedBuyer.city} · Potential Score: {selectedBuyer.potentialScore}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-card/50 border shadow-sm rounded-xl">
            <CardContent className="p-4 pt-6">
              <div className="flex flex-col items-center">
                <TrendingUp className="h-4 w-4 text-blue-500 mb-2" />
                <span className="text-xl font-bold tracking-tight">{selectedBuyer.potentialScore}</span>
                <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest mt-0.5">Potential</span>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border shadow-sm rounded-xl">
            <CardContent className="p-4 pt-6">
              <div className="flex flex-col items-center">
                <Clock className="h-4 w-4 text-orange-500 mb-2" />
                <span className="text-xl font-bold tracking-tight">{selectedBuyer.attentionScore}</span>
                <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest mt-0.5">Attention</span>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border shadow-sm rounded-xl">
            <CardContent className="p-4 pt-6">
              <div className="flex flex-col items-center">
                <DollarSign className="h-4 w-4 text-green-500 mb-2" />
                <span className="text-xl font-bold tracking-tight">${(selectedBuyer.totalRevenue / 1000).toFixed(1)}k</span>
                <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest mt-0.5">Value</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-base font-bold tracking-tight">Account Assessment</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-4 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <p className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground">Recent History</p>
                <p className="text-xs font-semibold">Contacted {selectedBuyer.daysSinceContact}d ago</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{selectedBuyer.lastContactNote || "No specific relationship notes."}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground">Order Volume</p>
                <p className="text-xs font-semibold">{selectedBuyer.orderCount} Orders Total</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">Active since {selectedBuyer.lastOrderDate ? new Date(selectedBuyer.lastOrderDate).getFullYear() : "N/A"}</p>
              </div>
            </div>
            <Button className="w-full h-10 rounded-lg font-bold text-xs">Prioritize Account</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // LEVEL 1: List View
  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="space-y-6">
        <div className="px-1">
          <h2 className="text-xl font-bold tracking-tight">Blind Spots</h2>
          <p className="text-sm text-muted-foreground font-medium">
            <span className="text-red-500 font-bold">{blindSpots.length} high-potential accounts</span> are underserved
          </p>
        </div>
        
        <div className="border rounded-xl overflow-hidden divide-y divide-border/50 bg-card shadow-sm">
          {data.sort((a, b) => b.potentialScore - a.potentialScore).map((buyer) => {
            const isBlindSpot = buyer.potentialScore >= 50 && buyer.attentionScore < 50;
            return (
              <div 
                key={buyer.id} 
                className="flex items-center justify-between p-5 hover:bg-muted/30 cursor-pointer transition-all active:scale-[0.99]"
                onClick={() => setSelectedBuyer(buyer)}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${isBlindSpot ? "bg-red-500 shadow-sm" : "bg-muted"}`} />
                  <div>
                    <span className="font-bold text-sm">{buyer.name}</span>
                    <p className="text-[10px] text-muted-foreground mt-0.5 font-medium tracking-tight">P: {buyer.potentialScore} · A: {buyer.attentionScore}</p>
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  {isBlindSpot && (
                    <Badge variant="destructive" className="text-[9px] h-5 px-2 uppercase font-bold tracking-widest">Blind Spot</Badge>
                  )}
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-40" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Card className="border shadow-sm rounded-xl overflow-hidden bg-muted/10">
        <CardHeader className="bg-muted/30 border-b p-5">
          <CardTitle className="text-xs font-bold flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
            <Target className="h-3.5 w-3.5" /> Portfolio Growth Matrix
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-[280px] w-full relative">
            <div className="absolute top-0 right-0 text-[8px] font-bold text-muted-foreground/50 p-2 uppercase tracking-widest">Growth Zone</div>
            <div className="absolute bottom-0 right-0 text-[8px] font-bold text-red-500/50 p-2 uppercase tracking-widest">Blind Spot</div>
            <div className="absolute top-0 left-0 text-[8px] font-bold text-muted-foreground/50 p-2 uppercase tracking-widest">Maintenance</div>
            <div className="absolute bottom-0 left-0 text-[8px] font-bold text-muted-foreground/50 p-2 uppercase tracking-widest">Low Priority</div>
            
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                <XAxis type="number" dataKey="x" domain={[0, 100]} hide />
                <YAxis type="number" dataKey="y" domain={[0, 100]} hide />
                <ZAxis type="number" dataKey="z" range={[50, 400]} />
                <ReferenceLine x={50} stroke="#e2e8f0" strokeWidth={1} />
                <ReferenceLine y={50} stroke="#e2e8f0" strokeWidth={1} />
                <Tooltip 
                  cursor={{ strokeDasharray: '4 4', strokeOpacity: 0.5 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const p = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-zinc-900 border shadow-xl p-3 rounded-lg text-[10px]">
                          <p className="font-bold mb-1 border-b pb-1">{p.name}</p>
                          <p>Potential: {p.x}</p>
                          <p>Attention: {p.y}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter 
                  data={chartData} 
                  shape={(props: any) => {
                    const { cx, cy, payload } = props;
                    const isBlindSpot = payload.x >= 50 && payload.y < 50;
                    return (
                      <circle 
                        cx={cx} 
                        cy={cy} 
                        r={Math.sqrt(payload.z / 100) * 4} 
                        fill={isBlindSpot ? "#ef4444" : "#94a3b8"} 
                        fillOpacity={0.6}
                        stroke={isBlindSpot ? "#ef4444" : "#64748b"}
                        strokeWidth={1}
                      />
                    );
                  }}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-muted-foreground mt-6 pt-4 border-t border-border/50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500/50 border border-red-500" /> High Potential Blind Spots
            </div>
            <div className="flex items-center gap-2">
               Portfolio Matrix <div className="w-2 h-2 rounded-full bg-slate-400/50 border border-slate-500" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BlindSpots;