import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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
import { Skeleton } from "@/components/ui/skeleton";
import { RelationshipSheet } from "./RelationshipSheet";
import {
  ArrowLeft,
  TrendingUp,
  Clock,
  DollarSign,
  Target,
  ChevronRight,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  Zap,
  History,
} from "lucide-react";

// ─── Logic ────────────────────────────────────────────────────────────────────

const GAP_THRESHOLD = 20; 

const getGap = (b: { potentialScore: number; attentionScore: number }) => 
  b.potentialScore - b.attentionScore;

const isBlindSpot = (b: BlindSpotItem) => getGap(b) >= GAP_THRESHOLD;

// ─── Custom Radar Dot ─────────────────────────────────────────────────────────

const RadarDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (!cx || !cy) return null;
  
  const gap = getGap(payload.original);
  const blind = gap >= GAP_THRESHOLD;
  const r = Math.max(6, (payload.original.potentialScore / 100) * 12);

  return (
    <g>
      {blind && (
        <circle
          cx={cx}
          cy={cy}
          r={r + 10 + (gap / 4)}
          fill="#ef4444"
          fillOpacity={0.06}
          className="animate-pulse pointer-events-none"
        />
      )}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={blind ? "#ef4444" : "#10b981"}
        fillOpacity={blind ? 0.9 : 0.6}
        stroke={blind ? "#f87171" : "#34d399"}
        strokeWidth={1.5}
        className="cursor-pointer transition-all duration-300 ease-out hover:scale-125"
        style={{ 
          transformOrigin: 'center', 
          transformBox: 'fill-box',
          transform: 'translate(0, 0)' // Stabilizes some browsers
        }}
      />
    </g>
  );
};

// ─── Sales-Centric Tooltip ────────────────────────────────────────────────────

const SalesTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload.original;
  const gap = getGap(p);
  const blind = gap >= GAP_THRESHOLD;

  return (
    <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border shadow-2xl rounded-2xl p-4 text-[11px] min-w-[200px] animate-in fade-in zoom-in-95 duration-200 pointer-events-none">
      <div className="flex flex-col gap-1 mb-3">
        <p className="font-black text-sm leading-tight text-foreground">{p.name}</p>
        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{p.city}</p>
      </div>
      
      <div className="space-y-2.5">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
            <Zap className="h-3 w-3 text-amber-500" /> Purchase Power
          </span>
          <span className="font-black text-foreground">{p.potentialScore}%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
            <Clock className="h-3 w-3 text-blue-500" /> Rep Attention
          </span>
          <span className="font-black text-foreground">{p.attentionScore}%</span>
        </div>

        <div className={`mt-2 py-2 px-3 rounded-xl flex items-center justify-between font-bold ${blind ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"}`}>
          <span className="text-[9px] uppercase tracking-tighter">Engagement Gap</span>
          <span className="text-sm">{gap > 0 ? `+${gap}` : gap}</span>
        </div>
        
        {blind && (
          <div className="flex items-center gap-1.5 text-rose-500 font-black mt-1 justify-center">
             <AlertCircle className="h-3.5 w-3.5" />
             <span className="text-[9px] uppercase tracking-widest">Neglected Account</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const BlindSpots = () => {
  const { repId } = useParams();
  const [data, setData] = useState<BlindSpotItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBuyer, setSelectedBuyer] = useState<BlindSpotItem | null>(null);
  const [chartReady, setChartReady] = useState(false);
  const [isRelationshipOpen, setIsRelationshipOpen] = useState(false);

  const fetchData = () => {
    fetch(`http://localhost:3040/api/reps/${repId}/blind-spots`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setTimeout(() => setChartReady(true), 200);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (repId) fetchData();
  }, [repId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-24 rounded-3xl bg-muted/40 animate-pulse" />
        <div className="h-[340px] rounded-3xl bg-muted/20 animate-pulse" />
      </div>
    );
  }

  const chartData = data.map((b) => ({
    x: b.potentialScore,
    y: b.attentionScore,
    original: b,
  }));

  const blindSpotCount = data.filter(isBlindSpot).length;

  if (selectedBuyer) {
    const gap = getGap(selectedBuyer);
    const blind = gap >= GAP_THRESHOLD;

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-3 duration-500">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-4">
            <button onClick={() => setSelectedBuyer(null)} className="h-10 w-10 rounded-2xl border bg-background hover:bg-muted flex items-center justify-center transition-all active:scale-90">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h2 className="font-black text-xl tracking-tight">{selectedBuyer.name}</h2>
              <p className="text-xs text-muted-foreground font-medium">{selectedBuyer.city} · {selectedBuyer.email}</p>
            </div>
           </div>
           {blind && (
             <div className="px-4 py-1.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-black uppercase tracking-widest animate-pulse">
               Action Needed
             </div>
           )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <DetailCard icon={<Zap className="h-4 w-4 text-amber-500" />} label="Purchase Power" value={`${selectedBuyer.potentialScore}%`} />
          <DetailCard icon={<Clock className="h-4 w-4 text-blue-500" />} label="Your Attention" value={`${selectedBuyer.attentionScore}%`} accent={blind} />
          <DetailCard icon={<Target className="h-4 w-4 text-rose-500" />} label="Opportunity Gap" value={`+${gap}`} accent={blind} />
        </div>

        <div className="rounded-3xl border bg-card p-6 space-y-6 shadow-sm relative overflow-hidden">
          {blind && <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 blur-3xl -mr-10 -mt-10" />}
          
          <div className="grid grid-cols-2 gap-8">
            <InfoItem icon={<Calendar />} label="Last Logged Contact" value={`${selectedBuyer.daysSinceContact} days ago`} red={selectedBuyer.daysSinceContact > 30} />
            <InfoItem icon={<TrendingUp />} label="Purchase Frequency" value={`${selectedBuyer.orderCount} total orders`} />
            <InfoItem icon={<DollarSign />} label="Customer Lifetime Value" value={`$${(selectedBuyer.totalRevenue / 1000).toFixed(1)}k`} />
            <InfoItem icon={<Phone />} label="Last Interaction" value={selectedBuyer.lastContactType ?? "No recent logs"} />
          </div>

          <div className="flex gap-3">
            <button 
              onClick={() => setIsRelationshipOpen(true)}
              className="flex-1 h-12 rounded-2xl bg-primary text-primary-foreground font-black text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-xl shadow-primary/20"
            >
              <History className="h-4 w-4" />
              Manage Relationship
            </button>
            <button className="w-12 h-12 rounded-2xl border bg-background hover:bg-muted flex items-center justify-center transition-colors">
              <Mail className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>

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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-3xl border bg-card p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Critical Gaps</p>
          <div className="flex items-end gap-2">
            <h3 className="text-3xl font-black leading-none">{blindSpotCount}</h3>
            <span className="text-xs font-bold text-rose-500 pb-0.5">High-Value Gaps</span>
          </div>
        </div>
        <div className="rounded-3xl border bg-card p-5 shadow-sm bg-gradient-to-br from-background to-emerald-50/30">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Active Portfolio</p>
          <div className="flex items-end gap-2">
            <h3 className="text-3xl font-black leading-none">{data.length}</h3>
            <span className="text-xs font-bold text-emerald-600 pb-0.5">Accounts Tracked</span>
          </div>
        </div>
      </div>

      <div className={`rounded-3xl border bg-card shadow-sm overflow-hidden transition-all duration-1000 ${chartReady ? "opacity-100 scale-100" : "opacity-0 scale-[0.98]"}`}>
        <div className="p-6 pb-2 border-b flex items-center justify-between bg-muted/20">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <RadarIcon className="h-4 w-4 text-primary" />
              Growth Radar
            </h3>
            <p className="text-[11px] text-muted-foreground font-medium mt-1">Comparing Purchase Power vs. Rep Attention</p>
          </div>
        </div>

        <div className="relative p-10 pt-14">
          <div className="absolute top-12 left-16 opacity-30 pointer-events-none">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-rose-500">Untapped Potential</span>
          </div>
          <div className="absolute bottom-12 right-16 opacity-30 pointer-events-none">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-600">Maximized Relationships</span>
          </div>

          <div className="relative border rounded-3xl bg-muted/5 p-4 overflow-hidden">
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
               <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-rose-500 via-transparent to-emerald-500" />
            </div>

            <ResponsiveContainer width="100%" height={320}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <XAxis type="number" dataKey="x" domain={[-10, 110]} hide />
                <YAxis type="number" dataKey="y" domain={[-10, 110]} hide />
                <ZAxis type="number" range={[100, 100]} />
                
                <ReferenceLine 
                  segment={[{ x: 0, y: 0 }, { x: 100, y: 100 }]} 
                  stroke="currentColor" 
                  strokeWidth={1} 
                  strokeDasharray="6 6" 
                  className="text-muted-foreground/20"
                />

                <Tooltip content={<SalesTooltip />} cursor={false} />
                
                <Scatter
                  data={chartData}
                  shape={<RadarDot />}
                  onClick={(p) => {
                    const b = data.find((x) => x.id === p.payload.original.id);
                    if (b) setSelectedBuyer(b);
                  }}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="px-6 py-4 bg-muted/10 border-t flex items-center justify-center gap-6">
           <div className="flex items-center gap-2">
             <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
             <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Attention Gap</span>
           </div>
           <div className="flex items-center gap-2">
             <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
             <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Balanced</span>
           </div>
        </div>
      </div>

      <div className="rounded-3xl border overflow-hidden shadow-sm divide-y bg-card">
        {[...data]
          .sort((a, b) => getGap(b) - getGap(a))
          .map((buyer) => {
            const gap = getGap(buyer);
            const blind = gap >= GAP_THRESHOLD;

            return (
              <div key={buyer.id} className="group relative flex items-center gap-5 px-6 py-5 hover:bg-muted/30 cursor-pointer transition-all active:scale-[0.99]" onClick={() => setSelectedBuyer(buyer)}>
                {blind && <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-rose-500 rounded-r-full shadow-[0_0_10px_rgba(239,68,68,0.5)]" />}
                
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm border transition-all group-hover:shadow-md ${blind ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"}`}>
                  {buyer.name.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-black text-sm tracking-tight">{buyer.name}</span>
                    {blind && (
                      <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-rose-500 text-white uppercase tracking-widest">Neglected</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-medium text-muted-foreground">
                    <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-amber-500" /> {buyer.potentialScore}% Power</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-blue-500" /> {buyer.attentionScore}% Attn</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                   <div className={`text-xs font-black ${blind ? "text-rose-500" : "text-emerald-600"}`}>
                     {gap > 0 ? `+${gap}` : gap}
                   </div>
                   <p className="text-[9px] font-bold uppercase tracking-tighter text-muted-foreground">Gap Index</p>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

const DetailCard = ({ icon, label, value, accent }: any) => (
  <div className="rounded-3xl border bg-card p-5 shadow-sm text-center space-y-2">
    <div className="mx-auto w-8 h-8 rounded-xl bg-muted/30 flex items-center justify-center">{icon}</div>
    <div className={`text-xl font-black tracking-tighter ${accent ? "text-rose-500" : ""}`}>{value}</div>
    <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{label}</div>
  </div>
);

const InfoItem = ({ icon, label, value, red }: any) => (
  <div className="flex items-start gap-3">
    <div className="mt-1 text-muted-foreground/60">{icon}</div>
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{label}</p>
      <p className={`text-sm font-bold ${red ? "text-rose-500" : ""}`}>{value}</p>
    </div>
  </div>
);

const RadarIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 12L19 19" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export default BlindSpots;
