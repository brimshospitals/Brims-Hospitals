import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import Transaction from "../../../../models/Transaction";
import User from "../../../../models/User";
import Coordinator from "../../../../models/Coordinator";
import Booking from "../../../../models/Booking";
import { requireAuth } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

// ── Category groups for platform accounting ───────────────────────────────────
// Income = money received BY the platform
const INCOME_CATEGORIES = [
  "card_activation_payment",
  "booking_payment",
  "booking_advance",
  "platform_charge",
  "wallet_topup",
];

// Expenses = money paid OUT by the platform
const EXPENSE_CATEGORIES = [
  "card_activation",        // legacy coordinator card commission
  "booking_commission",     // legacy coordinator booking commission
  "coordinator_commission",
  "referral",               // legacy referral cashback
  "referral_cashback",
  "pickup_charge",
  "expense",
  "withdrawal",
  "wallet_refund",
  // Partner payouts
  "hospital_payout",
  "lab_payout",
  "doctor_payout",
  "ambulance_payout",
];

// Human-readable category labels for the UI
const CATEGORY_LABELS = {
  card_activation_payment:  "Card Activation Income",
  booking_payment:          "Booking Payment",
  booking_advance:          "Advance Payment",
  platform_charge:          "Platform Charge",
  wallet_topup:             "Wallet Top-up",
  coordinator_commission:   "Coordinator Commission",
  card_activation:          "Card Commission",
  booking_commission:       "Booking Commission",
  referral_cashback:        "Referral Cashback",
  referral:                 "Referral Cashback",
  pickup_charge:            "Pickup Charge",
  expense:                  "Expense",
  withdrawal:               "Withdrawal",
  wallet_refund:            "Wallet Refund",
  wallet:                   "Wallet",
  other:                    "Other",
  hospital_payout:          "Hospital Payout",
  lab_payout:               "Lab Payout",
  doctor_payout:            "Doctor Payout",
  ambulance_payout:         "Ambulance Payout",
};

// ── GET — master ledger: stats + transactions or bookings ─────────────────────
// ?view=all|income|expenses|pending-payouts|paid-out|coordinator|staff|wallet
//         |bookings-all|bookings-pending|bookings-confirmed|bookings-completed
// ?page=1  &limit=30
// ?dateFrom=YYYY-MM-DD  &dateTo=YYYY-MM-DD
export async function GET(request) {
  const { error } = await requireAuth(request, ["admin"]);
  if (error) return error;

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const view     = searchParams.get("view")     || "all";
    const page     = parseInt(searchParams.get("page")  || "1", 10);
    const limit    = parseInt(searchParams.get("limit") || "30", 10);
    const dateFrom = searchParams.get("dateFrom");
    const dateTo   = searchParams.get("dateTo");

    // Date range filter (shared across all queries)
    const dateFilter = {};
    if (dateFrom || dateTo) {
      dateFilter.createdAt = {};
      if (dateFrom) dateFilter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        dateFilter.createdAt.$lte = end;
      }
    }

    // ── Stats aggregation (always computed) ──────────────────────────────────

    // Booking counts + total booking value
    const [
      totalBookings,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      bookingAmountAgg,
    ] = await Promise.all([
      Booking.countDocuments({ ...dateFilter }),
      Booking.countDocuments({ ...dateFilter, status: "pending" }),
      Booking.countDocuments({ ...dateFilter, status: "confirmed" }),
      Booking.countDocuments({ ...dateFilter, status: "completed" }),
      Booking.countDocuments({ ...dateFilter, status: "cancelled" }),
      Booking.aggregate([
        { $match: { ...dateFilter } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);
    const totalBookingValue = bookingAmountAgg[0]?.total || 0;

    // Platform income total (success transactions in INCOME_CATEGORIES)
    const incomeAgg = await Transaction.aggregate([
      { $match: { category: { $in: INCOME_CATEGORIES }, status: "success", ...dateFilter } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]);
    const totalIncome = incomeAgg[0]?.total || 0;

    // Platform expenses total (success transactions in EXPENSE_CATEGORIES)
    const expenseAgg = await Transaction.aggregate([
      { $match: { category: { $in: EXPENSE_CATEGORIES }, status: "success", ...dateFilter } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]);
    const totalExpenses = expenseAgg[0]?.total || 0;

    // Pending payouts (withdrawal requests not yet processed)
    const pendingPayoutsAgg = await Transaction.aggregate([
      { $match: { category: "withdrawal", status: "pending", ...dateFilter } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]);
    const pendingPayouts      = pendingPayoutsAgg[0]?.total || 0;
    const pendingPayoutsCount = pendingPayoutsAgg[0]?.count || 0;

    // Total paid out (withdrawal processed with UTR)
    const paidOutAgg = await Transaction.aggregate([
      { $match: { category: "withdrawal", status: "success", ...dateFilter } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalPaidOut = paidOutAgg[0]?.total || 0;

    const stats = {
      // Bookings
      totalBookings,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      totalBookingValue,
      // Finance
      totalIncome,
      totalExpenses,
      netBalance:           totalIncome - totalExpenses,
      pendingPayouts,
      pendingPayoutsCount,
      totalPaidOut,
    };

    // ── Coordinator lookup (used for enrichment) ──────────────────────────────
    const allCoords = await Coordinator.find({}).select("userId name coordinatorId").lean();
    const coordMap = {};
    allCoords.forEach(c => { if (c.userId) coordMap[c.userId.toString()] = c; });

    // Pending withdrawals (always returned for action bar)
    const pendingWithdrawals = await Transaction.find({ category: "withdrawal", status: "pending" })
      .sort({ createdAt: -1 })
      .populate("userId", "name mobile role")
      .lean();
    const enrichedPending = pendingWithdrawals.map(txn => ({
      ...txn,
      coordinator: txn.userId?._id ? coordMap[txn.userId._id.toString()] || null : null,
      categoryLabel: CATEGORY_LABELS[txn.category] || txn.category,
    }));

    // ── View: booking-txns — all transactions for a specific booking ─────────
    if (view === "booking-txns") {
      const { searchParams: sp } = new URL(request.url);
      const bookingMongoId = sp.get("bookingId");   // MongoDB _id
      const bookingRef     = sp.get("bookingRef");  // e.g. "BH-OPD-00008"

      const orClauses = [];
      if (bookingMongoId) {
        try {
          const { default: mongoose } = await import("mongoose");
          orClauses.push({ bookingId: new mongoose.Types.ObjectId(bookingMongoId) });
        } catch {}
      }
      if (bookingRef) {
        orClauses.push({ referenceId: bookingRef });
        // Legacy: some descriptions contain the booking ID
        orClauses.push({ description: { $regex: bookingRef, $options: "i" } });
      }

      const txns = orClauses.length > 0
        ? await Transaction.find({ $or: orClauses })
            .sort({ createdAt: 1 })
            .populate("userId", "name mobile role")
            .lean()
        : [];

      const enrichedTxns = txns.map(txn => ({
        ...txn,
        coordinator:   txn.userId?._id ? coordMap[txn.userId._id.toString()] || null : null,
        categoryLabel: CATEGORY_LABELS[txn.category] || txn.category,
      }));

      return NextResponse.json({
        success: true,
        stats,
        transactions: enrichedTxns,
        total: enrichedTxns.length,
        pendingWithdrawals: enrichedPending,
        categoryLabels: CATEGORY_LABELS,
      });
    }

    // ── View: bookings ────────────────────────────────────────────────────────
    if (view.startsWith("bookings-")) {
      const bookingStatus =
        view === "bookings-pending"   ? "pending"   :
        view === "bookings-confirmed" ? "confirmed" :
        view === "bookings-completed" ? "completed" : null;

      const bQuery = { ...dateFilter };
      if (bookingStatus) bQuery.status = bookingStatus;

      const [total, bookings] = await Promise.all([
        Booking.countDocuments(bQuery),
        Booking.find(bQuery)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .populate("userId", "name mobile")
          .populate("doctorId", "name department")
          .populate("hospitalId", "name")
          .lean(),
      ]);

      const enrichedBookings = bookings.map(b => {
        let notes = {};
        try { notes = b.notes ? JSON.parse(b.notes) : {}; } catch {}
        return { ...b, parsedNotes: notes };
      });

      return NextResponse.json({
        success: true,
        stats,
        bookings: enrichedBookings,
        total,
        pages: Math.ceil(total / limit),
        page,
        pendingWithdrawals: enrichedPending,
        categoryLabels: CATEGORY_LABELS,
      });
    }

    // ── View: transactions ────────────────────────────────────────────────────
    const txQuery = { ...dateFilter };

    if (view === "income") {
      txQuery.category = { $in: INCOME_CATEGORIES };
    } else if (view === "expenses") {
      txQuery.category = { $in: EXPENSE_CATEGORIES };
    } else if (view === "pending-payouts") {
      txQuery.category = "withdrawal";
      txQuery.status   = "pending";
    } else if (view === "paid-out") {
      txQuery.category = "withdrawal";
      txQuery.status   = "success";
    } else if (view === "coordinator") {
      const coordUserIds = allCoords.map(c => c.userId).filter(Boolean);
      txQuery.userId = { $in: coordUserIds };
    } else if (view === "staff") {
      const staffUsers = await User.find({ role: "staff" }).select("_id").lean();
      txQuery.userId = { $in: staffUsers.map(u => u._id) };
    } else if (view === "wallet") {
      txQuery.category = { $in: ["wallet", "wallet_topup", "wallet_refund"] };
    }
    // "all" — no additional filter

    const [total, transactions] = await Promise.all([
      Transaction.countDocuments(txQuery),
      Transaction.find(txQuery)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("userId", "name mobile role")
        .lean(),
    ]);

    const enrichedTxns = transactions.map(txn => ({
      ...txn,
      coordinator:   txn.userId?._id ? coordMap[txn.userId._id.toString()] || null : null,
      categoryLabel: CATEGORY_LABELS[txn.category] || txn.category,
    }));

    return NextResponse.json({
      success: true,
      stats,
      transactions: enrichedTxns,
      total,
      pages: Math.ceil(total / limit),
      page,
      pendingWithdrawals: enrichedPending,
      categoryLabels: CATEGORY_LABELS,
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// ── POST — admin adds a manual expense or platform charge entry ───────────────
export async function POST(request) {
  const { error } = await requireAuth(request, ["admin"]);
  if (error) return error;

  try {
    await connectDB();

    const { amount, description, category = "expense" } = await request.json();

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json({ success: false, message: "Valid amount required" }, { status: 400 });
    }
    if (!description?.trim()) {
      return NextResponse.json({ success: false, message: "Description required" }, { status: 400 });
    }

    const validPostCategories = ["expense", "pickup_charge", "platform_charge", "other"];
    if (!validPostCategories.includes(category)) {
      return NextResponse.json({ success: false, message: "Invalid category" }, { status: 400 });
    }

    // Use first admin user as userId for manual entries
    const adminUser = await User.findOne({ role: "admin" }).select("_id").lean();
    if (!adminUser) {
      return NextResponse.json({ success: false, message: "Admin user not found" }, { status: 404 });
    }

    const isIncome = category === "platform_charge";
    const txn = await Transaction.create({
      userId:      adminUser._id,
      type:        isIncome ? "credit" : "debit",
      amount:      Number(amount),
      description: description.trim(),
      category,
      status:      "success",
    });

    return NextResponse.json({
      success: true,
      message: `${isIncome ? "Income" : "Expense"} entry added — ₹${Number(amount).toLocaleString("en-IN")}`,
      txn,
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
