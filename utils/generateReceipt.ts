export interface ReceiptItem {
  title: string;
  format: "ebook" | "paperback";
  quantity: number;
  price: number;
  imprint?: string;
}

export interface ReceiptOrder {
  id: number | string;
  total_amount: number | string;
  created_at: string;
  coupon_code?: string;
  coupon_discount?: number | string;
  razorpay_payment_id?: string;
}

export interface ReceiptCustomer {
  name: string;
  email: string;
  phone?: string;
}

export interface ReceiptBilling {
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
}

export interface ReceiptShipping {
  courier?: string;
  tracking_number?: string;
  shipping_cost?: number | string;
}

export interface ReceiptData {
  order: ReceiptOrder;
  customer: ReceiptCustomer;
  billing?: ReceiptBilling;
  shipping?: ReceiptShipping;
  items: ReceiptItem[];
}

/* ─── helpers ─── */
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });

const money = (n: number | string) => `\u20B9${Number(n).toFixed(2)}`;

/* CSS-barcode — deterministic from seed string */
function barcode(seed: string, h = 48): string {
  const bars = Array.from({ length: 46 }, (_, i) => {
    const c = seed.charCodeAt(i % seed.length);
    const w = (Math.sin(i * 2.3 + c) > 0.25) ? 3 : 1;
    return `<div style="width:${w}px;flex-shrink:0;background:#111;height:100%;"></div>`;
  }).join("");
  return `
    <div style="display:flex;height:${h}px;align-items:stretch;gap:1px;margin-bottom:5px;">${bars}</div>
    <div style="font-family:monospace;font-size:10px;letter-spacing:1.5px;text-align:center;color:#111;">${seed}</div>`;
}

/* ══════════════════════════════════════════════════════════
   SHARED INVOICE BUILDER
══════════════════════════════════════════════════════════ */
interface ShellOpts {
  accent: string;
  accentText: string;
  brandName: string;
  brandSite: string;
  brandLogo?: string;
  brandAddress: string;   // newline-separated
  brandPhone: string;
  brandGSTIN?: string;
  data: ReceiptData;
}


function buildInvoice(o: ShellOpts): string {
  const {
    accent, accentText,
    brandName, brandLogo, brandSite, brandAddress, brandPhone, brandGSTIN,
    data,
  } = o;
  const { order, customer, billing, shipping, items } = data;

  // 1. FILTER EBOOKS OUT - ONLY KEEP PAPERBACKS
  const paperbackItems = items.filter(i => i.format === "paperback");

  const subtotal = paperbackItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const discount = Number(order.coupon_discount ?? 0);
  const shipCost = Number(shipping?.shipping_cost ?? 0);
  
  // 2. RECALCULATE ORDER TOTAL (so the math adds up without the eBook prices)
  const calculatedTotal = Math.max(0, subtotal - discount + shipCost);

  /* address block */
  const addrLines = billing
    ? [
        billing.address ?? "",
        [billing.city, billing.state].filter(Boolean).join(", "),
        [billing.pincode, billing.country].filter(Boolean).join(" "),
      ].filter(Boolean)
    : ["—"];

  /* item rows - ONLY PAPERBACKS */
  const itemRows = paperbackItems.map((item, idx) => {
    const lineTax = 0;
    const lineTotal = item.price * item.quantity;
    const bg = idx % 2 === 1 ? "#fafafa" : "#fff";
    // Badge is now hardcoded for paperback since eBooks are excluded
    const fmtBadge = `<span style="font-size:9px;font-weight:800;letter-spacing:1px;text-transform:uppercase;border:1px solid #000;color:#000;padding:2px 6px;border-radius:2px;display:inline-block;margin-top:4px;">Paperback</span>`;
    
    return `
      <tr style="background:${bg};">
        <td style="padding:10px 12px;font-size:11px;font-weight:600;color:#000;line-height:1.4;border-right:1px solid #ddd;">${item.title}</td>
        <td style="padding:10px 12px;font-size:11px;font-weight:600;color:#000;text-align:center;border-right:1px solid #ddd;">${item.quantity}</td>
        <td style="padding:10px 12px;font-size:11px;font-weight:600;color:#000;text-align:right;border-right:1px solid #ddd;white-space:nowrap;">${money(item.price)}</td>
        <td style="padding:10px 12px;font-size:11px;font-weight:600;color:#000;text-align:right;border-right:1px solid #ddd;white-space:nowrap;">${money(lineTotal)}</td>
        <td style="padding:10px 12px;font-size:11px;font-weight:600;color:#000;text-align:center;border-right:1px solid #ddd;">—</td>
        <td style="padding:10px 12px;font-size:11px;font-weight:800;color:#000;text-align:right;white-space:nowrap;">${money(lineTotal)}</td>
      </tr>`;
  }).join("");

  /* totals section */
  const totalsHTML = `
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:6px 12px;font-size:11px;font-weight:600;color:#000;">Subtotal</td>
        <td style="padding:6px 12px;font-size:11px;font-weight:600;color:#000;text-align:right;">${money(subtotal)}</td>
      </tr>
      ${discount > 0 ? `
      <tr>
        <td style="padding:6px 12px;font-size:11px;font-weight:600;color:#1a7a3a;">Discount${order.coupon_code ? ` (${order.coupon_code})` : ""}</td>
        <td style="padding:6px 12px;font-size:11px;font-weight:600;color:#1a7a3a;text-align:right;">−${money(discount)}</td>
      </tr>` : ""}
      <tr>
        <td style="padding:6px 12px;font-size:11px;font-weight:600;color:#000;">Shipping</td>
        <td style="padding:6px 12px;font-size:11px;font-weight:600;color:#000;text-align:right;">${shipCost > 0 ? money(shipCost) : "Free"}</td>
      </tr>
      <tr style="border-top:1.5px solid #bbb;">
        <td style="padding:12px;font-size:13px;font-weight:800;color:#000;">ORDER TOTAL</td>
        <td style="padding:12px;font-size:13px;font-weight:800;color:#000;text-align:right;">${money(calculatedTotal)}</td>
      </tr>
    </table>`;

  const trackSeed = shipping?.tracking_number ?? `ORD-${order.id}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Order No.${order.id}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin:0; padding:0; }
  body {
    font-family: 'Inter', Arial, sans-serif;
    background: #e0e0e0;
    padding: 28px 12px 40px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page {
    max-width: 700px;
    margin: 0 auto;
    background: #fff;
    border: 1.5px solid #aaa;
  }
  .sec-head {
    background: ${accent};
    color: ${accentText};
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 2px;
    text-transform: uppercase;
    padding: 6px 14px;
  }
  th {
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: #000;
    background: #f2f2f2;
    padding: 10px 12px;
    border-bottom: 1px solid #ddd;
  }
  @media print {
    body { background: #fff; padding: 0; }
    .page { border: 1px solid #aaa; box-shadow: none; }
    .no-print { display: none !important; }
    @page { margin: 8mm; size: A4; }
  }
</style>
</head>
<body>
<div class="page">

  <table width="100%" cellpadding="0" cellspacing="0" style="border-bottom:1.5px solid #aaa;">
    <tr>
      <td style="width:52%;border-right:1px solid #ddd;vertical-align:top;">
        <div class="sec-head">Ship By</div>
        <div style="padding:14px 16px;">
          ${brandLogo ? `<img src="${brandLogo}" alt="${brandName} Logo" style="max-height:42px;width:auto;object-fit:contain;margin-bottom:8px;" />` : ""}
          <div style="font-size:18px;font-weight:800;color:#000;letter-spacing:-0.5px;margin-bottom:2px;">${brandName}</div>
          <div style="font-size:12px;font-weight:600;color:#000;margin-bottom:10px;">${brandSite}</div>
          <div style="font-size:13px;font-weight:500;color:#000;line-height:1.3;white-space:pre-line;">${brandAddress}</div>
          ${brandGSTIN ? `<div style="font-size:12px;font-weight:600;color:#000;margin-top:6px;">GSTIN: ${brandGSTIN}</div>` : ""}
          <div style="font-size:13px;font-weight:600;color:#000;margin-top:6px;">Ph: ${brandPhone}</div>
        </div>
      </td>
      
      <td style="width:52%;vertical-align:top;border-right:1px solid #ddd;">
        <div class="sec-head">Ship To</div>
        <div style="padding:14px 16px;">
          <div style="font-size:18px;font-weight:800;color:#000;margin-bottom:6px;">${customer.name}</div>
          ${addrLines.map(l => `<div style="font-size:13px;font-weight:500;color:#000;line-height:1.3;">${l}</div>`).join("")}
          <div style="font-size:13px;font-weight:600;color:#000;margin-top:10px;">Ph: ${customer.phone ?? "—"}</div>
          <div style="font-size:13px;font-weight:600;color:#000;">${customer.email}</div>
        </div>
      </td>
    </tr>
  </table>

  <div style="border-bottom:1.5px solid #aaa;">
    <div class="sec-head">Items Ordered</div>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <thead>
        <tr>
          <th style="text-align:left;border-right:1px solid #ddd;">Product Name</th>
          <th style="text-align:center;border-right:1px solid #ddd;">Qty</th>
          <th style="text-align:right;border-right:1px solid #ddd;white-space:nowrap;">Unit Price</th>
          <th style="text-align:right;border-right:1px solid #ddd;white-space:nowrap;">Taxable Value</th>
          <th style="text-align:center;border-right:1px solid #ddd;">GST</th>
          <th style="text-align:right;white-space:nowrap;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>
  </div>
</div>

<div class="no-print" style="text-align:center;margin-top:22px;padding-bottom:8px;">
  <button onclick="window.print()"
    style="background:${accent};color:${accentText};border:none;padding:11px 32px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;letter-spacing:0.5px;border-radius:4px;">
    ⬇&nbsp; Download / Print
  </button>
</div>

<script>
  window.addEventListener("load", () => setTimeout(() => window.print(), 700));
</script>
</body>
</html>`;
}

/* ══════════════════════════════════════════════════════════
   Brand wrappers
══════════════════════════════════════════════════════════ */
const STORE_ADDRESS =
  "First Floor, Susheela Bhawan,\nPriyadarshini Phase-3, 57,\nnear Meenakshi Planet City, Bagmugaliya,\nBhopal, Madhya Pradesh 462043";

const STORE_PHONE = "+91-XXXXXXXXXX"; // replace with actual number

function agphReceiptHTML(d: ReceiptData): string {
  return buildInvoice({
    accent: "#ededed", accentText: "#4a4a4a",
    brandName: "AGPH BOOKS",
    brandLogo: "/images/logo/AGPH-Logo-Black-600x290.webp",
    brandSite: "store.agphbooks.com",
    brandAddress: STORE_ADDRESS,
    brandPhone: STORE_PHONE,
    data: d,
  });
}

function agClassicsReceiptHTML(d: ReceiptData): string {
  return buildInvoice({
    accent: "#ededed", accentText: "#4a4a4a",
    brandName: "AG CLASSICS",
    brandLogo: "/images/logo/AGClaasiclogo2.png",
    brandSite: "agclassics.in",
    brandAddress: STORE_ADDRESS,
    brandPhone: STORE_PHONE,
    data: d,
  });
}

/* ══════════════════════════════════════════════════════════
   PUBLIC API — same interface as before, no changes needed
   in ReceiptButtons.tsx
══════════════════════════════════════════════════════════ */
export function openReceipt(
  data: ReceiptData,
  brand: "agph" | "agclassics" | "auto" = "auto"
) {
  // Prevent opening a blank receipt if the order ONLY has eBooks
  if (!data.items.some(i => i.format === "paperback")) {
    alert("There are no physical paperback items in this order to print.");
    return;
  }

  const resolved =
    brand === "auto"
      ? data.items.every(i => i.imprint === "agclassics") ? "agclassics" : "agph"
      : brand;

  const html = resolved === "agclassics"
    ? agClassicsReceiptHTML(data)
    : agphReceiptHTML(data);

  const win = window.open("", "_blank", "width=820,height=960,menubar=yes,toolbar=yes");
  if (!win) { alert("Please allow pop-ups to download your invoice."); return; }
  
  win.document.write(html);
  
  // Set the file name for when the user clicks 'Save as PDF'
  const safeBrand = resolved === "agclassics" ? "AG_CLASSICS" : "AGPH_BOOKS";
  win.document.title = `Invoice_${safeBrand}_${data.order.id}`;
  
  win.document.close();
}

export function openMixedReceipts(data: ReceiptData) {
  // Only process the paperbacks for mixed orders
  const paperbacks = data.items.filter(i => i.format === "paperback");
  
  if (paperbacks.length === 0) {
    alert("There are no physical paperback items in this order to print.");
    return;
  }

  const agphItems     = paperbacks.filter(i => i.imprint !== "agclassics");
  const classicsItems = paperbacks.filter(i => i.imprint === "agclassics");
  
  if (agphItems.length > 0)     openReceipt({ ...data, items: agphItems }, "agph");
  if (classicsItems.length > 0) openReceipt({ ...data, items: classicsItems }, "agclassics");
}