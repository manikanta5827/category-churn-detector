import { useState } from "react";
import OverallChurn from "./components/OverallChurn";
import CategoryChurn from "./components/CategoryChurn";
import BlindSpots from "./components/BlindSpots";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

function App() {
  const [isDark, setIsDark] = useState(false);

  return (
    <div className={isDark ? "dark" : ""}>
      <div className="min-h-screen bg-background text-foreground font-sans antialiased transition-colors duration-300">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-4xl mx-auto px-8 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-primary-foreground font-bold">
                CD
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight leading-none">ChurnDetector</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Mark Wilson</span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsDark(!isDark)}
                className="rounded-full w-8 h-8"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-8 py-10">
          <Tabs defaultValue="overall" className="space-y-8">
            <div className="flex justify-center mb-2">
              <TabsList className="h-10 p-1 bg-muted border rounded-xl w-full max-w-sm shadow-sm">
                <TabsTrigger value="overall" className="rounded-lg px-6 text-[11px] font-bold uppercase tracking-tight">Overall</TabsTrigger>
                <TabsTrigger value="category" className="rounded-lg px-6 text-[11px] font-bold uppercase tracking-tight">Category</TabsTrigger>
                <TabsTrigger value="blind" className="rounded-lg px-6 text-[11px] font-bold uppercase tracking-tight">Blind Spots</TabsTrigger>
              </TabsList>
            </div>
            
            <div className="mt-6">
              <TabsContent value="overall" className="focus-visible:outline-none outline-none">
                <OverallChurn />
              </TabsContent>
              <TabsContent value="category" className="focus-visible:outline-none outline-none">
                <CategoryChurn />
              </TabsContent>
              <TabsContent value="blind" className="focus-visible:outline-none outline-none">
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
