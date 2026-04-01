import { prisma } from "./db";

async function main() {
  console.log("Cleaning up database...");
  await prisma.repContact.deleteMany();
  await prisma.order.deleteMany();
  await prisma.buyer.deleteMany();
  await prisma.category.deleteMany();
  await prisma.rep.deleteMany();

  // ─── Categories ───────────────────────────────
  console.log("Creating categories...");
  const categoryNames = [
    "Candles", "Lamps", "Rugs", "Vases", "Chairs", 
    "Tables", "Mirrors", "Wall Art", "Pillows", "Throws"
  ];
  const categories = await Promise.all(
    categoryNames.map(name => prisma.category.create({ data: { name } }))
  );
  
  const catMap: Record<string, any> = {};
  categories.forEach(c => catMap[c.name] = c);

  // ─── Single Rep ───────────────────────────────
  console.log("Creating single rep...");
  const rep = await prisma.rep.create({
    data: {
      name: "Mark Wilson",
      email: "mark@wholesale.com",
      region: "Midwest",
    },
  });

  // ─── Helper ───────────────────────────────────
  const daysAgo = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
  };

  // ─── Buyers (15) ──────────────────────────────
  console.log("Creating 15 buyers...");
  const buyerData = [
    { name: "Rustic Home Goods", email: "sarah@rustichome.com", city: "Chicago" },
    { name: "Midwest Gifts", email: "tom@midwestgifts.com", city: "Detroit" },
    { name: "Lovenest Lights", email: "amy@lovenest.com", city: "Columbus" },
    { name: "Tipper's Point", email: "joe@tipperspoint.com", city: "Indianapolis" },
    { name: "Beauty Homes", email: "lisa@beautyhomes.com", city: "Milwaukee" },
    { name: "Lakeview Decor", email: "kevin@lakeview.com", city: "Chicago" },
    { name: "Urban Dwelling", email: "mike@urbandwelling.com", city: "Minneapolis" },
    { name: "Prairie Designs", email: "claire@prairie.com", city: "Des Moines" },
    { name: "Windy City Wholesalers", email: "dan@windycity.com", city: "Chicago" },
    { name: "Northern Comforts", email: "beth@northern.com", city: "Madison" },
    { name: "Heartland Haven", email: "mark@heartland.com", city: "Omaha" },
    { name: "River North Retail", email: "julia@rivernorth.com", city: "Chicago" },
    { name: "Grand Avenue Gifts", email: "sam@grandave.com", city: "St. Paul" },
    { name: "Lakeside Living", email: "nina@lakeside.com", city: "Cleveland" },
    { name: "Modern Midwest", email: "alex@modernmidwest.com", city: "Kansas City" },
  ];

  const createdBuyers = await Promise.all(
    buyerData.map(b => prisma.buyer.create({ 
      data: { ...b, region: "Midwest", repId: rep.id } 
    }))
  );

  // ─── Orders (approx 60) ────────────────────────
  console.log("Creating dense order data...");
  const orderEntries: any[] = [];

  createdBuyers.forEach((buyer, index) => {
    // Each buyer gets 3-5 categories they buy from
    const buyerCats = categories.slice(index % 5, (index % 5) + 4);
    
    buyerCats.forEach((cat, cIdx) => {
      const isChurned = (index + cIdx) % 3 === 0; // Simulate some churn patterns
      const isHealthy = !isChurned;
      
      if (isHealthy) {
        // Active orders
        orderEntries.push({ buyerId: buyer.id, categoryId: cat.id, amount: 200 + Math.random() * 800, orderedAt: daysAgo(5 + Math.random() * 20) });
        orderEntries.push({ buyerId: buyer.id, categoryId: cat.id, amount: 200 + Math.random() * 800, orderedAt: daysAgo(35 + Math.random() * 20) });
        orderEntries.push({ buyerId: buyer.id, categoryId: cat.id, amount: 200 + Math.random() * 800, orderedAt: daysAgo(65 + Math.random() * 20) });
      } else {
        // Churned orders (last one long ago)
        orderEntries.push({ buyerId: buyer.id, categoryId: cat.id, amount: 200 + Math.random() * 800, orderedAt: daysAgo(95 + Math.random() * 30) });
        orderEntries.push({ buyerId: buyer.id, categoryId: cat.id, amount: 200 + Math.random() * 800, orderedAt: daysAgo(130 + Math.random() * 30) });
        orderEntries.push({ buyerId: buyer.id, categoryId: cat.id, amount: 200 + Math.random() * 800, orderedAt: daysAgo(170 + Math.random() * 30) });
      }
    });
  });

  await prisma.order.createMany({ data: orderEntries });

  // ─── Rep Contacts (approx 20) ──────────────────
  console.log("Creating rep contact history...");
  const contactEntries: any[] = [];
  const contactTypes = ["call", "email", "visit"];

  createdBuyers.forEach((buyer, index) => {
    // At least one contact for every buyer
    contactEntries.push({
      repId: rep.id,
      buyerId: buyer.id,
      contactType: contactTypes[index % 3],
      note: `Regular check-in with ${buyer.name}.`,
      contactedAt: daysAgo(10 + Math.random() * 50)
    });

    // Extra contacts for churned-looking ones
    if (index % 3 === 0) {
      contactEntries.push({
        repId: rep.id,
        buyerId: buyer.id,
        contactType: "call",
        note: `Attempted to discuss recent drop in orders.`,
        contactedAt: daysAgo(2 + Math.random() * 5)
      });
    }
  });

  await prisma.repContact.createMany({ data: contactEntries });

  console.log(`✅ Seed complete: 1 Rep, ${createdBuyers.length} Buyers, ${categories.length} Categories, ${orderEntries.length} Orders, ${contactEntries.length} Contacts.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
