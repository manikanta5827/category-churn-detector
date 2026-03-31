import { useEffect, useState } from "react";
import type { BuyerChurnItem, Status } from "../types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertCircle, Send, StickyNote, ChevronRight, Info } from "lucide-react";
import { buildGmailLink } from "./CategoryChurn";

export const OverallChurn = () => {
  const [data, setData] = useState<BuyerChurnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBuyer, setSelectedBuyer] = useState<BuyerChurnItem | null>(null);
  const [aiDraft, setAiDraft] = useState<{subject: string, body: string} | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetch("http://localhost:3040/api/reps/1/churn")
      .then((res) => res.json())
      .then(setData)
      .catch(err => console.error("Error fetching churn data:", err))
      .finally(() => setLoading(false));
  }, []);

  const fetchAiMessage = async (buyer: BuyerChurnItem) => {
    setGenerating(true);
    setAiDraft(null);
    try {
      const response = await fetch(
        `http://localhost:3040/api/reps/1/churn/${buyer.id}/message`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            daysSince: buyer.daysSinceLastOrder,
            avgCycle: buyer.avgCycleDays,
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

  const handleBuyerClick = (buyer: BuyerChurnItem) => {
    if (buyer.status === "green") return;
    setSelectedBuyer(buyer);
    fetchAiMessage(buyer);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="px-1">
        <h2 className="text-xl font-bold tracking-tight">Overall Churn</h2>
        <p className="text-sm text-muted-foreground font-medium">
          <span className="text-red-500 font-bold">{data.filter(b => b.status === "red").length} buyers</span> are at high risk of churning
        </p>
      </div>

      <div className="border rounded-xl overflow-hidden divide-y divide-border/50 bg-card shadow-sm">
        {data.map((buyer) => (
          <div 
            key={buyer.id} 
            className={`flex items-center justify-between p-5 transition-all ${buyer.status !== "green" ? "hover:bg-muted/30 cursor-pointer active:scale-[0.99]" : "opacity-70"}`}
            onClick={() => handleBuyerClick(buyer)}
          >
            <div className="flex items-center gap-4">
              <StatusIndicator status={buyer.status} />
              <div>
                <span className="font-bold text-sm">{buyer.name}</span>
                <p className="text-[10px] text-muted-foreground mt-0.5 font-medium tracking-tight">
                  Last order: {buyer.daysSinceLastOrder} days ago · {buyer.city}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-5">
              <div className="text-right">
                <span className={`text-xs font-bold ${
                  buyer.status === "red" ? "text-red-500" : 
                  buyer.status === "yellow" ? "text-yellow-600" : "text-green-600"
                }`}>
                  {buyer.status === "red" ? "Priority" : 
                   buyer.status === "yellow" ? "Warning" : "Active"}
                </span>
                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-tight mt-0.5">
                  Avg {buyer.avgCycleDays}d
                </p>
              </div>
              {buyer.status !== "green" && <ChevronRight className="h-4 w-4 text-muted-foreground opacity-40" />}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!selectedBuyer} onOpenChange={(open) => !open && setSelectedBuyer(null)}>
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden rounded-xl">
          {selectedBuyer && (
            <div className="flex flex-col">
              <div className="p-6 border-b bg-muted/30">
                <div className="flex items-center gap-2 mb-4">
                  <StatusIndicator status={selectedBuyer.status} />
                  <h3 className="text-lg font-bold tracking-tight">Account Warning: {selectedBuyer.name}</h3>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-xs">
                  <div>
                    <p className="text-muted-foreground mb-1 uppercase tracking-tighter font-bold text-[9px]">Last ordered</p>
                    <p className="font-semibold">{selectedBuyer.daysSinceLastOrder} days ago</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1 uppercase tracking-tighter font-bold text-[9px]">Usual pattern</p>
                    <p className="font-semibold">Every {selectedBuyer.avgCycleDays} days</p>
                  </div>
                  <div className="col-span-2 bg-red-50 dark:bg-red-900/20 p-2.5 rounded-lg flex items-center gap-3 border border-red-100 dark:border-red-900/40">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-red-700 dark:text-red-400 font-bold text-xs">
                      Overdue by {Math.max(0, selectedBuyer.daysSinceLastOrder - selectedBuyer.avgCycleDays)} days
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3.5 rounded-lg flex gap-3 border border-blue-100 dark:border-blue-900/40">
                  <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-[12px] text-blue-800 dark:text-blue-300 leading-relaxed">
                    <strong>AI Insight:</strong> Buyer has significantly exceeded their normal reorder frequency. High probability of competitive switching.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Draft outreach</p>
                  {generating ? (
                    <div className="h-[140px] flex flex-col items-center justify-center border rounded-lg bg-muted/10">
                      <Loader2 className="h-5 w-5 animate-spin text-primary mb-2" />
                      <span className="text-[9px] uppercase font-bold tracking-widest opacity-50">Synthesizing...</span>
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
                    if (aiDraft && selectedBuyer) {
                      window.open(buildGmailLink(selectedBuyer.email, aiDraft.subject, aiDraft.body), "_blank");
                    }
                  }}
                  disabled={!aiDraft}
                >
                  <Send className="h-3 w-3" /> Send via Gmail
                </button>
                <button className="h-10 px-4 rounded-lg border border-input bg-background text-xs font-bold" onClick={() => setSelectedBuyer(null)}>
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
};

const StatusIndicator = ({ status }: { status: Status }) => {
  const colors = {
    red: "bg-red-500",
    yellow: "bg-yellow-500",
    green: "bg-green-500"
  };
  return <div className={`w-2 h-2 rounded-full ${colors[status]} shadow-sm`} />;
};

export default OverallChurn;