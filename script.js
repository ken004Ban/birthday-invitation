/* ============================================================
   Patrick Bobo's 50th Birthday – Main Script
   ============================================================ */

(function () {
  "use strict";

  /* ── Helpers ──────────────────────────────────────────── */
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  function getConfig() {
    try {
      const saved = localStorage.getItem("bobobirthday_config");
      return saved ? { ...CONFIG, ...JSON.parse(saved) } : { ...CONFIG };
    } catch {
      return { ...CONFIG };
    }
  }

  let CFG = getConfig();

  /* ── Initialise ───────────────────────────────────────── */
  document.addEventListener("DOMContentLoaded", () => {
    renderEventDetails();
    buildFamilyDropdown();
    buildGuestDropdown();
    initCountdown();
    initInvitationText();
    initGallery();
    initQRCode();
    initShareButtons();
    initForm();
    initMusic();
    initScrollAnimations();
    initConfetti();
    initBalloons();
    initSparkles();
    initScrollSpy();
    $("#footer-year").textContent = new Date().getFullYear();
  });

  /* ── Event Details ────────────────────────────────────── */
  function renderEventDetails() {
    const e = CFG.event;
    setText("#detail-date", e.dateDisplay);
    setText("#detail-time", e.time);
    setText("#detail-venue", e.venue);
    setText("#detail-dress", e.dressCode);
    setText("#detail-contact", e.contactPerson);
    setText("#detail-phone", e.contactPhone);
    setText("#countdown-date-display", e.dateDisplay);

    if (e.address && e.address !== "Your Full Address Here") {
      const mapEl = $("#map-container");
      const mapLink = $("#map-link");
      mapLink.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.address)}`;
      mapEl.style.display = "block";
    }
  }

  function setText(sel, val) {
    const el = $(sel);
    if (el) el.textContent = val || "";
  }

  /* ── Invitation Text ──────────────────────────────────── */
  function initInvitationText() {
    const el = $("#invitation-text");
    if (el) el.textContent = CFG.invitationMessage;
  }

  /* ── Family Dropdown ──────────────────────────────────── */
  function buildFamilyDropdown() {
    const sel = $("#rsvp-family");
    if (!sel) return;
    sel.innerHTML = '<option value="" disabled selected>Select group...</option>';
    (CFG.familyGroups || []).forEach((g) => {
      const opt = document.createElement("option");
      opt.value = g;
      opt.textContent = g;
      sel.appendChild(opt);
    });
  }

  /* ── Guest Dropdown ───────────────────────────────────── */
  function buildGuestDropdown() {
    const sel = $("#rsvp-guests");
    if (!sel) return;
    for (let i = 0; i <= (CFG.maxGuests || 10); i++) {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = i === 0 ? "Just me" : i;
      sel.appendChild(opt);
    }
  }

  /* ── Countdown ────────────────────────────────────────── */
  function initCountdown() {
    updateCountdown();
    setInterval(updateCountdown, 1000);
  }

  function updateCountdown() {
    const target = new Date(CFG.event.date + "T00:00:00").getTime();
    const now = Date.now();
    const diff = target - now;

    if (diff <= 0) {
      setText("#cd-days", "00");
      setText("#cd-hours", "00");
      setText("#cd-minutes", "00");
      setText("#cd-seconds", "00");
      return;
    }

    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    setText("#cd-days", String(d).padStart(2, "0"));
    setText("#cd-hours", String(h).padStart(2, "0"));
    setText("#cd-minutes", String(m).padStart(2, "0"));
    setText("#cd-seconds", String(s).padStart(2, "0"));
  }

  /* ── Gallery ──────────────────────────────────────────── */
  let galleryIndex = 0;

  function initGallery() {
    const track = $("#gallery-track");
    const dots = $("#gallery-dots");
    if (!track || !dots) return;

    const photos = (CFG.photos || []).filter((p) => p);
    if (photos.length === 0) {
      track.innerHTML =
        '<div class="gallery-item" style="display:flex;align-items:center;justify-content:center;min-height:250px;color:var(--text-muted);font-family:var(--font-elegant);font-size:1.2rem;">Photos coming soon</div>';
      return;
    }

    photos.forEach((src, i) => {
      const item = document.createElement("div");
      item.className = "gallery-item";
      const img = document.createElement("img");
      img.src = src;
      img.alt = `Photo ${i + 1}`;
      img.loading = "lazy";
      img.onerror = function () {
        this.style.display = "none";
      };
      item.appendChild(img);
      track.appendChild(item);

      const dot = document.createElement("button");
      dot.className = "gallery-dot" + (i === 0 ? " active" : "");
      dot.setAttribute("aria-label", `Go to photo ${i + 1}`);
      dot.addEventListener("click", () => goToSlide(i));
      dots.appendChild(dot);
    });

    $(".gallery-prev").addEventListener("click", () => {
      goToSlide(galleryIndex - 1);
    });
    $(".gallery-next").addEventListener("click", () => {
      goToSlide(galleryIndex + 1);
    });

    // Touch swipe
    let startX = 0;
    track.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX;
    });
    track.addEventListener("touchend", (e) => {
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        goToSlide(galleryIndex + (diff > 0 ? 1 : -1));
      }
    });
  }

  function goToSlide(index) {
    const track = $("#gallery-track");
    const dots = $$(".gallery-dot");
    if (!track || dots.length === 0) return;

    const total = dots.length;
    galleryIndex = ((index % total) + total) % total;
    track.style.transform = `translateX(-${galleryIndex * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle("active", i === galleryIndex));
  }

  /* ── QR Code ──────────────────────────────────────────── */
  function initQRCode() {
    const el = $("#qr-code");
    if (!el || typeof QRCode === "undefined") return;

    const url =
      CFG.qrCodeUrl || window.location.href.split("?")[0];

    new QRCode(el, {
      text: url,
      width: 180,
      height: 180,
      colorDark: "#1a365d",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H,
    });
  }

  /* ── Share Buttons ────────────────────────────────────── */
  function initShareButtons() {
    const shareUrl = encodeURIComponent(window.location.href);
    const shareText = encodeURIComponent(
      `You're invited to Patrick Bobo's Golden Jubilee - 50th Birthday Celebration! Join us and RSVP here:`
    );

    const whatsApp = $("#share-whatsapp");
    const facebook = $("#share-facebook");
    const emailBtn = $("#share-email");
    const calBtn = $("#share-calendar");
    const copyBtn = $("#share-copy");

    if (whatsApp)
      whatsApp.addEventListener("click", () => {
        window.open(
          `https://wa.me/260977113739?text=${shareText}%20${shareUrl}`,
          "_blank"
        );
      });

    if (facebook)
      facebook.addEventListener("click", () => {
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
          "_blank"
        );
      });

    if (emailBtn)
      emailBtn.addEventListener("click", () => {
        const subject = encodeURIComponent("You're Invited - Patrick Bobo's 50th Birthday!");
        const body = encodeURIComponent(
          `Join us in celebrating Patrick Bobo's Golden Jubilee!\n\nRSVP here: ${window.location.href}`
        );
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
      });

    if (calBtn) calBtn.addEventListener("click", addGoogleCalendar);

    if (copyBtn)
      copyBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(window.location.href).then(() => {
          showToast("Link copied!");
        });
      });
  }

  function addGoogleCalendar() {
    const e = CFG.event;
    const start = e.date.replace(/-/g, "") + "T000000";
    const end = e.date.replace(/-/g, "") + "T235959";
    const text = encodeURIComponent(`${e.title} - ${e.subtitle}`);
    const details = encodeURIComponent(
      `${e.celebrantName}'s 50th Birthday Celebration\nVenue: ${e.venue}\nTime: ${e.time}`
    );
    const location = encodeURIComponent(e.address || e.venue);

    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${start}/${end}&details=${details}&location=${location}`;
    window.open(url, "_blank");
  }

  function showToast(msg) {
    const toast = $("#copy-toast");
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2500);
  }

  /* ── RSVP Form ────────────────────────────────────────── */
  function initForm() {
    const form = $("#rsvp-form");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Validate
      const name = $("#rsvp-name").value.trim();
      const phone = $("#rsvp-phone").value.trim();
      const family = $("#rsvp-family").value;
      const attendance = form.querySelector('input[name="attendance"]:checked');

      if (!name || !phone || !family || !attendance) {
        showToast("Please fill in all required fields.");
        return;
      }

      const btnText = form.querySelector(".btn-text");
      const btnSpinner = form.querySelector(".btn-spinner");
      const submitBtn = $("#rsvp-submit");

      submitBtn.disabled = true;
      btnText.classList.add("d-none");
      btnSpinner.classList.remove("d-none");

      const payload = {
        timestamp: new Date().toISOString(),
        fullName: name,
        phone: phone,
        email: $("#rsvp-email").value.trim(),
        familyGroup: family,
        attendance: attendance.value,
        guests: $("#rsvp-guests").value,
        dietaryRequirements: $("#rsvp-dietary").value.trim(),
        message: $("#rsvp-message").value.trim(),
        ip: "",
        browser: navigator.userAgent,
        device: getDeviceInfo(),
      };

      try {
        if (CFG.appsScriptUrl) {
          const resp = await fetch(CFG.appsScriptUrl, {
            method: "POST",
            mode: "no-cors",
            body: JSON.stringify(payload),
          });
        }
        // Save locally too
        saveLocalRSVP(payload);

        form.classList.add("d-none");
        const success = $("#rsvp-success");
        success.classList.remove("d-none");

        // Confetti burst
        launchConfetti();
      } catch (err) {
        // Still save locally on error
        saveLocalRSVP(payload);
        form.classList.add("d-none");
        $("#rsvp-success").classList.remove("d-none");
        launchConfetti();
      }
    });
  }

  function saveLocalRSVP(data) {
    try {
      const existing = JSON.parse(localStorage.getItem("bobobirthday_rsvps") || "[]");
      existing.push(data);
      localStorage.setItem("bobobirthday_rsvps", JSON.stringify(existing));
    } catch {}
  }

  function getDeviceInfo() {
    const ua = navigator.userAgent;
    if (/android/i.test(ua)) return "Android";
    if (/iPad|iPhone|iPod/.test(ua)) return "iOS";
    if (/Windows/.test(ua)) return "Windows";
    if (/Mac/.test(ua)) return "Mac";
    if (/Linux/.test(ua)) return "Linux";
    return "Unknown";
  }

  /* ── Music ────────────────────────────────────────────── */
  function initMusic() {
    const audio = $("#bg-music");
    const btn = $("#music-btn");
    if (!audio || !btn) return;

    audio.src = CFG.musicUrl || "";
    audio.currentTime = 25;
    audio.volume = 0;

    function fadeIn(targetVol, duration) {
      const steps = 30;
      const stepTime = duration / steps;
      const volStep = targetVol / steps;
      let current = 0;
      const interval = setInterval(() => {
        current += volStep;
        if (current >= targetVol) {
          audio.volume = targetVol;
          clearInterval(interval);
        } else {
          audio.volume = current;
        }
      }, stepTime);
    }

    function fadeOut(callback) {
      const startVol = audio.volume;
      const steps = 30;
      const stepTime = 50;
      const volStep = startVol / steps;
      let current = startVol;
      const interval = setInterval(() => {
        current -= volStep;
        if (current <= 0) {
          audio.volume = 0;
          audio.pause();
          clearInterval(interval);
          if (callback) callback();
        } else {
          audio.volume = current;
        }
      }, stepTime);
    }

    audio.play().then(() => {
      btn.classList.add("playing");
      fadeIn(0.3, 3000);
    }).catch(() => {
      const resumeOnInteract = () => {
        audio.currentTime = 25;
        audio.play().then(() => {
          btn.classList.add("playing");
          fadeIn(0.3, 3000);
        }).catch(() => {});
        document.removeEventListener("click", resumeOnInteract);
        document.removeEventListener("touchstart", resumeOnInteract);
      };
      document.addEventListener("click", resumeOnInteract);
      document.addEventListener("touchstart", resumeOnInteract);
    });

    btn.addEventListener("click", () => {
      if (audio.paused) {
        audio.currentTime = 25;
        audio.play().then(() => {
          btn.classList.add("playing");
          fadeIn(0.3, 1500);
        }).catch(() => {});
      } else {
        fadeOut(() => {
          btn.classList.remove("playing");
        });
      }
    });

    window.addEventListener("beforeunload", () => {
      fadeOut();
    });

    const rsvpSuccess = $("#rsvp-success");
    if (rsvpSuccess) {
      const rsvpObserver = new MutationObserver(() => {
        if (!rsvpSuccess.classList.contains("d-none")) {
          fadeOut();
        }
      });
      rsvpObserver.observe(rsvpSuccess, { attributes: true, attributeFilter: ["class"] });
    }
  }

  /* ── Scroll Animations ────────────────────────────────── */
  function initScrollAnimations() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.15 }
    );

    $$(".fade-in").forEach((el) => observer.observe(el));
  }

  function initScrollSpy() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1 }
    );

    // Observe detail cards for staggered animation
    $$(".detail-card").forEach((el, i) => {
      el.style.transitionDelay = `${i * 0.1}s`;
      observer.observe(el);
    });
  }

  /* ── Confetti ─────────────────────────────────────────── */
  function initConfetti() {
    // Auto confetti on page load
    setTimeout(() => launchConfetti(), 800);
  }

  function launchConfetti() {
    const canvas = $("#confetti-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const pieces = [];
    const colors = [
      "#1a365d", "#d4a94e", "#f0d68a",
      "#ffffff", "#2c5282", "#ffd700",
      "#f8f9fc", "#b8860b",
    ];

    for (let i = 0; i < 150; i++) {
      pieces.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        w: Math.random() * 10 + 4,
        h: Math.random() * 6 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        speed: Math.random() * 3 + 2,
        angle: Math.random() * 360,
        spin: (Math.random() - 0.5) * 8,
        drift: (Math.random() - 0.5) * 4,
      });
    }

    let frame = 0;
    const maxFrames = 180;

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach((p) => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.angle * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, 1 - frame / maxFrames);
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();

        p.y += p.speed;
        p.x += p.drift;
        p.angle += p.spin;
      });

      frame++;
      if (frame < maxFrames) requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    draw();
  }

  /* ── Balloons ─────────────────────────────────────────── */
  function initBalloons() {
    const container = $("#balloon-container");
    if (!container) return;

    function spawn() {
      const b = document.createElement("div");
      b.className = "balloon " + (Math.random() > 0.5 ? "gold" : "navy");
      b.style.left = Math.random() * 100 + "%";
      b.style.animationDuration = Math.random() * 6 + 8 + "s";
      b.style.animationDelay = Math.random() * 2 + "s";
      b.style.opacity = Math.random() * 0.3 + 0.3;
      b.style.transform = `scale(${Math.random() * 0.4 + 0.6})`;
      container.appendChild(b);
      setTimeout(() => b.remove(), 16000);
    }

    // Initial batch
    for (let i = 0; i < 5; i++) setTimeout(spawn, i * 600);
    // Continuously spawn
    setInterval(spawn, 3000);
  }

  /* ── Sparkles ─────────────────────────────────────────── */
  function initSparkles() {
    const layer = $("#sparkle-layer");
    if (!layer) return;

    function sparkle() {
      const s = document.createElement("div");
      s.className = "sparkle";
      s.style.left = Math.random() * 100 + "%";
      s.style.top = Math.random() * 100 + "%";
      s.style.animationDelay = Math.random() * 2 + "s";
      s.style.animationDuration = Math.random() * 2 + 2 + "s";
      layer.appendChild(s);
      setTimeout(() => s.remove(), 5000);
    }

    for (let i = 0; i < 12; i++) setTimeout(sparkle, i * 300);
    setInterval(sparkle, 800);
  }

  /* ── Resize handler ───────────────────────────────────── */
  window.addEventListener("resize", () => {
    const canvas = $("#confetti-canvas");
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  });
})();
