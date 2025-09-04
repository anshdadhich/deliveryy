import { NextResponse } from "next/server";
import { connectDB, SHIPMENTS_DELAYED_COLLECTION } from "@/lib/mongo";

export interface Shipment {
  DocketNo?: string;
  CustomerName?: string;
  logistics_email?: string;
  DeliveryPartner?: string;
  "From Location"?: string;
  "To Location"?: string;
  EDD?: string;
  severity?: "low" | "medium" | "high";
  CreatedAt?: string | Date;
  [key: string]: unknown;
}

export interface ShipmentsResponse {
  data: Shipment[];
  page: number;
  totalPages: number;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const search = searchParams.get("search") || "";
    const severity = searchParams.get("severity") || "all";

    const client = await connectDB();
    const db = client.db();
    const collection = db.collection<Shipment>(SHIPMENTS_DELAYED_COLLECTION);

    const query: Record<string, unknown> = {};

    if (search) {
      query.$or = [
        { DocketNo: { $regex: search, $options: "i" } },
        { CustomerName: { $regex: search, $options: "i" } },
        { logistics_email: { $regex: search, $options: "i" } },
        { DeliveryPartner: { $regex: search, $options: "i" } },
        { "From Location": { $regex: search, $options: "i" } },
        { "To Location": { $regex: search, $options: "i" } },
        { EDD: { $regex: search, $options: "i" } },
      ];
    }

    if (severity !== "all") query.severity = severity;

    const total = await collection.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    const shipments = await collection
      .find(query, { projection: { _id: 0, threadId: 0 } })
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ CreatedAt: -1 })
      .toArray();

    const response: ShipmentsResponse = {
      data: shipments,
      page,
      totalPages,
    };

    return NextResponse.json(response);
  } catch (err: unknown) {
    console.error("❌ Fetch error (shipments):", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
