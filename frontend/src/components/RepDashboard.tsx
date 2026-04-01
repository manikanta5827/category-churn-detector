import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AccountChurn } from "./AccountChurn";
import { CategoryChurn } from "./CategoryChurn";
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
      <div className="mb-10 flex flex-col items-center text-center space-y-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl border bg-background hover:bg-muted transition-all text-[10px] font-black uppercase tracking-widest active:scale-95"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Switch Representative
        </button>

        <div className="space-y-2">
          <div className="flex items-center justify-center gap-3 text-primary">
            <UserCircle2 className="h-5 w-5" />
            <h2 className="text-2xl font-black tracking-tighter sm:text-3xl">
              {repName || "Representative"}'s Console
            </h2>
          </div>
          <p className="text-muted-foreground text-[13px] font-medium max-w-[440px] mx-auto leading-relaxed">
            Real-time analysis of account health, category abandonment, and
            portfolio blind spots.
          </p>
        </div>
      </div>

      <Tabs
        value={currentTab}
        onValueChange={handleTabChange}
        className="space-y-10"
      >
        <div className="flex justify-center sticky top-20 z-40 bg-background/80 backdrop-blur-sm py-2 rounded-2xl -mx-4 px-4 border border-transparent hover:border-border/20 transition-all">
          <TabsList className="h-11 p-1 bg-muted/60 border rounded-2xl w-full max-w-md shadow-sm">
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
            <CategoryChurn />
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
