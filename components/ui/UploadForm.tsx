"use client";
import { useState } from "react";

type PreviewRow = Record<string, string | number | boolean | null | undefined>;

export default function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [collectionName, setCollectionName] = useState("");
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file || !collectionName) return alert("Select file and enter collection name");

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("collectionName", collectionName);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setLoading(false);

    if (data.error) {
      alert(data.error);
    } else {
      setPreview(data.sample || []);
    }
  };

  return (
    <div className="p-4 border rounded space-y-4">
      <div className="flex flex-col space-y-2">
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Collection Name"
          value={collectionName}
          onChange={(e) => setCollectionName(e.target.value)}
          className="border p-2 rounded"
        />
        <button
          onClick={handleUpload}
          disabled={loading}
          className={`px-4 py-2 rounded text-white ${
            loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Uploading..." : "Upload"}
        </button>
      </div>

      {/* Preview Table */}
      {preview.length > 0 && (
        <div className="overflow-x-auto border rounded">
          <table className="table-auto w-full border-collapse">
            <thead>
              <tr>
                {Object.keys(preview[0]).map((key) => (
                  <th key={key} className="border px-3 py-2 bg-gray-100 text-left">
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.map((row, i) => (
                <tr key={i}>
                  {Object.values(row).map((val, j) => (
                    <td key={j} className="border px-3 py-2">
                      {String(val)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-sm text-gray-600 px-2 py-1">
            Showing {preview.length} sample rows...
          </p>
        </div>
      )}
    </div>
  );
}
