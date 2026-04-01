import { useState, useEffect } from "react";
import { Routes, Route, Link } from "react-router-dom";
import RepList from "./components/RepList";
import RepDashboard from "./components/RepDashboard";
import { Moon, Sun, Radar } from "lucide-react";
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
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground shadow-sm">
              <Radar className="h-4.5 w-4.5" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight leading-none">ChurnDetector</h1>
              <p className="text-[10px] text-muted-foreground font-medium mt-0.5 uppercase tracking-widest">Growth Analytics</p>
            </div>
          </Link>
          
          <div className="flex items-center gap-5">
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

      <main className="max-w-4xl mx-auto px-8 pt-6 pb-20">
        <Routes>
          <Route path="/" element={<RepList />} />
          <Route path="/:repId" element={<RepDashboard />} />
          <Route path="/:repId/:tab" element={<RepDashboard />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
