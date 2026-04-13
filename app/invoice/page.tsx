"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const PAY_MODE: Record<string, string> = {
  counter:   "Counter / Cash",
  online:    "Online / PhonePe",
  wallet:    "Brims Wallet",
  insurance: "Insurance",
};

const TYPE_ICON: Record<string, string> = {
  OPD: "🩺", Lab: "🧪", Surgery: "🏥", Consultation: "💻", IPD: "🛏️",
};

function fmtDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
}
function fmtDateTime(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending:   "bg-amber-100 text-amber-700 border-amber-200",
    confirmed: "bg-green-100 text-green-700 border-green-200",
    completed: "bg-teal-100 text-teal-700 border-teal-200",
    cancelled: "bg-red-100 text-red-700 border-red-200",
    paid:      "bg-green-100 text-green-700 border-green-200",
    refunded:  "bg-blue-100 text-blue-700 border-blue-200",
  };
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${map[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

function InvoicePage() {
  const searchParams = useSearchParams();
  const bookingId    = searchParams.get("id");

  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (!bookingId) { setError("Booking ID nahi mili"); setLoading(false); return; }
    fetch(`/api/invoice?bookingId=${encodeURIComponent(bookingId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setInvoice(d.invoice);
        else setError(d.message || "Invoice nahi mila");
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Invoice load ho raha hai...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-4xl mb-3">⚠️</p>
          <p className="text-red-500 font-semibold mb-1">{error}</p>
          <a href="/my-bookings" className="text-teal-600 underline text-sm">← Bookings pe Jaao</a>
        </div>
      </div>
    );
  }

  const isPaid = invoice.paymentStatus === "paid";

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #invoice-print, #invoice-print * { visibility: visible !important; }
          #invoice-print { position: fixed; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          @page { margin: 12mm; size: A4; }
        }
      `}</style>

      <div className="min-h-screen bg-gray-100 py-6 px-4">

        {/* Top bar — hidden on print */}
        <div className="no-print max-w-2xl mx-auto mb-5 flex items-center justify-between">
          <a href="/my-bookings" className="flex items-center gap-2 text-gray-600 hover:text-teal-600 text-sm font-medium transition">
            ← Bookings
          </a>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-sm transition"
          >
            🖨️ Print / Save PDF
          </button>
        </div>

        {/* ── Invoice ── */}
        <div id="invoice-print" className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">

            {/* Header band */}
            <div className="bg-gradient-to-r from-teal-600 to-teal-500 px-8 py-6 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-black tracking-tight">Brims Hospitals</h1>
                  <p className="text-teal-100 text-sm mt-0.5">Making Healthcare Affordable</p>
                  <p className="text-teal-200 text-xs mt-1">Patna, Bihar, India</p>
                </div>
                <div className="text-right">
                  <p className="text-teal-200 text-xs uppercase tracking-widest font-semibold">Invoice</p>
                  <p className="text-white font-bold text-lg mt-0.5 font-mono">{invoice.invoiceNumber}</p>
                  <p className="text-teal-200 text-xs mt-1">{fmtDateTime(invoice.invoiceDate)}</p>
                </div>
              </div>
            </div>

            <div className="px-8 py-6 space-y-6">

              {/* Booking + Patient info row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Patient */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Patient Details</p>
                  <p className="font-bold text-gray-800">{invoice.patientName}</p>
                  <p className="text-gray-500 text-sm mt-0.5">📱 {invoice.patientMobile}</p>
                  {(invoice.patientAge || invoice.patientGender) && (
                    <p className="text-gray-500 text-sm mt-0.5">
                      {invoice.patientAge ? `${invoice.patientAge} yrs` : ""}
                      {invoice.patientAge && invoice.patientGender ? " · " : ""}
                      <span className="capitalize">{invoice.patientGender || ""}</span>
                    </p>
                  )}
                </div>

                {/* Booking info */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Booking Info</p>
                  <p className="font-mono text-xs text-gray-600 bg-white border border-gray-200 px-2 py-1 rounded-lg inline-block">{invoice.bookingId}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <StatusBadge status={invoice.status} />
                    <StatusBadge status={invoice.paymentStatus} />
                  </div>
                </div>
              </div>

              {/* Service details */}
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Service Details</p>
                </div>

                <table className="w-full">
                  <thead>
                    <tr className="text-[11px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-100">
                      <th className="px-4 py-2.5 text-left">Service</th>
                      <th className="px-4 py-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-50">
                      <td className="px-4 py-4">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl mt-0.5">{TYPE_ICON[invoice.type] || "📄"}</span>
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">{invoice.serviceName}</p>
                            {invoice.serviceCategory && (
                              <p className="text-xs text-gray-500 mt-0.5">{invoice.serviceCategory}</p>
                            )}
                            {invoice.doctorName && invoice.type !== "OPD" && (
                              <p className="text-xs text-gray-500 mt-0.5">Dr. {invoice.doctorName}</p>
                            )}
                            {invoice.hospitalName && (
                              <p className="text-xs text-gray-400 mt-0.5">🏥 {invoice.hospitalName}</p>
                            )}
                            {invoice.appointmentDate && (
                              <p className="text-xs text-teal-600 mt-1 font-medium">
                                📅 {fmtDate(invoice.appointmentDate)}
                                {invoice.slot ? ` · 🕐 ${invoice.slot}` : ""}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right font-bold text-gray-800">
                        ₹{invoice.subtotal.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  </tbody>

                  {/* Totals section */}
                  <tfoot>
                    {invoice.promoCode && invoice.promoDiscount > 0 && (
                      <tr className="bg-green-50">
                        <td className="px-4 py-2.5 text-sm text-green-700">
                          🎟️ Promo: <span className="font-bold font-mono">{invoice.promoCode}</span>
                        </td>
                        <td className="px-4 py-2.5 text-right text-sm font-semibold text-green-700">
                          − ₹{invoice.promoDiscount.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    )}
                    {invoice.gstRate > 0 && (
                      <tr className="border-t border-gray-100">
                        <td className="px-4 py-2.5 text-sm text-gray-500">GST ({invoice.gstRate}%)</td>
                        <td className="px-4 py-2.5 text-right text-sm text-gray-600">
                          ₹{invoice.gstAmt.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    )}
                    <tr className="bg-teal-600 text-white">
                      <td className="px-4 py-3.5 font-bold text-base">Total Amount</td>
                      <td className="px-4 py-3.5 text-right font-black text-xl">
                        ₹{invoice.total.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Payment info */}
              <div className="flex items-center justify-between bg-gray-50 rounded-xl px-5 py-4 border border-gray-100">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Payment Method</p>
                  <p className="font-semibold text-gray-700 text-sm">
                    {PAY_MODE[invoice.paymentMode] || invoice.paymentMode}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Payment Status</p>
                  <StatusBadge status={invoice.paymentStatus} />
                </div>
              </div>

              {/* Paid stamp overlay effect */}
              {isPaid && (
                <div className="flex items-center justify-center">
                  <div className="border-4 border-green-500 text-green-600 font-black text-2xl tracking-widest px-6 py-2 rounded-xl rotate-[-3deg] opacity-60">
                    ✓ PAID
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="border-t border-gray-100 pt-5 text-center space-y-1">
                <p className="text-sm font-semibold text-gray-700">Thank you for choosing Brims Hospitals!</p>
                <p className="text-xs text-gray-400">For queries: contact@brimshospitals.com | Patna, Bihar</p>
                <p className="text-xs text-gray-300 mt-2">
                  This is a computer-generated invoice and does not require a physical signature.
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* Print hint */}
        <div className="no-print max-w-2xl mx-auto mt-4 bg-blue-50 border border-blue-100 rounded-xl px-5 py-3">
          <p className="text-blue-700 text-xs font-semibold mb-1">PDF kaise save karein?</p>
          <p className="text-blue-600 text-xs">
            "🖨️ Print / Save PDF" button dabayein → Print dialog mein <strong>"Save as PDF"</strong> select karein → Save karein.
          </p>
        </div>

      </div>
    </>
  );
}

export default function InvoicePageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <InvoicePage />
    </Suspense>
  );
}
