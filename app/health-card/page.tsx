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
};

/* ═══════════════════════════════════════════════════
   CARD FRONT  (340 × 214 px on-screen)
   ═══════════════════════════════════════════════════ */
function CardFront({
  m,
  mobile,
  logoSrc,
}: {
  m: Member;
  mobile: string;
  logoSrc: string;
}) {
  const sex = m.gender === "male" ? "Male" : m.gender === "female" ? "Female" : m.gender;
  const rel = m.isPrimary ? "Primary Member" : m.relationship;

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
        {/* Logo in white pill */}
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
        {/* Card type badge */}
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
        padding: "10px 12px 0",
        gap: "12px",
      }}>
        {/* Photo circle with gold ring */}
        <div style={{ flexShrink: 0, position: "relative" }}>
          <div style={{
            width: "66px", height: "66px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #FFB800, #e6a800)",
            padding: "2px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{
              width: "62px", height: "62px",
              borderRadius: "50%",
              overflow: "hidden",
              background: "rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {m.photo
                ? <img src={m.photo} alt={m.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontSize: "24px", fontWeight: "900", color: "#FFB800" }}>
                    {m.name.charAt(0).toUpperCase()}
                  </span>
              }
            </div>
          </div>
          {/* Relation badge */}
          <div style={{
            position: "absolute", bottom: "-2px", left: "50%", transform: "translateX(-50%)",
            background: "#FFB800", borderRadius: "4px",
            padding: "1px 5px",
            whiteSpace: "nowrap",
          }}>
            <p style={{ fontSize: "5.5px", fontWeight: "800", color: "#3d2200", margin: 0, letterSpacing: "0.3px" }}>
              {rel.toUpperCase()}
            </p>
          </div>
        </div>

        {/* Details table */}
        <div style={{ flex: 1 }}>
          <p style={{ color: "#fff", fontWeight: "900", fontSize: "13px", margin: "0 0 6px", lineHeight: 1.1 }}>
            {m.name}
          </p>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <tbody>
              {[
                ["Age / Sex", `${m.age} Yrs / ${sex}`],
                ["Mobile No.", `+91 ${mobile}`],
                ["Member ID", m.memberId],
              ].map(([label, value]) => (
                <tr key={label}>
                  <td style={{
                    color: "rgba(255,220,100,0.9)",
                    fontSize: "7.5px",
                    fontWeight: "700",
                    paddingRight: "5px",
                    paddingBottom: "4px",
                    whiteSpace: "nowrap",
                    verticalAlign: "top",
                  }}>
                    {label} :
                  </td>
                  <td style={{
                    color: "#fff",
                    fontSize: "8px",
                    fontWeight: label === "Member ID" ? "700" : "600",
                    paddingBottom: "4px",
                    fontFamily: label === "Member ID" ? "monospace" : "Arial, sans-serif",
                    letterSpacing: label === "Member ID" ? "0.5px" : "0",
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
        padding: "4px 10px",
        display: "flex",
        alignItems: "center",
        gap: "7px",
        zIndex: 1,
      }}>
        <div style={{
          width: "22px", height: "22px",
          background: "#009e94",
          borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
          overflow: "hidden",
          border: "1.5px solid rgba(255,255,255,0.4)",
        }}>
          <img src={logoSrc} alt="B" style={{ width: "18px", height: "18px", objectFit: "contain" }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ color: "#3d2200", fontWeight: "800", fontSize: "7px", margin: 0, lineHeight: 1.3 }}>
            SH73, Rambagh, Tariya, Saran – 841424
          </p>
          <p style={{ color: "#3d2200", fontWeight: "700", fontSize: "6.5px", margin: 0 }}>
            24×7 Emergency: 9955564596
          </p>
        </div>
        <p style={{ color: "#5a3500", fontSize: "6px", fontWeight: "600", margin: 0, textAlign: "right" }}>
          www.brimshospitals.com
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   CARD BACK  (340 × 214 px on-screen)
   ═══════════════════════════════════════════════════ */
function CardBack({ logoSrc }: { logoSrc: string }) {
  return (
    <div style={{
      width: "340px",
      height: "214px",
      borderRadius: "16px",
      overflow: "hidden",
      boxShadow: "0 10px 40px rgba(0,0,0,0.25)",
      fontFamily: "Arial, sans-serif",
      position: "relative",
      background: "linear-gradient(145deg, #009e94 0%, #00b5a5 55%, #00cbb9 100%)",
      flexShrink: 0,
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Dot-grid texture */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.13) 1px, transparent 1px)",
        backgroundSize: "9px 9px",
        zIndex: 0,
      }} />
      {/* Decorative circles */}
      <div style={{
        position: "absolute", top: "-40px", left: "-40px",
        width: "130px", height: "130px",
        borderRadius: "50%",
        border: "20px solid rgba(255,255,255,0.07)",
        zIndex: 0,
      }} />
      <div style={{
        position: "absolute", bottom: "25px", right: "-25px",
        width: "90px", height: "90px",
        borderRadius: "50%",
        border: "15px solid rgba(255,255,255,0.06)",
        zIndex: 0,
      }} />

      {/* Magnetic stripe */}
      <div style={{
        background: "rgba(0,0,0,0.3)",
        height: "30px",
        marginTop: "18px",
        position: "relative", zIndex: 1,
      }} />

      {/* Center logo + info */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative", zIndex: 1,
        padding: "6px 20px",
        gap: "4px",
      }}>
        {/* Logo with golden ring */}
        <div style={{
          width: "52px", height: "52px",
          background: "linear-gradient(135deg, #FFB800, #e6a800)",
          borderRadius: "50%",
          padding: "2px",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: "4px",
        }}>
          <div style={{
            width: "48px", height: "48px",
            background: "white",
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden",
          }}>
            <img src={logoSrc} alt="Brims" style={{ width: "42px", height: "42px", objectFit: "contain" }} />
          </div>
        </div>

        <p style={{ color: "#fff", fontWeight: "900", fontSize: "12px", margin: 0, letterSpacing: "1.5px", textAlign: "center" }}>
          BRIMS HOSPITALS
        </p>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "7px", margin: 0, textAlign: "center", lineHeight: 1.4 }}>
          Dr. Birendra Ray Institute Of Medical Sciences Pvt. Ltd.
        </p>
        <p style={{ color: "#FFD700", fontSize: "6.5px", margin: "3px 0 0", fontStyle: "italic", textAlign: "center" }}>
          Making Healthcare Affordable
        </p>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "6px", margin: "2px 0 0", textAlign: "center", letterSpacing: "0.3px" }}>
          Valid for 1 Year from Date of Activation
        </p>
      </div>

      {/* Yellow footer */}
      <div style={{
        background: "linear-gradient(90deg, #e6a800 0%, #FFB800 50%, #e6a800 100%)",
        padding: "5px 14px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        position: "relative", zIndex: 1,
      }}>
        <div>
          <p style={{ color: "#3d2200", fontWeight: "800", fontSize: "7.5px", margin: 0, lineHeight: 1.4 }}>
            SH73, Rambagh, Tariya, Saran – 841424
          </p>
          <p style={{ color: "#3d2200", fontWeight: "700", fontSize: "7px", margin: 0 }}>
            Helpline: 9955564596 · www.brimshospitals.com
          </p>
        </div>
        <p style={{ color: "#5a3500", fontWeight: "800", fontSize: "7px", margin: 0, textAlign: "right" }}>
          24×7<br />Emergency
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   PRINT HTML — front (left) + back (right) per member
   Credit card: 85.6mm × 54mm
   ═══════════════════════════════════════════════════ */
function buildPrintHtml(members: Member[], mobile: string, logoUrl: string): string {
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

  const cards = members.map((m) => {
    const sex = m.gender === "male" ? "Male" : m.gender === "female" ? "Female" : m.gender;
    const rel = m.isPrimary ? "Primary Member" : m.relationship;
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
        <div style="position:relative;z-index:1;display:flex;align-items:center;padding:6px 8px 0;gap:8px;">
          <!-- Photo -->
          <div style="flex-shrink:0;position:relative;">
            <div style="width:46px;height:46px;border-radius:50%;background:linear-gradient(135deg,#FFB800,#e6a800);padding:2px;display:flex;align-items:center;justify-content:center;">
              <div style="width:42px;height:42px;border-radius:50%;overflow:hidden;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;">
                ${photoHtml}
              </div>
            </div>
            <div style="position:absolute;bottom:-1px;left:50%;transform:translateX(-50%);background:#FFB800;border-radius:3px;padding:1px 4px;white-space:nowrap;">
              <p style="font-size:4.5px;font-weight:800;color:#3d2200;margin:0;letter-spacing:0.3px;">${rel.toUpperCase()}</p>
            </div>
          </div>
          <!-- Details -->
          <div style="flex:1;">
            <p style="color:#fff;font-weight:900;font-size:9.5px;margin:0 0 4px;line-height:1.1;">${m.name}</p>
            <table style="border-collapse:collapse;width:100%;">
              <tr><td style="color:rgba(255,220,100,0.9);font-size:5.5px;font-weight:700;padding-right:4px;padding-bottom:3px;white-space:nowrap;">Age / Sex :</td><td style="color:#fff;font-size:6px;font-weight:600;padding-bottom:3px;">${m.age} Yrs / ${sex}</td></tr>
              <tr><td style="color:rgba(255,220,100,0.9);font-size:5.5px;font-weight:700;padding-right:4px;padding-bottom:3px;white-space:nowrap;">Mobile No. :</td><td style="color:#fff;font-size:6px;font-weight:600;padding-bottom:3px;">+91 ${mobile}</td></tr>
              <tr><td style="color:rgba(255,220,100,0.9);font-size:5.5px;font-weight:700;padding-right:4px;white-space:nowrap;">Member ID :</td><td style="color:#fff;font-size:6px;font-weight:700;font-family:monospace;letter-spacing:0.5px;">${m.memberId}</td></tr>
            </table>
          </div>
        </div>
        <!-- Footer -->
        <div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(90deg,#e6a800,#FFB800,#e6a800);padding:3px 8px;display:flex;align-items:center;gap:5px;z-index:1;">
          <div style="width:16px;height:16px;background:#009e94;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;border:1px solid rgba(255,255,255,0.4);">
            <img src="${logoUrl}" style="width:13px;height:13px;object-fit:contain"/>
          </div>
          <div style="flex:1;">
            <p style="color:#3d2200;font-weight:800;font-size:5.5px;margin:0;line-height:1.3;">SH73, Rambagh, Tariya, Saran – 841424</p>
            <p style="color:#3d2200;font-weight:700;font-size:5px;margin:0;">24×7 Emergency: 9955564596</p>
          </div>
          <p style="color:#5a3500;font-size:5px;font-weight:600;margin:0;text-align:right;">www.brimshospitals.com</p>
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
          <p style="color:rgba(255,255,255,0.55);font-size:4.5px;margin:1px 0 0;text-align:center;">Valid for 1 Year from Date of Activation</p>
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
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Arial, sans-serif; background: #e5e5e5; padding: 12mm; }
      .card-row {
        display: flex;
        gap: 8mm;
        align-items: flex-start;
        margin-bottom: 8mm;
        justify-content: center;
      }
      .card-wrap { display: flex; flex-direction: column; gap: 2mm; align-items: center; }
      .card-label { font-size: 8px; color: #666; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; }
      @media print {
        body { background: white; padding: 8mm; }
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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    (async () => {
      try {
        const userId = localStorage.getItem("userId");
        if (!userId) { setError("Login karein pehle."); setLoading(false); return; }
        const res  = await fetch(`/api/profile?userId=${userId}`);
        const data = await res.json();
        if (data.success) {
          const u = data.user;
          if (data.familyMembers?.length) {
            u.familyMembers = data.familyMembers.map((m: any) => ({
              name: m.name,
              age: m.age,
              gender: m.gender,
              relationship: m.relationship || "member",
              memberId: m.memberId,
              photo: m.photo,
            }));
          }
          setProfile(u);
        } else {
          setError(data.message || "Profile load nahi hua.");
        }
      } catch { setError("Network error"); }
      finally { setLoading(false); }
    })();
  }, []);

  function downloadCard(singleMember?: Member) {
    if (!profile) return;
    const logoUrl = window.location.origin + "/logo.png";
    const members = singleMember
      ? [singleMember]
      : allMembers;
    const html = buildPrintHtml(members, profile.mobile, logoUrl);
    const w = window.open("", "_blank", "width=1100,height=700");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
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
      name: profile.name,
      age: profile.age,
      gender: profile.gender,
      relationship: "self",
      memberId: profile.memberId,
      photo: profile.photo,
      mobile: profile.mobile,
      isPrimary: true,
    },
    ...(profile.familyMembers || []).map((m) => ({ ...m, mobile: profile.mobile })),
  ];

  const logoSrc = "/logo.png";

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

      {/* ── Cards list (FRONT only on page) ── */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {allMembers.map((m, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
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
              </div>
              <button
                onClick={() => downloadCard(m)}
                className="flex items-center gap-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
              >
                ⬇ Download PDF
              </button>
            </div>

            {/* Front card preview */}
            <div className="overflow-x-auto">
              <div className="flex justify-center py-1">
                <CardFront m={m} mobile={profile.mobile} logoSrc={logoSrc} />
              </div>
            </div>
            <p className="text-center text-xs text-gray-400 mt-2">
              Card Front Preview · Click "Download PDF" for print-ready front + back
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}