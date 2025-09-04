import { NextResponse } from "next/server";
import { connectDB, SHIPMENTS_DELAYED_COLLECTION } from "@/lib/mongo";

interface DelayedShipment {
  delay?: string | number;
  severity?: "low" | "medium" | "high" | "LOW" | "HIGH" | "MEDIUM" | "Low" | "Medium" | "High";
  EDD?: string | Date;
  [key: string]: string | number | boolean | Date | object | null | undefined;
}

interface StatsResponse {
  total: number;
  severityCounts: {
    low: number;
    medium: number;
    high: number;
  };
  avgDelay: number;
  delayedShipments: number;
}

export async function GET() {
  try {
    const client = await connectDB();
    const db = client.db();
    const collection = db.collection<DelayedShipment>(SHIPMENTS_DELAYED_COLLECTION);

    const shipments = await collection.find({}).toArray();
    const total = shipments.length;

    const severityCounts = {
      low: shipments.filter((s) => s.severity.toLocaleLowerCase() === "low").length,
      medium: shipments.filter((s) => s.severity.toLocaleLowerCase() === "medium").length,
      high: shipments.filter((s) => s.severity.toLocaleLowerCase() === "high").length,
    };

    const avgDelay =
      total > 0
        ? parseFloat(
            (
              shipments.reduce((sum, s) => sum + (parseInt(s.delay as string) || 0), 0) /
              total
            ).toFixed(2)
          )
        : 0;

    const delayedShipments = shipments.filter((s) => {
      if (!s.EDD) return false;
      const eddDate = new Date(s.EDD);
      return eddDate < new Date();
    }).length;

    const response: StatsResponse = {
      total,
      severityCounts,
      avgDelay,
      delayedShipments,
    };

    return NextResponse.json(response);
  } catch (err: unknown) {
    console.error("❌ Fetch error (stats):", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
