"use client";

import React from "react";

export default function DownloadTemplate() {
  const handleDownload = () => {
    const headers = ["Tenant", "DocketNo", "DeliveryPartner", "EDD", "EcomStatus"];
    const csvContent = headers.join(",") + "\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Upload_Format.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4">
      <a
        href="#"
        onClick={handleDownload}
        className="text-blue-600 underline hover:text-blue-800"
      >
        Click here to download Format for data upload
      </a>
    </div>
  );
}
