import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "brims_session";

// Routes that require a valid session (any role)
const MEMBER_ROUTES = [
  "/dashboard",
  "/update-profile",
  "/my-bookings",
  "/wallet",
  "/notifications",
  "/opd-booking",
  "/lab-tests",
  "/surgery-packages",
  "/teleconsultation",
  "/consultation",
];

// Routes that require specific roles
const ROLE_ROUTES: Record<string, string[]> = {
  "/admin":              ["admin"],
  "/staff-dashboard":    ["staff", "admin"],
  "/doctor-dashboard":   ["doctor", "admin"],
  "/hospital-dashboard": ["hospital", "admin"],
  "/write-article":      ["admin", "staff", "doctor"],
};

// Seed routes — only allowed in development
const SEED_ROUTES = [
  "/api/seed-doctors",
  "/api/seed-surgery",
  "/api/seed-labs",
  "/api/test-db",
];

function getSecret() {
  return new TextEncoder().encode(process.env.JWT_SECRET || "");
}

async function verifySession(token: string) {
  try {
    const secret = getSecret();
    if (!secret.length) return null;
    const { payload } = await jwtVerify(token, secret);
    return payload as { userId: string; role: string; name: string };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Block seed routes in production ──────────────────────────────────────
  if (SEED_ROUTES.some((r) => pathname.startsWith(r))) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { success: false, message: "Not available in production" },
        { status: 404 }
      );
    }
  }

  // ── Check role-specific routes ────────────────────────────────────────────
  const roleEntry = Object.entries(ROLE_ROUTES).find(([route]) =>
    pathname.startsWith(route)
  );

  if (roleEntry) {
    const [, allowedRoles] = roleEntry;
    const token = request.cookies.get(COOKIE_NAME)?.value;

    if (!token) {
      const loginUrl = new URL("/staff-login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const session = await verifySession(token);
    if (!session) {
      const loginUrl = new URL("/staff-login", request.url);
      loginUrl.searchParams.set("expired", "1");
      return NextResponse.redirect(loginUrl);
    }

    if (!allowedRoles.includes(session.role)) {
      // Wrong role — redirect to their correct dashboard
      const dashMap: Record<string, string> = {
        user:     "/dashboard",
        member:   "/dashboard",
        doctor:   "/doctor-dashboard",
        hospital: "/hospital-dashboard",
        staff:    "/staff-dashboard",
        admin:    "/admin",
      };
      return NextResponse.redirect(
        new URL(dashMap[session.role] || "/login", request.url)
      );
    }
  }

  // ── Check member routes ───────────────────────────────────────────────────
  const isMemberRoute = MEMBER_ROUTES.some((r) => pathname.startsWith(r));

  if (isMemberRoute) {
    const token = request.cookies.get(COOKIE_NAME)?.value;

    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const session = await verifySession(token);
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("expired", "1");
      return NextResponse.redirect(loginUrl);
    }
  }

  // ── Add security headers to all responses ────────────────────────────────
  const response = NextResponse.next();

  response.headers.set("X-Frame-Options",          "DENY");
  response.headers.set("X-Content-Type-Options",   "nosniff");
  response.headers.set("Referrer-Policy",           "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy",        "camera=(), microphone=(), geolocation=()");
  response.headers.set("X-XSS-Protection",          "1; mode=block");

  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder files (logo.png etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|logo.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
