"use client";

import { openReceipt, ReceiptData } from "@/utils/generateReceipt";

/* Statuses where a physical shipment exists and receipt makes sense */
const SHIPPED_STATUSES = new Set(["confirmed","shipped", "out_for_delivery", "delivered"]);

interface Props {
  receiptData: ReceiptData;
  items: any[];           // raw items with imprint field
  unifiedStatus: string;  // current order status
}

export function ReceiptButtons({ receiptData, items, unifiedStatus }: Props) {
  /* Only render when the order has actually been shipped */
  if (!SHIPPED_STATUSES.has(unifiedStatus)) return null;

  const agphItems     = items.filter((i: any) => i.imprint !== "agclassics");
  const classicsItems = items.filter((i: any) => i.imprint === "agclassics");
  const isMixed       = agphItems.length > 0 && classicsItems.length > 0;

  const btnBase =
    "inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer border";

  /* ── Single brand ── */
  if (!isMixed) {
    const isClassics = classicsItems.length > 0;
    return (
      <button
        onClick={() => openReceipt(receiptData, isClassics ? "agclassics" : "agph")}
        className={
          isClassics
            ? `${btnBase} bg-amber-700 border-amber-700 text-white hover:bg-amber-800`
            : `${btnBase} bg-blue-600 border-blue-600 text-white hover:bg-blue-700`
        }
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Download Receipt
      </button>
    );
  }

  /* ── Mixed order — two buttons ── */
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-gray-400">Invoice:</span>

      <button
        onClick={() => openReceipt({ ...receiptData, items: agphItems }, "agph")}
        className={`${btnBase} bg-blue-600 border-blue-600 text-white hover:bg-blue-700`}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        AGPH Books
      </button>

      <button
        onClick={() => openReceipt({ ...receiptData, items: classicsItems }, "agclassics")}
        className={`${btnBase} bg-amber-700 border-amber-700 text-white hover:bg-amber-800`}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        AG Classics
      </button>
    </div>
  );
}