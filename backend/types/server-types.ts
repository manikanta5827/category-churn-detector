export type Status = "red" | "yellow" | "green";

export type BuyerChurnItem = {
  id: number;
  name: string;
  email: string;
  city: string;
  daysSinceLastOrder: number;
  avgCycleDays: number;
  status: Status;
  lastOrderDate?: Date;
};

export type Category = {
  name: string;
  lastOrderDate: Date;
  daysSinceLastOrder: number;
  avgCycleDays: number;
  totalOrders: number;
  status: Status;
};

export type BuyerCategoryChurnItem = {
  id: number;
  name: string;
  email: string;
  city: string;
  categories: Category[];
  coldCount: number;
  warmCount: number;
  buyerStatus: Status;
};
