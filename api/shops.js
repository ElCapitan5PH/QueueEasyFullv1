
import { getDb, readJson } from "./_db.js";

export default async function handler(req, res) {
  const db = await getDb();
  const shops = db.collection("shops");

  if (req.method === "GET") {
    const all = await shops.find({}).toArray();
    return res.status(200).json(all);
  }

  if (req.method === "POST") {
    const body = await readJson(req);
    if (!body.name) return res.status(400).json({ error: "name required" });
    const doc = {
      name: body.name,
      address: body.address || "",
      phone: body.phone || "",
      hours: body.hours || { open: 9, close: 19 },
      adminCode: body.adminCode || "1234",
      staff: body.staff || [{ id: "s1", name: "Alex", role: "Barber" }],
      createdAt: Date.now(),
    };
    const r = await shops.insertOne(doc);
    return res.status(201).json({ _id: r.insertedId, ...doc });
  }

  if (req.method === "PUT") {
    const body = await readJson(req);
    if (!body._id) return res.status(400).json({ error: "_id required" });
    const { ObjectId } = await import("mongodb");
    const id = new ObjectId(body._id);
    const update = { $set: { ...body, _id: id } };
    await shops.updateOne({ _id: id }, update);
    const doc = await shops.findOne({ _id: id });
    return res.status(200).json(doc);
  }

  if (req.method === "DELETE") {
    const { ObjectId } = await import("mongodb");
    const id = req.query.id;
    if (!id) return res.status(400).json({ error: "id required" });
    await shops.deleteOne({ _id: new ObjectId(id) });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
