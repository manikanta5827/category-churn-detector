import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AccountChurn } from "./AccountChurn";
import { AbandonedCategory } from "./AbandonedCategory";
import BlindSpots from "./BlindSpots";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, UserCircle2 } from "lucide-react";

export default function RepDashboard() {
  const { repId, tab } = useParams();
  const navigate = useNavigate();
  const [repName, setRepName] = useState("");

  // Determine active tab
  const currentTab = tab || "account";

  useEffect(() => {
    if (repId) {
      fetch("http://localhost:3040/api/reps")
        .then((r) => r.json())
        .then((reps) => {
          const rep = reps.find((r: any) => r.id === Number(repId));
          if (rep) setRepName(rep.name);
        });
    }
  }, [repId]);

  const handleTabChange = (value: string) => {
    navigate(`/${repId}/${value}`);
  };

  return (
    <div className="animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-border/50">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <UserCircle2 className="h-5 w-5" />
            <h2 className="text-lg font-black tracking-tight uppercase">
              {repName || "Representative"}'s Console
            </h2>
          </div>
          <p className="text-muted-foreground text-[11px] font-medium max-w-[400px]">
            Real-time analysis of account health, category abandonment, and
            portfolio blind spots.
          </p>
        </div>

        <button
          onClick={() => navigate("/")}
          className="flex items-center self-start md:self-center gap-2 px-3 py-2 rounded-xl border bg-background hover:bg-muted transition-all text-[9px] font-black uppercase tracking-widest active:scale-95 shadow-sm"
        >
          <ArrowLeft className="h-3 w-3" />
          Switch Representative
        </button>
      </div>

      <Tabs
        value={currentTab}
        onValueChange={handleTabChange}
        className="space-y-6"
      >
        <div className="flex justify-start sticky top-16 z-40 bg-background/80 backdrop-blur-sm py-2 rounded-2xl -mx-4 px-4 transition-all">
          <TabsList className="h-10 p-1 bg-muted/60 border rounded-xl w-full max-w-md shadow-sm">
            <TabsTrigger
              value="account"
              className="rounded-xl px-6 text-[11px] font-bold uppercase tracking-tight data-[state=active]:shadow-md transition-all"
            >
              Account Churn
            </TabsTrigger>
            <TabsTrigger
              value="category"
              className="rounded-xl px-6 text-[11px] font-bold uppercase tracking-tight data-[state=active]:shadow-md transition-all"
            >
              Abandoned Category
            </TabsTrigger>
            <TabsTrigger
              value="blind"
              className="rounded-xl px-6 text-[11px] font-bold uppercase tracking-tight data-[state=active]:shadow-md transition-all"
            >
              Blind Spots
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="mt-8">
          <TabsContent
            value="account"
            className="focus-visible:outline-none outline-none ring-0"
          >
            <AccountChurn />
          </TabsContent>
          <TabsContent
            value="category"
            className="focus-visible:outline-none outline-none ring-0"
          >
            <AbandonedCategory />
          </TabsContent>
          <TabsContent
            value="blind"
            className="focus-visible:outline-none outline-none ring-0"
          >
            <BlindSpots />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
