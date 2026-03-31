import { useEffect, useState } from "react";
import type { BuyerChurnItem } from "../types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export const OverallChurn = () => {
  const [data, setData] = useState<BuyerChurnItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3040/api/reps/1/churn")
      .then((res) => res.json())
      .then(setData)
      .catch(err => console.error("Error fetching churn data:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    );
  }

  const total = data.length;
  const high = data.filter((d) => d.status === "red").length;
  const medium = data.filter((d) => d.status === "yellow").length;
  const active = data.filter((d) => d.status === "green").length;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold">Total Buyers</CardDescription>
            <CardTitle className="text-3xl font-bold">{total}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-t-4 border-t-destructive">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold">High Risk</CardDescription>
            <CardTitle className="text-3xl font-bold text-destructive">{high}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-t-4 border-t-yellow-500">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold">Medium Risk</CardDescription>
            <CardTitle className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{medium}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-t-4 border-t-green-500">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold">Active</CardDescription>
            <CardTitle className="text-3xl font-bold text-green-600 dark:text-green-400">{active}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold px-1">Buyer Risk Breakdown</h2>
        {data.map((buyer) => (
          <Card key={buyer.id} className="overflow-hidden transition-shadow hover:shadow-md">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                <div className={`w-2 shrink-0 ${
                  buyer.status === "red" ? "bg-destructive" : 
                  buyer.status === "yellow" ? "bg-yellow-500" : "bg-green-500"
                }`} />
                <div className="p-6 flex-1">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                        buyer.status === "red" ? "bg-destructive/10 text-destructive" : 
                        buyer.status === "yellow" ? "bg-yellow-500/10 text-yellow-600" : "bg-green-500/10 text-green-600"
                      }`}>
                        {buyer.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-lg leading-tight">{buyer.name}</div>
                        <div className="text-sm text-muted-foreground">{buyer.email} · {buyer.city}</div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col md:items-end gap-1">
                      <Badge variant={
                        buyer.status === "red" ? "destructive" : 
                        buyer.status === "yellow" ? "secondary" : "outline"
                      } className={
                        buyer.status === "yellow" ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400" : 
                        buyer.status === "green" ? "text-green-600 border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800 dark:text-green-400" : ""
                      }>
                        {buyer.status === "red" ? "High Risk" : buyer.status === "yellow" ? "Medium Risk" : "Active"}
                      </Badge>
                      {buyer.daysSinceLastOrder > buyer.avgCycleDays && (
                        <span className="text-xs font-medium text-destructive mt-1">
                          +{buyer.daysSinceLastOrder - buyer.avgCycleDays}d overdue
                        </span>
                      )}
                    </div>
                  </div>

                  {buyer.status !== "green" ? (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-4 border-t">
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Avg Gap</div>
                        <div className="text-sm font-semibold mt-1">{buyer.avgCycleDays} days</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Last Order</div>
                        <div className="text-sm font-semibold mt-1 text-destructive">{buyer.daysSinceLastOrder}d ago</div>
                      </div>
                      <div className="hidden md:block">
                        <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Overdue By</div>
                        <div className="text-sm font-semibold mt-1 text-destructive">
                          {Math.max(0, buyer.daysSinceLastOrder - buyer.avgCycleDays)} days
                        </div>
                      </div>
                      <div className="hidden md:block">
                        <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Last Date</div>
                        <div className="text-sm font-semibold mt-1">
                          {buyer.lastOrderDate ? new Date(buyer.lastOrderDate).toLocaleDateString() : "N/A"}
                        </div>
                      </div>
                      <div className="col-span-1">
                        <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Status</div>
                        <div className={`text-sm font-bold mt-1 capitalize ${
                          buyer.status === "red" ? "text-destructive" : "text-yellow-600 dark:text-yellow-400"
                        }`}>
                          {buyer.status}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 pt-4 border-t text-sm text-muted-foreground flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      Healthy ordering pattern. No immediate follow-up required.
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default OverallChurn;
