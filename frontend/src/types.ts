export type Status = "red" | "yellow" | "green";

export interface BuyerChurnItem {
  id: number;
  name: string;
  email: string;
  city: string;
  daysSinceLastOrder: number;
  avgCycleDays: number;
  status: Status;
  lastOrderDate: string | undefined;
}

export interface Category {
  name: string;
  lastOrderDate: string;
  daysSinceLastOrder: number;
  avgCycleDays: number;
  totalOrders: number;
  status: Status;
}

export interface BuyerCategoryChurnItem {
  id: number;
  name: string;
  email: string;
  city: string;
  categories: Category[];
  coldCount: number;
  warmCount: number;
  buyerStatus: Status;
}

export interface BlindSpotItem {
  id: number;
  name: string;
  email: string;
  city: string;
  potentialScore: number;
  attentionScore: number;
  isBlindSpot: boolean;
  totalRevenue: number;
  orderCount: number;
  daysSinceContact: number;
  lastContactType: string | null;
  lastContactNote: string | null;
  lastOrderDate: string | null;
}
