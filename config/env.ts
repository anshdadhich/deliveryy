export const MONGODB_URL: string = process.env.DATABASE_URL ?? "";
export const SHIPMENT_WEBHOOK_URL: string = process.env.SHIPMENT_WEBHOOK_URL ?? "";

if (!MONGODB_URL) {
  throw new Error("Missing environment variable: DATABASE_URL");
}

if (!SHIPMENT_WEBHOOK_URL) {
  throw new Error("Missing environment variable: SHIPMENT_WEBHOOK_URL");
}
