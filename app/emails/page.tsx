"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Trash, Edit } from "lucide-react";

interface EmailDoc {
  _id: string;
  [key: string]: string | number | object | null | undefined;
}

export default function EmailsPage() {
  const [emails, setEmails] = useState<EmailDoc[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);

  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<EmailDoc>>({});

  const fetchEmails = useCallback(async () => {
    try {
      const res = await fetch(`/api/emails?search=${search}&page=${page}&limit=${limit}`);
      const data = await res.json();
      setEmails(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("❌ Error fetching emails:", err);
      setEmails([]);
    }
  }, [search, page, limit]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const allFields = Array.from(new Set(emails.flatMap((doc) => Object.keys(doc)))).filter(
    (k) => k !== "_id"
  );

  const handleAddEmail = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setForm({});
        setOpenDialog(false);
        fetchEmails();
      } else {
        toast.error(data.error || "Failed to add email");
      }
    } catch (err) {
      console.error("❌ Error adding email:", err);
      toast.error("❌ Failed to add email");
    }
  };

  const handleEditClick = (idx: number) => {
    const { _id, ...rest } = emails[idx];
    setEditingIdx(idx);
    setEditData(rest);
  };

  const handleSaveEdit = async () => {
    if (editingIdx === null) return;

    const emailToEdit = emails[editingIdx];
    const updatedFields: Partial<EmailDoc> = {};

    Object.entries(editData).forEach(([key, value]) => {
      if (value !== emailToEdit[key]) updatedFields[key] = value;
    });

    if (Object.keys(updatedFields).length === 0) {
      setEditingIdx(null);
      return;
    }

    try {
      const res = await fetch("/api/emails", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: emailToEdit._id, updatedFields }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Details updated");
        setEmails((prev) =>
          prev.map((doc, i) => (i === editingIdx ? { ...doc, ...updatedFields } : doc))
        );
      } else {
        toast.error(data.error || "Failed to update details");
      }
    } catch (err) {
      console.error("❌ Error updating details:", err);
      toast.error("❌ Failed to update details");
    }

    setEditingIdx(null);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/emails?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        fetchEmails();
      } else {
        toast.error(data.error || "Failed to delete details");
      }
    } catch (err) {
      console.error("❌ Error deleting details:", err);
      toast.error("❌ Failed to delete details");
    }
  };

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">📧 Delivery Partner Emails</h1>
        <Button
          className="bg-black text-white font-semibold px-4 py-1.5 rounded-lg border-2 border-transparent hover:bg-white hover:text-black hover:border-black shadow-md transition-all duration-200 transform hover:scale-102 active:scale-95"
          onClick={() => setOpenDialog(true)}
        >
          Add New Email
        </Button>
      </header>

      {/* Search */}
      <div className="flex flex-wrap gap-4 items-center">
        <Input
          placeholder="🔍 Search by any field..."
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          className="flex-1"
        />
        <Button
          onClick={fetchEmails}
          variant="outline"
          className="bg-black text-white font-semibold px-4 py-1.5 rounded-lg border-2 border-transparent hover:bg-white hover:text-black hover:border-black shadow-md transition-all duration-200 transform hover:scale-102 active:scale-95"
        >
          Refresh
        </Button>
      </div>

      {/* Emails Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 items-stretch">
        {emails.length > 0 &&
          emails.map((doc, idx) => {
            const fields = Object.keys(doc).filter((k) => k !== "_id");

            return (
              <Card
                key={doc._id}
                className="border rounded-lg p-4 h-full flex flex-col relative group hover:bg-gray-50 transition-colors"
              >
                {/* Edit + Delete icons */}
                <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition">
                  <div
                    className="cursor-pointer p-1 rounded hover:bg-gray-200"
                    onClick={() => handleEditClick(idx)}
                    title="Edit"
                  >
                    <Edit size={18} className="text-gray-500 hover:text-black transition-colors" />
                  </div>
                  <div
                    className="cursor-pointer p-1 rounded hover:bg-red-200"
                    onClick={() => handleDelete(doc._id)}
                    title="Delete"
                  >
                    <Trash size={18} className="text-red-600 hover:text-red-800 transition-colors" />
                  </div>
                </div>

                <CardContent className="flex-1 flex flex-col divide-y divide-gray-200">
                  {fields.map((field) => {
                    const value = doc[field];
                    const displayValue =
                      value === null || value === undefined || value === ""
                        ? "-"
                        : typeof value === "string" || typeof value === "number"
                        ? String(value)
                        : JSON.stringify(value, null, 2);

                    return (
                      <div
                        key={field}
                        className="flex items-start gap-4 py-2 hover:bg-gray-100 rounded transition-colors"
                      >
                        <div className="flex-none min-w-[10rem] pr-2 font-semibold text-gray-700">
                          {field}
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex-1 text-gray-900 truncate whitespace-nowrap overflow-hidden p-1">
                                {displayValue}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs whitespace-pre-wrap">
                              {displayValue}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row sm:justify-between items-center mt-6 gap-2">
        <Button
          variant="outline"
          disabled={page <= 1}
          className="w-full sm:w-auto"
          onClick={() => setPage((p) => p - 1)}
        >
          ⬅ Previous
        </Button>

        <div className="text-sm text-gray-600 text-center flex-1 sm:flex-none">
          Page {page} of {totalPages}
        </div>

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
              <SelectItem value="25">25 / page</SelectItem>
              <SelectItem value="50">50 / page</SelectItem>
              <SelectItem value="100">100 / page</SelectItem>
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

      {/* Add Email Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Email</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddEmail} className="space-y-4">
            {allFields.map((field) => (
              <div key={field} className="flex flex-col">
                <label className="font-semibold text-gray-700 mb-1">{field}</label>
                <Input
                  type="text"
                  value={form[field] || ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, [field]: e.target.value }))
                  }
                />
              </div>
            ))}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-black text-white">
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Email Dialog */}
      {editingIdx !== null && (
        <Dialog open={true} onOpenChange={() => setEditingIdx(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Email</DialogTitle>
            </DialogHeader>

            <div className="flex flex-col space-y-3 mt-2">
              {Object.entries(editData).map(([key, value]) => (
                <div key={key} className="flex flex-col">
                  <label className="font-semibold text-gray-700 mb-1">{key}</label>
                  <Input
                    type="text"
                    value={value === null ? "" : String(value)}
                    onChange={(e) => setEditData({ ...editData, [key]: e.target.value })}
                  />
                </div>
              ))}
            </div>

            <DialogFooter className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingIdx(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </main>
  );
}
