import { useEffect, useState } from "react";
import type { BuyerCategoryChurnItem } from "../types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MessageSquare, Sparkles, AlertCircle, History, Zap } from "lucide-react";

export const CategoryChurn = () => {
  const [data, setData] = useState<BuyerCategoryChurnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiMessages, setAiMessages] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("http://localhost:3040/api/reps/1/category-churn")
      .then((res) => res.json())
      .then(setData)
      .catch(err => console.error("Error fetching category churn data:", err))
      .finally(() => setLoading(false));
  }, []);

  const generateMessage = async (buyerId: number, categoryName: string) => {
    const key = `${buyerId}-${categoryName}`;
    if (aiMessages[key]) return;

    setGenerating(prev => ({ ...prev, [key]: true }));

    const category = data
      .find((b) => b.id === buyerId)
      ?.categories.find((c) => c.name === categoryName);
    if (!category) {
      setGenerating(prev => ({ ...prev, [key]: false }));
      return;
    }

    try {
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
      const result: { message: string; error?: string } = await response.json();
      if (result.error) {
        alert(result.error);
      } else {
        setAiMessages((prev) => ({ ...prev, [key]: result.message }));
      }
    } catch (err) {
      console.error("Error generating AI message:", err);
    } finally {
      setGenerating(prev => ({ ...prev, [key]: false }));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
        </div>
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-72 w-full rounded-2xl" />)}
      </div>
    );
  }

  const total = data.length;
  const high = data.filter((d) => d.buyerStatus === "red").length;
  const medium = data.filter((d) => d.buyerStatus === "yellow").length;
  const active = data.filter((d) => d.buyerStatus === "green").length;

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="rounded-2xl border-primary/10 bg-card/50 backdrop-blur-sm shadow-xl shadow-black/5 dark:shadow-primary/5 transition-transform hover:scale-[1.02] duration-300">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-2">
              <AlertCircle className="w-3 h-3" /> Buyers with Gaps
            </CardDescription>
            <CardTitle className="text-4xl font-black">{total}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-2xl border-destructive/20 bg-destructive/5 backdrop-blur-sm shadow-xl shadow-destructive/5 transition-transform hover:scale-[1.02] duration-300">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-destructive/80 flex items-center gap-2">
              <Zap className="w-3 h-3" /> High Risk
            </CardDescription>
            <CardTitle className="text-4xl font-black text-destructive">{high}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-2xl border-yellow-500/20 bg-yellow-500/5 backdrop-blur-sm shadow-xl shadow-yellow-500/5 transition-transform hover:scale-[1.02] duration-300">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-yellow-600 dark:text-yellow-500/80">Medium Risk</CardDescription>
            <CardTitle className="text-4xl font-black text-yellow-600 dark:text-yellow-400">{medium}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-2xl border-green-500/20 bg-green-500/5 backdrop-blur-sm shadow-xl shadow-green-500/5 transition-transform hover:scale-[1.02] duration-300">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-green-600 dark:text-green-500/80">Healthy</CardDescription>
            <CardTitle className="text-4xl font-black text-green-600 dark:text-green-400">{active}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight px-1">Deep-Dive Analysis</h2>
        {data.map((buyer) => (
          <Card key={buyer.id} className="overflow-hidden rounded-2xl border-primary/5 bg-card/40 backdrop-blur-md transition-all hover:shadow-2xl hover:shadow-primary/10 shadow-lg shadow-black/5 dark:shadow-primary/5">
            <CardHeader className="bg-muted/30 border-b border-primary/5 pb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 ${
                    buyer.buyerStatus === "red" ? "bg-destructive/10 text-destructive border border-destructive/20" : 
                    buyer.buyerStatus === "yellow" ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20" : 
                    "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
                  }`}>
                    {buyer.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold tracking-tight">{buyer.name}</CardTitle>
                    <CardDescription className="font-medium">{buyer.email} · {buyer.city}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden md:block">
                    <div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1 opacity-70">Gap Summary</div>
                    <div className="text-sm font-bold flex gap-3">
                      <span className="text-destructive">{buyer.coldCount} COLD</span>
                      <span className="text-yellow-600 dark:text-yellow-400">{buyer.warmCount} WARM</span>
                    </div>
                  </div>
                  <Badge variant={buyer.buyerStatus === "red" ? "destructive" : buyer.buyerStatus === "yellow" ? "secondary" : "outline"}
                    className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      buyer.buyerStatus === "yellow" ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20" : ""
                    }`}>
                    {buyer.buyerStatus === "red" ? "Priority" : buyer.buyerStatus === "yellow" ? "Monitor" : "Healthy"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-primary/5">
                {buyer.categories.map((category) => (
                  <div key={category.name} className="p-6 md:p-8 hover:bg-primary/[0.02] transition-colors relative group">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <h4 className="font-bold text-xl tracking-tight">{category.name}</h4>
                          <Badge variant="outline" className={`text-[10px] font-black uppercase tracking-widest px-2 ${
                            category.status === "red" ? "text-destructive border-destructive/30 bg-destructive/5" : 
                            category.status === "yellow" ? "text-yellow-600 border-yellow-500/30 bg-yellow-500/5" : "text-green-600 border-green-500/30 bg-green-500/5"
                          }`}>
                            {category.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 text-sm">
                          <div className="space-y-1">
                            <div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-60 flex items-center gap-1.5">
                              <History className="w-3 h-3" /> Last Order
                            </div>
                            <div className="font-bold">{new Date(category.lastOrderDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-60">Gap Duration</div>
                            <div className={`font-bold ${category.status === "red" ? "text-destructive" : ""}`}>{category.daysSinceLastOrder} days</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-60">Avg Cycle</div>
                            <div className="font-bold">{category.avgCycleDays} days</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-60">Lifetime Count</div>
                            <div className="font-bold">{category.totalOrders} orders</div>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              className="h-11 rounded-xl gap-2.5 font-bold border-primary/10 hover:bg-primary/5 transition-all active:scale-95 group-hover:border-primary/30 shadow-sm"
                              onClick={() => generateMessage(buyer.id, category.name)}
                            >
                              <Sparkles className="w-4 h-4 text-purple-500 animate-pulse" />
                              AI Outreach
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[550px] rounded-3xl border-primary/10 bg-card/95 backdrop-blur-xl shadow-2xl">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-3 text-2xl font-black tracking-tight">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                  <Sparkles className="w-5 h-5 text-purple-500" />
                                </div>
                                Smart outreach
                              </DialogTitle>
                              <DialogDescription className="text-base font-medium">
                                Drafting personalized communication for {buyer.name}'s {category.name} gap.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-6">
                              {generating[`${buyer.id}-${category.name}`] ? (
                                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                                  <div className="relative">
                                    <Loader2 className="w-12 h-12 animate-spin text-primary opacity-20" />
                                    <Sparkles className="w-6 h-6 text-purple-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce" />
                                  </div>
                                  <p className="mt-6 text-sm font-black uppercase tracking-widest opacity-50">Synthesizing message...</p>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  <div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-60 ml-1">Generated Draft</div>
                                  <Textarea 
                                    className="min-h-[220px] rounded-2xl bg-muted/30 border-none p-5 text-base leading-relaxed focus-visible:ring-1 focus-visible:ring-primary/20 shadow-inner"
                                    value={aiMessages[`${buyer.id}-${category.name}`] || "Intelligence engine failed to generate response."}
                                    readOnly
                                  />
                                </div>
                              )}
                            </div>
                            <div className="flex justify-end gap-3">
                              <Button variant="ghost" className="rounded-xl font-bold" onClick={() => {
                                navigator.clipboard.writeText(aiMessages[`${buyer.id}-${category.name}`] || "");
                              }}>Copy Draft</Button>
                              <Button className="rounded-xl font-black px-8 shadow-lg shadow-primary/20">Send Email</Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CategoryChurn;