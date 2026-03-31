import { useEffect, useState } from "react";
import type { BuyerChurnItem } from "../types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingDown, Users, AlertTriangle, CheckCircle2 } from "lucide-react";

export const OverallChurn = () => {
  const [data, setData] = useState<BuyerChurnItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3040/api/reps/1/churn")
      .then((res) => res.json())
      .then(setData)
      .catch(err => console.error("Error fetching churn data:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-44 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  const total = data.length;
  const high = data.filter((d) => d.status === "red").length;
  const medium = data.filter((d) => d.status === "yellow").length;
  const active = data.filter((d) => d.status === "green").length;

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="rounded-2xl border-primary/10 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-2">
              <Users className="w-3 h-3" /> Total Buyers
            </CardDescription>
            <CardTitle className="text-4xl font-black">{total}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-2xl border-destructive/20 bg-destructive/5 backdrop-blur-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-destructive/10 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-destructive/20 transition-colors" />
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-destructive/80 flex items-center gap-2">
              <AlertTriangle className="w-3 h-3" /> High Risk
            </CardDescription>
            <CardTitle className="text-4xl font-black text-destructive">{high}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-2xl border-yellow-500/20 bg-yellow-500/5 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-yellow-600 dark:text-yellow-500/80 flex items-center gap-2">
              <TrendingDown className="w-3 h-3" /> Medium Risk
            </CardDescription>
            <CardTitle className="text-4xl font-black text-yellow-600 dark:text-yellow-400">{medium}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-2xl border-green-500/20 bg-green-500/5 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-green-600 dark:text-green-500/80 flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3" /> Active
            </CardDescription>
            <CardTitle className="text-4xl font-black text-green-600 dark:text-green-400">{active}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-2xl font-bold tracking-tight">Risk Analysis</h2>
          <div className="text-xs text-muted-foreground font-medium">Sorted by critical priority</div>
        </div>
        
        {data.map((buyer) => (
          <Card key={buyer.id} className="group overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5 border-primary/5 bg-card/40 backdrop-blur-md">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                <div className={`w-1.5 shrink-0 ${
                  buyer.status === "red" ? "bg-destructive shadow-[0_0_15px_oklch(var(--destructive))]" : 
                  buyer.status === "yellow" ? "bg-yellow-500 shadow-[0_0_15px_oklch(0.7_0.15_90)]" : "bg-green-500"
                }`} />
                <div className="p-7 flex-1">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 shadow-inner transition-transform group-hover:scale-105 duration-300 ${
                        buyer.status === "red" ? "bg-destructive/10 text-destructive border border-destructive/20" : 
                        buyer.status === "yellow" ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20" : 
                        "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
                      }`}>
                        {buyer.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-xl tracking-tight leading-none mb-1.5">{buyer.name}</div>
                        <div className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                          <span>{buyer.email}</span>
                          <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                          <span>{buyer.city}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col md:items-end gap-2">
                      <Badge variant={
                        buyer.status === "red" ? "destructive" : 
                        buyer.status === "yellow" ? "secondary" : "outline"
                      } className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        buyer.status === "yellow" ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20" : 
                        buyer.status === "green" ? "text-green-600 border-green-500/20 bg-green-500/5" : "shadow-lg shadow-destructive/20"
                      }`}>
                        {buyer.status === "red" ? "Immediate Action" : buyer.status === "yellow" ? "Warning" : "Healthy"}
                      </Badge>
                      {buyer.daysSinceLastOrder > buyer.avgCycleDays && (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-destructive">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Overdue {buyer.daysSinceLastOrder - buyer.avgCycleDays} days</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {buyer.status !== "green" ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-8 pt-6 border-t border-primary/5">
                      <div className="space-y-1">
                        <div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-60">Avg Frequency</div>
                        <div className="text-base font-bold flex items-baseline gap-1">
                          {buyer.avgCycleDays} <span className="text-xs font-medium text-muted-foreground">days</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-60">Last Activity</div>
                        <div className="text-base font-bold text-destructive flex items-baseline gap-1">
                          {buyer.daysSinceLastOrder} <span className="text-xs font-medium opacity-70">days ago</span>
                        </div>
                      </div>
                      <div className="hidden md:block space-y-1">
                        <div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-60">Last Date</div>
                        <div className="text-base font-bold">
                          {buyer.lastOrderDate ? new Date(buyer.lastOrderDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A"}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-60">Health Score</div>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden max-w-[80px]">
                            <div className={`h-full transition-all duration-500 ${
                              buyer.status === "red" ? "w-[15%] bg-destructive" : "w-[45%] bg-yellow-500"
                            }`} />
                          </div>
                          <span className={`text-sm font-bold ${buyer.status === "red" ? "text-destructive" : "text-yellow-600 dark:text-yellow-400"}`}>
                            {buyer.status === "red" ? "Critical" : "Fair"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6 pt-5 border-t border-primary/5 text-sm text-muted-foreground flex items-center gap-2 font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      Performing above baseline. Next expected order in {Math.max(0, buyer.avgCycleDays - buyer.daysSinceLastOrder)} days.
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default OverallChurn;
