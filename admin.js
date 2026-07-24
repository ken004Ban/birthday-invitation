/* ============================================================
   Patrick Bobo's 50th Birthday – Admin Dashboard
   ============================================================ */

(function () {
  "use strict";

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  /* ── Auth ─────────────────────────────────────────────── */
  const loginOverlay = $("#login-overlay");
  const dashboard = $("#dashboard");
  const loginBtn = $("#login-btn");
  const logoutBtn = $("#logout-btn");
  const passwordInput = $("#admin-password");
  const loginError = $("#login-error");

  // Check session
  if (sessionStorage.getItem("bobobirthday_admin") === "true") {
    showDashboard();
  }

  loginBtn.addEventListener("click", doLogin);
  passwordInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") doLogin();
  });

  function doLogin() {
    const pw = passwordInput.value.trim();
    try {
      if (typeof CONFIG === "undefined" || !CONFIG.adminPassword) {
        loginError.textContent = "Configuration not loaded. Please refresh.";
        loginError.style.display = "block";
        return;
      }
      if (pw === CONFIG.adminPassword) {
        sessionStorage.setItem("bobobirthday_admin", "true");
        showDashboard();
      } else {
        loginError.textContent = "Incorrect password";
        loginError.style.display = "block";
        passwordInput.value = "";
        passwordInput.focus();
      }
    } catch (err) {
      loginError.textContent = "Error: " + err.message;
      loginError.style.display = "block";
    }
  }

  logoutBtn.addEventListener("click", () => {
    sessionStorage.removeItem("bobobirthday_admin");
    location.reload();
  });

  function showDashboard() {
    loginOverlay.style.display = "none";
    dashboard.style.display = "block";
    init();
  }

  /* ── Config Helpers ───────────────────────────────────── */
  function loadConfig() {
    try {
      const saved = localStorage.getItem("bobobirthday_config");
      return saved ? { ...CONFIG, ...JSON.parse(saved) } : { ...CONFIG };
    } catch {
      return { ...CONFIG };
    }
  }

  function saveConfig(cfg) {
    localStorage.setItem("bobobirthday_config", JSON.stringify(cfg));
  }

  function getRSVPs() {
    try {
      return JSON.parse(localStorage.getItem("bobobirthday_rsvps") || "[]");
    } catch {
      return [];
    }
  }

  /* ── Tabs ─────────────────────────────────────────────── */
  function initTabs() {
    $$("#admin-tabs .nav-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const tab = link.dataset.tab;
        $$("#admin-tabs .nav-link").forEach((l) => l.classList.remove("active"));
        link.classList.add("active");
        $$(".tab-content").forEach((tc) => (tc.style.display = "none"));
        const target = $(`#tab-${tab}`);
        if (target) target.style.display = "block";

        if (tab === "overview") renderOverview();
        if (tab === "guests") renderGuests();
        if (tab === "sheets") renderSheetsTab();
      });
    });
  }

  /* ── Overview ─────────────────────────────────────────── */
  function renderOverview() {
    const rsvps = getRSVPs();
    const total = rsvps.length;
    const yes = rsvps.filter((r) => r.attendance === "Yes").length;
    const no = rsvps.filter((r) => r.attendance === "No").length;
    const maybe = rsvps.filter((r) => r.attendance === "Maybe").length;
    const guests = rsvps.reduce((sum, r) => sum + (parseInt(r.guests) || 0), 0);

    $("#stat-total").textContent = total;
    $("#stat-yes").textContent = yes;
    $("#stat-no").textContent = no;
    $("#stat-maybe").textContent = maybe;
    $("#stat-guests").textContent = guests + yes;
    $("#stat-invites").textContent = total;

    // Recent
    const recentEl = $("#recent-rsvps");
    if (rsvps.length === 0) {
      recentEl.innerHTML = '<p class="text-muted">No RSVPs yet.</p>';
      return;
    }

    const recent = rsvps.slice(-5).reverse();
    let html = '<table class="rsvp-table"><thead><tr><th>Name</th><th>Group</th><th>Attending</th><th>Time</th></tr></thead><tbody>';
    recent.forEach((r) => {
      const badge = getBadgeClass(r.attendance);
      const time = new Date(r.timestamp).toLocaleString();
      html += `<tr>
        <td>${esc(r.fullName)}</td>
        <td>${esc(r.familyGroup)}</td>
        <td><span class="badge ${badge}">${esc(r.attendance)}</span></td>
        <td>${time}</td>
      </tr>`;
    });
    html += "</tbody></table>";
    recentEl.innerHTML = html;
  }

  /* ── Edit Event ───────────────────────────────────────── */
  function loadEditForm() {
    const cfg = loadConfig();
    const e = cfg.event;

    $("#edit-celebrant").value = e.celebrantName || "";
    $("#edit-date").value = e.date || "";
    $("#edit-date-display").value = e.dateDisplay || "";
    $("#edit-time").value = e.time || "";
    $("#edit-dress").value = e.dressCode || "";
    $("#edit-venue").value = e.venue || "";
    $("#edit-address").value = e.address || "";
    $("#edit-contact").value = e.contactPerson || "";
    $("#edit-phone").value = e.contactPhone || "";
    $("#edit-message").value = cfg.invitationMessage || "";
    $("#edit-apps-script").value = cfg.appsScriptUrl || "";
    $("#edit-qr-url").value = cfg.qrCodeUrl || "";
  }

  function initSaveEvent() {
    $("#save-event-btn").addEventListener("click", () => {
      const cfg = loadConfig();

      cfg.event.celebrantName = $("#edit-celebrant").value.trim();
      cfg.event.date = $("#edit-date").value;
      cfg.event.dateDisplay = $("#edit-date-display").value.trim();
      cfg.event.time = $("#edit-time").value.trim();
      cfg.event.dressCode = $("#edit-dress").value.trim();
      cfg.event.venue = $("#edit-venue").value.trim();
      cfg.event.address = $("#edit-address").value.trim();
      cfg.event.contactPerson = $("#edit-contact").value.trim();
      cfg.event.contactPhone = $("#edit-phone").value.trim();
      cfg.invitationMessage = $("#edit-message").value.trim();
      cfg.appsScriptUrl = $("#edit-apps-script").value.trim();
      cfg.qrCodeUrl = $("#edit-qr-url").value.trim();

      saveConfig(cfg);
      alert("Changes saved! Reload the invitation page to see updates.");
    });
  }

  /* ── Guest List ───────────────────────────────────────── */
  let allGuests = [];
  let filteredGuests = [];

  function renderGuests() {
    allGuests = getRSVPs();
    buildGuestFilter();
    filterAndDisplay();
    initGuestActions();
  }

  function buildGuestFilter() {
    const filter = $("#guest-filter");
    const cfg = loadConfig();
    filter.innerHTML = '<option value="">All Groups</option>';
    (cfg.familyGroups || []).forEach((g) => {
      const opt = document.createElement("option");
      opt.value = g;
      opt.textContent = g;
      filter.appendChild(opt);
    });
  }

  function filterAndDisplay() {
    const search = ($("#guest-search") || {}).value?.toLowerCase() || "";
    const filterGroup = ($("#guest-filter") || {}).value || "";
    const sortBy = ($("#guest-sort") || {}).value || "newest";

    filteredGuests = allGuests.filter((r) => {
      const matchSearch =
        !search ||
        r.fullName.toLowerCase().includes(search) ||
        r.phone.toLowerCase().includes(search) ||
        (r.email || "").toLowerCase().includes(search);
      const matchGroup = !filterGroup || r.familyGroup === filterGroup;
      return matchSearch && matchGroup;
    });

    // Sort
    if (sortBy === "newest") {
      filteredGuests.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } else if (sortBy === "oldest") {
      filteredGuests.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    } else if (sortBy === "name") {
      filteredGuests.sort((a, b) => a.fullName.localeCompare(b.fullName));
    } else if (sortBy === "attendance") {
      const order = { Yes: 0, Maybe: 1, No: 2 };
      filteredGuests.sort((a, b) => (order[a.attendance] || 3) - (order[b.attendance] || 3));
    }

    displayGuestTable();
  }

  function displayGuestTable() {
    const tbody = $("#guests-tbody");
    const noGuests = $("#no-guests");

    if (filteredGuests.length === 0) {
      tbody.innerHTML = "";
      noGuests.style.display = "block";
      return;
    }

    noGuests.style.display = "none";
    let html = "";
    filteredGuests.forEach((r, i) => {
      const badge = getBadgeClass(r.attendance);
      const date = new Date(r.timestamp).toLocaleDateString();
      html += `<tr>
        <td>${i + 1}</td>
        <td>${esc(r.fullName)}</td>
        <td>${esc(r.phone)}</td>
        <td>${esc(r.email || "–")}</td>
        <td>${esc(r.familyGroup)}</td>
        <td><span class="badge ${badge}">${esc(r.attendance)}</span></td>
        <td>${r.guests}</td>
        <td title="${esc(r.message || "")}">${esc(truncate(r.message || "–", 30))}</td>
        <td>${date}</td>
      </tr>`;
    });
    tbody.innerHTML = html;
  }

  function initGuestActions() {
    const search = $("#guest-search");
    const filter = $("#guest-filter");
    const sort = $("#guest-sort");

    search.oninput = filterAndDisplay;
    filter.onchange = filterAndDisplay;
    sort.onchange = filterAndDisplay;

    $("#export-csv").onclick = exportCSV;
    $("#export-excel").onclick = exportExcel;
    $("#print-list").onclick = printList;
  }

  /* ── Export CSV ───────────────────────────────────────── */
  function exportCSV() {
    const headers = ["Name", "Phone", "Email", "Group", "Attendance", "Guests", "Dietary", "Message", "Date"];
    const rows = filteredGuests.map((r) => [
      r.fullName, r.phone, r.email || "", r.familyGroup,
      r.attendance, r.guests, r.dietaryRequirements || "",
      (r.message || "").replace(/\n/g, " "), r.timestamp,
    ]);

    let csv = headers.join(",") + "\n";
    rows.forEach((row) => {
      csv += row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",") + "\n";
    });

    downloadFile(csv, "bobobirthday_rsvps.csv", "text/csv");
  }

  /* ── Export Excel (XLSX via simple HTML table) ─────────── */
  function exportExcel() {
    const headers = ["Name", "Phone", "Email", "Group", "Attendance", "Guests", "Dietary", "Message", "Date"];
    let html = "<table border='1'><thead><tr>";
    headers.forEach((h) => { html += `<th>${h}</th>`; });
    html += "</tr></thead><tbody>";
    filteredGuests.forEach((r) => {
      html += `<tr>
        <td>${esc(r.fullName)}</td>
        <td>${esc(r.phone)}</td>
        <td>${esc(r.email || "")}</td>
        <td>${esc(r.familyGroup)}</td>
        <td>${esc(r.attendance)}</td>
        <td>${r.guests}</td>
        <td>${esc(r.dietaryRequirements || "")}</td>
        <td>${esc(r.message || "")}</td>
        <td>${r.timestamp}</td>
      </tr>`;
    });
    html += "</tbody></table>";

    const blob = new Blob([html], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bobobirthday_rsvps.xls";
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ── Print ────────────────────────────────────────────── */
  function printList() {
    const headers = ["#", "Name", "Phone", "Group", "Attendance", "Guests"];
    let html = `<html><head><title>Guest List – Patrick Bobo's 50th</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { font-size: 18px; margin-bottom: 5px; }
        h2 { font-size: 14px; font-weight: normal; color: #666; margin-top: 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
        th { background: #f5f5f5; font-weight: bold; }
      </style></head><body>
      <h1>Patrick Bobo's Golden Jubilee</h1>
      <h2>Guest List (${filteredGuests.length} entries)</h2>
      <table><thead><tr>`;
    headers.forEach((h) => { html += `<th>${h}</th>`; });
    html += "</tr></thead><tbody>";
    filteredGuests.forEach((r, i) => {
      html += `<tr>
        <td>${i + 1}</td>
        <td>${esc(r.fullName)}</td>
        <td>${esc(r.phone)}</td>
        <td>${esc(r.familyGroup)}</td>
        <td>${esc(r.attendance)}</td>
        <td>${r.guests}</td>
      </tr>`;
    });
    html += "</tbody></table></body></html>";

    const w = window.open("", "_blank");
    w.document.write(html);
    w.document.close();
    w.print();
  }

  /* ── Google Sheets Tab ────────────────────────────────── */
  function renderSheetsTab() {
    const cfg = loadConfig();
    const urlEl = $("#current-apps-script-url");
    if (cfg.appsScriptUrl) {
      urlEl.textContent = cfg.appsScriptUrl;
      urlEl.style.color = "var(--gold-light)";
    } else {
      urlEl.textContent = "Not configured. Set it in Edit Event tab.";
    }
  }

  // Fetch from Google Sheets
  document.addEventListener("click", (e) => {
    if (e.target.id === "fetch-sheets-btn" || e.target.closest("#fetch-sheets-btn")) {
      fetchFromSheets();
    }
  });

  async function fetchFromSheets() {
    const cfg = loadConfig();
    const status = $("#sheets-status");

    if (!cfg.appsScriptUrl) {
      status.innerHTML = '<span style="color:#dc3545;">No Apps Script URL configured. Set it in the Edit Event tab.</span>';
      return;
    }

    status.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Fetching data...';

    try {
      const resp = await fetch(cfg.appsScriptUrl + "?action=getRSVPs");
      const data = await resp.json();

      if (data.success && data.rsvps) {
        // Merge with local data
        const local = getRSVPs();
        const existing = new Set(local.map((r) => r.timestamp + r.fullName));
        let added = 0;
        data.rsvps.forEach((r) => {
          const key = r.timestamp + r.fullName;
          if (!existing.has(key)) {
            local.push(r);
            existing.add(key);
            added++;
          }
        });

        localStorage.setItem("bobobirthday_rsvps", JSON.stringify(local));
        status.innerHTML = `<span style="color:#28a745;"><i class="fas fa-check me-1"></i>Fetched ${data.rsvps.length} records, ${added} new imported.</span>`;
      } else {
        status.innerHTML = `<span style="color:#ffc107;">No data returned or unexpected format.</span>`;
      }
    } catch (err) {
      status.innerHTML = `<span style="color:#dc3545;">Error: ${esc(err.message)}</span>`;
    }
  }

  /* ── Utility ──────────────────────────────────────────── */
  function esc(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function truncate(str, max) {
    return str.length > max ? str.substring(0, max) + "..." : str;
  }

  function getBadgeClass(attendance) {
    if (attendance === "Yes") return "badge-yes";
    if (attendance === "No") return "badge-no";
    return "badge-maybe";
  }

  function downloadFile(content, filename, type) {
    const blob = new Blob(["\ufeff" + content], { type: type + ";charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ── Init ─────────────────────────────────────────────── */
  function init() {
    try {
      if (typeof CONFIG === "undefined") {
        console.error("CONFIG is not loaded. Check that config.js is accessible.");
        return;
      }
    } catch (e) {
      console.error("Init error:", e);
      return;
    }
    initTabs();
    loadEditForm();
    initSaveEvent();
    renderOverview();
  }
})();
