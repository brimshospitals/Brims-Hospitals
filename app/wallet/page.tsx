"use client";
import { useState, useEffect } from "react";
import Header from "../components/header";

export default function WalletPage() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addAmount, setAddAmount] = useState("");
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchWallet();
  }, []);

  async function fetchWallet() {
    const userId = localStorage.getItem("userId");
    if (!userId) { setLoading(false); return; }
    try {
      const res = await fetch(`/api/wallet?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setBalance(data.balance);
        setTransactions(data.transactions);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function handleAddMoney() {
    if (!addAmount || parseInt(addAmount) < 10) {
      setMessage("❌ Minimum ₹10 add karein");
      return;
    }
    setAdding(true);
    try {
      const userId = localStorage.getItem("userId");
      const res = await fetch("/api/wallet/add-money", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, amount: parseInt(addAmount) }),
      });
      const data = await res.json();
      if (data.success && data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        setMessage("❌ " + data.message);
      }
    } catch {
      setMessage("❌ Network error");
    }
    setAdding(false);
  }

  if (loading) return (
    <main className="min-h-screen bg-gray-50"><Header />
      <div className="flex items-center justify-center py-20 text-teal-600">Loading...</div>
    </main>
  );

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-2xl mx-auto py-8 px-4">

        {/* Wallet Card */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-6 text-white mb-6">
          <p className="text-teal-100 text-sm mb-1">Family Wallet Balance</p>
          <p className="text-4xl font-bold mb-4">₹{balance.toFixed(2)}</p>

          {/* Quick Add Buttons */}
          <div className="flex gap-2 mb-4">
            {[100, 200, 500, 1000].map((amt) => (
              <button key={amt} onClick={() => setAddAmount(amt.toString())}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  addAmount === amt.toString()
                    ? "bg-white text-teal-700"
                    : "bg-white/20 hover:bg-white/30"
                }`}>
                +₹{amt}
              </button>
            ))}
          </div>

          {/* Custom Amount */}
          <div className="flex gap-2">
            <input
              type="number"
              value={addAmount}
              onChange={(e) => setAddAmount(e.target.value)}
              placeholder="Amount daalo (₹)"
              className="flex-1 bg-white/20 text-white placeholder-white/60 border border-white/30 rounded-lg px-4 py-2.5 focus:outline-none focus:bg-white/30"
            />
            <button onClick={handleAddMoney} disabled={adding}
              className="bg-white text-teal-700 font-semibold px-5 py-2.5 rounded-lg disabled:opacity-50 hover:bg-teal-50 transition">
              {adding ? "..." : "Add"}
            </button>
          </div>

          {message && (
            <p className="mt-3 text-sm text-white/80">{message}</p>
          )}
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-700">Transaction History</h2>
          </div>

          {transactions.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <p className="text-3xl mb-2">💳</p>
              <p className="text-sm">Abhi koi transaction nahi hai</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {transactions.map((txn, i) => (
                <div key={i} className="p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                      txn.type === "credit" ? "bg-green-50" : "bg-red-50"
                    }`}>
                      {txn.type === "credit" ? "⬆️" : "⬇️"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{txn.description}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(txn.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <p className={`font-bold ${txn.type === "credit" ? "text-green-600" : "text-red-500"}`}>
                    {txn.type === "credit" ? "+" : "-"}₹{txn.amount}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 text-center">
          <a href="/dashboard" className="text-teal-600 text-sm hover:underline">← Dashboard pe wapas jaayein</a>
        </div>
      </div>
    </main>
  );
}