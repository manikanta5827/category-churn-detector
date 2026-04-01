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

// ─── FEATURE 1.5: AI Message for overall churn ─────
app.post(
  "/api/reps/:repId/churn/:buyerId/message",
  async ({ params, body }) => {
    const { buyerId } = params;
    const { daysSince, avgCycle } = body as {
      daysSince: number;
      avgCycle: number;
    };

    const buyer = await prisma.buyer.findUnique({
      where: { id: Number(buyerId) },
      include: { rep: true },
    });

    if (!buyer) return { error: "Buyer not found" };

    const prompt = `
You are a wholesale sales rep writing a short, friendly outreach message to a buyer who hasn't ordered anything recently.

Context:
- Buyer name: ${buyer.name}
- City: ${buyer.city}
- Days since last order: ${daysSince} days
- Their usual reorder cycle: every ${avgCycle} days
- Sales rep name: ${buyer.rep.name}

Write a SHORT, warm, professional message.
Return ONLY valid JSON, no markdown, no extra text:
{"subject": "...", "body": "..."}
`;

    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            max_tokens: 300,
          }),
        },
      );

      if (!response.ok) return { error: "Failed to generate AI message" };
      const data = (await response.json()) as any;
      return JSON.parse(data?.choices?.[0]?.message?.content || "{}");
    } catch (error) {
      return { error: "An unexpected error occurred" };
    }
  },
);

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
      // Only show buyers who have ordered before (at least one category)
      // and filter based on status if needed, but here we just want to ensure they have categories
      return b.categories.length > 0;
    })
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
  async ({ params, body }) => {
    const { buyerId, categoryName } = params;
    const { daysSince, avgCycle, totalOrders } = body as {
      daysSince: number;
      avgCycle: number;
      totalOrders: number;
    };

    const buyer = await prisma.buyer.findUnique({
      where: { id: Number(buyerId) },
      include: { rep: true },
    });

    if (!buyer) return { error: "Buyer not found" };

    const prompt = `
You are a wholesale sales rep writing a short, friendly outreach message.

Context:
- Buyer name: ${buyer.name}
- City: ${buyer.city}
- Category they stopped ordering: ${categoryName}
- Days since last order in this category: ${daysSince} days
- Their usual reorder cycle: every ${avgCycle} days
- How many times they ordered this before: ${totalOrders} times
- Sales rep name: ${buyer.rep.name}

Write a SHORT (3-4 sentences max), warm, personalised message. Reference the specific category gap.
Return ONLY valid JSON, no markdown, no extra text:
{"subject": "...", "body": "..."}
`;

    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            max_tokens: 300,
          }),
        },
      );

      if (!response.ok) return { error: "Failed to generate AI message" };
      const data = (await response.json()) as any;
      return JSON.parse(data?.choices?.[0]?.message?.content || "{}");
    } catch (error) {
      return { error: "An unexpected error occurred" };
    }
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

  const now = new Date();

  // ─── Contact quality weights ─────────────────────────────────────────────
  // Visit = physically showed up, strongest relationship signal
  // Call  = real conversation, medium signal
  // Email = async, low effort, weakest signal
  const CONTACT_QUALITY: Record<string, number> = {
    visit: 10,
    call: 6,
    email: 3,
  };

  // ─── Step 1: Raw signals per buyer ───────────────────────────────────────

  const raw = buyers.map((buyer) => {
    const orders = buyer.orders;
    const contacts = buyer.contacts;

    // ── Potential signals ────────────────────────────────────────────────

    const totalRevenue = orders.reduce((s, o) => s + o.amount, 0);
    const orderCount = orders.length;
    const avgOrderSize = orderCount > 0 ? totalRevenue / orderCount : 0;

    // Active window = days from first order to now
    const firstOrderDate =
      orders.length > 0 ? orders[orders.length - 1]!.orderedAt : now;
    const activeWindowDays = Math.max(1, daysBetween(firstOrderDate, now));

    // Order frequency = orders per 30 days
    const ordersPerMonth = (orderCount / activeWindowDays) * 30;

    // Growth trend: compare last 90 days revenue vs previous 90 days revenue
    // This smooths out individual order noise and seasonal spikes
    const ninetyDaysAgo = new Date(now);
    ninetyDaysAgo.setDate(now.getDate() - 90);
    const oneEightyDaysAgo = new Date(now);
    oneEightyDaysAgo.setDate(now.getDate() - 180);

    const last90Revenue = orders
      .filter((o) => o.orderedAt >= ninetyDaysAgo)
      .reduce((s, o) => s + o.amount, 0);

    const prev90Revenue = orders
      .filter(
        (o) => o.orderedAt >= oneEightyDaysAgo && o.orderedAt < ninetyDaysAgo,
      )
      .reduce((s, o) => s + o.amount, 0);

    // Growth ratio: >1 = growing, <1 = shrinking, 1 = stable
    // If no previous data, treat as stable (1.0)
    const growthRatio =
      prev90Revenue > 0
        ? last90Revenue / prev90Revenue
        : last90Revenue > 0
          ? 1.2 // new buyer with recent orders = positive signal
          : 0.8; // no recent orders at all = negative signal

    // ── Attention signals ────────────────────────────────────────────────

    // Days since last contact of ANY type
    const lastContactDate = contacts[0]?.contactedAt ?? null;
    const daysSinceContact = lastContactDate
      ? daysBetween(lastContactDate, now)
      : 999;

    // Weighted contact score = sum of quality weights for all contacts
    // A visit counts more than 3 emails — correctly reflects rep effort
    const weightedContactScore = contacts.reduce((total, contact) => {
      const weight = CONTACT_QUALITY[contact.contactType] ?? 2;
      return total + weight;
    }, 0);

    // Contact recency decay: recent contacts matter more than old ones
    // Each contact is worth less the older it is
    // Formula: quality_weight * e^(-days_since / 60)
    // This means a visit 10 days ago scores much higher than a visit 90 days ago
    const decayedContactScore = contacts.reduce((total, contact) => {
      const weight = CONTACT_QUALITY[contact.contactType] ?? 2;
      const daysAgo = daysBetween(contact.contactedAt, now);
      const decayFactor = Math.exp(-daysAgo / 60); // half-life ~60 days
      return total + weight * decayFactor;
    }, 0);

    // Note richness: only count contacts with meaningful notes
    // Weight by contact type — a visit note is worth more than an email note
    const noteRichnessScore = contacts.reduce((total, contact) => {
      const hasNote = contact.note && contact.note.trim().length > 10;
      if (!hasNote) return total;
      const weight = CONTACT_QUALITY[contact.contactType] ?? 2;
      return total + weight;
    }, 0);

    // Best contact type ever used for this buyer
    // Tells us if this rep has ever done a high-quality interaction
    const bestContactType = contacts.reduce((best: string | null, contact) => {
      const currentWeight = CONTACT_QUALITY[contact.contactType] ?? 0;
      const bestWeight = best ? (CONTACT_QUALITY[best] ?? 0) : 0;
      return currentWeight > bestWeight ? contact.contactType : best;
    }, null);

    return {
      id: buyer.id,
      name: buyer.name,
      email: buyer.email,
      city: buyer.city,
      // potential raws
      totalRevenue,
      orderCount,
      avgOrderSize,
      ordersPerMonth,
      growthRatio,
      // attention raws
      daysSinceContact,
      weightedContactScore,
      decayedContactScore,
      noteRichnessScore,
      bestContactType,
      // for response
      lastContactType: contacts[0]?.contactType ?? null,
      lastContactNote: contacts[0]?.note ?? null,
      lastOrderDate: orders[0]?.orderedAt ?? null,
    };
  });

  // ─── Step 2: Normalise each signal across the portfolio ──────────────────
  // Each signal is scaled relative to the best/worst in this rep's portfolio
  // This ensures scores spread across 0–100 regardless of portfolio size

  const normalise = (values: number[], invert = false): number[] => {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    if (range === 0) return values.map(() => 50);
    return values.map((v) => {
      const pct = ((v - min) / range) * 100;
      return Math.round(invert ? 100 - pct : pct);
    });
  };

  // Potential components
  const normRevenue = normalise(raw.map((r) => r.totalRevenue));
  const normAvgOrderSize = normalise(raw.map((r) => r.avgOrderSize));
  const normOrderFrequency = normalise(raw.map((r) => r.ordersPerMonth));
  const normGrowth = normalise(raw.map((r) => r.growthRatio));

  // Attention components
  // daysSinceContact is INVERTED — more days = less attention
  const normContactRecency = normalise(
    raw.map((r) => r.daysSinceContact),
    true,
  );
  const normDecayedContact = normalise(raw.map((r) => r.decayedContactScore));
  const normNoteRichness = normalise(raw.map((r) => r.noteRichnessScore));

  // ─── Step 3: Weighted combination ────────────────────────────────────────

  return raw.map((buyer, i) => {
    // ── Potential Score ──
    // Total revenue (35%): how much has this buyer spent overall
    // Avg order size (25%): are they a high-value buyer per transaction
    // Order frequency (25%): how regularly do they order
    // Growth trend (15%): are they growing or shrinking
    const potentialScore = Math.round(
      normRevenue[i]! * 0.35 +
        normAvgOrderSize[i]! * 0.25 +
        normOrderFrequency[i]! * 0.25 +
        normGrowth[i]! * 0.15,
    );

    // ── Attention Score ──
    // Decayed contact score (50%): recent high-quality contacts matter most
    //   — a visit last week beats 10 old emails
    // Contact recency (35%): how recently did rep touch this account at all
    // Note richness (15%): does the rep document the relationship
    const attentionScore = Math.round(
      normDecayedContact[i]! * 0.5 +
        normContactRecency[i]! * 0.35 +
        normNoteRichness[i]! * 0.15,
    );

    const isBlindSpot = potentialScore > 50 && attentionScore < 50;

    return {
      id: buyer.id,
      name: buyer.name,
      email: buyer.email,
      city: buyer.city,
      potentialScore,
      attentionScore,
      isBlindSpot,
      totalRevenue: Math.round(buyer.totalRevenue),
      orderCount: buyer.orderCount,
      daysSinceContact: buyer.daysSinceContact,
      bestContactType: buyer.bestContactType,
      lastContactType: buyer.lastContactType,
      lastContactNote: buyer.lastContactNote,
      lastOrderDate: buyer.lastOrderDate,
    };
  });
});

// ─── Log a Contact ────────────────────────────────
app.post("/api/contacts", async ({ body }) => {
  const { repId, buyerId, contactType, note } = body as {
    repId: number;
    buyerId: number;
    contactType: string;
    note?: string;
  };
  const contact = await prisma.repContact.create({
    data: {
      repId,
      buyerId,
      contactType,
      note: note ?? "",
      contactedAt: new Date(),
    },
  });
  return contact;
});

app.get("/api/buyers/:buyerId/contacts", async ({ params }) => {
  const contacts = await prisma.repContact.findMany({
    where: { buyerId: Number(params.buyerId) },
    orderBy: { contactedAt: "desc" },
  });
  return contacts;
});

app.listen(3040);
