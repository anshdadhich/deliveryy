"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Shipment {
  DocketNo?: string;
  DeliveryPartner?: string;
  EcomStatus?: string;
  delay?: string;
  [key: string]: string | number | object | null | undefined;
}

interface Stats {
  avgDelay?: number;
  total?: number;
  severityCounts?: {
    high?: number;
    medium?: number;
    low?: number;
  };
}

interface UploadResponse {
  error?: string;
  message?: string;
  webhookScheduled?: boolean;
  fileName?: string;
}

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<UploadResponse | null>(null);

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState<"all" | "low" | "medium" | "high">("all");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(100);
  const [totalPages, setTotalPages] = useState(1);

  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);

  const handleUpload = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploading(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/upload-csv", {
        method: "POST",
        body: formData,
      });

      const data: UploadResponse = await res.json();
      setMessage(data);
      setUploading(false);
      setPage(1);

      if (data.webhookScheduled) {
        toast.success(`Webhook for ${data.fileName} triggered—emails are being sent.`);
      } else {
        toast.error("❌ Webhook failed.");
      }

      await fetchShipments();
      await fetchStats();
    } catch (err) {
      console.error("❌ Upload failed:", err);
      toast.error("❌ Upload failed.");
      setUploading(false);
    }
  };

  const fetchShipments = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/shipments?search=${search}&severity=${severity}&page=${page}&limit=${limit}`
      );
      const data = await res.json();
      setShipments(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("❌ Error fetching shipments:", err);
      setShipments([]);
    }
  }, [search, severity, page, limit]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/shipments/stats?search=${search}&severity=${severity}`);
      if (!res.ok) {
        const text = await res.text();
        console.error("❌ Stats API error:", text);
        setStats(null);
        return;
      }
      const data: Stats = await res.json();
      setStats(data);
    } catch (err) {
      console.error("❌ Error fetching stats:", err);
      setStats(null);
    }
  }, [search, severity]);

  useEffect(() => {
    fetchShipments();
    fetchStats();
  }, [fetchShipments, fetchStats]);

  useEffect(() => {
    const interval = setInterval(() => fetchStats(), 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-8 bg-gray-50 min-h-screen text-gray-900">
      {/* HEADER */}
      <header>
        <h1 className="text-3xl font-bold">📊 Logistics Dashboard</h1>
        <p className="text-gray-500">Upload shipments → monitor delays & severity</p>
      </header>

      {/* UPLOAD CARD */}
      <Card>
        <CardHeader>
          <CardTitle>📤 Upload Shipments File</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="flex flex-col md:flex-row gap-4 items-center">
            <label
              htmlFor="fileInput"
              className="flex-1 cursor-pointer px-4 py-2 border rounded-2xl text-gray-600 hover:bg-gray-100 flex items-center justify-center gap-2 transition"
            >
              📂 {selectedFile ? selectedFile.name : "Choose File (xlsx or csv)"}
            </label>
            <Input
              id="fileInput"
              type="file"
              className="hidden"
              name="file"
              accept=".csv,.xls,.xlsx"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setSelectedFile(file);
              }}
              required
            />
            <Button
              type="submit"
              className="bg-black text-white px-6 py-2 rounded-lg border-2 border-transparent hover:bg-white hover:text-black hover:border-black shadow-md transition-all duration-300 transform hover:scale-102"
              disabled={uploading}
            >
              {uploading ? "⏳ Uploading..." : "Upload"}
            </Button>
          </form>

          {message && (
            <div
              className={`mt-4 p-3 rounded-lg text-sm overflow-auto border ${
                message.error
                  ? "bg-red-100 text-red-700 border-red-300"
                  : "bg-green-100 text-green-700 border-green-300"
              }`}
            >
              {message.error ? <p>❌ {message.error}</p> : <p>✅ {message.message}</p>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card className="p-3">
          <CardContent className="p-2 text-center">
            <p className="text-xs text-gray-500">Average Delay (days)</p>
            <p className="text-lg font-bold text-purple-600">{stats?.avgDelay ?? "-"}</p>
          </CardContent>
        </Card>
        <Card className="p-3">
          <CardContent className="p-2 text-center">
            <p className="text-xs text-gray-500">Total Delayed Shipments</p>
            <p className="text-lg font-bold text-blue-600">{stats?.total ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="p-3">
          <CardContent className="p-2 text-center">
            <p className="text-xs text-gray-500">High Severity</p>
            <p className="text-lg font-bold text-red-500">{stats?.severityCounts?.high ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="p-3">
          <CardContent className="p-2 text-center">
            <p className="text-xs text-gray-500">Medium Severity</p>
            <p className="text-lg font-bold text-yellow-600">{stats?.severityCounts?.medium ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="p-3">
          <CardContent className="p-2 text-center">
            <p className="text-xs text-gray-500">Low Severity</p>
            <p className="text-lg font-bold text-green-600">{stats?.severityCounts?.low ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* SEARCH & FILTER */}
      <div className="flex flex-wrap gap-4 items-center">
        <Input
          placeholder="🔍 Search docket, reason, email..."
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          className="flex-1"
        />

        <Select
          value={severity}
          onValueChange={(val) => {
            setPage(1);
            setSeverity(val as "all" | "low" | "medium" | "high");
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>

        <Button
          onClick={() => {
            fetchShipments();
            fetchStats();
          }}
          variant="outline"
          className="bg-black text-white px-3 py-2 rounded-lg border-2 border-transparent hover:bg-white hover:text-black hover:border-black shadow-md transition-all duration-300 transform hover:scale-102"
        >
          Refresh
        </Button>
      </div>

      {/* SHIPMENTS GRID */}
      {shipments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {shipments.map((shipment, idx) => (
            <Card
              key={idx}
              className="cursor-pointer hover:shadow-lg transition border rounded-xl p-4"
              onClick={() => setSelectedShipment(shipment)}
            >
              <div className="flex flex-col space-y-2">
                <div className="flex justify-between">
                  <p className="font-semibold text-gray-700">Docket No:</p>
                  <p className="text-gray-900">{shipment.DocketNo ?? "-"}</p>
                </div>

                <div className="flex justify-between items-center">
                  <p className="font-semibold text-gray-700">Delivery Partner:</p>
                  <p className="text-gray-900 max-w-[200px] truncate" title={shipment.DeliveryPartner ?? "-"}>
                   {shipment.DeliveryPartner ?? "-"}
                  </p>
                </div>

                <div className="flex justify-between">
                    <p className="font-semibold text-gray-700">Days Delayed:</p>
                    <p className="text-gray-900">{shipment.delay ?? "-"}</p>
                </div>

                <div className="flex justify-between">
                  <p className="font-semibold text-gray-700">Ecom Status:</p>
                  <p
                    className={`px-2 py-1 rounded-md font-medium ${
                      shipment.EcomStatus?.toLowerCase().includes("delayed") ||
                      shipment.EcomStatus?.toLowerCase().includes("cancelled")
                        ? "bg-red-100 text-red-700"
                        : shipment.EcomStatus?.toLowerCase().includes("intransit")
                        ? "bg-blue-100 text-blue-500"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {shipment.EcomStatus ?? "-"}
                  </p>
                </div>
                
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center h-10 mt-4">
          <p className="text-gray-400 text-lg">No data to display</p>
        </div>
      )}

      {/* SHIPMENT DETAILS DIALOG */}
      {selectedShipment && (
        <Dialog open={!!selectedShipment} onOpenChange={() => setSelectedShipment(null)}>
          <DialogContent className="w-full max-w-4xl max-h-[90vh] rounded-2xl border shadow-2xl overflow-hidden p-0">
            <div className="w-full max-h-[90vh] overflow-y-auto overflow-x-hidden p-6 bg-white border-4 rounded-xl">
              <DialogHeader className="mb-4">
                <DialogTitle className="text-xl font-semibold">Shipment Details</DialogTitle>
              </DialogHeader>

              <div className="divide-y">
                {Object.entries(selectedShipment).map(([key, value]) => {
                  const displayValue =
                    value === null || value === undefined || value === ""
                      ? "-"
                      : typeof value === "string" || typeof value === "number"
                      ? value
                      : JSON.stringify(value, null, 2);

                  const isLong = typeof displayValue === "string" && displayValue.length > 80;

                  let statusClasses = "";
                  const keyLower = key.toLowerCase();
                  const isStatusField = ["ecomstatus", "deliverystatus", "status"].includes(keyLower);

                  if (isStatusField && typeof displayValue === "string") {
                    const valueLower = displayValue.toLowerCase().replace(/\s|-/g, "");
                    if (valueLower.includes("delayed") || valueLower.includes("cancelled")) {
                      statusClasses = "bg-red-100 text-red-700";
                    } else if (valueLower.includes("intransit")) {
                      statusClasses = "bg-blue-100 text-blue-500";
                    } else if (valueLower.includes("delivered")) {
                      statusClasses = "bg-green-100 text-green-700";
                    } else {
                      statusClasses = "bg-gray-100 text-gray-700";
                    }
                  }

                  return (
                    <div
                      key={key}
                      className={`px-4 py-3 hover:bg-gray-200 transition-colors  ${
                        keyLower === "emailreply" ? "mb-4" : ""
                      }`}
                    >
                      {!isLong ? (
                        <div className="flex justify-between items-start gap-4">
                          <p className="font-semibold text-gray-700 w-1/3">{key}</p>
                          <p
                            className={`w-2/3 break-words ${
                              statusClasses
                                ? `inline-block px-2 py-1 rounded-md font-medium ${statusClasses}`
                                : "text-gray-900"
                            }`}
                          >
                            {displayValue}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="font-semibold text-gray-700 mb-1">{key}</p>
                          <div className="bg-gray-50 border rounded p-2 text-gray-900 whitespace-pre-wrap break-words">
                            {displayValue}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* PAGINATION */}
     <div className="flex flex-col sm:flex-row sm:justify-between items-center mt-4 gap-2 sm:gap-4">
  {/* Previous Button */}
  <Button
    variant="outline"
    disabled={page <= 1}
    className="w-full sm:w-auto"
    onClick={() => setPage((p) => p - 1)}
  >
    ⬅ Previous
  </Button>

  {/* Page info */}
  <div className="my-2 sm:my-0 text-sm text-gray-600 text-center flex-1 sm:flex-none">
    Page {page} of {totalPages}
  </div>

  {/* Limit selector + Next Button */}
  <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
    <Select
      value={limit.toString()}
      onValueChange={(val) => {
        setLimit(Number(val));
        setPage(1);
      }}
    >
      <SelectTrigger className="w-full sm:w-[140px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="50">50 / page</SelectItem>
        <SelectItem value="100">100 / page</SelectItem>
        <SelectItem value="200">200 / page</SelectItem>
      </SelectContent>
    </Select>

    <Button
      variant="outline"
      disabled={page >= totalPages}
      className="w-full sm:w-auto"
      onClick={() => setPage((p) => p + 1)}
    >
      Next ➡
    </Button>
  </div>
</div>
    </main>
  );
}
