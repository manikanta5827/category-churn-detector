import { useEffect, useState } from "react";
import type { BuyerCategoryChurnItem } from "../types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MessageSquare, Sparkles } from "lucide-react";

export const CategoryChurn = () => {
  const [data, setData] = useState<BuyerCategoryChurnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiMessages, setAiMessages] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("http://localhost:3040/api/reps/1/category-churn")
      .then((res) => res.json())
      .then(setData)
      .catch(err => console.error("Error fetching category churn data:", err))
      .finally(() => setLoading(false));
  }, []);

  const generateMessage = async (buyerId: number, categoryName: string) => {
    const key = `${buyerId}-${categoryName}`;
    if (aiMessages[key]) return;

    setGenerating(prev => ({ ...prev, [key]: true }));

    const category = data
      .find((b) => b.id === buyerId)
      ?.categories.find((c) => c.name === categoryName);
    if (!category) {
      setGenerating(prev => ({ ...prev, [key]: false }));
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3040/api/reps/1/category-churn/${buyerId}/${categoryName}/message`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            daysSince: category.daysSinceLastOrder,
            avgCycle: category.avgCycleDays,
            totalOrders: category.totalOrders,
          }),
        },
      );
      const result: { message: string; error?: string } = await response.json();
      if (result.error) {
        alert(result.error);
      } else {
        setAiMessages((prev) => ({ ...prev, [key]: result.message }));
      }
    } catch (err) {
      console.error("Error generating AI message:", err);
    } finally {
      setGenerating(prev => ({ ...prev, [key]: false }));
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-full" />)}
      </div>
    );
  }

  const total = data.length;
  const high = data.filter((d) => d.buyerStatus === "red").length;
  const medium = data.filter((d) => d.buyerStatus === "yellow").length;
  const active = data.filter((d) => d.buyerStatus === "green").length;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold">Buyers with Gaps</CardDescription>
            <CardTitle className="text-3xl font-bold">{total}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-t-4 border-t-destructive">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold">High Churn Risk</CardDescription>
            <CardTitle className="text-3xl font-bold text-destructive">{high}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-t-4 border-t-yellow-500">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold">Medium Churn Risk</CardDescription>
            <CardTitle className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{medium}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-t-4 border-t-green-500">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold">Healthy</CardDescription>
            <CardTitle className="text-3xl font-bold text-green-600 dark:text-green-400">{active}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold px-1">Category-Specific Churn Analysis</h2>
        {data.map((buyer) => (
          <Card key={buyer.id} className="overflow-hidden transition-shadow hover:shadow-md">
            <CardHeader className="bg-muted/30 pb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                    buyer.buyerStatus === "red" ? "bg-destructive/10 text-destructive" : 
                    buyer.buyerStatus === "yellow" ? "bg-yellow-500/10 text-yellow-600" : "bg-green-500/10 text-green-600"
                  }`}>
                    {buyer.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{buyer.name}</CardTitle>
                    <CardDescription>{buyer.email} · {buyer.city}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right hidden md:block">
                    <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Issues Found</div>
                    <div className="text-sm font-semibold">
                      <span className="text-destructive">{buyer.coldCount} Cold</span> · <span className="text-yellow-600 dark:text-yellow-400">{buyer.warmCount} Warm</span>
                    </div>
                  </div>
                  <Badge variant={buyer.buyerStatus === "red" ? "destructive" : buyer.buyerStatus === "yellow" ? "secondary" : "outline"}
                    className={buyer.buyerStatus === "yellow" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" : ""}>
                    {buyer.buyerStatus === "red" ? "Priority" : buyer.buyerStatus === "yellow" ? "Monitor" : "Healthy"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {buyer.categories.map((category) => (
                  <div key={category.name} className="p-4 md:p-6 hover:bg-muted/10 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-lg">{category.name}</h4>
                          <Badge variant="outline" className={`text-[10px] uppercase h-5 ${
                            category.status === "red" ? "text-destructive border-destructive/30 bg-destructive/5" : 
                            category.status === "yellow" ? "text-yellow-600 border-yellow-500/30 bg-yellow-500/5" : "text-green-600 border-green-500/30 bg-green-500/5"
                          }`}>
                            {category.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-1 text-sm">
                          <div className="text-muted-foreground">
                            Last Order: <span className="text-foreground font-medium">{new Date(category.lastOrderDate).toLocaleDateString()}</span>
                          </div>
                          <div className="text-muted-foreground">
                            Gap: <span className={`font-medium ${category.status === "red" ? "text-destructive" : ""}`}>{category.daysSinceLastOrder} days</span>
                          </div>
                          <div className="text-muted-foreground">
                            Avg Cycle: <span className="text-foreground font-medium">{category.avgCycleDays} days</span>
                          </div>
                          <div className="text-muted-foreground">
                            Total Orders: <span className="text-foreground font-medium">{category.totalOrders}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="gap-2"
                              onClick={() => generateMessage(buyer.id, category.name)}
                            >
                              <Sparkles className="w-4 h-4 text-purple-500" />
                              Outreach
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <MessageSquare className="w-5 h-5" />
                                Outreach Message: {category.name}
                              </DialogTitle>
                              <DialogDescription>
                                AI-generated message for {buyer.name} regarding their {category.name} order gap.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                              {generating[`${buyer.id}-${category.name}`] ? (
                                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                  <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
                                  <p className="text-sm font-medium">Generating personalised message...</p>
                                </div>
                              ) : (
                                <Textarea 
                                  className="min-h-[200px] text-sm leading-relaxed"
                                  value={aiMessages[`${buyer.id}-${category.name}`] || "Failed to generate message."}
                                  readOnly
                                />
                              )}
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => {
                                navigator.clipboard.writeText(aiMessages[`${buyer.id}-${category.name}`] || "");
                              }}>Copy to Clipboard</Button>
                              <Button>Open Email</Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CategoryChurn;
