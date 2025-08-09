
import { getDb } from "./_db.js";

export default async function handler(req, res) {
  const db = await getDb();
  const shops = db.collection("shops");
  const bookings = db.collection("bookings");

  const existing = await shops.findOne({ name: "QueueEasy Demo – Pioneer" });
  let shopId;
  if (!existing) {
    const shopDoc = {
      name: "QueueEasy Demo – Pioneer",
      address: "123 Pioneer St, Mandaluyong, Metro Manila",
      phone: "+63 917 000 0000",
      hours: { open: 9, close: 19 },
      adminCode: "1234",
      staff: [
        { id: "s1", name: "Alex", role: "Barber" },
        { id: "s2", name: "Bea", role: "Stylist" },
        { id: "s3", name: "Carlo", role: "Therapist" }
      ],
      createdAt: Date.now(),
    };
    const r = await shops.insertOne(shopDoc);
    shopId = String(r.insertedId);
  } else {
    shopId = String(existing._id);
  }

  const today = new Date().toISOString().slice(0,10);
  const already = await bookings.findOne({ shopId, date: today });
  if (!already) {
    await bookings.insertMany([
      { shopId, date: today, slot: "10:00", staffId: "s1", serviceId: "svc1", name: "Mina", phone: "0917xxxxxxx", status: "booked", createdAt: Date.now() },
      { shopId, date: today, slot: "10:30", staffId: "s2", serviceId: "svc2", name: "Paolo", phone: "0918xxxxxxx", status: "booked", createdAt: Date.now() },
      { shopId, date: today, slot: "11:00", staffId: "s3", serviceId: "svc4", name: "Ivy", phone: "0917xxxxxxx", status: "booked", createdAt: Date.now() },
    ]);
  }

  const all = await shops.find({}).toArray();
  return res.status(200).json({ ok: true, shops: all });
}
