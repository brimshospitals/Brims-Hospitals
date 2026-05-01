"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────
interface InvoiceItem {
  description: string; hsnCode: string;
  quantity: number; rate: number; discount: number;
  taxableAmt: number; cgstRate: number; cgstAmt: number;
  sgstRate: number; sgstAmt: number; amount: number;
}
interface Invoice {
  _id: string; invoiceId: string; hospitalId: string; hospitalName: string;
  patientName: string; patientMobile?: string; patientAge?: number; patientGender?: string; patientAddress?: string;
  labReportId?: string; bookingId?: string;
  items: InvoiceItem[];
  subtotal: number; totalCgst: number; totalSgst: number; totalTax: number;
  roundOff: number; totalAmount: number;
  paymentMode: string; paidAmount: number; balanceAmount: number;
  status: string; invoiceDate: string; notes?: string;
}
interface Hospital {
  name: string; address?: any; mobile?: string; email?: string; website?: string; photos?: string[];
}
interface LabSettings {
  labName?: string; logoUrl?: string; address?: string; phone?: string; email?: string; website?: string;
  gstNumber?: string; panNumber?: string; labRegNo?: string;
  invoiceFooter?: string; termsText?: string;
  pathologistName?: string; pathologistSign?: string;
  useCustomLetterhead?: boolean; letterheadUrl?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
}

const ONES = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine",
  "Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
const TENS = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
function numWords(n: number): string {
  if (n === 0) return "Zero";
  if (n < 0)   return "Minus " + numWords(-n);
  if (n < 20)  return ONES[n];
  if (n < 100) return TENS[Math.floor(n/10)] + (n%10 ? " " + ONES[n%10] : "");
  if (n < 1000) return ONES[Math.floor(n/100)] + " Hundred" + (n%100 ? " " + numWords(n%100) : "");
  if (n < 100000)  return numWords(Math.floor(n/1000)) + " Thousand" + (n%1000  ? " " + numWords(n%1000)  : "");
  if (n < 10000000) return numWords(Math.floor(n/100000)) + " Lakh" + (n%100000 ? " " + numWords(n%100000) : "");
  return numWords(Math.floor(n/10000000)) + " Crore" + (n%10000000 ? " " + numWords(n%10000000) : "");
}
function amountInWords(amount: number) {
  const rupees = Math.floor(amount);
  const paise  = Math.round((amount - rupees) * 100);
  let w = numWords(rupees) + " Rupees";
  if (paise > 0) w += " and " + numWords(paise) + " Paise";
  return w + " Only";
}

const PAY_MODE: Record<string, string> = {
  Cash: "Cash", cash: "Cash",
  Online: "Online / PhonePe", online: "Online / PhonePe",
  Wallet: "Brims Wallet", wallet: "Brims Wallet",
  Insurance: "Insurance", insurance: "Insurance",
  Card: "Debit / Credit Card", card: "Debit / Credit Card",
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function InvoicePrintPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const [invoice,     setInvoice]     = useState<Invoice | null>(null);
  const [hospital,    setHospital]    = useState<Hospital | null>(null);
  const [labSettings, setLabSettings] = useState<LabSettings | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");

  useEffect(() => {
    if (!invoiceId) return;
    fetch(`/api/hospital/invoice?invoiceId=${invoiceId}`)
      .then(r => r.json())
      .then(d => {
        if (!d.success) { setError(d.message || "Invoice not found"); return; }
        setInvoice(d.invoice);
        setHospital(d.hospital || null);
        setLabSettings(d.labSettings || null);
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, [invoiceId]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (error || !invoice) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center"><p className="text-5xl mb-4">📄</p><p className="text-gray-600">{error || "Invoice not found"}</p></div>
    </div>
  );

  const ls = labSettings;
  const logoUrl  = ls?.logoUrl   || hospital?.photos?.[0] || null;
  const labName  = ls?.labName   || hospital?.name        || "Brims Hospitals";
  const addr     = ls?.address   || (() => {
    const a = hospital?.address || {};
    return [a.street, a.city, a.district, a.state, a.pincode].filter(Boolean).join(", ");
  })();
  const phone    = ls?.phone   || hospital?.mobile  || "";
  const email    = ls?.email   || hospital?.email   || "";
  const website  = ls?.website || hospital?.website || "";
  const gstNo    = ls?.gstNumber || "";
  const panNo    = ls?.panNumber || "";
  const regNo    = ls?.labRegNo  || "";
  const footer   = ls?.invoiceFooter || "";
  const terms    = ls?.termsText    || "";
  const hasGst   = invoice.totalCgst > 0 || invoice.totalSgst > 0;

  const isPaid = invoice.status === "paid" || invoice.balanceAmount <= 0;

  return (
    <>
      {/* Print Controls — hidden on print */}
      <div className="no-print fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <button onClick={() => window.history.back()} className="text-gray-500 hover:text-gray-700 flex items-center gap-1.5 text-sm">
            ← Back
          </button>
          <span className="text-gray-300">|</span>
          <span className="text-sm font-semibold text-gray-700">Invoice #{invoice.invoiceId}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.print()}
            className="bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-teal-700 transition flex items-center gap-2">
            🖨️ Print / Download PDF
          </button>
        </div>
      </div>

      {/* Invoice Page */}
      <div className="min-h-screen bg-gray-100 pt-16 pb-10 print:bg-white print:pt-0 print:pb-0">
        <div id="invoice-print" className="max-w-3xl mx-auto bg-white shadow-lg print:shadow-none print:max-w-none">

          {/* Custom Letterhead */}
          {ls?.useCustomLetterhead && ls?.letterheadUrl ? (
            <div className="w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ls.letterheadUrl} alt="Letterhead" className="w-full object-contain" />
            </div>
          ) : (
            /* Standard Header */
            <div className="border-b-2 border-teal-600 px-8 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  {logoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl} alt="Logo" className="h-16 w-16 object-contain rounded-xl border border-gray-100" />
                  )}
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 leading-tight">{labName}</h1>
                    {regNo && <p className="text-xs text-gray-500 mt-0.5">Reg. No: {regNo}</p>}
                    {addr && <p className="text-xs text-gray-500 mt-0.5 max-w-xs">{addr}</p>}
                    <div className="flex flex-wrap gap-3 mt-1">
                      {phone   && <span className="text-xs text-gray-500">📞 {phone}</span>}
                      {email   && <span className="text-xs text-gray-500">✉ {email}</span>}
                      {website && <span className="text-xs text-gray-500">🌐 {website}</span>}
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-2xl font-bold text-teal-600 tracking-wide">INVOICE</div>
                  <div className="text-xs text-gray-500 mt-1">Tax Invoice</div>
                  {gstNo && <div className="text-xs text-gray-600 mt-1 font-medium">GSTIN: {gstNo}</div>}
                  {panNo && <div className="text-xs text-gray-500 mt-0.5">PAN: {panNo}</div>}
                </div>
              </div>
            </div>
          )}

          {/* Invoice Meta */}
          <div className="px-8 py-4 border-b border-gray-100 bg-gray-50">
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Invoice No.</p>
                <p className="text-sm font-bold text-gray-900">{invoice.invoiceId}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Invoice Date</p>
                <p className="text-sm font-semibold text-gray-700">{fmtDate(invoice.invoiceDate)}</p>
              </div>
              {invoice.labReportId && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Report Ref.</p>
                  <p className="text-sm text-gray-700">{invoice.labReportId}</p>
                </div>
              )}
              {invoice.bookingId && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Booking Ref.</p>
                  <p className="text-sm text-gray-700">{invoice.bookingId}</p>
                </div>
              )}
            </div>
          </div>

          {/* Bill To */}
          <div className="px-8 py-4 border-b border-gray-100">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Bill To</p>
            <p className="text-sm font-bold text-gray-900">{invoice.patientName}</p>
            <div className="flex flex-wrap gap-3 mt-1">
              {invoice.patientAge    && <span className="text-xs text-gray-600">Age: {invoice.patientAge}</span>}
              {invoice.patientGender && <span className="text-xs text-gray-600 capitalize">| {invoice.patientGender}</span>}
              {invoice.patientMobile && <span className="text-xs text-gray-600">| 📞 {invoice.patientMobile}</span>}
            </div>
            {invoice.patientAddress && (
              <p className="text-xs text-gray-500 mt-1">{invoice.patientAddress}</p>
            )}
          </div>

          {/* Items Table */}
          <div className="px-8 py-4">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-teal-600 text-white">
                  <th className="px-3 py-2.5 text-left font-semibold rounded-tl-lg">#</th>
                  <th className="px-3 py-2.5 text-left font-semibold">Description</th>
                  <th className="px-3 py-2.5 text-center font-semibold">SAC</th>
                  <th className="px-3 py-2.5 text-center font-semibold">Qty</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Rate (₹)</th>
                  {invoice.items.some(i => i.discount > 0) && (
                    <th className="px-3 py-2.5 text-right font-semibold">Disc (₹)</th>
                  )}
                  <th className="px-3 py-2.5 text-right font-semibold">Taxable (₹)</th>
                  {hasGst && <>
                    <th className="px-3 py-2.5 text-right font-semibold">CGST</th>
                    <th className="px-3 py-2.5 text-right font-semibold">SGST</th>
                  </>}
                  <th className="px-3 py-2.5 text-right font-semibold rounded-tr-lg">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-3 py-2.5 text-center text-gray-500">{idx + 1}</td>
                    <td className="px-3 py-2.5 text-gray-800 font-medium">{item.description}</td>
                    <td className="px-3 py-2.5 text-center text-gray-500">{item.hsnCode}</td>
                    <td className="px-3 py-2.5 text-center text-gray-700">{item.quantity}</td>
                    <td className="px-3 py-2.5 text-right text-gray-700">{item.rate.toFixed(2)}</td>
                    {invoice.items.some(i => i.discount > 0) && (
                      <td className="px-3 py-2.5 text-right text-red-600">
                        {item.discount > 0 ? `-${item.discount.toFixed(2)}` : "—"}
                      </td>
                    )}
                    <td className="px-3 py-2.5 text-right text-gray-700">{item.taxableAmt.toFixed(2)}</td>
                    {hasGst && <>
                      <td className="px-3 py-2.5 text-right text-gray-600">
                        {item.cgstAmt > 0 ? `${item.cgstRate}% = ${item.cgstAmt.toFixed(2)}` : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-right text-gray-600">
                        {item.sgstAmt > 0 ? `${item.sgstRate}% = ${item.sgstAmt.toFixed(2)}` : "—"}
                      </td>
                    </>}
                    <td className="px-3 py-2.5 text-right font-semibold text-gray-900">{item.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="px-8 pb-4">
            <div className="flex justify-end">
              <div className="w-72">
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <div className="flex justify-between px-4 py-2 bg-gray-50 text-xs text-gray-600 border-b border-gray-100">
                    <span>Subtotal</span>
                    <span>₹ {invoice.subtotal.toFixed(2)}</span>
                  </div>
                  {hasGst && <>
                    <div className="flex justify-between px-4 py-2 bg-gray-50 text-xs text-gray-600 border-b border-gray-100">
                      <span>CGST</span>
                      <span>₹ {invoice.totalCgst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between px-4 py-2 bg-gray-50 text-xs text-gray-600 border-b border-gray-100">
                      <span>SGST</span>
                      <span>₹ {invoice.totalSgst.toFixed(2)}</span>
                    </div>
                  </>}
                  {invoice.roundOff !== 0 && (
                    <div className="flex justify-between px-4 py-2 bg-gray-50 text-xs text-gray-600 border-b border-gray-100">
                      <span>Round Off</span>
                      <span>{invoice.roundOff > 0 ? "+" : ""}{invoice.roundOff.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between px-4 py-3 bg-teal-600 text-white font-bold text-sm">
                    <span>Total Amount</span>
                    <span>₹ {invoice.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between px-4 py-2 bg-green-50 text-xs text-green-700 border-b border-green-100">
                    <span>Payment Mode</span>
                    <span>{PAY_MODE[invoice.paymentMode] || invoice.paymentMode}</span>
                  </div>
                  <div className="flex justify-between px-4 py-2 bg-green-50 text-xs text-green-700 border-b border-green-100">
                    <span>Paid Amount</span>
                    <span>₹ {invoice.paidAmount.toFixed(2)}</span>
                  </div>
                  {invoice.balanceAmount > 0 && (
                    <div className="flex justify-between px-4 py-2 bg-red-50 text-xs text-red-700">
                      <span>Balance Due</span>
                      <span>₹ {invoice.balanceAmount.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Amount in Words */}
          <div className="px-8 pb-4">
            <div className="bg-teal-50 border border-teal-100 rounded-xl px-4 py-2.5">
              <span className="text-xs text-teal-600 font-medium">Amount in Words: </span>
              <span className="text-xs text-teal-800 font-semibold">{amountInWords(invoice.totalAmount)}</span>
            </div>
          </div>

          {/* Payment Status Stamp */}
          {isPaid && (
            <div className="px-8 pb-2 flex justify-end print:block">
              <div className="inline-block border-4 border-green-500 text-green-600 font-bold text-2xl px-6 py-2 rounded-xl rotate-[-8deg] opacity-70 tracking-widest select-none">
                PAID
              </div>
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div className="px-8 pb-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Notes</p>
              <p className="text-xs text-gray-600">{invoice.notes}</p>
            </div>
          )}

          {/* Terms */}
          {terms && (
            <div className="px-8 pb-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Terms & Conditions</p>
              <p className="text-xs text-gray-500 whitespace-pre-line">{terms}</p>
            </div>
          )}

          {/* Signature */}
          <div className="px-8 pb-6 pt-2 border-t border-gray-100 flex justify-between items-end">
            <div className="text-center">
              <div className="w-32 border-b border-gray-400 mb-1" />
              <p className="text-xs text-gray-500">Patient Signature</p>
            </div>
            <div className="text-center">
              {ls?.pathologistSign ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ls.pathologistSign} alt="Sign" className="h-10 mb-1 mx-auto" />
              ) : (
                <div className="w-32 border-b border-dashed border-gray-400 mb-1" />
              )}
              <p className="text-xs font-semibold text-gray-700">{labName}</p>
              <p className="text-xs text-gray-500">Authorised Signatory</p>
            </div>
          </div>

          {/* Footer */}
          {footer && (
            <div className="bg-teal-600 text-white text-center text-xs py-2.5 px-8 mt-2">
              {footer}
            </div>
          )}
          {!footer && (
            <div className="bg-gray-50 text-center text-xs py-2 text-gray-400 border-t border-gray-100">
              This is a computer generated invoice.
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .no-print, button { display: none !important; }
          body { margin: 0; background: white; }
          #invoice-print { box-shadow: none !important; max-width: 100% !important; }
        }
        @page { margin: 10mm; size: A4; }
      `}</style>
    </>
  );
}
