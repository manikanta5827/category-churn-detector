import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { BuyerChurnItem, Status } from "../types";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { RelationshipSheet } from "./RelationshipSheet";
import {
  Loader2,
  AlertTriangle,
  Send,
  StickyNote,
  ChevronRight,
  Sparkles,
  Clock,
  TrendingDown,
  CheckCircle2,
  X,
  History,
} from "lucide-react";
import { buildGmailLink } from "./AbandonedCategory";

// ─── Types ────────────────────────────────────────────────────────────────────

type AiDraft = { subject: string; body: string };

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  Status,
  {
    dot: string;
    badge: string;
    badgeText: string;
    label: string;
    ring: string;
    bar: string;
  }
> = {
  red: {
    dot: "bg-rose-500",
    badge: "bg-rose-50 text-rose-600 border border-rose-200",
    badgeText: "At Risk",
    label: "Priority",
    ring: "ring-rose-200",
    bar: "bg-rose-500",
  },
  yellow: {
    dot: "bg-amber-400",
    badge: "bg-amber-50 text-amber-700 border border-amber-200",
    badgeText: "Drifting",
    label: "Warning",
    ring: "ring-amber-200",
    bar: "bg-amber-400",
  },
  green: {
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    badgeText: "Healthy",
    label: "Active",
    ring: "ring-emerald-200",
    bar: "bg-emerald-500",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const overdueDays = (b: BuyerChurnItem) =>
  Math.max(0, b.daysSinceLastOrder - b.avgCycleDays);

const riskPercent = (b: BuyerChurnItem) =>
  Math.min(
    100,
    Math.round((b.daysSinceLastOrder / (b.avgCycleDays * 2)) * 100),
  );

// ─── Main component ───────────────────────────────────────────────────────────

export const AccountChurn = () => {
  const { repId } = useParams();
  const [data, setData] = useState<BuyerChurnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBuyer, setSelectedBuyer] = useState<BuyerChurnItem | null>(
    null,
  );
  const [aiDraft, setAiDraft] = useState<AiDraft | null>(null);
  const [generating, setGenerating] = useState(false);
  const [isRelationshipOpen, setIsRelationshipOpen] = useState(false);

  const fetchData = () => {
    fetch(`http://localhost:3040/api/reps/${repId}/churn`)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (repId) fetchData();
  }, [repId]);

  const fetchAiMessage = async (buyer: BuyerChurnItem) => {
    setGenerating(true);
    setAiDraft(null);
    try {
      const res = await fetch(
        `http://localhost:3040/api/reps/${repId}/churn/${buyer.id}/message`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            daysSince: buyer.daysSinceLastOrder,
            avgCycle: buyer.avgCycleDays,
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

  const handleOpen = (buyer: BuyerChurnItem) => {
    if (buyer.status === "green") {
      setSelectedBuyer(buyer);
      setAiDraft(null);
      return;
    }
    setSelectedBuyer(buyer);
    setAiDraft(null);
    fetchAiMessage(buyer);
  };

  const redCount = data.filter((b) => b.status === "red").length;
  const yellowCount = data.filter((b) => b.status === "yellow").length;

  // ── Loading skeleton ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-24 rounded-2xl bg-muted/60" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-[72px] w-full rounded-xl" />
        ))}
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* ── Compact Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-foreground/90">
            Account Churn
          </h2>
          <p className="text-[11px] text-muted-foreground font-medium">
            Risk analysis based on historical reorder cycles
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatPill
            icon={<TrendingDown className="h-3 w-3" />}
            value={redCount}
            label="Risk"
            color="text-rose-600 bg-rose-50/50 border-rose-200"
          />
          <StatPill
            icon={<Clock className="h-3 w-3" />}
            value={yellowCount}
            label="Drifting"
            color="text-amber-600 bg-amber-50/50 border-amber-200"
          />
        </div>
      </div>

      {/* ── Buyer list ── */}
      <div className="rounded-xl border overflow-hidden shadow-sm divide-y divide-border/40 bg-card">
        {data.map((buyer, i) => {
          const cfg = STATUS_CONFIG[buyer.status];
          const pct = riskPercent(buyer);
          const clickable = true; // All buyers clickable now to see history

          return (
            <div
              key={buyer.id}
              style={{ animationDelay: `${i * 40}ms` }}
              className={[
                "animate-in fade-in slide-in-from-left-1 duration-300",
                "relative flex items-center gap-4 px-5 py-4 transition-all hover:bg-muted/40 cursor-pointer active:scale-[0.995]",
                buyer.status === "green" && "opacity-80",
              ].join(" ")}
              onClick={() => handleOpen(buyer)}
            >
              {/* risk bar on left edge */}
              <div
                className={`absolute left-0 top-0 bottom-0 w-[3px] ${cfg.bar} opacity-70 rounded-r-full`}
              />

              {/* dot */}
              <div className="relative shrink-0">
                <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                {buyer.status === "red" && (
                  <div
                    className={`absolute inset-0 rounded-full ${cfg.dot} animate-ping opacity-40`}
                  />
                )}
              </div>

              {/* buyer info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm truncate">
                    {buyer.name}
                  </span>
                  <span
                    className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.badge}`}
                  >
                    {cfg.badgeText}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {buyer.city} · Last order{" "}
                  <span className="font-medium text-foreground/70">
                    {buyer.daysSinceLastOrder}d ago
                  </span>{" "}
                  · Avg cycle{" "}
                  <span className="font-medium text-foreground/70">
                    {buyer.avgCycleDays}d
                  </span>
                </p>

                {/* progress bar */}
                <div className="mt-2 h-1 w-full max-w-[180px] bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${cfg.bar} rounded-full transition-all duration-700`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* right side */}
              <div className="flex items-center gap-3 shrink-0">
                {buyer.status !== "green" && (
                  <div className="text-right">
                    <p
                      className={`text-xs font-bold ${
                        buyer.status === "red"
                          ? "text-rose-500"
                          : "text-amber-600"
                      }`}
                    >
                      +{overdueDays(buyer)}d overdue
                    </p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wide mt-0.5">
                      overdue
                    </p>
                  </div>
                )}
                <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Detail dialog ── */}
      <Dialog
        open={!!selectedBuyer}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedBuyer(null);
            setAiDraft(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden rounded-2xl gap-0 border-0 shadow-2xl">
          {selectedBuyer && (
            <BuyerDetailPanel
              buyer={selectedBuyer}
              aiDraft={aiDraft}
              generating={generating}
              onDraftChange={setAiDraft}
              onClose={() => setSelectedBuyer(null)}
              onRelationshipOpen={() => setIsRelationshipOpen(true)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ── Relationship sheet ── */}
      {selectedBuyer && (
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
      )}
    </div>
  );
};

// ─── Buyer detail panel ───────────────────────────────────────────────────────

const BuyerDetailPanel = ({
  buyer,
  aiDraft,
  generating,
  onDraftChange,
  onClose,
  onRelationshipOpen,
}: {
  buyer: BuyerChurnItem;
  aiDraft: AiDraft | null;
  generating: boolean;
  onDraftChange: (d: AiDraft) => void;
  onClose: () => void;
  onRelationshipOpen: () => void;
}) => {
  const cfg = STATUS_CONFIG[buyer.status];
  const overdue = overdueDays(buyer);

  return (
    <div className="flex flex-col max-h-[90vh]">
      {/* Header */}
      <div className="relative p-6 pb-5 bg-gradient-to-br from-muted/60 to-background border-b">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="relative">
            <div className={`w-3 h-3 rounded-full ${cfg.dot}`} />
            {buyer.status === "red" && (
              <div
                className={`absolute inset-0 rounded-full ${cfg.dot} animate-ping opacity-40`}
              />
            )}
          </div>
          <div>
            <h3 className="font-bold text-base leading-tight">{buyer.name}</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {buyer.city} · {buyer.email}
            </p>
          </div>
        </div>

        {/* Stat grid */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label="Last Order"
            value={`${buyer.daysSinceLastOrder}d ago`}
            accent={buyer.status === "red"}
          />
          <StatCard label="Avg Cycle" value={`${buyer.avgCycleDays}d`} />
          <StatCard
            label="Overdue"
            value={overdue > 0 ? `+${overdue}d` : "On track"}
            accent={overdue > 0}
          />
        </div>

        {/* Risk bar */}
        <div className="mt-4">
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1.5 font-medium">
            <span>Churn risk</span>
            <span>{riskPercent(buyer)}%</span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full ${cfg.bar} rounded-full transition-all duration-1000`}
              style={{ width: `${riskPercent(buyer)}%` }}
            />
          </div>
        </div>
      </div>

      {/* AI draft section or Health summary */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {buyer.status !== "green" ? (
          <>
            {/* AI insight pill */}
            <div className="flex items-start gap-2.5 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/40 rounded-xl p-3.5">
              <AlertTriangle className="h-4 w-4 text-violet-500 shrink-0 mt-0.5" />
              <p className="text-[11.5px] text-violet-800 dark:text-violet-300 leading-relaxed">
                Buyer has exceeded their normal reorder cycle by{" "}
                <strong>{overdue} days</strong>. High probability of competitive
                switching — reach out now.
              </p>
            </div>

            {/* Draft label */}
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                AI-drafted outreach
              </p>
              <div className="flex items-center gap-1 text-[10px] text-violet-500 font-semibold">
                <Sparkles className="h-3 w-3" />
                <span>Generated</span>
              </div>
            </div>

            {generating ? (
              <div className="h-[160px] flex flex-col items-center justify-center rounded-xl border bg-muted/20 gap-3">
                <div className="relative">
                  <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
                  <div className="absolute inset-0 blur-md bg-violet-400/30 rounded-full" />
                </div>
                <div className="space-y-1 text-center">
                  <p className="text-[11px] font-semibold text-muted-foreground">
                    Writing personalised message
                  </p>
                  <p className="text-[10px] text-muted-foreground/60">
                    Analysing buyer history...
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
                    aiDraft &&
                    onDraftChange({ ...aiDraft, body: e.target.value })
                  }
                />
              </div>
            )}
          </>
        ) : (
          <div className="h-[200px] flex flex-col items-center justify-center text-center p-6 bg-emerald-50/30 rounded-2xl border border-dashed border-emerald-200">
            <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-3" />
            <h4 className="font-bold text-emerald-800 text-sm">
              Account is Healthy
            </h4>
            <p className="text-xs text-emerald-600/80 mt-1 leading-relaxed">
              Relationship is currently stable. Use the log to record your
              routine touchpoints.
            </p>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="p-4 border-t bg-muted/20 flex gap-2.5">
        {buyer.status !== "green" && (
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
                ? "bg-violet-600 hover:bg-violet-700 text-white shadow-violet-200"
                : "bg-muted text-muted-foreground cursor-not-allowed",
            ].join(" ")}
          >
            <Send className="h-3.5 w-3.5" />
            Send via Gmail
          </button>
        )}

        <button
          onClick={onRelationshipOpen}
          className={[
            "h-10 px-4 rounded-xl border text-xs font-bold bg-background hover:bg-muted transition-colors flex items-center gap-2",
            buyer.status === "green" && "flex-1",
          ].join(" ")}
        >
          <History className="h-3.5 w-3.5 text-muted-foreground" />
          {buyer.status === "green" ? "Relationship History" : "Log Activity"}
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

// ─── Small reusable pieces ────────────────────────────────────────────────────

const StatPill = ({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: string;
}) => (
  <div
    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold ${color}`}
  >
    {icon}
    <span className="text-base font-black leading-none">{value}</span>
    <span className="font-medium opacity-80">{label}</span>
  </div>
);

const StatCard = ({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) => (
  <div className="rounded-xl bg-background/80 border p-3 text-center">
    <p
      className={`text-sm font-black leading-none ${accent ? "text-rose-500" : ""}`}
    >
      {value}
    </p>
    <p className="text-[9px] uppercase tracking-wider text-muted-foreground mt-1.5 font-semibold">
      {label}
    </p>
  </div>
);

export default AccountChurn;
