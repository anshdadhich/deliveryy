import { MongoClient } from "mongodb";
import { MONGODB_URL } from "@/config/env";

let client: MongoClient | null = null;


export async function connectDB(): Promise<MongoClient> {
  if (!client) {
    client = new MongoClient(MONGODB_URL);
    await client.connect();
    console.log("✅ Connected to MongoDB Atlas");
  }
  return client;
}

export const SHIPMENTS_COLLECTION: string = "Shipments";
export const SHIPMENTS_DELAYED_COLLECTION: string = "ShipmentDelayed";
