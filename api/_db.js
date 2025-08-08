
import { MongoClient, ServerApiVersion } from "mongodb";

let clientPromise;
export function getMongoClient() {
  if (!clientPromise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("Missing MONGODB_URI env var");
    const client = new MongoClient(uri, {
      serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
    });
    clientPromise = client.connect();
  }
  return clientPromise;
}
export async function getDb() {
  const client = await getMongoClient();
  const dbName = process.env.MONGODB_DB || "queueeasy";
  return client.db(dbName);
}
export async function readJson(req) {
  try {
    if (req.body && typeof req.body === "object") return req.body;
    if (req.body && typeof req.body === "string") return JSON.parse(req.body);
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const raw = Buffer.concat(chunks).toString("utf8");
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}
