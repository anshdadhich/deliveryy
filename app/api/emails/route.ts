import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongo";
import { ObjectId,Filter,Document } from "mongodb";

const EMAILS_COLLECTION = process.env.EMAILS_COLLECTION as string;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const search = searchParams.get("search") || "";

    const client = await connectDB();
    const db = client.db();
    const collection = db.collection(EMAILS_COLLECTION);

    const query:  Filter<Document>  = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { DeliveryPartner: { $regex: search, $options: "i" } },
      ];
    }

    const totalDocs = await collection.countDocuments(query);
    const data = await collection
      .find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    return NextResponse.json({
      data,
      page,
      totalPages: Math.ceil(totalDocs / limit),
      total: totalDocs,
    });
  } catch (err) {
    console.error("❌ Error fetching emails:", err);
    return NextResponse.json({ error: "Failed to fetch emails" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const newDoc: Record<string, string> = {};
    Object.entries(body).forEach(([key, value]) => {
      newDoc[key] = value?.toString() || "";
    });

    const client = await connectDB();
    const db = client.db();
    const collection = db.collection(EMAILS_COLLECTION);

    await collection.insertOne(newDoc);

    return NextResponse.json({ message: "Email document added", doc: newDoc });
  } catch (err) {
    console.error("❌ Error adding email:", err);
    return NextResponse.json({ error: "Failed to add email" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, updatedFields } = body;

    if (!id || !updatedFields) {
      return NextResponse.json({ error: "Missing id or updatedFields" }, { status: 400 });
    }

    const sanitizedFields: Record<string, string> = {};
    Object.entries(updatedFields).forEach(([key, value]) => {
      sanitizedFields[key] = value?.toString() || "";
    });

    const client = await connectDB();
    const db = client.db();
    const collection = db.collection(EMAILS_COLLECTION);

    await collection.updateOne(
      { _id: ObjectId.createFromHexString(id) },
      { $set: sanitizedFields }
    );

    return NextResponse.json({ message: "Email document updated" });
  } catch (err) {
    console.error("❌ Error updating email:", err);
    return NextResponse.json({ error: "Failed to update email" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const client = await connectDB();
    const db = client.db();
    const collection = db.collection(EMAILS_COLLECTION);

    await collection.deleteOne({ _id: ObjectId.createFromHexString(id) });

    return NextResponse.json({ message: "Email document deleted" });
  } catch (err) {
    console.error("❌ Error deleting email:", err);
    return NextResponse.json({ error: "Failed to delete email" }, { status: 500 });
  }
}
