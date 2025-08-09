
import { getDb, readJson } from "./_db.js";

export default async function handler(req, res) {
  const db = await getDb();
  const bookings = db.collection("bookings");
  const shops = db.collection("shops");

  if (req.method === "GET") {
    const { shopId, date } = req.query;
    const filter = {};
    if (shopId) filter.shopId = shopId;
    if (date) filter.date = date;
    const all = await bookings.find(filter).toArray();
    return res.status(200).json(all);
  }

  if (req.method === "POST") {
    const body = await readJson(req);
    if (!body.shopId || !body.date || !body.slot || !body.staffId) {
      return res.status(400).json({ error: "shopId, date, slot, staffId required" });
    }
    if (body.adminCode) {
      const { ObjectId } = await import("mongodb");
      const shop = await shops.findOne({ _id: new ObjectId(body.shopId) });
      if (!shop || String(shop.adminCode) !== String(body.adminCode)) {
        return res.status(403).json({ error: "Invalid admin code" });
      }
    }
    const doc = {
      shopId: body.shopId,
      date: body.date,
      slot: body.slot,
      staffId: body.staffId,
      serviceId: body.serviceId || "svc1",
      name: body.name || "Walk-in",
      phone: body.phone || "",
      status: "booked",
      createdAt: Date.now(),
    };
    const r = await bookings.insertOne(doc);
    return res.status(201).json({ _id: r.insertedId, ...doc });
  }

  if (req.method === "PUT") {
    const body = await readJson(req);
    if (!body.id) return res.status(400).json({ error: "id required" });
    if (!body.shopId || !body.adminCode) return res.status(403).json({ error: "Missing admin credentials" });
    const { ObjectId } = await import("mongodb");
    const shop = await shops.findOne({ _id: new ObjectId(body.shopId) });
    if (!shop || String(shop.adminCode) !== String(body.adminCode)) {
      return res.status(403).json({ error: "Invalid admin code" });
    }
    const _id = new ObjectId(body.id);
    const update = { $set: {} };
    if (body.status) update.$set.status = body.status;
    if (body.name) update.$set.name = body.name;
    await bookings.updateOne({ _id }, update);
    const doc = await bookings.findOne({ _id });
    return res.status(200).json(doc);
  }

  if (req.method === "DELETE") {
    const { ObjectId } = await import("mongodb");
    const id = req.query.id;
    if (!id) return res.status(400).json({ error: "id required" });
    await bookings.deleteOne({ _id: new ObjectId(id) });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
