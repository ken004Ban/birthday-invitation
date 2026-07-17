// ============================================================
// Patrick Bobo's 50th Birthday - Configuration
// ============================================================
// Update these values to customize the invitation.
// The admin panel can also edit these at runtime (stored in
// localStorage). Values here are the defaults.
// ============================================================

const CONFIG = {
  // ── Event Details ──────────────────────────────────────────
  event: {
    celebrantName: "Patrick Bobo",
    title: "Golden Jubilee",
    subtitle: "50th Birthday Celebration",
    date: "2025-08-04",               // ISO date (YYYY-MM-DD)
    dateDisplay: "Tuesday, 4 August 2025",
    time: "12:00 PM onwards",
    venue: "Bobo Residence",
    address: "Your Full Address Here",
    dressCode: "Smart Casual / Gold Accents Welcome",
    contactPerson: "Rabecca Bobo",
    contactPhone: "+260 977 113 739",
  },

  // ── Invitation Message ─────────────────────────────────────
  invitationMessage:
    "You are warmly invited to celebrate Patrick Bobo's Golden Jubilee " +
    "as he marks 50 wonderful years of God's faithfulness, love, and blessings.\n\n" +
    "Your presence will make this celebration even more special.\n\n" +
    "We look forward to celebrating with you and your family.",

  // ── Google Apps Script Web App URL ─────────────────────────
  // Paste your deployed Google Apps Script web app URL here.
  appsScriptUrl: "https://script.google.com/macros/s/AKfycbx7wCCENatyAeIlXkrrbroNlIRaMmPW8TeKImw9aXZnU-3mr1cR0dN8q-FvtiXKoTk2QA/exec",

  // ── QR Code target URL ────────────────────────────────────
  // Leave empty to auto-detect from current page location.
  qrCodeUrl: "",

  // ── Background Music ──────────────────────────────────────
  musicUrl: "assets/music/celebration.mp3",
  musicEnabled: false,

  // ── Photos (add paths relative to assets/images/) ─────────
  photos: [
    "assets/images/photo1.jpg",
    "assets/images/photo2.jpg",
    "assets/images/photo3.jpg",
  ],

  // ── Admin Password ────────────────────────────────────────
  adminPassword: "patrick50",

  // ── Family Groups ─────────────────────────────────────────
  familyGroups: [
    "Bobo Family",
    "Maternal Family",
    "Paternal Family",
    "Friends",
    "Church",
    "Other",
  ],

  // ── Max Guests ────────────────────────────────────────────
  maxGuests: 10,
};
