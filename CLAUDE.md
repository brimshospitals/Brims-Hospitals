# Brims Hospitals — Marketplace App Master Plan
> **"Making Healthcare Affordable"** | Patna, Bihar, India

> **Purpose of this file:** Claude ko project ka poora context ek jagah mile taaki har session mein ek consistent, well-planned codebase banaye.
> **Rule:** Koi bhi naya feature add karne se pehle is file ko read karo. Kaam hone ke baad status update karo.

---

## Project Overview

**Developer:** Dr. Mukesh | **Location:** Patna, Bihar | **Beginner-friendly guidance required**

Brims Hospitals ek **multi-role healthcare marketplace platform** hai — Bihar ke hospitals, labs, aur doctors ko onboard karta hai. Patients apne ghar se OPD book kar sakein, lab tests karwa sakein, surgery packages compare aur book kar sakein, aur teleconsultation le sakein. Hospitals, doctors, aur staff ek unified platform pe manage ho sakein, aur ek admin poore ecosystem ko control kare.

**Platform:** Web (Next.js) + Mobile (Flutter — future phase)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.1 — App Router (`app/` directory) |
| Language | TypeScript (`.tsx`) for pages/components, JavaScript (`.js`) for API routes |
| Database | MongoDB Atlas + Mongoose 9.3.3 — cached connection in `lib/mongodb.js` |
| Styling | Tailwind CSS 4 — utility-first, no component library |
| Auth | JWT session cookie (`brims_session`, 7-day), set via `lib/auth.js` → `createSession()` |
| SMS OTP | Fast2SMS — `FAST2SMS_API_KEY` in `.env.local` |
| Email OTP | Resend — `RESEND_API_KEY` in `.env.local` |
| Image Upload | Cloudinary (Cloud: `de1yqlwub`) via `POST /api/upload-photo` |
| Payments | PhonePe Gateway — Production mode, Base64 + SHA256 checksum, redirect-based |
| Video Calls | Jitsi Meet External API (`meet.jit.si`) — free, no key needed |
| Hosting | Vercel |
| GitHub | https://github.com/brimshospitals/Brims-Hospitals (branch: `master`) |

---

## Rules for Claude (READ BEFORE EVERY SESSION)

### Next.js Rules
- Read `node_modules/next/dist/docs/` before writing new API routes or layouts
- All pages in `app/` use **App Router** (`layout.tsx` + `page.tsx`)
- Pages with `useSearchParams()` **must** be wrapped in `<Suspense>`
- API routes must export `export const dynamic = "force-dynamic"` if they read request data
- `cookies()` from `next/headers` is async — always `await cookies()`
- No `useState`/`useEffect` in Server Components — add `"use client"` at top if needed
- `React.FormEvent` is deprecated — use `React.SyntheticEvent<HTMLFormElement>`

### Code Style Rules
- API routes are `.js` files — **no TypeScript syntax** in `.js` files
- API response format always: `{ success: true/false, message: "...", data: {} }`
- No `useState`/`useEffect` in Server Components
- All addresses default to Bihar state
- Git branch is `master` (not `main`)
- PhonePe is **Production mode** — localhost pe callback kaam nahi karega
- MongoDB: use direct shard connection string if SRV is blocked by ISP

### Communication Rules (Important)
- Dr. Mukesh beginner hain — step-by-step clearly explain karo
- Hindi mein explain karo jab needed
- Ek ek step clearly batao taaki easily follow kar sakein

---

## Environment Variables (`.env.local`)

```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=minimum-32-character-secret-key-here
ADMIN_KEY=your-secret-admin-panel-key

# Cloudinary (Cloud: de1yqlwub)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=de1yqlwub
CLOUDINARY_API_KEY=938744481517128
CLOUDINARY_API_SECRET=igAsZ8Rh9-Q9MsL4CPrJeHcjXPE

# PhonePe (Production)
PHONEPE_MERCHANT_ID=M227YEA24KLWQ
PHONEPE_SALT_KEY=943f97a2-d331-4b00-b56e-d63bfd3fcdee
PHONEPE_SALT_INDEX=1
NEXT_PUBLIC_BASE_URL=https://yourdomain.com

# SMS OTP
FAST2SMS_API_KEY=

# Email OTP
RESEND_API_KEY=
```

---

## Business Rules

### Family Card System
- **1 Primary Member + 5 Secondary Members = Total 6**
- Sabhi ek mobile number se linked
- Ek shared wallet (Family Wallet)
- Har member ka unique Member ID (BRIMS-XXXXXX format)
- Har member ka individual health record
- Marital status sirf: Female AND Age ≥ 18
- Pregnancy/LMP sirf: Female AND Married
- **Card Price: ₹249/year** (was ₹999 — 75% off permanently)
- Card valid: 1 saal activation se

### Booking Rules
- OPD: Wallet, Counter, Online (PhonePe) ya Insurance se payment
- Surgery/Lab: Advance booking — team 24h mein contact karti hai
- Membership discount: `membershipPrice` field on packages
- Max family members per card: 6 (1 primary + 5 secondary)

### Membership Discount Logic
```
Normal price = offerPrice
Member price = membershipPrice (lower — only for role: "member")
```

### User Roles Hierarchy
| Role | Access |
|------|--------|
| `user` | Dashboard, Booking, Profile, Wallet |
| `member` | Same as user + membership prices (after card activation) |
| `staff` | Staff dashboard — manage all bookings |
| `doctor` | Doctor dashboard — appointments, prescriptions |
| `hospital` | Hospital dashboard — manage doctors/packages/labs |
| `admin` | Full admin panel — verify hospitals, approve doctors, all data |

---

## Folder Structure

```
brims-hospitals-app/
├── app/
│   ├── page.tsx                    ← Home/Landing page
│   ├── layout.tsx                  ← Root layout (fonts, metadata)
│   ├── login/page.tsx              ← Multi-role OTP login (5 roles)
│   ├── register/page.tsx           ← New user registration
│   ├── dashboard/page.tsx          ← Patient/Member dashboard + sticky bottom nav
│   ├── update-profile/page.tsx     ← Profile completion (after first login)
│   ├── profile/page.tsx            ← View/edit profile
│   ├── add-member/page.tsx         ← Add family member (max 5)
│   ├── wallet/page.tsx             ← Wallet balance + transactions
│   ├── opd-booking/page.tsx        ← OPD doctor search + booking (PatientSelector)
│   ├── lab-tests/page.tsx          ← Lab test listing + booking (PatientSelector)
│   ├── surgery-packages/page.tsx   ← Surgery package listing + booking (PatientSelector)
│   ├── teleconsultation/page.tsx   ← Teleconsult 4-step booking
│   ├── consultation/[bookingId]/   ← Jitsi video call room
│   ├── my-bookings/page.tsx        ← Patient booking history + cancel + expandable details
│   ├── doctors/page.tsx            ← Doctor listing (public)
│   ├── doctors-search/page.tsx     ← Doctor search with filters
│   ├── articles/page.tsx           ← Health articles list (disease tag filter)
│   ├── articles/[id]/page.tsx      ← Article reader (all block types)
│   ├── write-article/page.tsx      ← Block editor (admin/doctor/staff only)
│   ├── notifications/page.tsx      ← Notification inbox (mark-as-read)
│   ├── services/page.tsx           ← All services overview
│   ├── contact/page.tsx            ← Contact page
│   ├── support/page.tsx            ← Customer Care — role-aware form, chat thread, My Tickets list
│   ├── hospital-onboarding/        ← Hospital self-registration (3-step form)
│   ├── doctor-register/page.tsx    ← Doctor self-registration
│   ├── staff-login/page.tsx        ← Staff/Doctor/Hospital portal login
│   ├── doctor-dashboard/page.tsx   ← Doctor appointments panel
│   ├── hospital-dashboard/page.tsx ← Hospital management (4 tabs)
│   ├── staff-dashboard/page.tsx    ← Staff booking management + search
│   ├── admin/page.tsx              ← Admin control panel (8 tabs)
│   ├── api/                        ← All API routes (see API Map below)
│   └── components/
│       ├── header.tsx              ← Global header (bell icon + unread badge)
│       ├── PatientSelector.tsx     ← Family member / new patient picker for booking
│       └── ImageCropper.tsx        ← Photo crop/upload (hidden inputs in both phases)
├── lib/
│   ├── mongodb.js                  ← Mongoose connection (cached with global)
│   ├── auth.js                     ← JWT: createSession, requireAuth, getSession, verifyToken
│   └── rateLimit.js                ← OTP rate limiting (in-memory)
├── models/
│   ├── User.js                     ← Primary + family members embedded
│   ├── Doctor.js
│   ├── Hospital.js
│   ├── Booking.js
│   ├── LabTest.js
│   ├── SurgeryPackage.js
│   ├── FamilyCard.js
│   ├── Transaction.js
│   ├── Article.js
│   ├── Notification.js
│   └── SupportTicket.js            ← TKT-XXXXX tickets with chat thread messages[]
└── public/                         ← Static assets (logo.png etc.)
```

---

## Data Models

### User
```
mobile (unique, required), name, age, gender, maritalStatus, isPregnant,
idType, idNumber, photo (Cloudinary URL),
address{state="Bihar", district, prakhand, village},
preExistingDiseases["HTN","Diabetes","CVD","CKD","Thyroid Disorder","Pregnancy","Joint Pain"],
height, weight,
familyMembers[healthRecordSchema] (max 5 embedded),
memberId (unique, auto "BRIMS-xxx"), familyCardId→FamilyCard,
walletBalance, referralCode, referredBy,
role: user|member|doctor|hospital|staff|admin,
otp, otpExpiry (10 min),
doctorId→Doctor, hospitalId→Hospital,
isActive
```

### FamilyCard
```
cardNumber (unique, 16-char), userId→User,
status: active|inactive|expired,
activatedAt, expiryDate (1 year from activation),
walletBalance
```
> Note: `walletBalance` exists on both User and FamilyCard — currently deducting from User.walletBalance. Migrate to FamilyCard.walletBalance for production.

### Doctor
```
name, userId→User (null if not yet linked),
mobile, email,
hospitalId→Hospital, hospitalName (denormalized),
department (required), speciality, degrees[], experience,
photo, opdFee (required), offerFee,
availableSlots[{day, times[]}],
address{district, city, state="Bihar"},
rating, totalReviews,
isAvailable, isActive (false = pending admin approval)
```

### Hospital
```
hospitalId (unique, "BRIMS-HOSP-xxx"), userId→User,
name (required), address{street, district, city, state="Bihar", pincode},
mobile, website, email,
spocName, spocContact, ownerName,
registrationNo, rohiniNo,
coordinates{lat, lng},
type: "Single Specialist"|"Multi Specialist"|"Super Specialist",
departments[], photos[],
rating, totalReviews,
isVerified (false=pending admin approval), isActive
```

### Booking
```
bookingId (auto "BH-OPD-xxxxx" / "BH-LAB-xxxxx" / "BH-SUR-xxxxx" / "BH-CON-xxxxx"),
type: OPD|IPD|Lab|Surgery|Consultation,
userId→User, doctorId→Doctor, hospitalId→Hospital,
packageId→SurgeryPackage, labTestId→LabTest,
appointmentDate, slot, roomType,
status: pending|confirmed|completed|cancelled,
statusStage (workflow stage string), statusHistory[{stage, label, timestamp, updatedBy, notes}],
paymentStatus: pending|paid|refunded,
amount, paymentMode, paymentId, paymentMode,
familyCardId→FamilyCard,
notes (JSON string — always parse with try/catch):
  { patientName, patientMobile, patientAge, patientGender,
    symptoms, paymentMode, isNewPatient,
    promoCode, promoDiscount, homeAddress,
    insurancePolicyNo, insurerName, tpaName }

// Commission (calculated at booking time)
platformCommission (₹), commissionPct (%), hospitalPayable (amount − commission),
coordinatorId→Coordinator, coordinatorName,
coordinatorCommission (₹), coordinatorCommissionPct (%),
coordinatorPaid (bool),

// Partial / deposit (Surgery)
isPartialBooking (bool), depositAmount, balanceAmount,

// Partner payout tracking
payoutStatus: "pending"|"paid"|"not_applicable" (default null),
payoutUtr (UTR string after admin processes payout),
payoutProcessedAt (Date),

// Staff collection tracking
collectedBy→User, collectedByName, collectedAt,

// Reminder tracking
reminderToday (bool), reminderTomorrow (bool)
```

### LabTest / SurgeryPackage
```
hospitalId→Hospital, hospitalName (denormalized),
name, category,
mrp, offerPrice, membershipPrice,
isActive, description, inclusions[]

SurgeryPackage extras: stayDays, surgeonName, roomType[]
LabTest extras: turnaroundTime, homeCollection (bool), fastingRequired (bool)
```

### Transaction
```
userId→User, familyCardId→FamilyCard (optional),
type: credit|debit,
amount, description, referenceId, paymentId,
bookingId→Booking (optional),
category:
  // Platform Income (money IN to platform)
  card_activation_payment   ← ₹249 card activation via PhonePe
  booking_payment           ← full booking payment online/wallet
  booking_advance           ← advance/deposit for surgery/IPD
  platform_charge           ← periodic charge from hospital/lab/doctor
  wallet_topup              ← user wallet top-up

  // Platform Expenses (money OUT from platform)
  coordinator_commission    ← coordinator commission (card or booking)
  referral_cashback         ← ₹50 cashback to referrer/referee
  pickup_charge             ← home sample collection charge
  expense                   ← admin-recorded miscellaneous expense
  wallet_refund             ← booking cancellation refund to wallet
  withdrawal                ← coordinator withdrawal (processed with UTR)
  hospital_payout           ← platform paying hospital after completed booking
  lab_payout                ← platform paying lab after completed test
  doctor_payout             ← platform paying doctor after consultation
  ambulance_payout          ← platform paying ambulance provider

  // Legacy (backward compat only)
  wallet | card_activation | booking_commission | referral | other

status: success|pending|failed,
createdAt
```
> **Income categories (INCOME_CATEGORIES):** card_activation_payment, booking_payment, booking_advance, platform_charge, wallet_topup
> **Expense categories (EXPENSE_CATEGORIES):** coordinator_commission, referral_cashback, pickup_charge, expense, wallet_refund, withdrawal, hospital_payout, lab_payout, doctor_payout, ambulance_payout
> **Payout flow:** When admin enters UTR in Partner Payouts section → booking.payoutStatus="paid" + Transaction(category: hospital_payout/lab_payout/doctor_payout) created

### SupportTicket
```
ticketId (unique, auto "TKT-00001"),
userId→User (required),
bookingRef: String (optional — bookingId string, not ObjectId),
category: enum ["booking","payment","cancellation","service","home_collection","report","account","other"],
subject (required), description (required),
status: enum ["open","in_progress","resolved","closed"] default "open",
priority: enum ["low","medium","high","urgent"] default "medium",
messages: [{ senderId→User, senderName, senderRole, message, createdAt }],
assignedTo→User, assignedName, resolvedAt, createdAt
```
> First message = initial ticket description (auto-appended at creation)
> Admin first reply auto-moves status from "open" → "in_progress"
> Context prefix auto-injected: coordinatorId, hospitalId, selected member, booking/transaction IDs

### Article
```
title, blocks[{type, content, imageUrl, videoUrl, size}],
authorId→User, authorRole,
diseaseTags[], isPublished, views
```
> On publish: `Notification.insertMany()` for all users with matching `preExistingDiseases`

---

## API Map

### Auth
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/send-otp` | POST | Send OTP — mobile creates user (member flow), email requires existing (staff/portal) |
| `/api/verify-otp` | POST | Verify OTP → `createSession()` → redirect path + role data |
| `/api/auth/me` | GET | Get current session from cookie |
| `/api/auth/logout` | POST | Clear `brims_session` cookie |
| `/api/register` | POST | Full registration |
| `/api/update-profile` | PATCH | Update user profile fields |

### Patient
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/profile` | GET | Own profile + family card + members |
| `/api/family/add` | POST | Add family member |
| `/api/family/get` | GET | Get family members list |
| `/api/add-member` | POST | Add member (alt route) |
| `/api/switch-profile` | POST | Switch active member |
| `/api/wallet` | GET | Wallet balance + transaction history |
| `/api/wallet/add-money` | POST | Initiate wallet top-up (PhonePe) |
| `/api/wallet/callback` | POST | PhonePe wallet callback |
| `/api/create-order` | POST | Family card activation payment (₹249) |
| `/api/payment-callback` | POST | Card activation PhonePe callback |
| `/api/upload-photo` | POST | Cloudinary photo upload → returns URL |

### Bookings
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/bookings` | POST | **Primary** booking create (OPD/Lab/Surgery) — patient info in `notes` JSON |
| `/api/bookings` | GET | User's bookings (session-based) |
| `/api/my-bookings` | GET | Booking history with notes parsed + enriched |
| `/api/my-bookings` | PATCH | Cancel booking + wallet refund if paymentMode=wallet |
| `/api/book-opd` | POST | Legacy OPD booking |
| `/api/book-lab` | POST | Legacy lab booking |
| `/api/book-surgery` | POST | Legacy surgery booking |
| `/api/book-teleconsult` | POST | Teleconsultation booking |
| `/api/create-lab-order` | POST | Lab PhonePe payment init |
| `/api/lab-payment-callback` | POST | Lab PhonePe callback |

### Public Listings
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/doctors` | GET | Doctor search (district, dept, name, available filters) |
| `/api/lab-tests` | GET | Lab test listing (hospital, category, search filters) |
| `/api/surgery-packages` | GET | Surgery packages listing |
| `/api/articles` | GET/POST | Health articles CRUD |
| `/api/articles/[id]` | GET/PATCH/DELETE | Single article |
| `/api/notifications` | GET/PATCH | User notifications (inbox + mark-as-read) |

### Doctor Dashboard
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/doctor/appointments` | GET/PATCH | Doctor's appointments (today/upcoming/all + status update) |
| `/api/doctor-register` | POST | Self-registration → Doctor with `isActive: false` |

### Hospital Dashboard
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/hospital/overview` | GET | Stats (booking counts, revenue) |
| `/api/hospital/doctors` | GET/POST/PATCH/DELETE | Manage hospital's doctors |
| `/api/hospital/lab-tests` | GET/POST/PATCH/DELETE | Manage lab tests |
| `/api/hospital/surgery-packages` | GET/POST/PATCH/DELETE | Manage surgery packages |
| `/api/hospital/earnings` | GET | Hospital earnings — summary (pending from platform, commission due, received, this month) + paginated booking ledger with per-booking commission breakdown + payout history; ?view=bookings\|payouts&type=&dateFrom=&dateTo=&page= |
| `/api/hospital-onboarding` | POST | Hospital self-registration → `isVerified: false` |

### Staff Dashboard
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/staff/bookings` | GET/PATCH | All bookings with search + filters + status update |

### Support / Customer Care
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/support/context` | GET | Role-specific context (no auth required — guests get `{ loggedIn: false }`); user/member: bookings+transactions+familyMembers; coordinator: referred bookings+transactions; hospital: doctors/labTests/surgeryPackages+bookings; doctor: appointments+transactions |
| `/api/support` | POST | Create support ticket — auto-generates TKT-XXXXX ID, appends first message, notifies all admins |
| `/api/support` | GET | User's own tickets (paginated, messages excluded) |
| `/api/support/[ticketId]` | GET | Full ticket with messages thread (users see own only; admin/staff see all) |
| `/api/support/[ticketId]` | PATCH | Add reply (user or admin/staff); optional status/priority update; auto in_progress on first admin reply; sends notification to other party |
| `/api/admin/support` | GET | All tickets with filters (status, category, priority, search) + stats by status |
| `/api/admin/support` | PATCH | Admin reply + status/priority/assign update + user notification |

### Admin Panel
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/admin` | GET | Stats + bookings list (paginated) |
| `/api/admin` | PATCH | Update booking status/paymentStatus |
| `/api/admin/login` | POST | Admin login → `createSession` + localStorage |
| `/api/admin/members` | GET/PATCH | List patients + toggle `isActive` |
| `/api/admin/hospitals` | GET | List hospitals (pending/verified) or single detail |
| `/api/admin/hospitals` | POST | Add new hospital directly (admin) |
| `/api/admin/hospitals` | PATCH | Verify/reject hospital (`isVerified`, `isActive`) |
| `/api/admin/doctors` | GET | List doctors (all or pending only) |
| `/api/admin/doctors` | POST | Add new doctor directly (admin) |
| `/api/admin/doctors` | PATCH | Approve/toggle `isActive`/`isAvailable` |
| `/api/admin/packages` | GET/POST/PATCH/DELETE | Surgery packages management |
| `/api/admin/labtests` | GET/POST/PATCH/DELETE | Lab tests management |
| `/api/admin/staff` | GET/POST/PATCH | Staff management |
| `/api/admin/patient` | GET | Full patient detail (profile + card + booking history) |
| `/api/admin/ledger` | GET | Master Ledger — booking stats + financial stats; ?view=all\|income\|expenses\|pending-payouts\|paid-out\|coordinator\|staff\|wallet\|bookings-all\|bookings-pending\|bookings-confirmed\|bookings-completed\|booking-txns |
| `/api/admin/ledger` | POST | Add manual expense/platform-charge entry |
| `/api/admin/coordinators` | GET | List coordinators with earnings stats |
| `/api/admin/coordinators` | PATCH | process-withdraw action (enter UTR → mark withdrawal success) |
| `/api/admin/payouts` | GET | Partner payouts list; ?entity=hospital\|lab\|doctor\|ambulance &status=pending\|paid\|all |
| `/api/admin/payouts` | PATCH | Process partner payout — body: {bookingId, utr, entity} → booking.payoutStatus="paid" + Transaction created |

---

## Auth Architecture

```
Member Login:
  POST /api/send-otp { identifier: "mobile", flow: "member" }
  → Creates user if not exists → Sends OTP via Fast2SMS
  POST /api/verify-otp { identifier, otp, flow: "member" }
  → createSession({ userId, role, name, mobile })
  → httpOnly cookie "brims_session" (7 days)

Staff/Doctor/Hospital Login:
  POST /api/send-otp { identifier: "mobile or email", flow: undefined }
  → Requires existing account with role in [admin, staff, doctor, hospital]
  POST /api/verify-otp → same createSession flow

Admin Login (Panel):
  POST /api/admin/login { mobile, adminKey }
  → Validates ADMIN_KEY env var → promotes role to admin → createSession
  → Also stores adminId/adminName in localStorage (for display ONLY — not auth)

API Route Protection:
  const { error, session } = await requireAuth(request, ["admin"])
  if (error) return error;
  // session.userId, session.role, session.name available
```

**Role upgrade path:** `user` → `member` (after card activation at ₹249)

---

## Completed Features ✅

| # | Feature | Status |
|---|---------|--------|
| 1 | Home / Landing Page | ✅ Done |
| 2 | Services Page | ✅ Done |
| 3 | Doctors Public Listing Page | ✅ Done |
| 4 | Contact Page | ✅ Done |
| 5 | Multi-role OTP Login (5 roles) | ✅ Done |
| 6 | User Registration + Profile | ✅ Done |
| 7 | Member Dashboard + Family Card UI | ✅ Done |
| 8 | Add/Switch Family Members (max 5) | ✅ Done |
| 9 | Wallet (balance, add money, history) | ✅ Done |
| 10 | PhonePe — Card Activation Payment | ✅ Done |
| 11 | PhonePe — Wallet Top-up | ✅ Done |
| 12 | OPD Booking (PatientSelector, slot, 4 payment modes) | ✅ Done |
| 13 | Lab Test Booking (counter/wallet/PhonePe) | ✅ Done |
| 14 | Surgery Package Booking | ✅ Done |
| 15 | Teleconsultation Booking (4-step) | ✅ Done |
| 16 | Jitsi Video Call Room | ✅ Done |
| 17 | My Bookings (cancel, wallet refund, expandable, skeleton) | ✅ Done |
| 18 | Health Articles (write + read + disease tag notifications) | ✅ Done |
| 19 | Notifications Inbox | ✅ Done |
| 20 | Doctor Dashboard (appointments, confirm/complete, join call) | ✅ Done |
| 21 | Doctor Self-Registration Page | ✅ Done |
| 22 | Hospital Dashboard (4 tabs: overview/doctors/labs/packages) | ✅ Done |
| 23 | Hospital Onboarding Page (3-step, 38 districts) | ✅ Done |
| 24 | Staff Dashboard (search, filters, manage bookings) | ✅ Done |
| 25 | PatientSelector Component | ✅ Done |
| 26 | ImageCropper Component (crop + Cloudinary upload) | ✅ Done |
| 27 | Admin Panel — 8 tabs (Overview/Members/Hospitals/Doctors/Packages/LabTests/Bookings/Staff) | ✅ Done |
| 28 | Admin — Hospital verification workflow | ✅ Done |
| 29 | Admin — Doctor approval workflow | ✅ Done |
| 30 | Admin — Patient detail drawer (profile + card + booking history) | ✅ Done |
| 31 | Admin — Add Hospital/Doctor/Staff directly | ✅ Done |
| 32 | Admin — Login with session cookie | ✅ Done |
| 33 | JWT session cookie auth (`lib/auth.js`) | ✅ Done |
| 34 | Dashboard sticky bottom nav (AddMoney/Bookings/Members) | ✅ Done |
| 35 | Fast2SMS OTP integration | ✅ Done (needs API key) |
| 36 | Resend Email OTP integration | ✅ Done (needs API key) |
| 37 | Booking cancellation + wallet refund | ✅ Done |
| 38 | Lab Reports Upload (hospital upload → patient view + download) | ✅ Done |
| 39 | Membership Renewal (expiry detect → banner → PhonePe ₹249 → 1yr extend) | ✅ Done |
| 40 | Doctor Profile Edit (photo, slots, fees, hospital from /doctor-profile) | ✅ Done |
| 41 | Admin Analytics Dashboard (bar chart trend, type breakdown, revenue, status) | ✅ Done |
| 42 | Prescription Upload (doctor uploads PDF → patient sees in /reports) | ✅ Done |
| 43 | Hospital-Doctor association enforced (Brims Network / Private Clinic) | ✅ Done |
| 44 | Staff Hospital Management (manageHospitals/onboardHospitals permissions + assigned hospitals) | ✅ Done |
| 45 | Admin → Hospital Manage Panel (doctors/labs/packages per hospital from admin panel) | ✅ Done |
| 46 | `requireHospitalAccess()` auth guard (admin + hospital owner + assigned staff) | ✅ Done |
| 47 | `/api/auth/me` returns `staffPermissions` for staff role (dashboard tabs driven by perms) | ✅ Done |
| 48 | Patient Health Card PDF (credit-card size, front+back, print/download, all family members) | ✅ Done |
| 49 | Booking Reminder Notifications (Vercel cron `/api/cron/reminders` — 7:30 AM + 1:30 PM IST) | ✅ Done |
| 50 | Insurance Payment Mode (OPD booking — policy no. + company capture) | ✅ Done |
| 51 | Push Notifications / FCM (Firebase Cloud Messaging — doctor + hospital alert on new booking) | ✅ Done |
| 52 | Multi-language Hindi/English (LangProvider + `lib/i18n.ts` + toggle on dashboard) | ✅ Done |
| 53 | AI Chatbot — Brims Assistant (Claude Haiku, booking help + health info, floating widget all pages) | ✅ Done |
| 54 | Coordinator Earnings System — card activation ₹100 commission, booking commission (%), withdrawal flow with UTR | ✅ Done |
| 55 | Master Ledger (Admin) — 8 clickable stat cards (bookings + finance), income vs expense accounting, net balance, booking detail drawer with transaction history, live 30s auto-refresh, manual expense entry | ✅ Done |
| 56 | Partner Payouts System — 🏦 Partner Payouts section in Master Ledger; 4 entity tabs (🏥 Hospital / 🧪 Lab / 🩺 Doctor / 🚑 Ambulance); pending amount banner; UTR entry + process per booking; `/api/admin/payouts` GET+PATCH; `payoutStatus/payoutUtr/payoutProcessedAt` on Booking model; `hospital_payout/lab_payout/doctor_payout/ambulance_payout` Transaction categories | ✅ Done |
| 58 | Hospital Earnings & Accounting Tab — `💰 Earnings` tab in hospital dashboard; 4 summary cards (Platform Ko Dena Hai / Platform Se Milna Hai / Platform Se Mila / Is Maah); booking ledger with per-row commission%, platformCommission, hospitalPayable, paymentMode, payoutStatus; Payout History sub-view; commission rates readonly display; backward-compat on-the-fly commission calc for old bookings; `/api/hospital/earnings` GET; Admin HospitalDrawer commission slab editor (editable per-service-type rates, save via `/api/admin/commission-slabs` POST, loaded on drawer open); `/api/admin/commission-slabs` GET extended with `?hospitalId=` single-slab lookup | ✅ Done |
| 57 | Customer Care / Support Ticket System — `/support` page (role-aware form for all 6 roles); SupportTicket model (TKT-XXXXX auto ID); 8 categories; chat-style conversation thread; auto-context prefix injection (coordinatorId/hospitalId/memberId/bookingId/txnId); `IdentitySection` per role (guest/user/coordinator/hospital/doctor/staff); smart `ReferenceSection` dropdowns; BookingDropdown+TransactionDropdown detail cards; Admin 🎧 Customer Care tab with status filter + reply panel + sidebar badge; `/api/support/context` single-call role data fetch; `/api/support` + `/api/support/[ticketId]` + `/api/admin/support` routes; `openSupportTickets` badge on admin sidebar | ✅ Done |

---

## Pending Features 🔲

### Phase 6 — Patient Experience

| # | Feature | Priority | Notes |
|---|---------|----------|-------|
| P1 | ~~**Lab Reports Upload**~~ | ✅ Done | Hospital uploads PDF/image → patient `/reports` page with category filter |
| P2 | ~~**Prescription Upload**~~ | ✅ Done | Doctor uploads from dashboard → stored as Report (category: Prescription) → patient views in /reports |
| P3 | ~~**Membership Renewal**~~ | ✅ Done | Expired/expiring banner on dashboard → PhonePe ₹249 → expiry +1yr |
| P4 | ~~**Doctor Profile Edit**~~ | ✅ Done | Photo, slots, fees, hospital association from /doctor-profile |
| P5 | ~~**IPD Booking**~~ | ✅ Done | `/ipd-booking` — 4-step: hospital search → room type + dates → patient → deposit + payment |
| P6 | ~~**Booking Reminder Notifications**~~ | ✅ Done | Vercel cron `/api/cron/reminders` — 7:30 AM IST (same-day) + 1:30 PM IST (next-day) |
| P7 | ~~**Patient Health Card PDF**~~ | ✅ Done | `/health-card` — credit-card size (85.6×54mm), front+back, print/download per member |
| P8 | ~~**Rating & Reviews**~~ | ✅ Done | Post-appointment 1–5 stars + comment → doctor/hospital rating auto-update |

### Phase 7 — Analytics & Growth

| # | Feature | Priority | Notes |
|---|---------|----------|-------|
| P9 | ~~**Admin Analytics Dashboard**~~ | ✅ Done | Revenue charts, booking trends, bar chart, type breakdown on Overview tab |
| P10 | ~~**Referral System**~~ | ✅ Done | `/referral` — code display, WhatsApp share, stats (referred count, earned), referred people list |
| P11 | ~~**Hospital Search Page (Public)**~~ | ✅ Done | `/hospitals` — browse verified hospitals, district/type filter, search, Book OPD CTA |
| P12 | ~~**SEO — Hospital/Doctor Profiles**~~ | ✅ Done | `/hospitals/[slug]`, `/doctors/[slug]` — Server Components, generateMetadata, reviews, slots |
| P13 | ~~**Push Notifications**~~ | ✅ Done | FCM — doctor + hospital notified on new booking via `lib/fcm-admin` |
| P14 | **WhatsApp OTP / Notifications** | 🟡 Medium | 360Dialog or WATI integration (not yet started) |
| P15 | ~~**Multi-language (Hindi/English)**~~ | ✅ Done | LangProvider + `lib/i18n.ts` — toggle on dashboard |

### Phase 8 — Business Features

| # | Feature | Priority | Notes |
|---|---------|----------|-------|
| P16 | ~~**Promo Codes / Discounts**~~ | ✅ Done | Admin panel tab → create/edit/delete codes → validate at OPD checkout → usage tracking |
| P17 | ~~**Home Sample Collection**~~ | ✅ Done | Lab booking modal: toggle → address form (flat/street/landmark/district/pin) + morning pickup slots → stored in notes.homeAddress |
| P18 | ~~**Insurance Integration**~~ | ✅ Done | OPD booking — insurance mode, policy no. + company name capture |
| P19 | ~~**Ambulance Booking**~~ | ✅ Done | `/ambulance` — GPS location, vehicle type, emergency type, track by request ID; Admin 🚑 tab with dispatch/ETA/SMS |
| P20 | ~~**Revenue Reports (Admin)**~~ | ✅ Done | Monthly/weekly/daily breakdown, bar chart, table, CSV export |
| P21 | **Medicine Delivery** | 🟢 Low | 3rd-party pharmacy API integration |

### Phase 9 — Mobile App (Flutter)

| # | Feature | Priority | Notes |
|---|---------|----------|-------|
| P22 | **Flutter App Setup** | 🟡 Medium | API-first architecture already done — same APIs will serve Flutter |
| P23 | **Dual Auth (Cookie + Bearer)** | 🟡 Medium | Web=cookie, Mobile=`Authorization: Bearer <token>` — same `requireAuth()` |
| P24 | **FCM Push Notifications** | 🟡 Medium | New booking alerts on mobile |

---

## UI Design System

### Color Palette
```
Primary (teal-600):   #0d9488 — main CTA buttons, nav active, header
Secondary (blue-600): #2563eb — doctor/info actions, links
Success (green-600):  #16a34a — confirm/complete/verified
Warning (amber-500):  #f59e0b — pending badges, alerts
Danger (red-600):     #dc2626 — cancel/delete/error
Purple (purple-600):  #9333ea — staff/consultation/admin
Gray:                 gray-50/100/200 — backgrounds, borders, text
```

### Role Color Mapping
```
Member:   teal     (dashboard, bookings)
Doctor:   blue     (doctor-dashboard, register)
Hospital: purple   (hospital-dashboard, onboarding)
Staff:    orange   (staff-login, staff-dashboard)
Admin:    rose/red (admin panel)
```

### Component Patterns
```
Cards:    bg-white rounded-2xl border border-gray-100 shadow-sm p-4/5
Buttons:  px-4 py-2.5 rounded-xl text-sm font-semibold transition
Inputs:   border border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-teal-400
Badges:   inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border
Modals:   fixed inset-0 bg-black/40 z-50 backdrop-blur-sm — card max-w-lg centered
Drawers:  fixed right-0 top-0 h-full max-w-md bg-white z-50 shadow-2xl
Spinners: w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin
Toasts:   fixed top-4 right-4 z-50 bg-teal-700 text-white px-4 py-2.5 rounded-xl
```

### Status Badge Colors
```
pending:   bg-amber-100 text-amber-700 border-amber-200
confirmed: bg-green-100 text-green-700 border-green-200
completed: bg-teal-100 text-teal-700 border-teal-200
cancelled: bg-red-100 text-red-700 border-red-200
```

---

## Important Conventions

### API Response Format (Always follow this)
```js
// Success
return NextResponse.json({ success: true, message: "...", data: {} });
// Error
return NextResponse.json({ success: false, message: "..." }, { status: 4xx });
```

### Booking Notes Field
Patient details stored as JSON string in `Booking.notes`:
```js
// Create:
notes = JSON.stringify({ patientName, patientMobile, patientAge,
  patientGender, symptoms, paymentMode, isNewPatient })

// Read (always try/catch):
let n = {}; try { n = b.notes ? JSON.parse(b.notes) : {}; } catch {}
```

### Booking ID Format
```
BH-OPD-00008   (OPD)
BH-LAB-00003   (Lab)
BH-SUR-00001   (Surgery)
BH-CON-00005   (Consultation)
```

### PatientSelector Component
```tsx
import PatientSelector, { SelectedPatient } from "@/app/components/PatientSelector";
// Props: onSelect(patient), primaryUser, familyMembers
// Shows logged-in user + family members as radio cards
// "Naya Patient" expands form for external/new patients
// Returns: { userId, name, mobile, age, gender, symptoms, isNewPatient }
```

### ImageCropper Component
```tsx
import ImageCropper from "@/app/components/ImageCropper";
// Props: onUpload(url: string), onClose()
// IMPORTANT: Hidden file inputs rendered in BOTH phases (prevents unmount bug)
// Camera capture + gallery pick + crop-to-circle + Cloudinary upload
```

### Hospital Workflow
```
1. Apply: /hospital-onboarding → POST /api/hospital-onboarding
         → isVerified: false, isActive: false (pending)
2. Admin: /admin → Hospitals tab → Verify button
         → isVerified: true, isActive: true
3. Visibility: Only verified hospitals' doctors/packages/labs appear to patients
```

### Doctor Workflow
```
1. Apply: /doctor-register → POST /api/doctor-register
         → isActive: false, userId: null (pending admin approval)
2. Admin: /admin → Doctors tab → Approve toggle
         → isActive: true
3. Login: Doctor must have userId linked (set at admin approval or manually)
4. OR Admin adds directly via "Add Doctor" button
```

### Admin Panel Structure
```
Sidebar: Overview → Members → Hospitals → Doctors → Surgery Packages → Lab Tests → Bookings → Staff → 🎧 Customer Care
Each tab: independent fetch on mount, mutations refresh local list (no page reload)
Badges: amber = actionable (pendingHospitals, pendingDoctors, pending bookings, openSupportTickets)
Drawers: PatientDrawer (right slide-in) + HospitalDrawer (right slide-in)
Customer Care: ticket list (filter by status/category/priority/search) + right-side detail panel (chat thread + admin reply + status/priority dropdowns)
```

---

## Known Issues / Gotchas

1. **OTP in API response** — `IS_DEV` flag controls this. `NODE_ENV=production` pe OTP response mein nahi aayega. ✅ Fixed.
2. **Hospital login** uses `hospitalMongoId` (MongoDB `_id`), NOT `hospitalId` (custom `BRIMS-HOSP-xxx` string).
3. **Doctor login** requires `Doctor.userId` = User's `_id` — linking happens at admin approval or manual setup.
4. **Admin login** sets JWT session cookie AND `adminId`/`adminName` in localStorage. localStorage = display only; cookie = actual auth.
5. **Jitsi Meet** uses free public `meet.jit.si` — upgrade to `8x8.vc` for production reliability/SLA.
6. **Wallet deduction** — currently from `User.walletBalance`. Should migrate to `FamilyCard.walletBalance` for proper family wallet.
7. **pendingDoctors count** — counts all `isActive: false` doctors including deactivated ones. Add `isPendingApproval` flag for cleaner separation.
8. **Cloudinary** — free tier 25 credits/month. For scale: upgrade or use Supabase Storage.
9. **PhonePe callbacks** — only work on deployed URL, not localhost. Use ngrok for local testing.
10. **MongoDB SRV** — some ISPs in Bihar block SRV DNS. Use direct shard connection string if `mongodb+srv://` fails.
11. **Master Ledger income tracking** — Only NEW card activations (after this update) will have `card_activation_payment` Transaction records. Old activations are not backfilled. Booking payments (online/PhonePe) must also be tagged at `/api/bookings` and `/api/lab-payment-callback` to appear in income totals.
12. **Transaction `userId` for platform income** — `card_activation_payment` uses the paying user's `_id` as `userId`. Manual expense entries use the first admin user's `_id`. This is intentional — it allows tracing who paid/triggered each transaction.
13. **Partner Payouts** — `payoutStatus` on Booking is `null` by default (not "pending"). Queries for pending payouts must use `$or: [{payoutStatus: null}, {payoutStatus: "pending"}]`. Only bookings with `paymentMode in [online, wallet, insurance]` are eligible — counter/cash bookings do not create payout obligations.
14. **Health Card PDF** — uses Canvas `toDataURL()` to pre-convert all Cloudinary photos + logo to base64 before injecting into print HTML. `print-color-adjust: exact !important` required on all elements for colors to appear in PDF/print.
15. **Booking Detail Drawer** — clicking any booking in LedgerTab (bookings-all/pending/confirmed/completed view) opens a right-side drawer with patient info, payment details, and per-booking transaction history fetched via `?view=booking-txns&bookingId=...&bookingRef=...`.
16. **Support context API** — `/api/support/context` uses graceful auth (no 401 for guests). It returns role-specific data in one call. For `user/member` it returns all bookings by `userId` (not per family member — family member context is added as a prefix note only). Guest users see the full form but are redirected to `/login?redirect=/support` on submit.
17. **Admin support tab** — `openSupportTickets` badge comes from `SupportTicket.countDocuments({status:{$in:["open","in_progress"]}})` in `/api/admin` GET. Badge updates on each tab switch (stats refresh).

---

## Development Commands

```bash
npm run dev        # Start dev server → http://localhost:3000
npm run build      # Production build (check for errors before deploy)
npm run lint       # ESLint check
```

## Git Commands
```bash
git add .
git commit -m "Description of changes"
git push origin master
```


**GitHub:** https://github.com/brimshospitals/Brims-Hospitals  
**Branch:** `master`  
**Vercel:** Auto-deploys on push to `master`

---

## Next Steps (Recommended Order)

1. ✅ ~~Fast2SMS OTP integration~~ — add `FAST2SMS_API_KEY` to `.env.local`
2. ✅ ~~My Bookings polish + cancel button~~
3. ✅ ~~Hospital Onboarding redesign~~
4. ✅ ~~Lab Reports Upload~~ — hospital uploads, patient views in dashboard
5. ✅ ~~Membership Renewal~~ — expiry detection + ₹249 renewal flow
6. ✅ ~~Doctor Profile Edit~~ — slots, fees, photo, hospital from /doctor-profile
7. ✅ ~~Admin Analytics Charts~~ — pure CSS bar charts, trend, revenue, type breakdown
8. ✅ ~~**Referral System**~~ — invite link + ₹50 cashback
9. ✅ ~~**Rating & Reviews**~~ — post-appointment stars
10. ✅ ~~**SEO Profile Pages**~~ — `/hospitals/[slug]`, `/doctors/[slug]`
11. ✅ ~~**Patient Health Card PDF**~~ — `/health-card`, credit-card size, print-ready
12. ✅ ~~**Booking Reminder Notifications**~~ — Vercel cron, SMS via Fast2SMS
13. ✅ ~~**Insurance Integration**~~ — OPD booking, policy no. capture
14. ✅ ~~**Push Notifications (FCM)**~~ — doctor/hospital alert on booking
15. ✅ ~~**Multi-language Hindi/English**~~ — LangProvider + i18n
16. **WhatsApp OTP** — 360Dialog/WATI (only pending major feature)
17. **Flutter App** — phase 9, same APIs (shuru karo jab web stable ho)

---

*Last Updated: April 2026 (27 Apr)*  
*Status: Web App **~99% Complete** ✅ | Hospital Earnings Tab + Partner Payouts + Customer Care System + Master Ledger fully done | WhatsApp OTP pending | Flutter — future phase*

### What's fully done (58 features):
- Full patient flow: register → family card → OPD/Lab/Surgery/IPD/Teleconsult booking → reports → cancellation
- Hospital & Doctor management: onboarding, admin verification, dashboards, profile edit
- Staff dashboard: bookings, walk-in, collections, hospital management (permission-based)
- Admin panel: 9+ tabs including 🎧 Customer Care, analytics, revenue reports, ambulance, referral, promo codes, SEO pages
- Auth: JWT cookie, OTP (SMS+Email), FCM push, multi-role, `requireHospitalAccess` guard
- Patient Health Card (print-ready, canvas-based PDF), Booking Reminders (Vercel cron), Insurance mode, Multi-language
- **Master Ledger**: 8 clickable stat cards, booking detail drawer, transaction history per booking, 30s live refresh
- **Partner Payouts**: Hospital/Lab/Doctor/Ambulance entity tabs, UTR-based payout processing, full Transaction audit trail
- **Coordinator Accounting**: card commission, booking commission, withdrawal with UTR
- **Customer Care**: SupportTicket model, role-aware `/support` page, chat thread, auto-context injection, 8 categories, Admin 🎧 tab with reply + status management, sidebar badge
- **Hospital Earnings Tab**: 💰 tab in hospital dashboard — platform pending/received/counter-commission summary, full booking ledger with commission breakdown, payout history, commission rate editor in admin hospital drawer

### Only genuinely pending:
- **WhatsApp OTP** (P14) — 360Dialog/WATI (Medium priority)
- **Medicine Delivery** (P21) — 3rd party pharmacy API (Low priority)
- **Flutter App** (P22–P24) — start after web is fully stable

