export { default } from './page-fixed'; ─────────────────────────────────────────────────────────────

    if (searchMobile.length !== 10) {
      onToast("10-digit mobile number required", false);
      return;
    }

    setSearching(true);
    try {
      const res = await fetch(`/api/staff/search-patient?mobile=${searchMobile}`);
      const data = await res.json();
      if (data.success) {
        setSearchResult(data);
        if (data.found) {
          setForm((p) => ({
            ...p,
            patientName: data.user.name,
            patientMobile: data.user.mobile,
            patientAge: String(data.user.age || ""),
            patientGender: data.user.gender || "male",
          }));
          setSelectedMember(data.user);
          onToast("✓ Member found", true);
        } else {
          onToast("Member not found - add as new patient", false);
        }
      } else {
        onToast(data.message || "Search error", false);
      }
    } catch (error) {
      console.error("Search error:", error);
      onToast("Search failed - try again", false);
    } finally {
      setSearching(false);
    }
  }

  function selectMember(member: any) {
    setForm((p) => ({
      ...p,
      patientName: member.name,
      patientAge: String(member.age || ""),
      patientGender: member.gender || "male",
    }));
    setSelectedMember(member);
  }

  function resetSearch() {
    setSearchMobile("");
    setSearchResult(null);
    setSelectedMember(null);
    setForm((p) => ({ ...p, patientName: "", patientAge: "", patientGender: "male" }));
  }

  async function handleSubmit() {
    if (!form.patientName || !form.patientMobile || form.patientMobile.length !== 10) {
      onToast("Patient naam aur 10-digit mobile zaruri hai", false); return;
    }
    setSaving(true);
    try {
      const res  = await fetch("/api/staff/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) || 0 }),
      });
      const data = await res.json();
      if (data.success) {
        setCreated(data);
        onToast(`✓ Booking create ho gayi — ${data.bookingId}`, true);
      } else {
        onToast(data.message || "Error", false);
      }
    } finally { setSaving(false); }
  }

  function reset() {
    setCreated(null);
    setForm({
      patientName:"", patientMobile:"", patientAge:"", patientGender:"male",
      type:"OPD", amount:"", paymentMode:"counter", paymentStatus:"pending",
      appointmentDate: new Date().toISOString().split("T")[0],
      slot:"", symptoms:"", doctorName:"",
    });
  }

  if (created) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 text-center space-y-4">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center text-2xl mx-auto">✓</div>
          <div>
            <p className="font-bold text-green-700 text-xl">Booking Successful!</p>
            <p className="text-green-600 font-mono text-lg mt-1">{created.bookingId}</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-left space-y-2 border border-green-100">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Patient</span><span className="font-semibold">{form.patientName}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Mobile</span><span className="font-semibold">{form.patientMobile}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Type</span><span className="font-semibold">{form.type}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Amount</span><span className="font-bold text-teal-700">₹{form.amount || 0}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Payment</span><span className="font-semibold">{PM_LABEL[form.paymentMode]}</span></div>
          </div>
          <div className="flex gap-3">
            <button onClick={reset} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl transition">
              + Naya Booking
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div>
        <h2 className="text-lg font-bold text-gray-800">🚶 Walk-in Booking</h2>
        <p className="text-xs text-gray-400 mt-0.5">Counter pe aaye patient ki booking create karein</p>
      </div>

      {/* Patient Search Section */}
      {!selectedMember && (
        <div className="bg-blue-50 rounded-2xl border border-blue-100 shadow-sm p-5 space-y-4">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">🔍 Patient Verification</p>
          <p className="text-sm text-blue-700">Kya ye patient pehle se registered hai? Mobile number se check karein</p>
          
          <div className="flex gap-2">
            <input
              type="tel"
              maxLength={10}
              value={searchMobile}
              onChange={(e) => setSearchMobile(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && handleSearchPatient()}
              placeholder="Mobile number"
              className="flex-1 border border-blue-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={handleSearchPatient}
              disabled={searching || searchMobile.length !== 10}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
            >
              {searching ? "..." : "Search"}
            </button>
          </div>

          {/* Search Results */}
          {searchResult && (
            <>
              {searchResult.found ? (
                <div className="bg-white rounded-xl border border-green-200 p-4 space-y-3">
                  <p className="text-xs font-bold text-green-700">✓ Member Found</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name</span>
                      <span className="font-semibold">{searchResult.user.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mobile</span>
                      <span className="font-semibold">{searchResult.user.mobile}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Age</span>
                      <span className="font-semibold">{searchResult.user.age || "—"}</span>
                    </div>
                  </div>

                  {/* Primary + Family Members */}
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-600 mb-2">Kaun member hai?</p>
                    <div className="space-y-2">
                      <button
                        onClick={() => selectMember(searchResult.user)}
                        className="w-full flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition"
                      >
                        <input type="radio" checked={selectedMember?.userId === searchResult.user.userId} readOnly />
                        <div className="text-left">
                          <p className="text-sm font-semibold text-gray-800">{searchResult.user.name}</p>
                          <p className="text-xs text-gray-500">Primary Member</p>
                        </div>
                      </button>

                      {(searchResult.familyMembers || []).map((m: any) => (
                        <button
                          key={m.id}
                          onClick={() => selectMember({ ...m, userId: searchResult.user.userId })}
                          className="w-full flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition"
                        >
                          <input type="radio" readOnly />
                          <div className="text-left">
                            <p className="text-sm font-semibold text-gray-800">{m.name}</p>
                            <p className="text-xs text-gray-500">{m.relationship}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
               ) : (
                 <div className="space-y-3">
                   <div className="bg-orange-50 rounded-xl border border-orange-200 p-4">
                     <p className="text-xs font-bold text-orange-700 mb-2">➕ Naya Patient Register Karein</p>
                     <p className="text-sm text-gray-600">Ye patient system mein registered nahi hai. Neeche form fill karke add karein:</p>
                   </div>

                   {/* New Patient Quick Form */}
                   <div className="bg-white rounded-xl border border-orange-100 p-4 space-y-3">
                     <div>
                       <label className="text-xs font-semibold text-gray-500 block mb-1">Patient Name *</label>
                       <input
                         value={form.patientName}
                         onChange={(e) => set("patientName", e.target.value)}
                         placeholder="Full naam"
                         className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                       />
                     </div>

                     <div className="grid grid-cols-2 gap-3">
                       <div>
                         <label className="text-xs font-semibold text-gray-500 block mb-1">Age</label>
                         <input
                           type="number"
                           value={form.patientAge}
                           onChange={(e) => set("patientAge", e.target.value)}
                           placeholder="Years"
                           className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                         />
                       </div>
                       <div>
                         <label className="text-xs font-semibold text-gray-500 block mb-1">Gender</label>
                         <select
                           value={form.patientGender}
                           onChange={(e) => set("patientGender", e.target.value)}
                           className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                         >
                           <option value="male">Male</option>
                           <option value="female">Female</option>
                           <option value="other">Other</option>
                         </select>
                       </div>
                     </div>

                     <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                       <p className="text-xs font-semibold text-blue-700 mb-1">💡 Tip:</p>
                       <p className="text-xs text-blue-600">
                         Booking karne ke baad patient registration form fill kara sakte ho
                       </p>
                     </div>
                   </div>
                 </div>
               )}
             </>
           )}
      )}

      {selectedMember && (
        <div className="bg-green-50 rounded-2xl border border-green-100 p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-800">{selectedMember.name}</p>
            <p className="text-xs text-gray-500">{selectedMember.mobile}</p>
          </div>
          <button
            onClick={resetSearch}
            className="text-xs text-orange-600 hover:text-orange-700 font-semibold px-3 py-1 rounded-lg hover:bg-orange-50"
          >
            Change
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide border-b border-gray-100 pb-2">Patient Details</p>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs font-semibold text-gray-500 block mb-1">Patient Name *</label>
            <input value={form.patientName} onChange={(e) => set("patientName", e.target.value)}
              placeholder="Full naam likhein"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Mobile *</label>
            <input type="tel" maxLength={10} value={form.patientMobile} onChange={(e) => set("patientMobile", e.target.value.replace(/\D/g, ""))}
              placeholder="10-digit"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Age</label>
            <input type="number" value={form.patientAge} onChange={(e) => set("patientAge", e.target.value)}
              placeholder="Years"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-semibold text-gray-500 block mb-1.5">Gender</label>
            <div className="flex gap-2">
              {["male","female","other"].map((g) => (
                <button key={g} onClick={() => set("patientGender", g)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition capitalize ${form.patientGender === g ? "bg-orange-50 border-orange-300 text-orange-700" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                  {g === "male" ? "♂ Male" : g === "female" ? "♀ Female" : "Other"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide border-b border-gray-100 pb-2">Booking Details</p>

        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1.5">Service Type *</label>
          <div className="grid grid-cols-3 gap-2">
            {["OPD","Lab","Surgery","Consultation","IPD"].map((t) => (
              <button key={t} onClick={() => set("type", t)}
                className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium border transition ${form.type === t ? "bg-orange-50 border-orange-300 text-orange-700" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                <span>{TYPE_ICON[t]}</span> {t}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Appointment Date</label>
            <input type="date" value={form.appointmentDate} onChange={(e) => set("appointmentDate", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Time Slot</label>
            <input value={form.slot} onChange={(e) => set("slot", e.target.value)}
              placeholder="e.g. 10:00 AM"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-semibold text-gray-500 block mb-1">Doctor Name (optional)</label>
            <input value={form.doctorName} onChange={(e) => set("doctorName", e.target.value)}
              placeholder="Dr. naam likhein"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-semibold text-gray-500 block mb-1">Symptoms / Notes</label>
            <textarea value={form.symptoms} onChange={(e) => set("symptoms", e.target.value)} rows={2}
              placeholder="Symptoms ya notes..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide border-b border-gray-100 pb-2">Payment</p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Amount (₹)</label>
            <input type="number" value={form.amount} onChange={(e) => set("amount", e.target.value)}
              placeholder="0"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Status</label>
            <div className="flex gap-2 mt-1">
              <button onClick={() => set("paymentStatus","pending")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition ${form.paymentStatus === "pending" ? "bg-amber-50 border-amber-300 text-amber-700" : "border-gray-200 text-gray-500"}`}>
                Pending
              </button>
              <button onClick={() => set("paymentStatus","paid")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition ${form.paymentStatus === "paid" ? "bg-green-50 border-green-300 text-green-700" : "border-gray-200 text-gray-500"}`}>
                ✓ Paid
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1.5">Payment Mode</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value:"counter", icon:"🏢", label:"Counter/Cash" },
              { value:"online",  icon:"📱", label:"Online/UPI" },
              { value:"wallet",  icon:"💼", label:"Brims Wallet" },
              { value:"insurance",icon:"🛡️",label:"Insurance" },
            ].map((m) => (
              <button key={m.value} onClick={() => set("paymentMode", m.value)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition ${form.paymentMode === m.value ? "bg-orange-50 border-orange-300 text-orange-700" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                <span>{m.icon}</span> {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button onClick={handleSubmit} disabled={saving}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl transition disabled:opacity-50 text-base shadow-lg shadow-orange-200 flex items-center justify-center gap-2">
        {saving ? (
          <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating...</>
        ) : "✓ Booking Create Karein"}
      </button>
    </div>
  );
}

// ── Collections Tab ───────────────────────────────────────────────────────────
function CollectionsTab({ staffId }: { staffId: string }) {
  const [range, setRange]       = useState("today");
  const [data, setData]         = useState<any>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/staff/collections?range=${range}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setData(d); })
      .finally(() => setLoading(false));
  }, [range]);

  const TYPE_COLORS2: Record<string,string> = { OPD:"#0d9488", Lab:"#f59e0b", Surgery:"#9333ea", Consultation:"#2563eb", IPD:"#dc2626" };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-800">💰 Meri Collections</h2>
          <p className="text-xs text-gray-400">Maine kitna payment receive kiya</p>
        </div>
        <div className="flex bg-gray-100 rounded-xl p-1">
          {[{v:"today",l:"Aaj"},{v:"week",l:"Week"},{v:"month",l:"Month"},{v:"all",l:"All Time"}].map((r) => (
            <button key={r.v} onClick={() => setRange(r.v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${range === r.v ? "bg-white text-gray-800 shadow-sm" : "text-gray-500"}`}>
              {r.l}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-3">{[1,2,3].map(i=><div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse"/>)}</div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label:"Total Collected", value:`₹${(data?.summary?.total||0).toLocaleString()}`, icon:"💰", bg:"bg-gradient-to-br from-green-500 to-emerald-600" },
              { label:"Transactions",    value:data?.summary?.count||0, icon:"📋", bg:"bg-gradient-to-br from-orange-500 to-amber-500" },
              { label:"Avg per Bill",    value:`₹${data?.summary?.avgAmt||0}`, icon:"📊", bg:"bg-gradient-to-br from-blue-500 to-cyan-500" },
            ].map(({ label, value, icon, bg }) => (
              <div key={label} className={`${bg} rounded-2xl p-4 text-white shadow-md`}>
                <p className="text-xl mb-1">{icon}</p>
                <p className="text-2xl font-extrabold">{value}</p>
                <p className="text-xs opacity-80 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* By Type */}
          {(data?.byType||[]).length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="font-bold text-gray-800 mb-3 text-sm">📊 Service-wise Breakdown</p>
              <div className="space-y-2">
                {(data.byType||[]).map((t: any) => {
                  const maxV = Math.max(...(data.byType||[]).map((x:any)=>x.total),1);
                  const pct  = Math.round((t.total/maxV)*100);
                  return (
                    <div key={t._id} className="flex items-center gap-3">
                      <span className="text-sm w-20 shrink-0 font-medium">{TYPE_ICON[t._id]} {t._id}</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width:`${pct}%`, backgroundColor: TYPE_COLORS2[t._id]||"#6b7280" }} />
                      </div>
                      <span className="text-xs font-bold text-gray-700 w-20 text-right">₹{t.total.toLocaleString()}</span>
                      <span className="text-xs text-gray-400 w-10 text-right">{t.count}x</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* By Mode */}
          {(data?.byMode||[]).length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="font-bold text-gray-800 mb-3 text-sm">💳 Payment Mode Breakdown</p>
              <div className="grid grid-cols-2 gap-2">
                {(data.byMode||[]).map((m: any) => {
                  const modeColors: Record<string,string> = { counter:"bg-amber-50 text-amber-700 border-amber-100", online:"bg-blue-50 text-blue-700 border-blue-100", wallet:"bg-teal-50 text-teal-700 border-teal-100", insurance:"bg-purple-50 text-purple-700 border-purple-100" };
                  const modeIcons: Record<string,string>  = { counter:"🏢", online:"📱", wallet:"💼", insurance:"🛡️" };
                  const cls = modeColors[m._id] || "bg-gray-50 text-gray-700 border-gray-100";
                  return (
                    <div key={m._id} className={`${cls} border rounded-xl p-3`}>
                      <p className="text-base mb-0.5">{modeIcons[m._id]||"💳"}</p>
                      <p className="font-bold text-sm">₹{m.total.toLocaleString()}</p>
                      <p className="text-xs">{PM_LABEL[m._id]||m._id} · {m.count}x</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="font-bold text-gray-800 mb-3 text-sm">🕐 Recent Collections</p>
            {(data?.recent||[]).length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">Koi collection nahi mili</p>
            ) : (
              <div className="space-y-2">
                {(data.recent||[]).map((b: any, i: number) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-lg font-semibold ${TYPE_COLORS[b.type]||"bg-gray-100 text-gray-600"}`}>{TYPE_ICON[b.type]} {b.type}</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{b.patientName}</p>
                        <p className="text-xs text-gray-400 font-mono">{b.bookingId}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-700">₹{b.amount}</p>
                      <p className="text-xs text-gray-400">{fmtDateTime(b.collectedAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Staff Profile Tab ─────────────────────────────────────────────────────────
function StaffProfileTab({ staffId, onToast }: { staffId: string; onToast: (msg: string, ok: boolean) => void }) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: "", age: "", gender: "male", phone: "", designation: "", department: "",
    email: "", currentPassword: "", newPassword: "", confirmPassword: "",
  });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  // Fetch profile on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/staff/profile");
        const data = await res.json();
        if (data.success) {
          setProfile(data.staff);
          setForm({
            name: data.staff.name || "",
            age: data.staff.age || "",
            gender: data.staff.gender || "male",
            phone: data.staff.phone || "",
            designation: data.staff.designation || "",
            department: data.staff.department || "",
            email: data.staff.email || "",
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handlePhotoUpload(file: File) {
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload-photo", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) {
        // Update profile with new photo
        const updateRes = await fetch("/api/staff/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photo: data.url }),
        });
        const updateData = await updateRes.json();
        if (updateData.success) {
          setProfile((p: any) => ({ ...p, photo: data.url }));
          onToast("Photo updated ✓", true);
        }
      }
    } catch (e) {
      onToast("Photo upload failed", false);
    }
  }

  async function handleSave() {
    if (!form.name || !form.email) {
      onToast("Name and email required", false);
      return;
    }

    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      onToast("Passwords don't match", false);
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        name: form.name,
        age: form.age,
        gender: form.gender,
        phone: form.phone,
        designation: form.designation,
        department: form.department,
        email: form.email,
      };

      if (form.newPassword) {
        payload.password = form.newPassword;
        payload.currentPassword = form.currentPassword;
      }

      const res = await fetch("/api/staff/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setProfile(data.staff);
        setEditing(false);
        setForm((p) => ({ ...p, currentPassword: "", newPassword: "", confirmPassword: "" }));
        onToast("Profile updated ✓", true);
      } else {
        onToast(data.message || "Update failed", false);
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl h-32 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h2 className="text-lg font-bold text-gray-800">👤 My Profile</h2>
        <p className="text-xs text-gray-400 mt-0.5">Apne details aur photo update karein</p>
      </div>

      {/* Photo Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Photo</p>
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white text-3xl flex-shrink-0 overflow-hidden">
            {profile?.photo ? (
              <img src={profile.photo} alt="Staff" className="w-full h-full object-cover" />
            ) : (
              profile?.name?.charAt(0) || "S"
            )}
          </div>
          <label className="flex-1 px-4 py-3 border-2 border-dashed border-orange-300 rounded-xl text-center cursor-pointer hover:bg-orange-50 transition">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])}
              className="hidden"
            />
            <p className="text-sm font-semibold text-orange-600">📸 Photo upload karein</p>
            <p className="text-xs text-gray-400">Camera ya Gallery se</p>
          </label>
        </div>
      </div>

      {/* Details Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Personal Details</p>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-orange-600 hover:text-orange-700 font-semibold"
            >
              ✏️ Edit
            </button>
          )}
        </div>

        {!editing ? (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-500 mb-1">Name</p>
              <p className="font-semibold text-gray-800">{profile?.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Age</p>
              <p className="font-semibold text-gray-800">{profile?.age || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Gender</p>
              <p className="font-semibold text-gray-800 capitalize">{profile?.gender || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Phone</p>
              <p className="font-semibold text-gray-800">{profile?.phone || "—"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-gray-500 mb-1">Designation</p>
              <p className="font-semibold text-gray-800">{profile?.designation || "—"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-gray-500 mb-1">Department</p>
              <p className="font-semibold text-gray-800">{profile?.department || "—"}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 block mb-1">Name *</label>
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Age</label>
              <input
                type="number"
                value={form.age}
                onChange={(e) => set("age", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Gender</label>
              <select
                value={form.gender}
                onChange={(e) => set("gender", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Phone</label>
              <input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Designation</label>
              <input
                value={form.designation}
                onChange={(e) => set("designation", e.target.value)}
                placeholder="e.g. Receptionist"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Department</label>
              <input
                value={form.department}
                onChange={(e) => set("department", e.target.value)}
                placeholder="e.g. OPD, Lab"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>
        )}
      </div>

      {/* Login Credentials */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">Login Credentials</p>

        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1">Professional ID</label>
          <input
            value={form.email || profile?.professionalId}
            onChange={(e) => set("email", e.target.value)}
            disabled={!editing}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-50"
          />
          <p className="text-xs text-gray-400 mt-1">Email ya mobile se login kar sakte ho</p>
        </div>

        {editing && (
          <>
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 mb-3">🔐 Change Password (Optional)</p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Current Password</label>
                  <input
                    type="password"
                    value={form.currentPassword}
                    onChange={(e) => set("currentPassword", e.target.value)}
                    placeholder="Required if changing password"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">New Password</label>
                  <input
                    type="password"
                    value={form.newPassword}
                    onChange={(e) => set("newPassword", e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Confirm Password</label>
                  <input
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => set("confirmPassword", e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      {editing && (
        <div className="flex gap-3">
          <button
            onClick={() => {
              setEditing(false);
              setForm((p) => ({
                ...p,
                name: profile?.name,
                age: profile?.age,
                gender: profile?.gender,
                phone: profile?.phone,
                designation: profile?.designation,
                department: profile?.department,
                email: profile?.email,
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
              }));
            }}
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════

// ── MAIN STAFF DASHBOARD ───────────────────────────────────────────────────────
export default function StaffDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab]   = useState<Tab>("bookings");
  const [staffName, setStaffName]   = useState("");
  const [staffId, setStaffId]       = useState("");
  const [bookings, setBookings]     = useState<any[]>([]);
  const [stats, setStats]           = useState<any>({});
  const [loading, setLoading]       = useState(true);
  const [updating, setUpdating]     = useState<string | null>(null);
  const [payModal, setPayModal]     = useState<any>(null);
  const [billModal, setBillModal]   = useState<any>(null);
  const [toast, setToast]           = useState<{ msg: string; ok: boolean } | null>(null);

  // Filters
  const [search, setSearch]         = useState("");
  const [statusF, setStatusF]       = useState("all");
  const [typeF, setTypeF]           = useState("all");
  const [dateF, setDateF]           = useState("all");
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const name = localStorage.getItem("userName") || "Staff";
    const id   = localStorage.getItem("userId")   || "";
    if (role !== "staff" && role !== "admin") { router.replace("/login"); return; }
    setStaffName(name);
    setStaffId(id);
  }, []);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: statusF, type: typeF, date: dateF, page: String(page) });
      if (search.trim()) params.set("search", search.trim());
      const res  = await fetch(`/api/staff/bookings?${params}`);
      const data = await res.json();
      if (data.success) {
        setBookings(data.bookings);
        setStats(data.stats || {});
        setTotalPages(data.pages || 1);
      }
    } finally { setLoading(false); }
  }, [statusF, typeF, dateF, page, search]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  async function updateStatus(bookingId: string, status: string) {
    setUpdating(bookingId);
    try {
      const res  = await fetch("/api/staff/bookings", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, status }),
      });
      const data = await res.json();
      if (data.success) {
        setBookings((prev) => prev.map((b) => b.bookingId === bookingId ? { ...b, status } : b));
        showToast(`Booking ${status} ho gayi ✓`, true);
      }
    } finally { setUpdating(null); }
  }

  function handlePaySuccess(updatedBooking: any) {
    setBookings((prev) => prev.map((b) => b.bookingId === updatedBooking.bookingId ? { ...b, paymentStatus:"paid", amount: updatedBooking.amount, status:"completed" } : b));
    showToast(`₹${updatedBooking.amount} payment received ✓`, true);
    setPayModal(null);
  }

  function logout() {
    ["userId","userRole","userName","adminId","adminName"].forEach((k) => localStorage.removeItem(k));
    router.push("/login");
  }

  const NAV_TABS = [
    { key: "bookings",    icon: "📋", label: "Bookings"      },
    { key: "walkin",      icon: "🚶", label: "Walk-in"       },
    { key: "collections", icon: "💰", label: "Collections"   },
    { key: "profile",     icon: "👤", label: "My Profile"    },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50">
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}
      {payModal  && <PaymentModal booking={payModal} onClose={() => setPayModal(null)} onSuccess={handlePaySuccess} />}
      {billModal && <BillModal booking={billModal} staffName={staffName} onClose={() => setBillModal(null)} />}

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 font-bold flex items-center justify-center text-lg">
              {staffName.charAt(0) || "S"}
            </div>
            <div>
              <p className="font-bold text-gray-800 text-sm">{staffName}</p>
              <p className="text-xs text-orange-500 font-medium">Staff Panel</p>
            </div>
          </div>

          {/* Today's collection badge */}
          {stats?.todayCollectedAmt > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-3 py-1.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-green-700">Today: ₹{stats.todayCollectedAmt.toLocaleString()} collected</span>
            </div>
          )}

          <button onClick={logout} className="text-xs text-gray-500 hover:text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition">
            Logout
          </button>
        </div>

        {/* Tab nav */}
        <div className="max-w-6xl mx-auto px-4 flex gap-1 pb-0">
          {NAV_TABS.map(({ key, icon, label }) => (
            <button key={key} onClick={() => setActiveTab(key as Tab)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition ${activeTab === key ? "border-orange-500 text-orange-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
              <span>{icon}</span> {label}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">

        {/* ── BOOKINGS TAB ── */}
        {activeTab === "bookings" && (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label:"Aaj Pending",    value: stats.todayPending   || 0, color:"from-amber-500 to-orange-400"    },
                { label:"Total Pending",  value: stats.totalPending   || 0, color:"from-rose-500 to-pink-400"       },
                { label:"Confirmed",      value: stats.totalConfirmed || 0, color:"from-blue-500 to-cyan-400"       },
                { label:"Aaj Collected",  value: `₹${(stats.todayCollectedAmt||0).toLocaleString()}`, color:"from-green-500 to-emerald-400" },
              ].map((s) => (
                <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-2xl p-4 text-white shadow-sm`}>
                  <p className="text-2xl font-extrabold">{s.value}</p>
                  <p className="text-xs opacity-80 mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchBookings()}
                  placeholder="Patient naam, mobile ya Booking ID..."
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="flex bg-gray-100 rounded-xl p-1 gap-1 flex-wrap">
                  {["all","pending","confirmed","completed","cancelled"].map((s) => (
                    <button key={s} onClick={() => { setStatusF(s); setPage(1); }}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition ${statusF === s ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:bg-white/70"}`}>
                      {s === "all" ? "All" : s}
                    </button>
                  ))}
                </div>
                <div className="flex bg-gray-100 rounded-xl p-1 gap-1 flex-wrap">
                  {["all","OPD","Lab","Surgery","Consultation","IPD"].map((t) => (
                    <button key={t} onClick={() => { setTypeF(t); setPage(1); }}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition ${typeF === t ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:bg-white/70"}`}>
                      {t === "all" ? "All Types" : t}
                    </button>
                  ))}
                </div>
                <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                  {[{k:"all",l:"Sabhi"},{k:"today",l:"Aaj"},{k:"week",l:"Week"}].map((d) => (
                    <button key={d.k} onClick={() => { setDateF(d.k); setPage(1); }}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition ${dateF === d.k ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:bg-white/70"}`}>
                      {d.l}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bookings list */}
            {loading ? (
              <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="bg-white rounded-2xl h-24 animate-pulse" />)}</div>
            ) : bookings.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center">
                <p className="text-4xl mb-3">📋</p><p className="text-gray-400 text-sm">Koi booking nahi mili</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((b) => (
                  <div key={b._id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
                    {/* Color top bar */}
                    <div className={`h-0.5 w-full -mt-4 mb-3 rounded-full ${b.type==="OPD"?"bg-teal-400":b.type==="Lab"?"bg-orange-400":b.type==="Surgery"?"bg-rose-400":b.type==="IPD"?"bg-indigo-400":"bg-purple-400"}`} />

                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <p className="font-bold text-gray-800 text-sm">{b.patientName}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[b.type]||"bg-gray-100 text-gray-600"}`}>{TYPE_ICON[b.type]} {b.type}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[b.status]}`}>{b.status}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${b.paymentStatus==="paid"?"bg-green-100 text-green-600":b.paymentStatus==="refunded"?"bg-red-100 text-red-500":"bg-gray-100 text-gray-500"}`}>
                            {b.paymentStatus === "paid" ? "✓ Paid" : b.paymentStatus}
                          </span>
                        </div>
                        <div className="flex gap-3 text-xs text-gray-400 flex-wrap">
                          <span className="font-mono">{b.bookingId}</span>
                          {b.patientMobile && <span>📱 {b.patientMobile}</span>}
                          {b.patientAge    && <span>👤 {b.patientAge}yrs</span>}
                          {b.appointmentDate && <span>📅 {fmtDate(b.appointmentDate)}</span>}
                          {b.slot          && <span>🕐 {b.slot}</span>}
                          {b.amount > 0    && <span className="font-semibold text-teal-600">₹{b.amount}</span>}
                        </div>
                        {b.symptoms && (
                          <p className="text-xs text-gray-500 mt-1.5 bg-gray-50 rounded-lg px-2 py-1">💬 {b.symptoms}</p>
                        )}
                        {b.collectedByName && (
                          <p className="text-[10px] text-green-600 mt-1">✓ Collected by {b.collectedByName}</p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col gap-1.5 shrink-0">
                        {b.status === "pending" && (
                          <button onClick={() => updateStatus(b.bookingId, "confirmed")} disabled={updating === b.bookingId}
                            className="text-xs bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 transition disabled:opacity-50 whitespace-nowrap">
                            {updating === b.bookingId ? "..." : "✓ Confirm"}
                          </button>
                        )}
                        {(b.status === "pending" || b.status === "confirmed") && b.paymentStatus !== "paid" && (
                          <button onClick={() => setPayModal(b)}
                            className="text-xs bg-green-500 text-white px-3 py-1.5 rounded-lg hover:bg-green-600 transition whitespace-nowrap">
                            💰 Payment
                          </button>
                        )}
                        {(b.status === "pending" || b.status === "confirmed") && (
                          <button onClick={() => updateStatus(b.bookingId, "completed")} disabled={updating === b.bookingId}
                            className="text-xs bg-teal-500 text-white px-3 py-1.5 rounded-lg hover:bg-teal-600 transition disabled:opacity-50 whitespace-nowrap">
                            {updating === b.bookingId ? "..." : "✓ Complete"}
                          </button>
                        )}
                        <button onClick={() => setBillModal(b)}
                          className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition whitespace-nowrap">
                          🧾 Bill
                        </button>
                        {b.status !== "cancelled" && b.status !== "completed" && (
                          <button onClick={() => updateStatus(b.bookingId, "cancelled")} disabled={updating === b.bookingId}
                            className="text-xs bg-red-50 text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100 transition disabled:opacity-50 whitespace-nowrap">
                            ✕ Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition">
                  ← Pehle
                </button>
                <span className="text-sm text-gray-500">Page {page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition">
                  Aage →
                </button>
              </div>
            )}
          </>
        )}

        {/* ── WALK-IN TAB ── */}
        {activeTab === "walkin" && (
          <WalkInTab staffName={staffName} onToast={showToast} />
        )}

        {/* ── COLLECTIONS TAB ── */}
        {activeTab === "collections" && (
          <CollectionsTab staffId={staffId} />
        )}

        {/* ── PROFILE TAB ── */}
        {activeTab === "profile" && (

