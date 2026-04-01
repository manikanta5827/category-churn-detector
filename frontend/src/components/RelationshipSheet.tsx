import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  History,
  Send,
  Loader2,
  Calendar,
} from "lucide-react";

type Contact = {
  id: number;
  contactType: string;
  note: string;
  contactedAt: string;
};

type RelationshipSheetProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  buyer: { id: number; name: string; city: string; email: string };
  onLogSuccess?: () => void;
};

export const RelationshipSheet = ({
  isOpen,
  onOpenChange,
  buyer,
  onLogSuccess,
}: RelationshipSheetProps) => {
  const { repId } = useParams();
  const [history, setHistory] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [type, setType] = useState<string>("call");
  const [submitting, setSubmitting] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:3040/api/buyers/${buyer.id}/contacts`,
      );
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
      setNote("");
    }
  }, [isOpen, buyer.id]);

  const handleLog = async () => {
    if (!note.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`http://localhost:3040/api/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repId: Number(repId),
          buyerId: buyer.id,
          contactType: type,
          note: note.trim(),
        }),
      });
      if (res.ok) {
        setNote("");
        fetchHistory();
        if (onLogSuccess) onLogSuccess();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md flex flex-col h-full overflow-hidden p-0 gap-0">
        <SheetHeader className="p-6 pb-4 border-b bg-muted/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center border">
              <History className="h-5 w-5 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-lg font-black tracking-tight">
                {buyer.name}
              </SheetTitle>
              <SheetDescription className="text-xs font-medium">
                Relationship Management · {buyer.city}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
          {/* New Log Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                Log New Activity
              </h4>
              <Badge
                variant="outline"
                className="text-[9px] font-black tracking-widest uppercase py-0 px-2 bg-background shadow-sm"
              >
                Real-time Sync
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <TypeButton
                active={type === "call"}
                icon={<Phone className="h-3.5 w-3.5" />}
                label="Call"
                onClick={() => setType("call")}
              />
              <TypeButton
                active={type === "email"}
                icon={<Mail className="h-3.5 w-3.5" />}
                label="Email"
                onClick={() => setType("email")}
              />
              <TypeButton
                active={type === "visit"}
                icon={<MapPin className="h-3.5 w-3.5" />}
                label="Visit"
                onClick={() => setType("visit")}
              />
            </div>

            <div className="relative group">
              <Textarea
                placeholder={`What did you discuss during the ${type}?`}
                className="min-h-[120px] rounded-2xl bg-muted/30 border-transparent focus:border-primary/30 transition-all resize-none p-4 text-sm"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-muted/10 to-transparent pointer-events-none rounded-b-2xl" />
            </div>

            <Button
              className="w-full h-11 rounded-2xl font-black text-xs uppercase tracking-widest gap-2 shadow-lg shadow-primary/10"
              disabled={!note.trim() || submitting}
              onClick={handleLog}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              Save Interaction
            </Button>
          </section>

          {/* History Section */}
          <section className="space-y-5">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                Past Interactions
              </h4>
              <span className="text-[10px] font-bold text-muted-foreground/60">
                {history.length} Logs
              </span>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-20 rounded-2xl bg-muted/40 animate-pulse"
                  />
                ))}
              </div>
            ) : history.length > 0 ? (
              <div className="space-y-4 relative">
                <div className="absolute left-[19px] top-4 bottom-4 w-px bg-border/60" />
                {history.map((log) => (
                  <div key={log.id} className="relative pl-12 group">
                    {/* Icon Circle */}
                    <div className="absolute left-0 top-0 h-10 w-10 rounded-xl bg-background border flex items-center justify-center shadow-sm z-10 group-hover:border-primary/40 transition-colors">
                      {log.contactType === "call" && (
                        <Phone className="h-4 w-4 text-blue-500" />
                      )}
                      {log.contactType === "email" && (
                        <Mail className="h-4 w-4 text-violet-500" />
                      )}
                      {log.contactType === "visit" && (
                        <MapPin className="h-4 w-4 text-emerald-500" />
                      )}
                    </div>

                    <div className="bg-muted/30 rounded-2xl p-4 border border-transparent hover:border-border transition-all hover:shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-foreground/80">
                          {log.contactType}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                          <Calendar className="h-3 w-3" />
                          {new Date(log.contactedAt).toLocaleDateString(
                            undefined,
                            { month: "short", day: "numeric", year: "numeric" },
                          )}
                        </div>
                      </div>
                      <p className="text-xs leading-relaxed text-muted-foreground/90 font-medium italic">
                        "{log.note}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-32 rounded-3xl border border-dashed flex flex-col items-center justify-center bg-muted/10 gap-2 opacity-60">
                <MessageSquare className="h-6 w-6 text-muted-foreground/40" />
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                  No history yet
                </p>
              </div>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
};

const TypeButton = ({ active, icon, label, onClick }: any) => (
  <button
    onClick={onClick}
    className={[
      "flex flex-col items-center justify-center gap-2 py-3 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-tighter",
      active
        ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20"
        : "bg-background hover:bg-muted/50 text-muted-foreground",
    ].join(" ")}
  >
    {icon}
    {label}
  </button>
);
