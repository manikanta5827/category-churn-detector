import { useState, useEffect } from "react";
import OverallChurn from "./components/OverallChurn";
import CategoryChurn from "./components/CategoryChurn";
import BlindSpots from "./components/BlindSpots";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Moon, Sun, Radar, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function App() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased transition-colors duration-300">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-4xl mx-auto px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground shadow-sm">
              <Radar className="h-4.5 w-4.5" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight leading-none">ChurnDetector</h1>
              <p className="text-[10px] text-muted-foreground font-medium mt-0.5 uppercase tracking-widest">Growth Analytics</p>
            </div>
          </div>
          
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2 pr-2 border-r border-border/60 h-8">
              <UserCircle2 className="h-4 w-4 text-muted-foreground/60" />
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Mark Wilson</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsDark(!isDark)}
              className="rounded-full w-8 h-8 text-muted-foreground hover:text-foreground transition-colors"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-8 py-10 pb-20">
        <div className="mb-10 text-center space-y-2 animate-in fade-in slide-in-from-top-4 duration-700">
          <h2 className="text-2xl font-black tracking-tighter sm:text-3xl">Rep Retention Console</h2>
          <p className="text-muted-foreground text-[13px] font-medium max-w-[440px] mx-auto leading-relaxed">
            Real-time analysis of buyer churn patterns and category abandonment across your active portfolio.
          </p>
        </div>

        <Tabs defaultValue="overall" className="space-y-10">
          <div className="flex justify-center sticky top-20 z-40 bg-background/80 backdrop-blur-sm py-2 rounded-2xl -mx-4 px-4 border border-transparent hover:border-border/20 transition-all">
            <TabsList className="h-11 p-1 bg-muted/60 border rounded-2xl w-full max-w-sm shadow-sm">
              <TabsTrigger 
                value="overall" 
                className="rounded-xl px-8 text-[11px] font-bold uppercase tracking-tight data-[state=active]:shadow-md transition-all"
              >
                Overall
              </TabsTrigger>
              <TabsTrigger 
                value="category" 
                className="rounded-xl px-8 text-[11px] font-bold uppercase tracking-tight data-[state=active]:shadow-md transition-all"
              >
                Category
              </TabsTrigger>
              <TabsTrigger 
                value="blind" 
                className="rounded-xl px-8 text-[11px] font-bold uppercase tracking-tight data-[state=active]:shadow-md transition-all"
              >
                Blind Spots
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="mt-8">
            <TabsContent value="overall" className="focus-visible:outline-none outline-none ring-0">
              <OverallChurn />
            </TabsContent>
            <TabsContent value="category" className="focus-visible:outline-none outline-none ring-0">
              <CategoryChurn />
            </TabsContent>
            <TabsContent value="blind" className="focus-visible:outline-none outline-none ring-0">
              <BlindSpots />
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
}

export default App;
