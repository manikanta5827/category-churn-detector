import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { BuyerCategoryChurnItem, Category, Status } from "../types";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { RelationshipSheet } from "./RelationshipSheet";
import {
  Loader2,
  ChevronRight,
  ArrowLeft,
  Send,
  StickyNote,
  Sparkles,
  X,
  Layers,
  AlertTriangle,
  TrendingDown,
  History,
} from "lucide-react";

// ─── Gmail helper ─────────────────────────────────────────────────────────────

export function buildGmailLink(to: string, subject: string, body: string) {
  return `https://mail.google.com/mail/u/0/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type AiDraft = { subject: string; body: string };
type CategorySelection = { buyer: BuyerCategoryChurnItem; category: Category };

// ─── Status helpers ───────────────────────────────────────────────────────────

const CELL_STYLES: Record<
  Status,
  { bg: string; text: string; border: string; dot: string }
> = {
  red: {
    bg: "bg-rose-100 dark:bg-rose-900/30",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-300 dark:border-rose-700/50",
    dot: "bg-rose-500",
  },
  yellow: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-300 dark:border-amber-700/50",
    dot: "bg-amber-400",
  },
  green: {
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800/40",
    dot: "bg-emerald-500",
  },
};

const BUYER_STATUS_BAR: Record<Status, string> = {
  red: "bg-rose-500",
  yellow: "bg-amber-400",
  green: "bg-emerald-500",
};

const missedCycles = (cat: Category) =>
  (cat.daysSinceLastOrder / cat.avgCycleDays).toFixed(1);

// ─── Main component ───────────────────────────────────────────────────────────

export const CategoryChurn = () => {
  const { repId } = useParams();
  const [data, setData] = useState<BuyerCategoryChurnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBuyer, setSelectedBuyer] =
    useState<BuyerCategoryChurnItem | null>(null);
  const [selectedCat, setSelectedCat] = useState<CategorySelection | null>(
    null,
  );
  const [aiDraft, setAiDraft] = useState<AiDraft | null>(null);
  const [generating, setGenerating] = useState(false);
  const [isRelationshipOpen, setIsRelationshipOpen] = useState(false);

  const fetchData = () => {
    fetch(`http://localhost:3040/api/reps/${repId}/category-churn`)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (repId) fetchData();
  }, [repId]);

  const fetchAiMessage = async (
    buyer: BuyerCategoryChurnItem,
    cat: Category,
  ) => {
    setGenerating(true);
    setAiDraft(null);
    try {
      const res = await fetch(
        `http://localhost:3040/api/reps/${repId}/category-churn/${buyer.id}/${cat.name}/message`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            daysSince: cat.daysSinceLastOrder,
            avgCycle: cat.avgCycleDays,
            totalOrders: cat.totalOrders,
          }),
        },
      );
      const result = await res.json();
      if (!result.error) setAiDraft(result);
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleCategoryClick = (
    buyer: BuyerCategoryChurnItem,
    cat: Category,
  ) => {
    if (cat.status === "green") return;
    setSelectedCat({ buyer, category: cat });
    setAiDraft(null);
    fetchAiMessage(buyer, cat);
  };

  const coldTotal = data.reduce((s, b) => s + b.coldCount, 0);

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-20 rounded-2xl bg-muted/60 animate-pulse" />
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-[88px] w-full rounded-xl" />
        ))}
      </div>
    );
  }

  // ── Level 2: Buyer Detail ─────────────────────────────────────────────────

  if (selectedBuyer) {
    return (
      <div className="space-y-5 animate-in fade-in slide-in-from-right-2 duration-300">
        {/* Back header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedBuyer(null)}
              className="flex items-center justify-center h-8 w-8 rounded-xl border bg-background hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h2 className="font-bold text-base leading-tight">
                {selectedBuyer.name}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                {selectedBuyer.city} · {selectedBuyer.coldCount} cold{" "}
                {selectedBuyer.warmCount > 0 &&
                  `· ${selectedBuyer.warmCount} drifting`}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsRelationshipOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest bg-background hover:bg-muted transition-all active:scale-95"
          >
            <History className="h-3.5 w-3.5" />
            Relationship History
          </button>
        </div>

        {/* Category heatmap rows */}
        <div className="rounded-2xl border overflow-hidden shadow-sm bg-card">
          <div className="px-5 py-3 border-b bg-muted/30">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Category Health — {selectedBuyer.categories.length} segments
            </p>
          </div>

          <div className="divide-y divide-border/40">
            {selectedBuyer.categories
              .sort((a, b) => {
                const order = { red: 0, yellow: 1, green: 2 };
                return order[a.status] - order[b.status];
              })
              .map((cat, i) => {
                const s = CELL_STYLES[cat.status];
                const clickable = cat.status !== "green";
                const pct = Math.min(
                  100,
                  Math.round(
                    (cat.daysSinceLastOrder / (cat.avgCycleDays * 2)) * 100,
                  ),
                );

                return (
                  <div
                    key={cat.name}
                    style={{ animationDelay: `${i * 50}ms` }}
                    className={[
                      "animate-in fade-in slide-in-from-left-1 duration-300",
                      "flex items-center gap-4 px-5 py-4 transition-all",
                      clickable
                        ? "hover:bg-muted/30 cursor-pointer active:scale-[0.995]"
                        : "opacity-70",
                    ].join(" ")}
                    onClick={() => handleCategoryClick(selectedBuyer, cat)}
                  >
                    {/* Status cell badge */}
                    <div
                      className={`shrink-0 w-20 text-center py-1.5 px-2 rounded-lg border text-[10px] font-bold ${s.bg} ${s.text} ${s.border}`}
                    >
                      {cat.name}
                    </div>

                    {/* Progress + info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-semibold">
                          {cat.daysSinceLastOrder}d silent
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          avg {cat.avgCycleDays}d · {cat.totalOrders} orders
                        </span>
                      </div>
                      {/* Decay bar */}
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            cat.status === "red"
                              ? "bg-rose-500"
                              : cat.status === "yellow"
                                ? "bg-amber-400"
                                : "bg-emerald-500"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Right info */}
                    {clickable ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] font-bold ${s.text}`}>
                          {missedCycles(cat)}× missed
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
                      </div>
                    ) : (
                      <span className="text-[10px] text-emerald-600 font-semibold shrink-0">
                        ✓ Active
                      </span>
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        {/* Level 3: Category popup */}
        <Dialog
          open={!!selectedCat}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedCat(null);
              setAiDraft(null);
            }
          }}
        >
          <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden rounded-2xl border-0 shadow-2xl gap-0">
            {selectedCat && (
              <CategoryDetailPanel
                buyer={selectedCat.buyer}
                category={selectedCat.category}
                aiDraft={aiDraft}
                generating={generating}
                onDraftChange={setAiDraft}
                onClose={() => {
                  setSelectedCat(null);
                  setAiDraft(null);
                }}
                onRelationshipOpen={() => setIsRelationshipOpen(true)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Relationship sheet */}
        <RelationshipSheet
          isOpen={isRelationshipOpen}
          onOpenChange={setIsRelationshipOpen}
          buyer={{
            id: selectedBuyer.id,
            name: selectedBuyer.name,
            city: selectedBuyer.city,
            email: selectedBuyer.email,
          }}
          onLogSuccess={() => fetchData()}
        />
      </div>
    );
  }

  // ── Level 1: Buyer List ───────────────────────────────────────────────────

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Summary banner */}
      <div className="rounded-2xl border bg-gradient-to-br from-card to-muted/20 p-5 shadow-sm">
        <h2 className="text-base font-semibold tracking-tight mb-1">
          Abandoned Category
        </h2>
        <p className="text-[12px] text-muted-foreground mb-3">
          Buyers who are still active — but silently abandoning product
          categories
        </p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 text-xs font-bold">
            <TrendingDown className="h-3.5 w-3.5" />
            <span className="text-base font-black">
              {data.filter((b) => b.coldCount > 0).length}
            </span>
            <span className="font-medium opacity-80">buyers affected</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 text-xs font-bold">
            <Layers className="h-3.5 w-3.5" />
            <span className="text-base font-black">{coldTotal}</span>
            <span className="font-medium opacity-80">cold categories</span>
          </div>
        </div>
      </div>

      {/* Buyer list */}
      <div className="rounded-2xl border overflow-hidden shadow-sm divide-y divide-border/40 bg-card">
        {data.map((buyer, i) => {
          const bar = BUYER_STATUS_BAR[buyer.buyerStatus];

          return (
            <div
              key={buyer.id}
              style={{ animationDelay: `${i * 50}ms` }}
              className="animate-in fade-in slide-in-from-left-1 duration-300 relative flex items-center gap-4 px-5 py-4 hover:bg-muted/30 cursor-pointer transition-all active:scale-[0.995]"
              onClick={() => setSelectedBuyer(buyer)}
            >
              {/* Left status bar */}
              <div
                className={`absolute left-0 top-0 bottom-0 w-[3px] ${bar} opacity-70 rounded-r-full`}
              />

              {/* Mini category pill strip */}
              <div className="flex flex-col gap-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">{buyer.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {buyer.city}
                  </span>
                </div>

                {/* Category pills — the visual differentiator */}
                <div className="flex flex-wrap gap-1.5">
                  {buyer.categories.map((cat) => {
                    const s = CELL_STYLES[cat.status];
                    return (
                      <span
                        key={cat.name}
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${s.bg} ${s.text} ${s.border}`}
                      >
                        {cat.name}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Right count */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  {buyer.coldCount > 0 && (
                    <p className="text-xs font-black text-rose-500">
                      {buyer.coldCount} cold
                    </p>
                  )}
                  {buyer.warmCount > 0 && (
                    <p className="text-[10px] font-bold text-amber-600">
                      {buyer.warmCount} drifting
                    </p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Category detail panel ────────────────────────────────────────────────────

const CategoryDetailPanel = ({
  buyer,
  category,
  aiDraft,
  generating,
  onDraftChange,
  onClose,
  onRelationshipOpen,
}: {
  buyer: BuyerCategoryChurnItem;
  category: Category;
  aiDraft: AiDraft | null;
  generating: boolean;
  onDraftChange: (d: AiDraft) => void;
  onClose: () => void;
  onRelationshipOpen: () => void;
}) => {
  const s = CELL_STYLES[category.status];
  const missed = parseFloat(missedCycles(category));
  const riskPct = Math.min(
    100,
    Math.round(
      (category.daysSinceLastOrder / (category.avgCycleDays * 2)) * 100,
    ),
  );

  return (
    <div className="flex flex-col max-h-[90vh]">
      {/* Header */}
      <div className="p-6 pb-5 border-b bg-gradient-to-br from-muted/60 to-background">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className={`w-2.5 h-2.5 rounded-full ${s.dot} shadow-sm`} />
          <div>
            <h3 className="font-bold text-base leading-tight">{buyer.name}</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {buyer.city} · Category:{" "}
              <span className={`font-bold ${s.text}`}>{category.name}</span>
            </p>
          </div>
        </div>

        {/* Stat grid */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          {[
            {
              label: "Silent for",
              value: `${category.daysSinceLastOrder}d`,
              accent: true,
            },
            { label: "Avg cycle", value: `${category.avgCycleDays}d` },
            { label: "Past orders", value: `${category.totalOrders}` },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl bg-background/80 border p-3 text-center"
            >
              <p
                className={`text-sm font-black leading-none ${s.accent ? "text-rose-500" : ""}`}
              >
                {s.value}
              </p>
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground mt-1.5 font-semibold">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Decay bar */}
        <div>
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1.5 font-medium">
            <span>Category decay</span>
            <span className="font-bold text-rose-500">
              {missed}× cycles missed
            </span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-500 rounded-full transition-all duration-1000"
              style={{ width: `${riskPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* AI insight */}
        <div className="flex items-start gap-2.5 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/40 rounded-xl p-3.5">
          <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
          <p className="text-[11.5px] text-orange-800 dark:text-orange-300 leading-relaxed">
            <strong>{category.name}</strong> orders have been silent for{" "}
            <strong>{category.daysSinceLastOrder} days</strong> — {missed}×
            longer than their usual cycle. This buyer may have switched
            suppliers for this category.
          </p>
        </div>

        {/* Draft label */}
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            AI-drafted outreach
          </p>
          <div className="flex items-center gap-1 text-[10px] text-violet-500 font-semibold">
            <Sparkles className="h-3 w-3" />
            <span>Category-specific</span>
          </div>
        </div>

        {generating ? (
          <div className="h-[160px] flex flex-col items-center justify-center rounded-xl border bg-muted/20 gap-3">
            <div className="relative">
              <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
              <div className="absolute inset-0 blur-md bg-violet-400/30 rounded-full" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-[11px] font-semibold text-muted-foreground">
                Writing personalised message
              </p>
              <p className="text-[10px] text-muted-foreground/60">
                Referencing {category.name} order history...
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <input
              className="w-full text-xs font-semibold px-3 py-2.5 bg-muted/40 rounded-lg border-transparent border focus:border-violet-300 focus:bg-background outline-none transition-all"
              placeholder="Subject line..."
              value={aiDraft?.subject ?? ""}
              onChange={(e) =>
                aiDraft &&
                onDraftChange({ ...aiDraft, subject: e.target.value })
              }
            />
            <Textarea
              className="min-h-[120px] text-[12px] leading-relaxed bg-muted/40 rounded-lg border-transparent focus:border-violet-300 focus:bg-background p-3 resize-none outline-none transition-all"
              placeholder="Message body..."
              value={aiDraft?.body ?? ""}
              onChange={(e) =>
                aiDraft && onDraftChange({ ...aiDraft, body: e.target.value })
              }
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t bg-muted/20 flex gap-2.5">
        <button
          disabled={!aiDraft || generating}
          onClick={() => {
            if (aiDraft) {
              window.open(
                buildGmailLink(buyer.email, aiDraft.subject, aiDraft.body),
                "_blank",
              );
            }
          }}
          className={[
            "flex-1 h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm",
            aiDraft && !generating
              ? "bg-violet-600 hover:bg-violet-700 text-white"
              : "bg-muted text-muted-foreground cursor-not-allowed",
          ].join(" ")}
        >
          <Send className="h-3.5 w-3.5" />
          Send via Gmail
        </button>

        <button
          onClick={onRelationshipOpen}
          className="h-10 px-4 rounded-xl border text-xs font-bold bg-background hover:bg-muted transition-colors flex items-center gap-2"
        >
          <History className="h-3.5 w-3.5 text-muted-foreground" />
          Log Activity
        </button>

        <button
          onClick={onClose}
          className="h-10 px-4 rounded-xl border text-xs font-bold bg-background hover:bg-muted transition-colors"
        >
          Dismiss
        </button>

        <button className="h-10 w-10 flex items-center justify-center rounded-xl border bg-background hover:bg-muted transition-colors">
          <StickyNote className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
};

export default CategoryChurn;
