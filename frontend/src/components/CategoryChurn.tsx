import { useEffect, useState } from "react";
import type { BuyerCategoryChurnItem, Category, Status } from "../types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ChevronRight, ArrowLeft, Info, Send, StickyNote } from "lucide-react";

export function buildGmailLink(toEmail: string, subject: string, body: string) {
  const base = "https://mail.google.com/mail/u/0/?view=cm&fs=1";
  return `${base}&to=${encodeURIComponent(toEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export const CategoryChurn = () => {
  const [data, setData] = useState<BuyerCategoryChurnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBuyer, setSelectedBuyer] = useState<BuyerCategoryChurnItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<{buyer: BuyerCategoryChurnItem, category: Category} | null>(null);
  const [aiDraft, setAiDraft] = useState<{subject: string, body: string} | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetch("http://localhost:3040/api/reps/1/category-churn")
      .then((res) => res.json())
      .then(setData)
      .catch(err => console.error("Error fetching category churn data:", err))
      .finally(() => setLoading(false));
  }, []);

  const fetchAiMessage = async (buyer: BuyerCategoryChurnItem, category: Category) => {
    setGenerating(true);
    setAiDraft(null);
    try {
      const response = await fetch(
        `http://localhost:3040/api/reps/1/category-churn/${buyer.id}/${category.name}/message`,
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
      const result = await response.json();
      if (result.error) {
        alert(result.error);
      } else {
        setAiDraft(result);
      }
    } catch (err) {
      console.error("Error generating AI message:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleCategoryClick = (buyer: BuyerCategoryChurnItem, category: Category) => {
    setSelectedCategory({ buyer, category });
    if (category.status !== "green") {
      fetchAiMessage(buyer, category);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
      </div>
    );
  }

  // LEVEL 2: Buyer Detail View
  if (selectedBuyer) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex items-center gap-4 px-2">
          <Button variant="ghost" size="icon" onClick={() => setSelectedBuyer(null)} className="rounded-full h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-xl font-bold tracking-tight">{selectedBuyer.name}</h2>
            <p className="text-xs text-muted-foreground">Last order: {selectedBuyer.categories[0]?.daysSinceLastOrder} days ago · {selectedBuyer.city}</p>
          </div>
        </div>

        <Card className="border shadow-sm bg-card/50 overflow-hidden">
          <CardHeader className="pb-3 pt-4 px-6 border-b">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Category Health Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {selectedBuyer.categories.map((cat) => (
                <div 
                  key={cat.name} 
                  className="flex items-center justify-between p-5 hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => handleCategoryClick(selectedBuyer, cat)}
                >
                  <div className="flex items-center gap-4">
                    <StatusIndicator status={cat.status} />
                    <span className="font-semibold text-sm">{cat.name}</span>
                  </div>
                  <div className="text-xs text-right">
                    {cat.status === "green" ? (
                      <span className="text-green-600 font-medium">Healthy · {cat.daysSinceLastOrder}d</span>
                    ) : (
                      <span className={cat.status === "red" ? "text-red-500 font-bold" : "text-yellow-600 font-bold"}>
                        {cat.daysSinceLastOrder}d silent <span className="text-muted-foreground font-normal ml-1">(avg: {cat.avgCycleDays}d)</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* LEVEL 3: Category Detail Popup */}
        <Dialog open={!!selectedCategory} onOpenChange={(open) => !open && setSelectedCategory(null)}>
          <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden rounded-xl">
            {selectedCategory && (
              <div className="flex flex-col">
                <div className="p-6 border-b bg-muted/30">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <StatusIndicator status={selectedCategory.category.status} />
                      <h3 className="text-lg font-bold tracking-tight">{selectedCategory.buyer.name} — {selectedCategory.category.name}</h3>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-xs">
                    <div>
                      <p className="text-muted-foreground mb-1 uppercase tracking-tighter font-bold text-[9px]">Last ordered</p>
                      <p className="font-semibold">{selectedCategory.category.daysSinceLastOrder} days ago</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1 uppercase tracking-tighter font-bold text-[9px]">Usual pattern</p>
                      <p className="font-semibold">Every {selectedCategory.category.avgCycleDays} days</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1 uppercase tracking-tighter font-bold text-[9px]">Orders before</p>
                      <p className="font-semibold">{selectedCategory.category.totalOrders} total orders</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1 uppercase tracking-tighter font-bold text-[9px]">Missed cycles</p>
                      <p className="font-bold text-red-500">~{(selectedCategory.category.daysSinceLastOrder / selectedCategory.category.avgCycleDays).toFixed(1)} cycles missed</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3.5 rounded-lg flex gap-3 border border-blue-100 dark:border-blue-900/40">
                    <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-[12px] text-blue-800 dark:text-blue-300 leading-relaxed">
                      <strong>AI Diagnosis:</strong> Deviation from normal reorder pattern. Account requires immediate touchpoint to address potential competitive displacement.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Draft outreach</p>
                    {generating ? (
                      <div className="h-[140px] flex flex-col items-center justify-center border rounded-lg bg-muted/10">
                        <Loader2 className="h-5 w-5 animate-spin text-primary mb-2" />
                        <span className="text-[9px] uppercase font-bold tracking-widest opacity-50">Generating...</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <input 
                          className="w-full text-xs font-bold p-2.5 bg-muted/40 border-none rounded-lg focus-visible:ring-1 focus-visible:ring-primary/20 transition-all"
                          value={aiDraft?.subject || ""}
                          onChange={(e) => setAiDraft(prev => prev ? { ...prev, subject: e.target.value } : null)}
                          placeholder="Subject"
                        />
                        <Textarea 
                          className="min-h-[120px] text-xs leading-relaxed bg-muted/40 border-none rounded-lg p-3 resize-none focus-visible:ring-1 focus-visible:ring-primary/20 transition-all"
                          value={aiDraft?.body || ""}
                          onChange={(e) => setAiDraft(prev => prev ? { ...prev, body: e.target.value } : null)}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-5 bg-muted/30 border-t flex gap-3">
                  <button 
                    className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    onClick={() => {
                      if (aiDraft) {
                        window.open(buildGmailLink(selectedCategory.buyer.email, aiDraft.subject, aiDraft.body), "_blank");
                      }
                    }}
                    disabled={!aiDraft}
                  >
                    <Send className="h-3 w-3" /> Send via Gmail
                  </button>
                  <button className="h-10 px-4 rounded-lg border border-input bg-background text-xs font-bold" onClick={() => setSelectedCategory(null)}>
                    Dismiss
                  </button>
                  <button className="h-10 w-10 flex items-center justify-center rounded-lg border border-input bg-background">
                    <StickyNote className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // LEVEL 1: Buyer List
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="px-1">
        <h2 className="text-xl font-bold tracking-tight">Category Churn</h2>
        <p className="text-sm text-muted-foreground font-medium">
          <span className="text-red-500 font-bold">{data.filter(b => b.coldCount > 0).length} buyers</span> have cold categories this month
        </p>
      </div>
      
      <div className="border rounded-xl overflow-hidden divide-y divide-border/50 bg-card shadow-sm">
        {data.map((buyer) => (
          <div 
            key={buyer.id} 
            className="flex items-center justify-between p-5 hover:bg-muted/30 cursor-pointer transition-all active:scale-[0.99]"
            onClick={() => setSelectedBuyer(buyer)}
          >
            <div className="flex items-center gap-4">
              <StatusIndicator status={buyer.buyerStatus} />
              <div>
                <span className="font-bold text-sm">{buyer.name}</span>
                <p className="text-[10px] text-muted-foreground mt-0.5 font-medium uppercase tracking-tight">{buyer.city} · {buyer.categories.length} segments</p>
              </div>
            </div>
            <div className="flex items-center gap-5">
              <span className="text-xs font-semibold">
                {buyer.coldCount > 0 ? (
                  <span className="text-red-500 font-bold">{buyer.coldCount} cold</span>
                ) : buyer.warmCount > 0 ? (
                  <span className="text-yellow-600 font-bold">{buyer.warmCount} warm</span>
                ) : (
                  <span className="text-green-600 font-bold">Active</span>
                )}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-40" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const StatusIndicator = ({ status }: { status: Status }) => {
  const colors = {
    red: "bg-red-500",
    yellow: "bg-yellow-500",
    green: "bg-green-500"
  };
  return <div className={`w-2 h-2 rounded-full ${colors[status]} shadow-sm`} />;
};

export default CategoryChurn;