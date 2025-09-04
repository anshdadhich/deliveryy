import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongo";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const collectionName = searchParams.get("collection");

    if (!collectionName) {
      return NextResponse.json(
        { error: "Missing collection name" },
        { status: 400 }
      );
    }

    const client = await connectDB();
    const db = client.db();

    // Using a generic document type for MongoDB collection
    type GenericDocument = Record<string, unknown>;
    const data: GenericDocument[] = await db
      .collection<GenericDocument>(collectionName)
      .find({})
      .toArray();

    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error(err);
    const errorMessage = err instanceof Error ? err.message : "Failed to fetch data";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
