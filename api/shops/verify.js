
import { getDb } from "../_db.js";

export default async function handler(req, res) {
  const db = await getDb();
  const shops = db.collection("shops");
  const { shopId, code } = req.query;
  if (!shopId || !code) return res.status(400).json({ error: "shopId and code required" });
  const { ObjectId } = await import("mongodb");
  const id = new ObjectId(shopId);
  const shop = await shops.findOne({ _id: id });
  if (!shop) return res.status(404).json({ error: "Shop not found" });
  return res.status(200).json({ valid: String(code) === String(shop.adminCode) });
}
