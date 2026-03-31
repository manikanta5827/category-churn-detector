import { useState } from "react";
import OverallChurn from "./components/OverallChurn";
import CategoryChurn from "./components/CategoryChurn";
import BlindSpots from "./components/BlindSpots";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

function App() {
  const [isDark, setIsDark] = useState(true);

  return (
    <div className={isDark ? "dark" : ""}>
      <div className="min-h-screen bg-background text-foreground font-sans antialiased transition-colors duration-300">
        {/* Subtle background glow for dark mode */}
        {isDark && (
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-[25%] -left-[10%] w-[70%] h-[70%] bg-blue-500/5 rounded-full blur-[120px]" />
            <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-purple-500/5 rounded-full blur-[120px]" />
          </div>
        )}

        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm dark:shadow-primary/5">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-extrabold shadow-xl shadow-primary/20">
                CD
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight leading-none">ChurnDetector</h1>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Intelligence Engine</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-xs text-muted-foreground font-medium">Sales Representative</span>
                <span className="text-sm font-bold">Mark Wilson</span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsDark(!isDark)}
                className="rounded-full w-9 h-9 shadow-sm"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </header>

        <main className="relative max-w-7xl mx-auto px-4 py-10">
          <Tabs defaultValue="overall" className="space-y-10">
            <div className="flex flex-col items-center gap-4">
              <TabsList className="h-12 p-1 bg-muted/50 border rounded-xl w-full max-w-lg shadow-xl shadow-black/5 dark:shadow-primary/5">
                <TabsTrigger value="overall" className="rounded-lg px-6 data-[state=active]:shadow-lg">Overall</TabsTrigger>
                <TabsTrigger value="category" className="rounded-lg px-6 data-[state=active]:shadow-lg">Category</TabsTrigger>
                <TabsTrigger value="blind" className="rounded-lg px-6 data-[state=active]:shadow-lg">Blind Spots</TabsTrigger>
              </TabsList>
            </div>
            
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <TabsContent value="overall" className="mt-0 focus-visible:outline-none">
                <OverallChurn />
              </TabsContent>
              <TabsContent value="category" className="mt-0 focus-visible:outline-none">
                <CategoryChurn />
              </TabsContent>
              <TabsContent value="blind" className="mt-0 focus-visible:outline-none">
                <BlindSpots />
              </TabsContent>
            </div>
          </Tabs>
        </main>
      </div>
    </div>
  );
}

export default App;
