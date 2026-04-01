import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { UserCircle2, ChevronRight, Radar, Briefcase, Users, LayoutDashboard } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type Rep = {
  id: number;
  name: string;
};

export default function RepList() {
  const [reps, setReps] = useState<Rep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3040/api/reps")
      .then((r) => r.json())
      .then(setReps)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-3xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider mb-2">
          <Users className="h-3 w-3" /> Team Directory
        </div>
        <h2 className="text-3xl font-black tracking-tighter">Select a Representative</h2>
        <p className="text-muted-foreground text-sm font-medium max-w-[460px] mx-auto leading-relaxed">
          Access specialized retention dashboards for your sales team to monitor account health and category growth.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {reps.map((rep) => (
          <Link key={rep.id} to={`/${rep.id}/account`} className="group">
            <Card className="p-6 rounded-[2rem] border-2 border-transparent hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 bg-card/50 backdrop-blur-sm relative overflow-hidden group-hover:-translate-y-1">
              <div className="absolute top-0 right-0 p-8 text-primary/5 group-hover:text-primary/10 transition-colors pointer-events-none">
                <Radar className="h-24 w-24 rotate-12" />
              </div>
              
              <div className="flex items-center gap-5 relative z-10">
                <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500">
                  <UserCircle2 className="h-8 w-8" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5">
                    <Briefcase className="h-3 w-3" /> Senior Sales Rep
                  </p>
                  <h3 className="text-xl font-black tracking-tight group-hover:text-primary transition-colors truncate">
                    {rep.name}
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                  <ChevronRight className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3 relative z-10">
                <div className="flex -space-x-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="w-6 h-6 rounded-full border-2 border-background bg-muted flex items-center justify-center overflow-hidden">
                       <div className="w-full h-full bg-primary/10" />
                    </div>
                  ))}
                </div>
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                  Active Portfolio Data Ready
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="pt-10 border-t flex flex-col items-center gap-4">
        <div className="flex items-center gap-6 text-muted-foreground/40">
           <LayoutDashboard className="h-5 w-5" />
           <Users className="h-5 w-5" />
           <Radar className="h-5 w-5" />
        </div>
        <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-[0.2em]">
          Corporate Growth Intelligence Suite
        </p>
      </div>
    </div>
  );
}
