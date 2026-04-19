import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

// Secret — must be set in .env.local as JWT_SECRET
// Minimum 32 characters required
const getSecret = () => {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 32) {
    throw new Error("JWT_SECRET env variable missing or too short (min 32 chars). Set it in .env.local");
  }
  return new TextEncoder().encode(s);
};

const COOKIE_NAME = "brims_session";

// Role-based session expiry
function getExpiry(role) {
  if (role === "admin")                              return { jwt: "4h",  maxAge: 4  * 60 * 60 };
  if (["staff", "doctor", "hospital"].includes(role)) return { jwt: "8h",  maxAge: 8  * 60 * 60 };
  return                                                    { jwt: "7d",  maxAge: 7  * 24 * 60 * 60 }; // user / member
}

// ─── Password Hashing ─────────────────────────────────────────────────────────
export async function hashPassword(password) {
  return bcrypt.hash(password, 10);  // 10 salt rounds
}

export async function verifyPassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}

// ─── Create session cookie after successful login ───────────────────────────
export async function createSession(payload) {
  const { jwt: jwtExpiry, maxAge } = getExpiry(payload.role);

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(jwtExpiry)
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,                                        // JS cannot read — XSS safe
    secure:   process.env.NODE_ENV === "production",       // HTTPS only in prod
    sameSite: "lax",                                       // CSRF protection
    maxAge,
    path:     "/",
  });
}

// ─── Read session from Next.js cookies() — for Server Components & API routes ─
export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload;
  } catch {
    return null;
  }
}

// ─── Clear session cookie (logout) ─────────────────────────────────────────
export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// ─── Verify raw token string — used in middleware (Edge runtime) ────────────
export async function verifyToken(token) {
  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || ""
    );
    if (!secret.length) return null;
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

// ─── Get session from a Request object — for API Route Handlers ────────────
export async function getSessionFromRequest(request) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload;
  } catch {
    return null;
  }
}

// ─── requireAuth — use at top of API routes ────────────────────────────────
// allowedRoles: [] = any logged-in user; ["admin"] = admin only; etc.
// Returns { session } on success, or { error: NextResponse } on failure.
export async function requireAuth(request, allowedRoles = []) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return {
      error: NextResponse.json(
        { success: false, message: "Login karein — session expire ho gaya" },
        { status: 401 }
      ),
      session: null,
    };
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(session.role)) {
    return {
      error: NextResponse.json(
        { success: false, message: "Access denied — aapke paas permission nahi hai" },
        { status: 403 }
      ),
      session: null,
    };
  }

  return { error: null, session };
}
