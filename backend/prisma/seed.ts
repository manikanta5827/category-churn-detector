import { prisma } from "./db";

async function main() {
  // ─── Categories ───────────────────────────────
  const categories = await Promise.all([
    prisma.category.create({ data: { name: "Candles" } }),
    prisma.category.create({ data: { name: "Lamps" } }),
    prisma.category.create({ data: { name: "Rugs" } }),
    prisma.category.create({ data: { name: "Vases" } }),
    prisma.category.create({ data: { name: "Chairs" } }),
  ]);

  // ─── Rep ──────────────────────────────────────
  const rep = await prisma.rep.create({
    data: {
      name: "Mark Wilson",
      email: "mark@wholesale.com",
      region: "Midwest",
    },
  });

  // ─── Buyers ───────────────────────────────────
  const buyers = await Promise.all([
    prisma.buyer.create({
      data: {
        name: "Rustic Home Goods",
        email: "sarah@rustichome.com",
        city: "Chicago",
        region: "Midwest",
        repId: rep.id,
      },
    }),
    prisma.buyer.create({
      data: {
        name: "Midwest Gifts",
        email: "tom@midwestgifts.com",
        city: "Detroit",
        region: "Midwest",
        repId: rep.id,
      },
    }),
    prisma.buyer.create({
      data: {
        name: "Lovenest Lights",
        email: "amy@lovenest.com",
        city: "Columbus",
        region: "Midwest",
        repId: rep.id,
      },
    }),
    prisma.buyer.create({
      data: {
        name: "Tipper's Point",
        email: "joe@tipperspoint.com",
        city: "Indianapolis",
        region: "Midwest",
        repId: rep.id,
      },
    }),
    prisma.buyer.create({
      data: {
        name: "Beauty Homes",
        email: "lisa@beautyhomes.com",
        city: "Milwaukee",
        region: "Midwest",
        repId: rep.id,
      },
    }),
  ]);

  // ─── Helper ───────────────────────────────────
  // daysAgo(n) → Date object n days in the past
  const daysAgo = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
  };

  // ─── Orders ───────────────────────────────────
  // Rustic Home — Candles went cold (last order 71 days ago)
  // Rugs still active
  const [candles, lamps, rugs, vases, chairs] = categories;
  const [rustic, midwest, lovenest, tippers, beauty] = buyers;

  await prisma.order.createMany({
    data: [
      // Rustic — Candles: 6 orders then STOPPED 71 days ago
      {
        buyerId: rustic.id,
        categoryId: candles.id,
        amount: 420,
        orderedAt: daysAgo(71),
      },
      {
        buyerId: rustic.id,
        categoryId: candles.id,
        amount: 390,
        orderedAt: daysAgo(99),
      },
      {
        buyerId: rustic.id,
        categoryId: candles.id,
        amount: 410,
        orderedAt: daysAgo(127),
      },
      {
        buyerId: rustic.id,
        categoryId: candles.id,
        amount: 380,
        orderedAt: daysAgo(155),
      },
      {
        buyerId: rustic.id,
        categoryId: candles.id,
        amount: 400,
        orderedAt: daysAgo(183),
      },
      {
        buyerId: rustic.id,
        categoryId: candles.id,
        amount: 430,
        orderedAt: daysAgo(211),
      },

      // Rustic — Rugs: still active
      {
        buyerId: rustic.id,
        categoryId: rugs.id,
        amount: 1200,
        orderedAt: daysAgo(8),
      },
      {
        buyerId: rustic.id,
        categoryId: rugs.id,
        amount: 1100,
        orderedAt: daysAgo(38),
      },

      // Rustic — Lamps: went cold 55 days ago
      {
        buyerId: rustic.id,
        categoryId: lamps.id,
        amount: 600,
        orderedAt: daysAgo(55),
      },
      {
        buyerId: rustic.id,
        categoryId: lamps.id,
        amount: 580,
        orderedAt: daysAgo(90),
      },
      {
        buyerId: rustic.id,
        categoryId: lamps.id,
        amount: 610,
        orderedAt: daysAgo(125),
      },

      // Midwest Gifts — Rugs went cold
      {
        buyerId: midwest.id,
        categoryId: rugs.id,
        amount: 900,
        orderedAt: daysAgo(62),
      },
      {
        buyerId: midwest.id,
        categoryId: rugs.id,
        amount: 850,
        orderedAt: daysAgo(94),
      },
      {
        buyerId: midwest.id,
        categoryId: rugs.id,
        amount: 920,
        orderedAt: daysAgo(126),
      },

      // Midwest Gifts — Candles still active
      {
        buyerId: midwest.id,
        categoryId: candles.id,
        amount: 300,
        orderedAt: daysAgo(5),
      },
      {
        buyerId: midwest.id,
        categoryId: candles.id,
        amount: 280,
        orderedAt: daysAgo(35),
      },

      // Lovenest — Vases went cold
      {
        buyerId: lovenest.id,
        categoryId: vases.id,
        amount: 500,
        orderedAt: daysAgo(48),
      },
      {
        buyerId: lovenest.id,
        categoryId: vases.id,
        amount: 480,
        orderedAt: daysAgo(78),
      },
      {
        buyerId: lovenest.id,
        categoryId: vases.id,
        amount: 510,
        orderedAt: daysAgo(108),
      },

      // Lovenest — Lamps active
      {
        buyerId: lovenest.id,
        categoryId: lamps.id,
        amount: 700,
        orderedAt: daysAgo(10),
      },

      // Tippers — Chairs went cold
      {
        buyerId: tippers.id,
        categoryId: chairs.id,
        amount: 2000,
        orderedAt: daysAgo(55),
      },
      {
        buyerId: tippers.id,
        categoryId: chairs.id,
        amount: 1900,
        orderedAt: daysAgo(90),
      },

      // Beauty Homes — all active (healthy buyer)
      {
        buyerId: beauty.id,
        categoryId: candles.id,
        amount: 350,
        orderedAt: daysAgo(7),
      },
      {
        buyerId: beauty.id,
        categoryId: lamps.id,
        amount: 800,
        orderedAt: daysAgo(12),
      },
      {
        buyerId: beauty.id,
        categoryId: rugs.id,
        amount: 1500,
        orderedAt: daysAgo(15),
      },
    ],
  });

  // ─── Rep Contacts ─────────────────────────────
  await prisma.repContact.createMany({
    data: [
      {
        repId: rep.id,
        buyerId: rustic.id,
        contactType: "call",
        note: "Discussed spring collection",
        contactedAt: daysAgo(45),
      },
      {
        repId: rep.id,
        buyerId: midwest.id,
        contactType: "email",
        note: "Sent catalog",
        contactedAt: daysAgo(20),
      },
      {
        repId: rep.id,
        buyerId: beauty.id,
        contactType: "visit",
        note: "In person meeting",
        contactedAt: daysAgo(5),
      },
    ],
  });

  console.log("✅ Seed complete");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
