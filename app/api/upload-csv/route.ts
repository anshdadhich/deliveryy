import { NextResponse } from "next/server";
import { connectDB, SHIPMENTS_COLLECTION } from "@/lib/mongo";
import * as XLSX from "xlsx";
import { Document } from "mongodb";
import { SHIPMENT_WEBHOOK_URL } from "@/config/env";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils
      .sheet_to_json<Record<string, unknown>>(sheet, {
        raw: true,
        defval: "",
      })
      .filter((row) => Object.keys(row).length > 0) as Document[];

    const dateColumns = ["Date", "ShipmentDate", "DeliveryDate", "EDD"];

    const cleanedRows = rows.map((row) => {
      Object.keys(row).forEach((key) => {
        const value = row[key];
        if (dateColumns.includes(key) && typeof value === "number") {
          try {
            row[key] = XLSX.SSF.format("dd/mm/yyyy", value);
          } catch {
            row[key] = value.toString();
          }
        } else if (dateColumns.includes(key) && typeof value === "string") {
          const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
          if (match) {
            const [, d, m, yInitial] = match; // skip unused variable
            let y = yInitial;
            if (y.length === 2) y = "20" + y;
            row[key] = `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
          }
        }
      });
      return row;
    });

    const client = await connectDB();
    const db = client.db();
    const collection = db.collection(SHIPMENTS_COLLECTION);

    await collection.insertMany(cleanedRows);

    setTimeout(async () => {
      try {
        await fetch(SHIPMENT_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: file.name }),
        });
        console.log(`Webhook triggered for file: ${file.name}`);
      } catch (err) {
        console.error("❌ Webhook trigger failed:", err);
      }
    }, 8000);

    return NextResponse.json({
      message: `Uploaded ${rows.length} records successfully`,
      count: rows.length,
      fileName: file.name,
      webhookScheduled: true,
    });
  } catch (err: unknown) {
    console.error("❌ Error in uploading the file");
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
