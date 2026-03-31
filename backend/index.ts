import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { prisma } from "./prisma/db";
import { logixlysia } from "logixlysia";
import type {
  Status,
  BuyerChurnItem,
  BuyerCategoryChurnItem,
  Category,
} from "./types/server-types";

const app = new Elysia().use(logixlysia());

app.use(cors());

// ─── Helper: days between two dates ──────────────
function daysBetween(date1: Date, date2: Date): number {
  return Math.floor(
    (date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24),
  );
}

// ─── Helper: category status ─────────────────────
// Given last order date and avg cycle days
// returns 'red' | 'yellow' | 'green'
function getCategoryStatus(lastOrderDate: Date, avgCycleDays: number): Status {
  const daysSince = daysBetween(lastOrderDate, new Date());
  if (daysSince > avgCycleDays * 1.5) return "red";
  if (daysSince > avgCycleDays * 1.1) return "yellow";
  return "green";
}

// ─── FEATURE 1: Overall Churn ────────────────────
app.get("/api/reps/:repId/churn", async ({ params }) => {
  const buyers = await prisma.buyer.findMany({
    where: { repId: Number(params.repId) },
    include: {
      orders: {
        orderBy: { orderedAt: "desc" },
        take: 10,
      },
    },
  });

  return buyers
    .map((buyer): BuyerChurnItem => {
      const orders = buyer.orders;
      if (orders.length === 0) {
        return {
          ...buyer,
          daysSinceLastOrder: 999,
          status: "red",
          avgCycleDays: 0,
          lastOrderDate: undefined,
        };
      }

      const lastOrder = orders[0]!.orderedAt;
      const daysSinceLastOrder = daysBetween(lastOrder, new Date());

      // avg cycle = average gap between consecutive orders
      let avgCycleDays = 30; // default
      if (orders.length >= 2) {
        const gaps = orders
          .slice(0, -1)
          .map((o, i) => daysBetween(orders[i + 1]!.orderedAt, o.orderedAt));
        avgCycleDays = Math.round(
          gaps.reduce((a, b) => a + b, 0) / gaps.length,
        );
      }

      const status = getCategoryStatus(lastOrder, avgCycleDays);

      return {
        id: buyer.id,
        name: buyer.name,
        email: buyer.email,
        city: buyer.city,
        daysSinceLastOrder,
        avgCycleDays,
        status,
        lastOrderDate: lastOrder,
      };
    })
    .sort((a, b) => {
      const statuses: readonly Status[] = ["red", "yellow", "green"];
      const statusDiff =
        statuses.indexOf(a.status) - statuses.indexOf(b.status);
      if (statusDiff !== 0) return statusDiff;
      return b.daysSinceLastOrder - a.daysSinceLastOrder;
    });
});

// ─── FEATURE 2: Category Churn (buyer list) ──────
app.get("/api/reps/:repId/category-churn", async ({ params }) => {
  const buyers = await prisma.buyer.findMany({
    where: { repId: Number(params.repId) },
    include: {
      orders: {
        include: { category: true },
        orderBy: { orderedAt: "desc" },
      },
    },
  });

  const result = buyers
    .map((buyer): BuyerCategoryChurnItem => {
      // Group orders by category
      const categoryMap: Record<string, Date[]> = {};

      buyer.orders.forEach((order) => {
        const catName = order.category.name;
        if (!categoryMap[catName]) categoryMap[catName] = [];
        categoryMap[catName].push(order.orderedAt);
      });

      // Score each category
      const categories: Category[] = Object.entries(categoryMap).map(
        ([name, dates]) => {
          const lastOrder = dates[0]!; // already sorted desc
          const daysSince = daysBetween(lastOrder, new Date());

          // avg cycle for this category
          let avgCycleDays = 30;
          if (dates.length >= 2) {
            const gaps = dates
              .slice(0, -1)
              .map((d, i) => daysBetween(dates[i + 1]!, d));
            avgCycleDays = Math.round(
              gaps.reduce((a, b) => a + b, 0) / gaps.length,
            );
          }

          const status = getCategoryStatus(lastOrder, avgCycleDays);

          return {
            name,
            lastOrderDate: lastOrder,
            daysSinceLastOrder: daysSince,
            avgCycleDays,
            totalOrders: dates.length,
            status,
          };
        },
      );

      const coldCount = categories.filter((c) => c.status === "red").length;
      const warmCount = categories.filter((c) => c.status === "yellow").length;

      // overall buyer status
      const buyerStatus =
        coldCount > 0 ? "red" : warmCount > 0 ? "yellow" : "green";

      return {
        id: buyer.id,
        name: buyer.name,
        email: buyer.email,
        city: buyer.city,
        categories,
        coldCount,
        warmCount,
        buyerStatus,
      };
    })
    .filter((b) => {
      if (b.coldCount > 0 || b.warmCount > 0) return true;
      else {
        console.log(`Buyer ${b.name} has no issues, skipping`);
        return false;
      }
    }) // only show buyers with issues
    .sort((a, b) => {
      const statuses: readonly Status[] = ["red", "yellow", "green"];
      const statusDiff =
        statuses.indexOf(a.buyerStatus) - statuses.indexOf(b.buyerStatus);
      if (statusDiff !== 0) return statusDiff;
      return b.coldCount - a.coldCount;
    });
  return result;
});

// ─── FEATURE 2: AI Message for cold category ─────
app.post(
  "/api/reps/:repId/category-churn/:buyerId/:categoryName/message",
  async (context) => {
    const { params, body } = context;
    const params_typed = params as {
      repId: string;
      buyerId: string;
      categoryName: string;
    };
    const body_typed = body as {
      daysSince: number;
      avgCycle: number;
      totalOrders: number;
    };

    const buyer = await prisma.buyer.findUnique({
      where: { id: Number(params_typed.buyerId) },
      include: { rep: true },
    });

    if (!buyer) return { error: "Buyer not found" };

    const prompt = `
You are a wholesale sales rep writing a short, friendly outreach message.

Context:
- Buyer name: ${buyer.name}
- City of the Buyer: ${buyer.city}
- Category they stopped ordering: ${params_typed.categoryName}
- Days since last order in this category: ${body_typed.daysSince} days
- Their usual reorder cycle: every ${body_typed.avgCycle} days
- How many times they ordered this before: ${body_typed.totalOrders} times
- Sales rep name: ${buyer.rep.name}

Write a SHORT (3-4 sentences max), warm, personalised message from the rep to the buyer.
Reference the specific category gap. Don't be pushy. Sound human.
Just the message text. No subject line. No greeting prefix . No Emojis, Include the input data we have given to you in that email and make it personalised, use backslash n for new lines.
  `;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 150,
      }),
    });

    const data = (await response.json()) as {
      choices: { message: { content: string } }[];
    };

    return { message: data?.choices[0]?.message.content };
  },
);

// ─── FEATURE 3: Blind Spot Detector ──────────────
app.get("/api/reps/:repId/blind-spots", async ({ params }) => {
  const buyers = await prisma.buyer.findMany({
    where: { repId: Number(params.repId) },
    include: {
      orders: { orderBy: { orderedAt: "desc" } },
      contacts: { orderBy: { contactedAt: "desc" } },
    },
  });

  return buyers.map((buyer) => {
    const orders = buyer.orders;
    const contacts = buyer.contacts;

    // ── Potential Score (0-100) ──
    // Based on: total revenue, order frequency, growth trend
    const totalRevenue = orders.reduce((sum, o) => sum + o.amount, 0);
    const orderCount = orders.length;
    const revenueScore = Math.min(totalRevenue / 100, 50); // max 50 pts
    const frequencyScore = Math.min(orderCount * 3, 30); // max 30 pts

    // growth trend: is last 3 orders higher than previous 3?
    let growthScore = 0;
    if (orders.length >= 6) {
      const recent = orders.slice(0, 3).reduce((s, o) => s + o.amount, 0);
      const older = orders.slice(3, 6).reduce((s, o) => s + o.amount, 0);
      if (recent > older) growthScore = 20;
    }

    const potentialScore = Math.round(
      Math.min(revenueScore + frequencyScore + growthScore, 100),
    );

    // ── Attention Score (0-100) ──
    // Based on: last contact, last order view, notes logged
    const lastContact = contacts[0]?.contactedAt;
    const lastOrder = orders[0]?.orderedAt;

    const daysSinceContact = lastContact
      ? daysBetween(lastContact, new Date())
      : 999;

    const daysSinceOrder = lastOrder ? daysBetween(lastOrder, new Date()) : 999;

    const contactScore = Math.max(0, 50 - daysSinceContact); // decays over time
    const orderScore = Math.max(0, 30 - daysSinceOrder * 0.5);
    const notesScore = Math.min(contacts.length * 5, 20); // max 20 pts

    const attentionScore = Math.round(
      Math.min(contactScore + orderScore + notesScore, 100),
    );

    // ── Quadrant ──
    const isBlindSpot = potentialScore > 50 && attentionScore < 50;

    return {
      id: buyer.id,
      name: buyer.name,
      email: buyer.email,
      city: buyer.city,
      potentialScore,
      attentionScore,
      isBlindSpot,
      totalRevenue: Math.round(totalRevenue),
      orderCount,
      daysSinceContact,
      lastContactType: lastContact ? contacts[0]?.contactType : null,
      lastContactNote: lastContact ? contacts[0]?.note : null,
      lastOrderDate: lastOrder,
    };
  });
});

// ─── Log a Contact ────────────────────────────────
app.post("/api/contacts", async (context) => {
  const body = context.body as {
    repId: number;
    buyerId: number;
    contactType: string;
    note?: string;
  };
  const contact = await prisma.repContact.create({
    data: {
      repId: body.repId,
      buyerId: body.buyerId,
      contactType: body.contactType,
      note: body.note ?? "",
      contactedAt: new Date(),
    },
  });
  return contact;
});

app.listen(3040);
