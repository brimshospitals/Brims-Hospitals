// ── Brims Hospitals — Translation Dictionary ─────────────────────────────────
// Usage: import { t } from "@/lib/i18n"; then t("nav.opd", lang)
// Extend this file to add more strings. Keep keys consistent.

export type Lang = "en" | "hi";

const translations: Record<string, Record<Lang, string>> = {
  // ── Navigation ──
  "nav.opd":          { en: "OPD Booking",       hi: "OPD बुकिंग" },
  "nav.lab":          { en: "Lab Tests",          hi: "लैब टेस्ट" },
  "nav.surgery":      { en: "Surgery",            hi: "सर्जरी" },
  "nav.ipd":          { en: "IPD Admission",      hi: "IPD भर्ती" },
  "nav.teleconsult":  { en: "Teleconsult",        hi: "टेलीकंसल्ट" },
  "nav.hospitals":    { en: "Hospitals",          hi: "अस्पताल" },
  "nav.ambulance":    { en: "Ambulance",          hi: "एम्बुलेंस" },
  "nav.articles":     { en: "Articles",           hi: "लेख" },
  "nav.contact":      { en: "Contact",            hi: "संपर्क" },
  "nav.login":        { en: "Login / Register",   hi: "लॉगिन / रजिस्टर" },
  "nav.logout":       { en: "Logout",             hi: "लॉगआउट" },
  "nav.dashboard":    { en: "Dashboard",          hi: "डैशबोर्ड" },
  "nav.myBookings":   { en: "My Bookings",        hi: "मेरी बुकिंग" },
  "nav.notifications":{ en: "Notifications",      hi: "सूचनाएं" },

  // ── Dashboard tiles ──
  "tile.opd":         { en: "OPD Booking",        hi: "OPD बुकिंग" },
  "tile.teleconsult": { en: "Teleconsult",        hi: "टेलीकंसल्ट" },
  "tile.lab":         { en: "Lab Tests",          hi: "लैब टेस्ट" },
  "tile.surgery":     { en: "Surgery",            hi: "सर्जरी" },
  "tile.ipd":         { en: "IPD Admission",      hi: "IPD भर्ती" },
  "tile.reports":     { en: "My Reports",         hi: "मेरी रिपोर्ट" },
  "tile.hospitals":   { en: "Hospitals",          hi: "अस्पताल" },
  "tile.ambulance":   { en: "Ambulance",          hi: "एम्बुलेंस" },
  "tile.referral":    { en: "Refer & Earn",       hi: "रेफर करें" },
  "tile.healthCard":  { en: "Health Card",        hi: "हेल्थ कार्ड" },

  "tile.opd.sub":         { en: "Specialist appointment",    hi: "विशेषज्ञ अपॉइंटमेंट" },
  "tile.teleconsult.sub": { en: "Video / Audio Call",        hi: "वीडियो / ऑडियो कॉल" },
  "tile.lab.sub":         { en: "Home collection",           hi: "होम कलेक्शन" },
  "tile.surgery.sub":     { en: "All-inclusive package",     hi: "पूरा पैकेज" },
  "tile.ipd.sub":         { en: "Inpatient / hospital stay", hi: "इनपेशेंट भर्ती" },
  "tile.reports.sub":     { en: "Lab & medical reports",     hi: "लैब और रिपोर्ट" },
  "tile.hospitals.sub":   { en: "Find verified hospitals",   hi: "अस्पताल खोजें" },
  "tile.ambulance.sub":   { en: "Emergency request",         hi: "आपातकालीन अनुरोध" },
  "tile.referral.sub":    { en: "₹50 cashback per referral", hi: "₹50 कैशबैक प्रति रेफरल" },
  "tile.healthCard.sub":  { en: "Download PDF card",         hi: "PDF कार्ड डाउनलोड" },

  // ── Common buttons ──
  "btn.book":         { en: "Book Now",           hi: "अभी बुक करें" },
  "btn.search":       { en: "Search",             hi: "खोजें" },
  "btn.confirm":      { en: "Confirm",            hi: "पुष्टि करें" },
  "btn.cancel":       { en: "Cancel",             hi: "रद्द करें" },
  "btn.back":         { en: "Back",               hi: "वापस" },
  "btn.next":         { en: "Next",               hi: "आगे" },
  "btn.save":         { en: "Save",               hi: "सहेजें" },
  "btn.submit":       { en: "Submit",             hi: "सबमिट करें" },
  "btn.download":     { en: "Download",           hi: "डाउनलोड" },
  "btn.print":        { en: "Print / Save PDF",   hi: "प्रिंट / PDF सेव करें" },
  "btn.addMoney":     { en: "Add Money",          hi: "पैसे जोड़ें" },
  "btn.viewAll":      { en: "View All",           hi: "सब देखें" },

  // ── Status labels ──
  "status.pending":   { en: "Pending",            hi: "लंबित" },
  "status.confirmed": { en: "Confirmed",          hi: "पुष्टि हुई" },
  "status.completed": { en: "Completed",          hi: "पूर्ण" },
  "status.cancelled": { en: "Cancelled",          hi: "रद्द" },
  "status.paid":      { en: "Paid",               hi: "भुगतान हुआ" },
  "status.pending_pay":{ en: "Payment Pending",   hi: "भुगतान बाकी" },
  "status.refunded":  { en: "Refunded",           hi: "वापस हुआ" },

  // ── Booking types ──
  "type.opd":         { en: "OPD Appointment",    hi: "OPD अपॉइंटमेंट" },
  "type.lab":         { en: "Lab Test",           hi: "लैब टेस्ट" },
  "type.surgery":     { en: "Surgery Package",    hi: "सर्जरी पैकेज" },
  "type.consultation":{ en: "Teleconsultation",   hi: "टेलीकंसल्टेशन" },
  "type.ipd":         { en: "IPD Admission",      hi: "IPD भर्ती" },

  // ── Payment modes ──
  "pay.counter":      { en: "Counter / Cash",     hi: "काउंटर / नकद" },
  "pay.online":       { en: "Online / UPI",       hi: "ऑनलाइन / UPI" },
  "pay.wallet":       { en: "Brims Wallet",       hi: "ब्रिम्स वॉलेट" },
  "pay.insurance":    { en: "Insurance",          hi: "बीमा" },

  // ── Dashboard greeting ──
  "dash.hello":       { en: "Hello",              hi: "नमस्ते" },
  "dash.wallet":      { en: "Wallet Balance",     hi: "वॉलेट बैलेंस" },
  "dash.card":        { en: "Family Card",        hi: "फैमिली कार्ड" },
  "dash.members":     { en: "Members",            hi: "सदस्य" },
  "dash.myBookings":  { en: "My Bookings",        hi: "मेरी बुकिंग" },
  "dash.services":    { en: "Our Services",       hi: "हमारी सेवाएं" },
  "dash.activateCard":{ en: "Activate Family Card",hi: "फैमिली कार्ड सक्रिय करें" },
  "dash.addMoney":    { en: "Add Money",          hi: "पैसे जोड़ें" },
  "dash.addMember":   { en: "Add Member",         hi: "सदस्य जोड़ें" },

  // ── Common phrases ──
  "common.loading":   { en: "Loading...",         hi: "लोड हो रहा है..." },
  "common.error":     { en: "Something went wrong", hi: "कुछ गलत हुआ" },
  "common.noData":    { en: "No data found",      hi: "कोई डेटा नहीं मिला" },
  "common.required":  { en: "Required",           hi: "जरूरी" },
  "common.optional":  { en: "Optional",           hi: "वैकल्पिक" },
  "common.free":      { en: "FREE",               hi: "मुफ्त" },
  "common.perYear":   { en: "per year",           hi: "प्रति वर्ष" },
  "common.bookings":  { en: "bookings",           hi: "बुकिंग" },
  "common.patients":  { en: "patients",           hi: "मरीज" },
  "common.doctors":   { en: "doctors",            hi: "डॉक्टर" },
  "common.hospitals": { en: "hospitals",          hi: "अस्पताल" },

  // ── Membership ──
  "mem.activate":     { en: "Activate Card",      hi: "कार्ड सक्रिय करें" },
  "mem.active":       { en: "Active",             hi: "सक्रिय" },
  "mem.expired":      { en: "Expired",            hi: "समाप्त" },
  "mem.validTill":    { en: "Valid till",         hi: "तक मान्य" },
  "mem.cardNumber":   { en: "Card Number",        hi: "कार्ड नंबर" },
  "mem.familyCard":   { en: "Family Card",        hi: "फैमिली कार्ड" },
  "mem.price":        { en: "₹249/year",          hi: "₹249/वर्ष" },
};

// Main translation function
export function t(key: string, lang: Lang): string {
  return translations[key]?.[lang] ?? translations[key]?.["en"] ?? key;
}

// Hook-friendly helper — returns a bound translator
export function useT(lang: Lang) {
  return (key: string) => t(key, lang);
}

export default translations;
