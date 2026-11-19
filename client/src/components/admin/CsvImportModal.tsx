"use client";

import { useState } from "react";
import { toast } from "sonner";
import { apiFetch, errorMessage } from "@/lib/api";
import { btnGhost, btnPrimary, Modal } from "@/components/dashboard/ui";

type Result = { created: number; updated: number; errors: { row: number; message: number | string }[] };

const TEMPLATE =
  "slug,name,description,price,discountPrice,stock,category,type,colors,sizes,images\r\n" +
  'blue-tee,Blue T-Shirt,Soft cotton tee,25,20,50,men,physical,#1e3a8a|#ffffff,S|M|L,https://example.com/a.jpg|https://example.com/b.jpg\r\n';

const CsvImportModal = ({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) => {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const close = () => {
    setFile(null);
    setResult(null);
    onClose();
  };

  const run = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const text = await file.text();
      const r = await apiFetch<Result>("/admin/products/import", {
        method: "POST",
        headers: { "Content-Type": "text/csv" },
        body: text,
      });
      setResult(r);
      toast.success(`${r.created} created, ${r.updated} updated`);
      onDone();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const downloadTemplate = () => {
    const url = URL.createObjectURL(new Blob([TEMPLATE], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "products-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal open={open} title="Import products from CSV" onClose={close}>
      <div className="flex flex-col gap-4 text-sm">
        <p className="text-gray-600">
          Rows whose <code>slug</code> matches an existing product update it. Other rows create new products.
          Use <code>|</code> to separate colors, sizes and image links. Category is the category slug.
        </p>
        <button type="button" onClick={downloadTemplate} className={`${btnGhost} w-max`}>Download template</button>
        <input type="file" accept=".csv,text/csv" onChange={(e) => { setFile(e.target.files?.[0] ?? null); setResult(null); }} />

        {result && (
          <div className="rounded-lg bg-gray-50 p-3">
            <div><strong>{result.created}</strong> created, <strong>{result.updated}</strong> updated, <strong>{result.errors.length}</strong> skipped</div>
            {result.errors.length > 0 && (
              <ul className="mt-2 max-h-40 overflow-y-auto text-red-700 text-xs flex flex-col gap-1">
                {result.errors.map((e, i) => <li key={i}>Row {e.row}: {e.message}</li>)}
              </ul>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button className={btnGhost} onClick={close}>{result ? "Close" : "Cancel"}</button>
          <button className={btnPrimary} disabled={!file || busy} onClick={run}>{busy ? "Importing..." : "Import"}</button>
        </div>
      </div>
    </Modal>
  );
};

export default CsvImportModal;