import { useState } from "react";
import OverallChurn from "./components/OverallChurn";
import CategoryChurn from "./components/CategoryChurn";
import BlindSpots from "./components/BlindSpots";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold">
              C
            </div>
            <h1 className="text-xl font-bold tracking-tight">ChurnDetector</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Sales Rep: <span className="text-foreground font-medium">John Doe</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="overall" className="space-y-6">
          <div className="flex justify-center">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="overall">Overall Churn</TabsTrigger>
              <TabsTrigger value="category">Category Churn</TabsTrigger>
              <TabsTrigger value="blind">Blind Spots</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="overall" className="space-y-4">
            <OverallChurn />
          </TabsContent>
          <TabsContent value="category" className="space-y-4">
            <CategoryChurn />
          </TabsContent>
          <TabsContent value="blind" className="space-y-4">
            <BlindSpots />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default App;
