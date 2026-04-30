"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Member = {
  name: string;
  age: number;
  gender: string;
  relationship: string;
  memberId: string;
  photo?: string;
  mobile?: string;
  isPrimary?: boolean;
};

type Profile = {
  name: string;
  mobile: string;
  memberId: string;
  photo?: string;
  age: number;
  gender: string;
  address?: { district?: string; state?: string };
  familyMembers?: Member[];
  walletBalance?: number;
  familyCard?: { expiryDate?: string; cardNumber?: string; status?: string };
};

/* ═══════════════════════════════════════════════════
   CARD FRONT  (340 × 214 px on-screen)
   ═══════════════════════════════════════════════════ */
function CardFront({
  m,
  mobile,
  logoSrc,
  cardExpiry,
}: {
  m: Member;
  mobile: string;
  logoSrc: string;
  cardExpiry?: string;
}) {
  const sex = m.gender === "male" ? "Male" : m.gender === "female" ? "Female" : m.gender;
  const rel = m.isPrimary ? "Primary Member" : m.relationship;
  const expiryLabel = cardExpiry
    ? new Date(cardExpiry).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "2-digit" })
    : "1 Year";

  return (
    <div
      style={{
        width: "340px",
        height: "214px",
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "0 10px 40px rgba(0,0,0,0.25)",
        fontFamily: "Arial, sans-serif",
        position: "relative",
        background: "linear-gradient(145deg, #009e94 0%, #00b5a5 55%, #00cbb9 100%)",
        flexShrink: 0,
      }}
    >
      {/* Dot-grid texture */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.13) 1px, transparent 1px)",
        backgroundSize: "9px 9px",
        zIndex: 0,
      }} />

      {/* Decorative circle top-right */}
      <div style={{
        position: "absolute", top: "-30px", right: "-30px",
        width: "110px", height: "110px",
        borderRadius: "50%",
        border: "18px solid rgba(255,255,255,0.08)",
        zIndex: 0,
      }} />
      <div style={{
        position: "absolute", bottom: "20px", left: "-20px",
        width: "70px", height: "70px",
        borderRadius: "50%",
        border: "12px solid rgba(255,255,255,0.06)",
        zIndex: 0,
      }} />

      {/* ── HEADER: Logo + Hospital Name ── */}
      <div style={{
        position: "relative", zIndex: 1,
        display: "flex", alignItems: "center",
        padding: "8px 10px 5px",
        gap: "7px",
        borderBottom: "1px solid rgba(255,255,255,0.18)",
      }}>
        <div style={{
          background: "white",
          borderRadius: "8px",
          padding: "2px 5px",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
          height: "30px",
          width: "30px",
          overflow: "hidden",
        }}>
          <img src={logoSrc} alt="Brims" style={{ height: "26px", width: "26px", objectFit: "contain" }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ color: "#fff", fontWeight: "900", fontSize: "9px", margin: 0, lineHeight: 1.25, letterSpacing: "0.2px" }}>
            Dr. Birendra Ray Institute Of Medical Sciences
          </p>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "6.5px", margin: "1px 0 0" }}>
            A unit of Birendra Ray Institute Of Medical Sciences Pvt. Ltd.
          </p>
        </div>
        <div style={{
          background: "rgba(255,255,255,0.15)",
          border: "1px solid rgba(255,255,255,0.3)",
          borderRadius: "6px",
          padding: "2px 6px",
          flexShrink: 0,
        }}>
          <p style={{ color: "#FFD700", fontWeight: "800", fontSize: "6px", margin: 0, letterSpacing: "0.5px" }}>GOLD</p>
        </div>
      </div>

      {/* ── GOLD CARD BANNER ── */}
      <div style={{
        position: "relative", zIndex: 1,
        background: "linear-gradient(90deg, #e6a800 0%, #FFB800 40%, #ffd454 60%, #FFB800 80%, #e6a800 100%)",
        padding: "3.5px 0",
        textAlign: "center",
      }}>
        <p style={{ color: "#3d2200", fontWeight: "900", fontSize: "9px", letterSpacing: "3px", margin: 0 }}>
          ✦  BRIMS GOLD CARD  ✦
        </p>
      </div>

      {/* ── MEMBER INFO BODY ── */}
      <div style={{
        position: "relative", zIndex: 1,
        display: "flex", alignItems: "center",
        padding: "8px 12px 0",
        gap: "12px",
      }}>
        {/* Photo circle with gold ring */}
        <div style={{ flexShrink: 0, position: "relative" }}>
          <div style={{
            width: "72px", height: "72px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #FFB800, #e6a800)",
            padding: "2.5px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{
              width: "67px", height: "67px",
              borderRadius: "50%",
              overflow: "hidden",
              background: "rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {m.photo
                ? <img src={m.photo} alt={m.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontSize: "26px", fontWeight: "900", color: "#FFB800" }}>
                    {m.name.charAt(0).toUpperCase()}
                  </span>
              }
            </div>
          </div>
          {/* Relation badge */}
          <div style={{
            position: "absolute", bottom: "-2px", left: "50%", transform: "translateX(-50%)",
            background: "#FFB800", borderRadius: "4px",
            padding: "1.5px 5px",
            whiteSpace: "nowrap",
          }}>
            <p style={{ fontSize: "6px", fontWeight: "800", color: "#3d2200", margin: 0, letterSpacing: "0.3px" }}>
              {rel.toUpperCase()}
            </p>
          </div>
        </div>

        {/* Details table */}
        <div style={{ flex: 1 }}>
          <p style={{ color: "#fff", fontWeight: "900", fontSize: "14px", margin: "0 0 4px", lineHeight: 1.1, textShadow: "0 1px 3px rgba(0,0,0,0.3)" }}>
            {m.name}
          </p>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <tbody>
              {[
                ["Age / Sex",  `${m.age} Yrs / ${sex}`],
                ["Mobile No.", `+91 ${mobile}`],
                ["Member ID",  m.memberId || "Pending"],
                ["Valid Till", expiryLabel],
              ].map(([label, value]) => (
                <tr key={label}>
                  <td style={{
                    color: "rgba(255,230,100,1)",
                    fontSize: "7.5px",
                    fontWeight: "800",
                    paddingRight: "4px",
                    paddingBottom: "3px",
                    whiteSpace: "nowrap",
                    verticalAlign: "top",
                  }}>
                    {label} :
                  </td>
                  <td style={{
                    color: "#fff",
                    fontSize: "8.5px",
                    fontWeight: label === "Member ID" ? "800" : "700",
                    paddingBottom: "3px",
                    fontFamily: label === "Member ID" ? "monospace" : "Arial, sans-serif",
                    letterSpacing: label === "Member ID" ? "0.8px" : "0",
                    textShadow: "0 1px 2px rgba(0,0,0,0.2)",
                  }}>
                    {value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── YELLOW FOOTER ── */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        background: "linear-gradient(90deg, #e6a800 0%, #FFB800 50%, #e6a800 100%)",
        padding: "3px 10px",
        display: "flex",
        alignItems: "center",
        gap: "7px",
        zIndex: 1,
      }}>
        <div style={{
          width: "20px", height: "20px",
          background: "#009e94",
          borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
          overflow: "hidden",
          border: "1.5px solid rgba(255,255,255,0.4)",
        }}>
          <img src={logoSrc} alt="B" style={{ width: "16px", height: "16px", objectFit: "contain" }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ color: "#3d2200", fontWeight: "800", fontSize: "6.5px", margin: 0, lineHeight: 1.3 }}>
            SH73, Rambagh, Tariya, Saran – 841424
          </p>
          <p style={{ color: "#3d2200", fontWeight: "700", fontSize: "6px", margin: 0 }}>
            24×7 Emergency: 9955564596
          </p>
        </div>
        <p style={{ color: "#5a3500", fontSize: "5.5px", fontWeight: "600", margin: 0, textAlign: "right" }}>
          www.brimshospitals.com
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   PRINT HTML — front (left) + back (right) per member
   Credit card: 85.6mm × 54mm
   ═══════════════════════════════════════════════════ */
function buildPrintHtml(members: Member[], mobile: string, logoUrl: string, cardExpiry?: string): string {
  const cardStyle = `
    width:85.6mm; height:54mm; border-radius:4mm; overflow:hidden;
    font-family:Arial,sans-serif; position:relative;
    background:linear-gradient(145deg,#009e94 0%,#00b5a5 55%,#00cbb9 100%);
    flex-shrink:0; box-sizing:border-box;
  `;
  const dotBg = `
    position:absolute;inset:0;
    background-image:radial-gradient(circle,rgba(255,255,255,0.13) 1px,transparent 1px);
    background-size:9px 9px; z-index:0;
  `;
  const expiryLabel = cardExpiry
    ? new Date(cardExpiry).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "2-digit" })
    : "1 Year";
  const expiryBackText = cardExpiry
    ? `Valid Till: ${new Date(cardExpiry).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })}`
    : "Valid for 1 Year from Date of Activation";

  const cards = members.map((m) => {
    const sex = m.gender === "male" ? "Male" : m.gender === "female" ? "Female" : m.gender;
    const rel = m.isPrimary ? "Primary Member" : m.relationship;
    const safeId = m.memberId || "Pending";
    const photoHtml = m.photo
      ? `<img src="${m.photo}" style="width:100%;height:100%;object-fit:cover"/>`
      : `<span style="font-size:18px;font-weight:900;color:#FFB800">${m.name.charAt(0).toUpperCase()}</span>`;

    const frontHtml = `
      <div style="${cardStyle}">
        <div style="${dotBg}"></div>
        <div style="position:absolute;top:-20px;right:-20px;width:80px;height:80px;border-radius:50%;border:14px solid rgba(255,255,255,0.08);z-index:0;"></div>
        <!-- Header -->
        <div style="position:relative;z-index:1;display:flex;align-items:center;padding:4px 6px 3px;gap:5px;border-bottom:1px solid rgba(255,255,255,0.18);">
          <div style="background:white;border-radius:5px;padding:1px 3px;width:22px;height:22px;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;">
            <img src="${logoUrl}" style="width:20px;height:20px;object-fit:contain"/>
          </div>
          <div style="flex:1;">
            <p style="color:#fff;font-weight:900;font-size:6.5px;margin:0;line-height:1.25;">Dr. Birendra Ray Institute Of Medical Sciences</p>
            <p style="color:rgba(255,255,255,0.75);font-size:5px;margin:1px 0 0;">A unit of Birendra Ray Institute Of Medical Sciences Pvt. Ltd.</p>
          </div>
          <div style="background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);border-radius:4px;padding:1px 4px;flex-shrink:0;">
            <p style="color:#FFD700;font-weight:800;font-size:5px;margin:0;letter-spacing:0.5px;">GOLD</p>
          </div>
        </div>
        <!-- Gold banner -->
        <div style="position:relative;z-index:1;background:linear-gradient(90deg,#e6a800,#FFB800,#ffd454,#FFB800,#e6a800);padding:2.5px 0;text-align:center;">
          <p style="color:#3d2200;font-weight:900;font-size:6.5px;letter-spacing:3px;margin:0;">✦  BRIMS GOLD CARD  ✦</p>
        </div>
        <!-- Body -->
        <div style="position:relative;z-index:1;display:flex;align-items:center;padding:5px 8px 0;gap:8px;">
          <div style="flex-shrink:0;position:relative;">
            <div style="width:50px;height:50px;border-radius:50%;background:linear-gradient(135deg,#FFB800,#e6a800);padding:2px;display:flex;align-items:center;justify-content:center;">
              <div style="width:46px;height:46px;border-radius:50%;overflow:hidden;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;">
                ${photoHtml}
              </div>
            </div>
            <div style="position:absolute;bottom:-1px;left:50%;transform:translateX(-50%);background:#FFB800;border-radius:3px;padding:1px 4px;white-space:nowrap;">
              <p style="font-size:5px;font-weight:800;color:#3d2200;margin:0;letter-spacing:0.3px;">${rel.toUpperCase()}</p>
            </div>
          </div>
          <div style="flex:1;">
            <p style="color:#fff;font-weight:900;font-size:10px;margin:0 0 3px;line-height:1.1;text-shadow:0 1px 2px rgba(0,0,0,0.3);">${m.name}</p>
            <table style="border-collapse:collapse;width:100%;">
              <tr><td style="color:rgba(255,230,100,1);font-size:5.5px;font-weight:800;padding-right:3px;padding-bottom:2px;white-space:nowrap;">Age / Sex :</td><td style="color:#fff;font-size:6.5px;font-weight:700;padding-bottom:2px;">${m.age} Yrs / ${sex}</td></tr>
              <tr><td style="color:rgba(255,230,100,1);font-size:5.5px;font-weight:800;padding-right:3px;padding-bottom:2px;white-space:nowrap;">Mobile No. :</td><td style="color:#fff;font-size:6.5px;font-weight:700;padding-bottom:2px;">+91 ${mobile}</td></tr>
              <tr><td style="color:rgba(255,230,100,1);font-size:5.5px;font-weight:800;padding-right:3px;padding-bottom:2px;white-space:nowrap;">Member ID :</td><td style="color:#fff;font-size:6px;font-weight:800;font-family:monospace;letter-spacing:0.8px;padding-bottom:2px;">${safeId}</td></tr>
              <tr><td style="color:rgba(255,230,100,1);font-size:5.5px;font-weight:800;padding-right:3px;white-space:nowrap;">Valid Till :</td><td style="color:#fff;font-size:6.5px;font-weight:700;">${expiryLabel}</td></tr>
            </table>
          </div>
        </div>
        <!-- Footer -->
        <div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(90deg,#e6a800,#FFB800,#e6a800);padding:2.5px 8px;display:flex;align-items:center;gap:5px;z-index:1;">
          <div style="width:14px;height:14px;background:#009e94;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;border:1px solid rgba(255,255,255,0.4);">
            <img src="${logoUrl}" style="width:11px;height:11px;object-fit:contain"/>
          </div>
          <div style="flex:1;">
            <p style="color:#3d2200;font-weight:800;font-size:5px;margin:0;line-height:1.3;">SH73, Rambagh, Tariya, Saran – 841424</p>
            <p style="color:#3d2200;font-weight:700;font-size:4.5px;margin:0;">24×7 Emergency: 9955564596</p>
          </div>
          <p style="color:#5a3500;font-size:4.5px;font-weight:600;margin:0;text-align:right;">www.brimshospitals.com</p>
        </div>
      </div>
    `;

    const backHtml = `
      <div style="${cardStyle}display:flex;flex-direction:column;">
        <div style="${dotBg}"></div>
        <div style="position:absolute;top:-30px;left:-30px;width:100px;height:100px;border-radius:50%;border:16px solid rgba(255,255,255,0.07);z-index:0;"></div>
        <!-- Magnetic stripe -->
        <div style="background:rgba(0,0,0,0.3);height:20px;margin-top:12px;position:relative;z-index:1;"></div>
        <!-- Center -->
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;z-index:1;padding:4px 16px;gap:3px;">
          <div style="width:38px;height:38px;background:linear-gradient(135deg,#FFB800,#e6a800);border-radius:50%;padding:2px;display:flex;align-items:center;justify-content:center;margin-bottom:3px;">
            <div style="width:34px;height:34px;background:white;border-radius:50%;display:flex;align-items:center;justify-content:center;overflow:hidden;">
              <img src="${logoUrl}" style="width:30px;height:30px;object-fit:contain"/>
            </div>
          </div>
          <p style="color:#fff;font-weight:900;font-size:8.5px;margin:0;letter-spacing:1.5px;text-align:center;">BRIMS HOSPITALS</p>
          <p style="color:rgba(255,255,255,0.8);font-size:5px;margin:0;text-align:center;line-height:1.4;">Dr. Birendra Ray Institute Of Medical Sciences Pvt. Ltd.</p>
          <p style="color:#FFD700;font-size:5px;margin:2px 0 0;font-style:italic;">Making Healthcare Affordable</p>
          <p style="color:rgba(255,255,255,0.8);font-size:5.5px;margin:2px 0 0;text-align:center;font-weight:700;">${expiryBackText}</p>
        </div>
        <!-- Footer -->
        <div style="background:linear-gradient(90deg,#e6a800,#FFB800,#e6a800);padding:3.5px 10px;display:flex;justify-content:space-between;align-items:center;position:relative;z-index:1;">
          <div>
            <p style="color:#3d2200;font-weight:800;font-size:6px;margin:0;line-height:1.4;">SH73, Rambagh, Tariya, Saran – 841424</p>
            <p style="color:#3d2200;font-weight:700;font-size:5.5px;margin:0;">Helpline: 9955564596 · www.brimshospitals.com</p>
          </div>
          <p style="color:#5a3500;font-weight:800;font-size:5.5px;margin:0;text-align:right;">24×7<br/>Emergency</p>
        </div>
      </div>
    `;

    return `
      <div class="card-row">
        <div class="card-wrap">
          <p class="card-label">${m.name} — Front</p>
          ${frontHtml}
        </div>
        <div class="card-wrap">
          <p class="card-label">${m.name} — Back</p>
          ${backHtml}
        </div>
      </div>
    `;
  }).join("");

  return `<!DOCTYPE html><html><head>
    <title>Brims Health Cards</title>
    <meta charset="UTF-8"/>
    <style>
      * {
        box-sizing: border-box; margin: 0; padding: 0;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      body {
        font-family: Arial, sans-serif; background: #e5e5e5; padding: 12mm;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .card-row {
        display: flex;
        gap: 8mm;
        align-items: flex-start;
        margin-bottom: 8mm;
        justify-content: center;
      }
      .card-wrap { display: flex; flex-direction: column; gap: 2mm; align-items: center; }
      .card-label { font-size: 8px; color: #666; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; }
      img { display: block; }
      @media print {
        body { background: #e5e5e5; padding: 8mm; }
        .no-print { display: none !important; }
        @page { size: A4 landscape; margin: 8mm; }
      }
    </style>
  </head><body>
  <div class="no-print" style="text-align:center;margin-bottom:16px">
    <button onclick="window.print()" style="background:#00b5a5;color:white;border:none;padding:10px 28px;border-radius:8px;font-size:14px;cursor:pointer;font-weight:700;letter-spacing:1px;box-shadow:0 4px 12px rgba(0,0,0,0.2)">
      🖨️ Print / Save as PDF
    </button>
  </div>
  ${cards}
  </body></html>`;
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════ */
export default function HealthCardPage() {
  const router  = useRouter();
  const [profile, setProfile]         = useState<Profile | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [paidMembers, setPaidMembers] = useState<Set<string>>(new Set());
  const [payingFor, setPayingFor]     = useState<string | null>(null);
  const [toast, setToast]             = useState("");

  function showToast(msg: string, ms = 4000) {
    setToast(msg);
    setTimeout(() => setToast(""), ms);
  }

  useEffect(() => {
    (async () => {
      try {
        // Get userId: localStorage first, fallback to session cookie
        let userId = localStorage.getItem("userId") || "";
        if (!userId) {
          const meRes  = await fetch("/api/auth/me");
          const meData = await meRes.json();
          if (!meData.success) {
            setError("Login karein pehle.");
            setLoading(false);
            return;
          }
          userId = meData.userId || "";
        }
        if (!userId) { setError("Login karein pehle."); setLoading(false); return; }

        const res  = await fetch(`/api/profile?userId=${userId}`);
        const data = await res.json();
        if (data.success) {
          const u = data.user;
          if (data.familyCard) u.familyCard = data.familyCard;
          if (data.familyMembers?.length) {
            u.familyMembers = data.familyMembers.map((m: any) => ({
              name:         m.name,
              age:          m.age,
              gender:       m.gender,
              relationship: m.relationship || "member",
              memberId:     m.memberId,
              photo:        m.photo,
            }));
          }
          // Restore paid members from localStorage (survive page refresh)
          if (u.memberId) {
            const stored = localStorage.getItem(`hc_paid_${u.memberId}`);
            if (stored) {
              try { setPaidMembers(new Set(JSON.parse(stored))); } catch {}
            }
          }
          setProfile(u);
        } else {
          setError(data.message || "Profile load nahi hua.");
        }
      } catch { setError("Network error"); }
      finally { setLoading(false); }
    })();
  }, []);

  // Convert image URL → base64 so photos render correctly in the print window.
  // 8-second timeout prevents downloadCard from hanging on slow/broken images.
  async function imgToDataUrl(src: string): Promise<string> {
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(src), 8000);
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        clearTimeout(timer);
        try {
          const canvas = document.createElement("canvas");
          canvas.width  = img.naturalWidth  || 200;
          canvas.height = img.naturalHeight || 200;
          canvas.getContext("2d")?.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/jpeg", 0.92));
        } catch {
          resolve(src);
        }
      };
      img.onerror = () => { clearTimeout(timer); resolve(src); };
      img.src = src.includes("cloudinary.com")
        ? src + (src.includes("?") ? "&" : "?") + "cb=" + Date.now()
        : src;
    });
  }

  async function downloadCard(singleMember?: Member | Member[]) {
    if (!profile) return;
    const logoUrl = window.location.origin + "/logo.png";

    let rawMembers: Member[];
    if (Array.isArray(singleMember)) {
      rawMembers = singleMember;
    } else if (singleMember) {
      rawMembers = [singleMember];
    } else {
      // Print All — warn about skipped unpaid secondary members
      rawMembers = allMembers.filter(m => m.isPrimary || paidMembers.has(m.memberId));
      const skipped = allMembers.filter(m => !m.isPrimary && !paidMembers.has(m.memberId));
      if (skipped.length > 0) {
        showToast(`ℹ️ ${skipped.length} secondary member(s) skip kiye gaye (unlock nahi hue). Sirf unlocked cards print honge.`, 5000);
      }
    }

    // Pre-convert all photos + logo to base64 for print window rendering
    const [logoDataUrl, ...convertedMembers] = await Promise.all([
      imgToDataUrl(logoUrl),
      ...rawMembers.map(async (m) => ({
        ...m,
        photo: m.photo ? await imgToDataUrl(m.photo) : undefined,
      })),
    ]);

    const html = buildPrintHtml(convertedMembers, profile.mobile, logoDataUrl, profile.familyCard?.expiryDate);
    const blob    = new Blob([html], { type: "text/html; charset=utf-8" });
    const blobUrl = URL.createObjectURL(blob);
    const w = window.open(blobUrl, "_blank", "width=1100,height=700");
    if (!w) {
      URL.revokeObjectURL(blobUrl);
      showToast("❌ Browser ne popup block kiya. Please allow popups aur dobara try karein.");
      return;
    }
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    w.focus();
  }

  async function payForSecondaryCard(m: Member) {
    if (payingFor) return; // double-click guard
    if (!profile) return;
    setPayingFor(m.memberId);
    setToast("");
    try {
      const res = await fetch("/api/wallet/deduct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount:      50,
          description: `Card print fee — ${m.name}`,
          referenceId: `CARD-${m.memberId}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const updated = new Set(paidMembers).add(m.memberId);
        setPaidMembers(updated);
        // Persist so card stays unlocked after page refresh
        if (profile.memberId) {
          localStorage.setItem(`hc_paid_${profile.memberId}`, JSON.stringify([...updated]));
        }
        setProfile(prev => prev ? { ...prev, walletBalance: data.newBalance } : prev);
        showToast(`✅ ₹50 deducted! ${m.name} ka card unlock ho gaya.`);
        setTimeout(() => downloadCard(m), 800);
      } else {
        showToast("❌ " + (data.message || "Payment fail"));
      }
    } catch {
      showToast("❌ Network error");
    } finally {
      setPayingFor(null);
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !profile) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <p className="text-4xl">😕</p>
        <p className="text-gray-600">{error || "Profile nahi mili"}</p>
        <button onClick={() => router.push("/login")} className="bg-teal-600 text-white px-6 py-2 rounded-xl">Login Karein</button>
      </div>
    </div>
  );

  const allMembers: Member[] = [
    {
      name:         profile.name,
      age:          profile.age,
      gender:       profile.gender,
      relationship: "self",
      memberId:     profile.memberId,
      photo:        profile.photo,
      mobile:       profile.mobile,
      isPrimary:    true,
    },
    ...(profile.familyMembers || []).map((m) => ({ ...m, mobile: profile.mobile })),
  ];

  const logoSrc = "/logo.png";
  const cardExpiry = profile.familyCard?.expiryDate;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ── Top bar ── */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium">
            ← Back
          </button>
          <div className="text-center">
            <h1 className="text-base font-bold text-gray-800">Health Cards</h1>
            <p className="text-xs text-gray-400">{allMembers.length} member{allMembers.length > 1 ? "s" : ""}</p>
          </div>
          <button
            onClick={() => downloadCard()}
            className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition shadow"
          >
            🖨️ Print All
          </button>
        </div>
      </div>

      {/* ── Toast notification ── */}
      {toast && (
        <div className="max-w-4xl mx-auto px-4 pt-4">
          <div className={`p-3 rounded-xl text-sm font-medium ${
            toast.startsWith("✅") ? "bg-green-50 text-green-700 border border-green-200"
            : toast.startsWith("ℹ️") ? "bg-blue-50 text-blue-700 border border-blue-200"
            : "bg-red-50 text-red-700 border border-red-200"
          }`}>
            {toast}
          </div>
        </div>
      )}

      {/* ── Card expiry info bar ── */}
      {cardExpiry && (
        <div className="max-w-4xl mx-auto px-4 pt-4">
          <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-2.5 flex items-center justify-between">
            <p className="text-xs text-teal-700 font-medium">
              🏷️ Family Card Active
            </p>
            <p className="text-xs text-teal-700 font-semibold">
              Valid Till: {new Date(cardExpiry).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </p>
          </div>
        </div>
      )}

      {/* ── Cards list ── */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {allMembers.map((m) => {
          const isUnlocked = m.isPrimary || paidMembers.has(m.memberId);
          const isPaying   = payingFor === m.memberId;
          return (
            <div key={m.memberId || m.name} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              {/* Member header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${m.isPrimary ? "bg-teal-500" : "bg-amber-400"}`} />
                  <p className="font-bold text-gray-800 text-sm">
                    {m.name}
                    <span className="ml-2 text-xs font-normal text-gray-400">
                      {m.isPrimary ? "Primary Member" : m.relationship}
                    </span>
                  </p>
                  {m.isPrimary && (
                    <span className="bg-teal-100 text-teal-700 text-xs px-2 py-0.5 rounded-full font-semibold">FREE</span>
                  )}
                  {!m.isPrimary && !isUnlocked && (
                    <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-semibold">₹50</span>
                  )}
                  {!m.isPrimary && isUnlocked && (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-semibold">Unlocked</span>
                  )}
                </div>
                {isUnlocked ? (
                  <button
                    onClick={() => downloadCard(m)}
                    className="flex items-center gap-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                  >
                    ⬇ Download PDF
                  </button>
                ) : (
                  <button
                    onClick={() => payForSecondaryCard(m)}
                    disabled={isPaying}
                    className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                  >
                    {isPaying ? "Processing..." : "🔓 Pay ₹50 & Print"}
                  </button>
                )}
              </div>

              {/* Front card preview */}
              <div className="overflow-x-auto">
                <div className="flex justify-center py-1">
                  <CardFront m={m} mobile={profile.mobile} logoSrc={logoSrc} cardExpiry={cardExpiry} />
                </div>
              </div>
              {!m.isPrimary && !isUnlocked && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
                  <p className="text-xs text-amber-700 font-medium">
                    🔒 Secondary member card print karne ke liye ₹50 wallet se deduct hoga
                  </p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    Wallet Balance: ₹{(profile.walletBalance || 0).toFixed(0)}
                  </p>
                </div>
              )}
              {isUnlocked && (
                <p className="text-center text-xs text-gray-400 mt-2">
                  Card Front Preview · Click &quot;Download PDF&quot; for print-ready front + back
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
