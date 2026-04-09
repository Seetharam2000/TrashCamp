(function () {
  const KEYS = {
    spots: "cleanspot_spots",
    proof: "cleanspot_proof",
    trust: "cleanspot_trust",
    queue: "cleanspot_queue",
    activity: "cleanspot_activity",
    seen: "cleanspot_seen",
    points: "cleanspot_points",
    escalations: "cleanspot_escalations",
    alertAcks: "cleanspot_alert_acks",
    user: "cleanspot_user",
    broadcast: "cleanspot_broadcast",
    volunteers: "cleanspot_volunteers",
    credits: "cleanspot_credits"
  };

  const PAGE_KEYS = ["index", "citizen", "volunteer", "authority", "proof-feed", "signup", "notify"];

  const seedSpots = [
    { id: "s1", lat: 12.8211, lng: 80.0418, reporterName: "Aarav", reporterTrust: 7, baseSeverity: 0.5, hoursAge: 14, rainForecast: false, heatAbove35: true, status: "reported", reportPhotoName: "roadside_pile_1.jpg", cleanupPhotoName: "", timestamp: Date.now() - 11 * 3600000, volunteerName: "", zoneName: "Potheri Gate East" },
    { id: "s2", lat: 12.8237, lng: 80.0462, reporterName: "Meera", reporterTrust: 6, baseSeverity: 0.7, hoursAge: 20, rainForecast: true, heatAbove35: false, status: "reported", reportPhotoName: "canteen_lane_waste.png", cleanupPhotoName: "", timestamp: Date.now() - 15 * 3600000, volunteerName: "", zoneName: "SRM Canteen Lane" },
    { id: "s3", lat: 12.8251, lng: 80.0429, reporterName: "Rohit", reporterTrust: 9, baseSeverity: 0.8, hoursAge: 34, rainForecast: true, heatAbove35: true, status: "reported", reportPhotoName: "bus_stop_dump.jpeg", cleanupPhotoName: "", timestamp: Date.now() - 28 * 3600000, volunteerName: "", zoneName: "Kattankulathur Bus Stop" },
    { id: "s4", lat: 12.8199, lng: 80.0488, reporterName: "Divya", reporterTrust: 4, baseSeverity: 0.35, hoursAge: 6, rainForecast: false, heatAbove35: false, status: "reported", reportPhotoName: "hostel_backyard.jpg", cleanupPhotoName: "", timestamp: Date.now() - 5 * 3600000, volunteerName: "", zoneName: "Hostel Back Road" },
    { id: "s5", lat: 12.8275, lng: 80.0444, reporterName: "Kiran", reporterTrust: 8, baseSeverity: 0.9, hoursAge: 42, rainForecast: true, heatAbove35: true, status: "inProgress", reportPhotoName: "market_corner.png", cleanupPhotoName: "", timestamp: Date.now() - 38 * 3600000, volunteerName: "Asha", zoneName: "Potheri Market Corner" },
    { id: "s6", lat: 12.8246, lng: 80.0399, reporterName: "Nila", reporterTrust: 5, baseSeverity: 0.45, hoursAge: 18, rainForecast: false, heatAbove35: true, status: "cleaned", reportPhotoName: "railway_side_heap.jpg", cleanupPhotoName: "cleanup_done_nila.jpg", timestamp: Date.now() - 25 * 3600000, volunteerName: "Naveen", zoneName: "Railway Crossing Side" },
    { id: "s7", lat: 12.8208, lng: 80.0449, reporterName: "Vijay", reporterTrust: 3, baseSeverity: 0.55, hoursAge: 9, rainForecast: false, heatAbove35: false, status: "reported", reportPhotoName: "bridge_underpass.jpeg", cleanupPhotoName: "", timestamp: Date.now() - 7 * 3600000, volunteerName: "", zoneName: "Underpass Link Road" }
  ];

  function getJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function setJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function broadcast(type, payload) {
    setJSON(KEYS.broadcast, { type, payload, ts: Date.now() });
  }

  function ensureSeedData() {
    if (!localStorage.getItem(KEYS.spots)) setJSON(KEYS.spots, seedSpots);
    if (!localStorage.getItem(KEYS.proof)) setJSON(KEYS.proof, []);
    if (!localStorage.getItem(KEYS.trust)) setJSON(KEYS.trust, {});
    if (!localStorage.getItem(KEYS.queue)) setJSON(KEYS.queue, []);
    if (!localStorage.getItem(KEYS.activity)) {
      setJSON(KEYS.activity, { index: 1, citizen: 1, volunteer: 1, authority: 1, "proof-feed": 1 });
    }
    if (!localStorage.getItem(KEYS.seen)) {
      setJSON(KEYS.seen, { index: 0, citizen: 0, volunteer: 0, authority: 0, "proof-feed": 0 });
    }
    if (!localStorage.getItem(KEYS.points)) setJSON(KEYS.points, 0);
    if (!localStorage.getItem(KEYS.escalations)) setJSON(KEYS.escalations, []);
    if (!localStorage.getItem(KEYS.alertAcks)) setJSON(KEYS.alertAcks, {});
    if (!localStorage.getItem(KEYS.user)) setJSON(KEYS.user, null);
    if (!localStorage.getItem(KEYS.broadcast)) setJSON(KEYS.broadcast, { type: "init", ts: Date.now() });
    if (!localStorage.getItem(KEYS.volunteers)) setJSON(KEYS.volunteers, []);
    if (!localStorage.getItem(KEYS.credits)) setJSON(KEYS.credits, {});
  }

  function trustWeight(reporterTrust) {
    return 0.5 + (reporterTrust - 1) * (1.0 / 9);
  }
  function ageMultiplier(hoursAge) {
    return Math.min(1.0 + Math.floor(hoursAge / 12) * 0.1, 2.0);
  }
  function decayFactor(rainForecast, heatAbove35) {
    return (rainForecast ? 0.2 : 0) + (heatAbove35 ? 0.15 : 0);
  }
  function compositeScore(spot) {
    const comp = (spot.baseSeverity * trustWeight(spot.reporterTrust) * ageMultiplier(spot.hoursAge)) + decayFactor(spot.rainForecast, spot.heatAbove35);
    return Number(comp.toFixed(2));
  }

  function severityFromScore(score) {
    if (score > 0.8) return "High";
    if (score >= 0.4) return "Medium";
    return "Low";
  }

  function colorFromScore(score, status) {
    if (status === "inProgress") return getComputedStyle(document.documentElement).getPropertyValue("--color-blue").trim();
    if (status === "cleaned") return getComputedStyle(document.documentElement).getPropertyValue("--color-grey").trim();
    if (score < 0.4) return getComputedStyle(document.documentElement).getPropertyValue("--color-accent").trim();
    if (score <= 0.8) return getComputedStyle(document.documentElement).getPropertyValue("--color-amber").trim();
    if (score <= 1.4) return getComputedStyle(document.documentElement).getPropertyValue("--color-red").trim();
    return getComputedStyle(document.documentElement).getPropertyValue("--color-purple").trim();
  }

  function diameterFromScore(score) {
    const min = 0.1;
    const max = 1.6;
    const t = Math.max(0, Math.min(1, (score - min) / (max - min)));
    return Math.round(12 + t * (40 - 12));
  }

  function pulseClass(score) {
    if (score > 1.4) return "pulse-critical";
    if (score > 0.8) return "pulse-fast";
    if (score >= 0.4) return "pulse-medium";
    return "pulse-slow";
  }

  function distanceKm(a, b) {
    const R = 6371;
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLng = (b.lng - a.lng) * Math.PI / 180;
    const lat1 = a.lat * Math.PI / 180;
    const lat2 = b.lat * Math.PI / 180;
    const s1 = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
    return 2 * R * Math.atan2(Math.sqrt(s1), Math.sqrt(1 - s1));
  }

  function markActivity(pageNames) {
    const activity = getJSON(KEYS.activity, {});
    pageNames.forEach((p) => activity[p] = (activity[p] || 0) + 1);
    setJSON(KEYS.activity, activity);
  }

  function markSeen(page) {
    const activity = getJSON(KEYS.activity, {});
    const seen = getJSON(KEYS.seen, {});
    seen[page] = activity[page] || 0;
    setJSON(KEYS.seen, seen);
  }

  function showToast(text, cls = "green") {
    const toast = document.createElement("div");
    toast.className = `toast ${cls}`;
    toast.textContent = text;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2800);
  }

  function registerVolunteer(name) {
    const clean = (name || "").trim();
    if (!clean) return;
    const list = getJSON(KEYS.volunteers, []);
    if (!list.includes(clean)) {
      list.unshift(clean);
      setJSON(KEYS.volunteers, list.slice(0, 24));
      broadcast("volunteers:write", { count: list.length });
    }
  }

  function awardCredit(reporterName, amount = 1) {
    const name = (reporterName || "").trim();
    if (!name) return 0;
    const credits = getJSON(KEYS.credits, {});
    credits[name] = (credits[name] || 0) + amount;
    setJSON(KEYS.credits, credits);
    broadcast("credits:write", { reporterName: name, credits: credits[name] });
    return credits[name];
  }

  function getCredits(reporterName) {
    const credits = getJSON(KEYS.credits, {});
    return credits[(reporterName || "").trim()] || 0;
  }

  function queueWrite(item) {
    if (navigator.onLine) return false;
    const queue = getJSON(KEYS.queue, []);
    queue.push(item);
    setJSON(KEYS.queue, queue);
    const badge = document.querySelector("[data-queue-badge]");
    if (badge) badge.hidden = false;
    broadcast("queue:add", { type: item.type });
    return true;
  }

  function createSpotMarker(spot) {
    const score = compositeScore(spot);
    const diameter = diameterFromScore(score);
    const color = colorFromScore(score, spot.status);
    const html = `
      <div style="position:relative;width:${diameter}px;height:${diameter}px;color:${color}">
        <span class="pulse-ring ${pulseClass(score)}"></span>
        <svg width="${diameter}" height="${diameter}" viewBox="0 0 100 100" style="position:relative;z-index:2">
          <circle cx="50" cy="50" r="40" fill="${color}" fill-opacity="0.22" stroke="${color}" stroke-width="10"></circle>
        </svg>
      </div>`;
    return L.divIcon({ html, className: "clean-marker", iconSize: [diameter, diameter], iconAnchor: [diameter / 2, diameter / 2] });
  }

  function popupHTML(spot) {
    const score = compositeScore(spot);
    const sev = severityFromScore(score);
    const badgeClass = sev === "High" ? "badge-high" : sev === "Medium" ? "badge-medium" : "badge-low";
    const verifiedLine = spot.verified ? `<span class="badge badge-low">Verified</span><br>` : `<span class="badge badge-medium">Unverified</span><br>`;
    return `
      <div style="min-width:220px;color:#111">
        <strong>${spot.zoneName}</strong><br>
        Composite Score: <strong>${score}</strong><br>
        <span class="badge ${badgeClass}">${sev}</span><br>
        ${verifiedLine}
        Hours Age: ${spot.hoursAge}<br>
        Reporter: ${spot.reporterName} <span class="badge badge-trust">Trust ${spot.reporterTrust}</span><br>
        Status: ${spot.status}
      </div>
    `;
  }

  function readSpotsWithTrust() {
    const spots = getJSON(KEYS.spots, []);
    const trustMap = getJSON(KEYS.trust, {});
    return spots.map((s) => ({ ...s, reporterTrust: Math.min(10, trustMap[s.reporterName] || s.reporterTrust) }));
  }

  function writeSpots(spots) {
    setJSON(KEYS.spots, spots);
    trackEscalations(spots);
    broadcast("spots:write", { count: spots.length });
  }

  function trackEscalations(spots) {
    const log = getJSON(KEYS.escalations, []);
    const existing = new Set(log.map((l) => l.spotId));
    spots.forEach((spot) => {
      const score = compositeScore(spot);
      if (score > 1.4 && !existing.has(spot.id)) {
        log.push({ spotId: spot.id, zoneName: spot.zoneName, timestamp: Date.now(), status: spot.status, reporterName: spot.reporterName });
      }
    });
    setJSON(KEYS.escalations, log);
  }

  function setupNav(page) {
    const navLinks = document.querySelectorAll(".nav-links a");
    navLinks.forEach((a) => {
      if (a.dataset.page === page) a.classList.add("active");
    });
    const activity = getJSON(KEYS.activity, {});
    const seen = getJSON(KEYS.seen, {});
    navLinks.forEach((a) => {
      const p = a.dataset.page;
      if (p !== page && (activity[p] || 0) > (seen[p] || 0)) {
        const dot = document.createElement("span");
        dot.className = "activity-dot";
        a.appendChild(dot);
      }
    });
    const points = getJSON(KEYS.points, 0);
    const pointsEl = document.getElementById("impactPoints");
    if (pointsEl) pointsEl.textContent = `${points} pts`;
    const user = getJSON(KEYS.user, null);
    const label = document.getElementById("accountLabel");
    if (label) label.textContent = user?.name ? user.name : "Sign in";
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.hidden = !user?.name;
      logoutBtn.onclick = async () => {
        const ok = window.confirm("Logout from TrashCamp?");
        if (!ok) return;
        try {
          if (window.__TRASHCAMP_SIGNOUT__) await window.__TRASHCAMP_SIGNOUT__();
        } catch {}
        setJSON(KEYS.user, null);
        broadcast("user:write", { name: null, role: null });
        window.location.href = "signup.html";
      };
    }
    markSeen(page);
  }

  function currentPage() {
    return document.body.dataset.page || "index";
  }

  function requireUser(returnToUrl) {
    const user = getJSON(KEYS.user, null);
    if (user && user.name) return user;
    const to = encodeURIComponent(returnToUrl || window.location.pathname.split("/").pop() || "index.html");
    window.location.href = `signup.html?returnTo=${to}`;
    return null;
  }

  function roleForPage(page) {
    if (page === "citizen") return "citizen";
    if (page === "volunteer") return "volunteer";
    if (page === "authority" || page === "notify") return "authority";
    return null;
  }

  function animateCount(el, target) {
    if (!el) return;
    let current = 0;
    const step = Math.max(1, Math.round(target / 30));
    const iv = setInterval(() => {
      current += step;
      if (current >= target) {
        el.textContent = String(target);
        clearInterval(iv);
      } else {
        el.textContent = String(current);
      }
    }, 20);
  }

  function renderStats(prefix = "") {
    const spots = readSpotsWithTrust();
    const reported = spots.filter((s) => s.status === "reported").length;
    const inProgress = spots.filter((s) => s.status === "inProgress").length;
    const cleaned = spots.filter((s) => s.status === "cleaned").length;
    ["reported", "inProgress", "cleaned"].forEach((k) => {
      const el = document.getElementById(prefix + k);
      if (el) animateCount(el, ({ reported, inProgress, cleaned })[k]);
    });
    const activeAlertsEl = document.getElementById(prefix + "activeAlerts");
    if (activeAlertsEl) {
      const alerts = detectAnomalyClusters(spots);
      animateCount(activeAlertsEl, alerts.length);
    }
  }

  function initIndex() {
    renderStats("home-");
  }

  function addSpotsToMap(map, spots) {
    const markers = [];
    spots.forEach((spot) => {
      const marker = L.marker([spot.lat, spot.lng], { icon: createSpotMarker(spot) }).addTo(map);
      marker.bindPopup(popupHTML(spot));
      markers.push({ marker, spot });
    });
    return markers;
  }

  function initCitizen() {
    let spots = readSpotsWithTrust();
    const map = L.map("citizenMap").setView([12.8231, 80.0444], 14);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
    let markers = addSpotsToMap(map, spots);
    let selected = null;
    let pinMarker = null;
    map.on("click", (e) => {
      selected = e.latlng;
      if (pinMarker) pinMarker.remove();
      pinMarker = L.marker(selected).addTo(map);
    });

    const gpsBtn = document.getElementById("gpsBtn");
    gpsBtn.addEventListener("click", () => {
      navigator.geolocation.getCurrentPosition((pos) => {
        selected = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (pinMarker) pinMarker.remove();
        pinMarker = L.marker([selected.lat, selected.lng]).addTo(map);
        map.setView([selected.lat, selected.lng], 15);
      });
    });

    const cameraBtn = document.getElementById("cameraBtn");
    const cameraPanel = document.getElementById("cameraPanel");
    const cameraPreview = document.getElementById("cameraPreview");
    const cameraCanvas = document.getElementById("cameraCanvas");
    const captureBtn = document.getElementById("captureBtn");
    const retakeBtn = document.getElementById("retakeBtn");
    const closeCameraBtn = document.getElementById("closeCameraBtn");
    let cameraStream = null;

    let selectedSeverity = null;
    document.querySelectorAll(".icon-severity").forEach((btn) => {
      btn.addEventListener("click", () => selectedSeverity = btn.dataset.severity);
    });
    const photoInput = document.getElementById("reportPhoto");
    const aiBadge = document.getElementById("aiSeverity");
    let photoName = "no_photo.png";
    let capturedBlob = null;

    function setSeverityFromBytes(bytes) {
      const kb = bytes / 1024;
      let sev = "Low";
      if (kb > 1536) sev = "High";
      else if (kb >= 500) sev = "Medium";
      aiBadge.textContent = `AI suggested: ${sev}`;
      aiBadge.classList.add("fade-in");
      aiBadge.hidden = false;
      if (!selectedSeverity) selectedSeverity = sev;
    }

    photoInput.addEventListener("change", () => {
      const file = photoInput.files[0];
      if (!file) return;
      photoName = file.name;
      capturedBlob = null;
      setSeverityFromBytes(file.size);
    });

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        showToast("Camera not supported. Use file upload.", "amber");
        return;
      }
      try {
        cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        cameraPreview.srcObject = cameraStream;
        cameraPanel.style.display = "block";
      } catch {
        showToast("Camera permission denied. Use upload instead.", "amber");
      }
    }

    function stopCamera() {
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
        cameraStream = null;
      }
      if (cameraPreview) cameraPreview.srcObject = null;
      if (cameraPanel) cameraPanel.style.display = "none";
    }

    if (cameraBtn) cameraBtn.addEventListener("click", startCamera);
    if (closeCameraBtn) closeCameraBtn.addEventListener("click", stopCamera);
    if (retakeBtn) retakeBtn.addEventListener("click", async () => {
      capturedBlob = null;
      await startCamera();
    });
    if (captureBtn) captureBtn.addEventListener("click", () => {
      if (!cameraPreview?.videoWidth || !cameraPreview?.videoHeight) return;
      cameraCanvas.width = cameraPreview.videoWidth;
      cameraCanvas.height = cameraPreview.videoHeight;
      const ctx = cameraCanvas.getContext("2d");
      ctx.drawImage(cameraPreview, 0, 0, cameraCanvas.width, cameraCanvas.height);
      cameraCanvas.toBlob((blob) => {
        if (!blob) return;
        capturedBlob = blob;
        photoName = `camera_${Date.now()}.jpg`;
        setSeverityFromBytes(blob.size);
        showToast("Photo captured from live camera.");
        stopCamera();
      }, "image/jpeg", 0.92);
    });

    const form = document.getElementById("citizenForm");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const user = requireUser("citizen.html");
      if (!user) return;
      if (!selected) return showToast("Set location from map click or GPS.", "amber");
      const name = (document.getElementById("reporterName").value.trim() || user.name || "Anonymous");
      const zoneName = (document.getElementById("zoneName")?.value || "").trim() || "Citizen Submitted Zone";
      const notes = (document.getElementById("reportNotes")?.value || "").trim();
      const sev = selectedSeverity || "Low";
      const base = sev === "High" ? 0.9 : sev === "Medium" ? 0.6 : 0.3;
      const spot = {
        id: "s" + Date.now(),
        lat: selected.lat,
        lng: selected.lng,
        reporterName: name,
        reporterTrust: 5,
        baseSeverity: base,
        hoursAge: 1,
        rainForecast: Math.random() > 0.5,
        heatAbove35: Math.random() > 0.45,
        status: "reported",
        reportPhotoName: photoName,
        cleanupPhotoName: "",
        timestamp: Date.now(),
        volunteerName: "",
        zoneName,
        notes,
        verified: false,
        verifiedBy: "",
        verifiedAt: 0
      };
      if (queueWrite({ type: "report", payload: spot })) {
        showToast("Queued — will sync when back online.", "amber");
        return;
      }
      spots = readSpotsWithTrust();
      spots.push(spot);
      writeSpots(spots);
      markActivity(["index", "volunteer", "authority", "citizen"]);
      showToast("Spot reported — sent to volunteers for verification.");
      markers.forEach((m) => m.marker.remove());
      markers = addSpotsToMap(map, spots);
      location.hash = "#confirmation";
      const confirmMap = L.map("confirmMap").setView([spot.lat, spot.lng], 15);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(confirmMap);
      addSpotsToMap(confirmMap, spots);
      setTimeout(() => confirmMap.invalidateSize(), 150);

      renderVolunteerDispatch(name, spot);
      stopCamera();
    });

    function renderVolunteerDispatch(reporterName, spot) {
      const root = document.getElementById("volunteerCheckList");
      if (!root) return;
      const vols = getJSON(KEYS.volunteers, []);
      const pick = (vols.length ? vols : ["Asha", "Naveen", "Field Team"]).slice(0, 6);
      root.innerHTML = "";
      pick.forEach((v) => {
        const card = document.createElement("div");
        card.className = "route-stop-card";
        card.innerHTML = `<strong>${v}</strong><br><span class="muted">Assigned to verify: ${spot.zoneName}</span>`;
        root.appendChild(card);
      });
      const credits = getCredits(reporterName);
      const note = document.createElement("div");
      note.className = "route-stop-card";
      note.innerHTML = `<strong>Your credits</strong><br><span class="muted">${credits} credits (earn +1 when verified)</span>`;
      root.appendChild(note);
    }

    window.addEventListener("storage", (ev) => {
      if (ev.key !== KEYS.spots && ev.key !== KEYS.broadcast) return;
      spots = readSpotsWithTrust();
      markers.forEach((m) => m.marker.remove());
      markers = addSpotsToMap(map, spots);
    });
  }

  function initVolunteer() {
    let spots = readSpotsWithTrust();
    const map = L.map("volunteerMap").setView([12.8231, 80.0444], 14);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
    let markers = addSpotsToMap(map, spots);
    let start = null;
    let startMarker = null;
    let routeLine = null;
    const claimedLocal = [];
    map.on("click", (e) => {
      start = { lat: e.latlng.lat, lng: e.latlng.lng };
      if (startMarker) startMarker.remove();
      startMarker = L.marker([start.lat, start.lng]).addTo(map).bindPopup("Starting point").openPopup();
    });

    function refreshMap() {
      markers.forEach((m) => m.marker.remove());
      spots = readSpotsWithTrust();
      markers = addSpotsToMap(map, spots);
    }

    document.getElementById("generateRouteBtn").addEventListener("click", () => {
      const name = document.getElementById("volunteerName").value.trim();
      if (!name || !start) return showToast("Enter name and click start location on map.", "amber");
      registerVolunteer(name);
      const pool = spots.filter((s) => s.status === "reported")
        .map((s) => ({ ...s, score: compositeScore(s), dist: distanceKm(start, s) }))
        .filter((s) => s.dist <= 2)
        .filter((s) => s.verified === true)
        .sort((a, b) => b.score - a.score)
        .slice(0, 4);
      const routeList = document.getElementById("routeList");
      routeList.innerHTML = "";
      if (routeLine) routeLine.remove();
      if (!pool.length) return;
      routeLine = L.polyline([[start.lat, start.lng], ...pool.map((p) => [p.lat, p.lng])], { color: "#2ecc71" }).addTo(map);
      const points = [start, ...pool];
      pool.forEach((p, i) => {
        const prev = points[i];
        const dist = distanceKm(prev, p).toFixed(2);
        const card = document.createElement("div");
        card.className = "route-stop-card";
        card.innerHTML = `<strong>${i + 1}. ${p.zoneName}</strong><br>Composite: <strong>${p.score}</strong> <span class="badge ${severityFromScore(p.score) === "High" ? "badge-high" : severityFromScore(p.score) === "Medium" ? "badge-medium" : "badge-low"}">${severityFromScore(p.score)}</span><br>Distance: ${dist} km<br><button data-claim="${p.id}">Claim this spot</button><div data-clean-wrap="${p.id}"></div>`;
        routeList.appendChild(card);
      });

      routeList.querySelectorAll("[data-claim]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const user = requireUser("volunteer.html");
          if (!user) return;
          const id = btn.dataset.claim;
          const all = readSpotsWithTrust();
          const idx = all.findIndex((s) => s.id === id);
          if (idx < 0) return;
          all[idx].status = "inProgress";
          all[idx].volunteerName = name;
          if (queueWrite({ type: "claim", payload: { id, volunteerName: name } })) return showToast("Queued — will sync when back online.", "amber");
          writeSpots(all);
          markActivity(["index", "citizen", "authority", "volunteer"]);
          btn.outerHTML = `<span class="badge badge-medium">Claimed — head there now</span> <button data-mark="${id}">Mark as cleaned</button>`;
          refreshMap();
          const markBtn = routeList.querySelector(`[data-mark="${id}"]`);
          markBtn.addEventListener("click", () => {
            const wrap = routeList.querySelector(`[data-clean-wrap="${id}"]`);
            wrap.innerHTML = `<input type="file" data-after="${id}" accept="image/*" capture="environment"><button data-submit-clean="${id}">Submit proof photo</button>`;
            const submit = routeList.querySelector(`[data-submit-clean="${id}"]`);
            submit.addEventListener("click", () => {
              const fileInput = routeList.querySelector(`[data-after="${id}"]`);
              const file = fileInput.files[0];
              if (!file) return showToast("Upload cleanup photo.", "amber");
              if (queueWrite({ type: "clean", payload: { id, fileName: file.name, volunteerName: name } })) return showToast("Queued — will sync when back online.", "amber");
              const now = readSpotsWithTrust();
              const j = now.findIndex((s) => s.id === id);
              now[j].status = "cleaned";
              now[j].cleanupPhotoName = file.name;
              now[j].volunteerName = name;
              writeSpots(now);
              const proof = getJSON(KEYS.proof, []);
              proof.push({
                spotId: id,
                zoneName: now[j].zoneName,
                beforePhotoName: now[j].reportPhotoName,
                afterPhotoName: file.name,
                volunteerName: name,
                timestamp: Date.now(),
                score: compositeScore(now[j]),
                hoursAge: now[j].hoursAge
              });
              setJSON(KEYS.proof, proof);
              broadcast("proof:add", { spotId: id });
              const pts = getJSON(KEYS.points, 0) + 10;
              setJSON(KEYS.points, pts);
              broadcast("points:write", { points: pts });
              applyTrustBoost(now[j].reporterName);
              claimedLocal.push(now[j]);
              renderMyCleaned(claimedLocal);
              markActivity(["index", "citizen", "authority", "proof-feed", "volunteer"]);
              showToast("Spot cleaned and proof published.");
              refreshMap();
              setupNav("volunteer");
            });
          });
        });
      });
    });

    function renderVerifyQueue() {
      const root = document.getElementById("verifyList");
      if (!root) return;
      const user = getJSON(KEYS.user, null);
      const me = user?.name || "";
      const list = readSpotsWithTrust()
        .filter((s) => s.status === "reported" && s.verified !== true)
        .map((s) => ({ ...s, score: compositeScore(s) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);
      root.innerHTML = "";
      if (!list.length) {
        const empty = document.createElement("div");
        empty.className = "route-stop-card";
        empty.innerHTML = `<strong>No reports waiting</strong><br><span class="muted">New reports will appear here for verification.</span>`;
        root.appendChild(empty);
        return;
      }
      list.forEach((s) => {
        const card = document.createElement("div");
        card.className = "route-stop-card";
        card.innerHTML = `<strong>${s.zoneName}</strong><br>
          Composite: <strong>${s.score}</strong> <span class="badge ${severityFromScore(s.score) === "High" ? "badge-high" : severityFromScore(s.score) === "Medium" ? "badge-medium" : "badge-low"}">${severityFromScore(s.score)}</span><br>
          Reporter: ${s.reporterName}<br>
          <button data-verify="${s.id}" class="btn-accent" type="button">Verify (on-ground)</button>
          <button data-reject="${s.id}" type="button">Reject</button>`;
        root.appendChild(card);
      });

      root.querySelectorAll("[data-verify]").forEach((btn) => btn.addEventListener("click", () => {
        const userNow = requireUser("volunteer.html");
        if (!userNow) return;
        const id = btn.dataset.verify;
        const all = readSpotsWithTrust();
        const i = all.findIndex((x) => x.id === id);
        if (i < 0) return;
        all[i].verified = true;
        all[i].verifiedBy = userNow.name;
        all[i].verifiedAt = Date.now();
        if (queueWrite({ type: "verify", payload: { id, verifiedBy: userNow.name } })) return showToast("Queued — will sync when back online.", "amber");
        writeSpots(all);
        const total = awardCredit(all[i].reporterName, 1);
        markActivity(["citizen", "volunteer", "authority", "index"]);
        showToast(`Verified. Reporter credited (+1). Total: ${total} credits.`);
        refreshMap();
        renderVerifyQueue();
      }));

      root.querySelectorAll("[data-reject]").forEach((btn) => btn.addEventListener("click", () => {
        const userNow = requireUser("volunteer.html");
        if (!userNow) return;
        const id = btn.dataset.reject;
        const all = readSpotsWithTrust();
        const i = all.findIndex((x) => x.id === id);
        if (i < 0) return;
        all[i].status = "reported";
        all[i].verified = false;
        all[i].verifiedBy = userNow.name;
        all[i].verifiedAt = Date.now();
        if (queueWrite({ type: "reject", payload: { id, rejectedBy: userNow.name } })) return showToast("Queued — will sync when back online.", "amber");
        writeSpots(all);
        markActivity(["citizen", "volunteer", "authority", "index"]);
        showToast("Rejected report (kept on map as unverified).", "amber");
        refreshMap();
        renderVerifyQueue();
      }));
    }

    renderVerifyQueue();
    window.addEventListener("storage", (ev) => {
      if (ev.key !== KEYS.spots && ev.key !== KEYS.broadcast && ev.key !== KEYS.points) return;
      refreshMap();
      renderVerifyQueue();
      setupNav("volunteer");
    });
  }

  function renderMyCleaned(list) {
    const root = document.getElementById("myCleanedList");
    if (!root) return;
    root.innerHTML = "";
    list.forEach((s) => {
      const c = document.createElement("div");
      c.className = "cleaned-card";
      c.textContent = `${s.zoneName} — cleaned`;
      root.appendChild(c);
    });
  }

  function applyTrustBoost(reporterName) {
    const trust = getJSON(KEYS.trust, {});
    trust[reporterName] = Math.min(10, (trust[reporterName] || 5) + 1);
    setJSON(KEYS.trust, trust);
    broadcast("trust:write", { reporterName, trust: trust[reporterName] });
    const spots = readSpotsWithTrust().map((s) => {
      if (s.reporterName === reporterName && s.status !== "cleaned") {
        s.reporterTrust = trust[reporterName];
      }
      return s;
    });
    writeSpots(spots);
  }

  function detectAnomalyClusters(spots) {
    const high = spots.filter((s) => compositeScore(s) > 0.8);
    const used = new Set();
    const groups = [];
    for (let i = 0; i < high.length; i++) {
      if (used.has(high[i].id)) continue;
      const g = [high[i]];
      used.add(high[i].id);
      for (let j = i + 1; j < high.length; j++) {
        if (distanceKm(high[i], high[j]) <= 0.2) {
          g.push(high[j]);
          used.add(high[j].id);
        }
      }
      if (g.length >= 2) groups.push(g);
    }
    return groups;
  }

  function initAuthority() {
    let spots = readSpotsWithTrust();
    const map = L.map("authorityMap").setView([12.8231, 80.0444], 14);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
    let markers = addSpotsToMap(map, spots);
    const heat = [];
    const polygons = [];

    function renderHeatAndAlerts() {
      heat.forEach((c) => c.remove());
      polygons.forEach((p) => p.remove());
      const list = document.getElementById("alertList");
      list.innerHTML = "";
      spots.forEach((s) => {
        const score = compositeScore(s);
        const col = colorFromScore(score, "reported");
        const circle = L.circle([s.lat, s.lng], { radius: 45 + score * 40, color: col, fillColor: col, fillOpacity: 0.15, weight: 0 }).addTo(map);
        heat.push(circle);
      });
      const groups = detectAnomalyClusters(spots);
      const acks = getJSON(KEYS.alertAcks, {});
      groups.forEach((g, i) => {
        const alertId = g.map((s) => s.id).sort().join("_");
        if (acks[alertId]) return;
        const lat = g.reduce((a, b) => a + b.lat, 0) / g.length;
        const lng = g.reduce((a, b) => a + b.lng, 0) / g.length;
        const avg = g.reduce((a, b) => a + compositeScore(b), 0) / g.length;
        const poly = L.polygon(g.map((s) => [s.lat, s.lng]), { color: "#ff3b30", dashArray: "4 4", fillOpacity: 0.08 }).addTo(map);
        polygons.push(poly);
        const card = document.createElement("div");
        card.className = "zone-alert-card";
        card.innerHTML = `<strong>Zone Alert ${i + 1}</strong><br>Centroid: ${lat.toFixed(4)}, ${lng.toFixed(4)}<br>Spots: ${g.length}<br>Avg composite: ${avg.toFixed(2)}<br>Zone: ${g[0].zoneName}<br><button data-ack="${alertId}">Notify field team</button>`;
        list.appendChild(card);
      });
      list.querySelectorAll("[data-ack]").forEach((btn) => btn.addEventListener("click", () => {
        const id = btn.dataset.ack;
        const ackMap = getJSON(KEYS.alertAcks, {});
        ackMap[id] = Date.now();
        setJSON(KEYS.alertAcks, ackMap);
        broadcast("alerts:ack", { id });
        const g = groups.find((gg) => gg.map((s) => s.id).sort().join("_") === id);
        if (g) {
          const lat = g.reduce((a, b) => a + b.lat, 0) / g.length;
          const lng = g.reduce((a, b) => a + b.lng, 0) / g.length;
          window.location.href = `notify.html?lat=${lat.toFixed(6)}&lng=${lng.toFixed(6)}&zone=${encodeURIComponent(g[0].zoneName)}&spots=${g.length}`;
        } else {
          btn.closest(".zone-alert-card").remove();
        }
      }));
      renderStats("auth-");
    }

    renderHeatAndAlerts();
    setInterval(() => {
      spots = readSpotsWithTrust();
      renderHeatAndAlerts();
    }, 30000);

    document.getElementById("simulateBtn").addEventListener("click", () => {
      const oldScores = new Map(spots.map((s) => [s.id, compositeScore(s)]));
      spots = spots.map((s) => ({ ...s, hoursAge: s.hoursAge + 12 }));
      if (queueWrite({ type: "simulate12h" })) return showToast("Queued — will sync when back online.", "amber");
      writeSpots(spots);
      markers.forEach((m) => m.marker.remove());
      markers = addSpotsToMap(map, spots);
      renderHeatAndAlerts();
      const changes = spots
        .map((s) => ({ zone: s.zoneName, old: oldScores.get(s.id), now: compositeScore(s) }))
        .filter((x) => (x.old < 0.4 && x.now >= 0.4) || (x.old < 0.8 && x.now >= 0.8) || (x.old <= 1.4 && x.now > 1.4));
      if (changes.length) {
        const panel = document.getElementById("severityPanel");
        panel.hidden = false;
        panel.innerHTML = `<h4>Tier changes</h4>${changes.map((c) => `<p>${c.zone}: ${c.old} → <strong>${c.now}</strong></p>`).join("")}`;
      }
      markActivity(["index", "citizen", "volunteer", "authority"]);
      showToast("12h simulated and maps updated.");
    });

    const esc = getJSON(KEYS.escalations, []);
    const tbody = document.getElementById("escalationBody");
    tbody.innerHTML = "";
    esc.forEach((r) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${r.zoneName}</td><td>${new Date(r.timestamp).toLocaleString()}</td><td>${r.status}</td><td>${r.reporterName}</td>`;
      tbody.appendChild(tr);
    });

    window.addEventListener("storage", (ev) => {
      if (ev.key !== KEYS.spots && ev.key !== KEYS.broadcast) return;
      spots = readSpotsWithTrust();
      markers.forEach((m) => m.marker.remove());
      markers = addSpotsToMap(map, spots);
      renderHeatAndAlerts();
    });
  }

  function initProofFeed() {
    let proof = getJSON(KEYS.proof, []).sort((a, b) => b.timestamp - a.timestamp);
    const sevFilter = document.getElementById("severityFilter");
    const timeFilter = document.getElementById("timeFilter");
    const countEl = document.getElementById("proofCount");
    const grid = document.getElementById("proofGrid");
    const empty = document.getElementById("proofEmpty");

    function render() {
      proof = getJSON(KEYS.proof, []).sort((a, b) => b.timestamp - a.timestamp);
      const sev = sevFilter.value;
      const time = timeFilter.value;
      const now = Date.now();
      const items = proof.filter((p) => {
        const sLabel = severityFromScore(p.score);
        const sevOk = sev === "All" || sev === sLabel;
        const ageH = (now - p.timestamp) / 3600000;
        const timeOk = time === "all" || (time === "24h" && ageH <= 24) || (time === "7d" && ageH <= 168);
        return sevOk && timeOk;
      });
      const kg = items.reduce((a, b) => a + b.hoursAge * 0.5, 0).toFixed(1);
      countEl.textContent = `${items.length} spots cleaned. ${kg} kg of waste removed.`;
      grid.innerHTML = "";
      if (!items.length) {
        empty.hidden = false;
        return;
      }
      empty.hidden = true;
      items.forEach((p) => {
        const c = document.createElement("article");
        c.className = "proof-card" + ((Date.now() - p.timestamp < 86400000) ? " recent" : "");
        c.innerHTML = `<h4 style="margin:0;font-size:16px;letter-spacing:0.13em;text-transform:uppercase">${p.zoneName}</h4>
          <div class="before-after">
            <div class="shot before"><div><strong>Before</strong><br>${p.beforePhotoName}</div></div>
            <div class="shot after"><div><strong>After</strong><br>${p.afterPhotoName}</div></div>
          </div>
          <small style="color:#aaa">${p.volunteerName} • ${new Date(p.timestamp).toLocaleString()}</small>`;
        grid.appendChild(c);
      });
    }
    sevFilter.addEventListener("change", render);
    timeFilter.addEventListener("change", render);
    render();

    window.addEventListener("storage", (ev) => {
      if (ev.key !== KEYS.proof && ev.key !== KEYS.broadcast) return;
      render();
    });
  }

  function initSignup() {
    if (document.body.dataset.authProvider === "firebase") return;
    const params = new URLSearchParams(window.location.search);
    const returnTo = params.get("returnTo") || "index.html";

    const googleBtn = document.getElementById("googleBtn");
    const localBtn = document.getElementById("localBtn");
    const signOutBtn = document.getElementById("signOutBtn");

    function signIn(profile) {
      setJSON(KEYS.user, profile);
      broadcast("user:write", { name: profile.name });
      showToast(`Signed in as ${profile.name}`);
      window.location.href = returnTo;
    }

    if (googleBtn) googleBtn.addEventListener("click", () => {
      signIn({ provider: "google-demo", name: "Google User", email: "user@gmail.com", ts: Date.now() });
    });
    if (localBtn) localBtn.addEventListener("click", () => {
      const name = (document.getElementById("nameInput").value || "").trim() || "Citizen";
      const email = (document.getElementById("emailInput").value || "").trim() || "user@example.com";
      signIn({ provider: "local", name, email, ts: Date.now() });
    });
    if (signOutBtn) signOutBtn.addEventListener("click", () => {
      setJSON(KEYS.user, null);
      broadcast("user:write", { name: null });
      showToast("Signed out.", "amber");
    });
  }

  function initNotify() {
    const params = new URLSearchParams(window.location.search);
    const lat = Number(params.get("lat") || "12.8231");
    const lng = Number(params.get("lng") || "80.0444");
    const zone = params.get("zone") || "SRM / Potheri";
    const spots = params.get("spots") || "—";

    const meta = document.getElementById("incidentMeta");
    const box = document.getElementById("incidentText");
    const mapsLink = document.getElementById("mapsLink");
    const copyBtn = document.getElementById("copyBtn");

    if (meta) meta.textContent = `Zone: ${zone} • Cluster spots: ${spots} • Centroid: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    const text = [
      `TRASHCAMP ALERT`,
      `Zone: ${zone}`,
      `Cluster spots: ${spots}`,
      `Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      `Action: Please dispatch field team for cleanup + enforcement check.`,
      `Source: TrashCamp authority dashboard`
    ].join("\n");
    if (box) box.value = text;
    if (mapsLink) mapsLink.href = `https://www.google.com/maps?q=${lat},${lng}`;
    if (copyBtn) copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(box.value);
        showToast("Copied incident message.");
      } catch {
        showToast("Copy failed. Select and copy manually.", "amber");
      }
    });
  }

  function processQueuedItem(item) {
    if (item.type === "report") {
      const spots = readSpotsWithTrust();
      spots.push(item.payload);
      writeSpots(spots);
      return 1;
    }
    if (item.type === "claim") {
      const spots = readSpotsWithTrust();
      const i = spots.findIndex((s) => s.id === item.payload.id);
      if (i >= 0) {
        spots[i].status = "inProgress";
        spots[i].volunteerName = item.payload.volunteerName;
        writeSpots(spots);
      }
      return 1;
    }
    if (item.type === "clean") {
      const spots = readSpotsWithTrust();
      const i = spots.findIndex((s) => s.id === item.payload.id);
      if (i >= 0) {
        spots[i].status = "cleaned";
        spots[i].cleanupPhotoName = item.payload.fileName;
        spots[i].volunteerName = item.payload.volunteerName;
        writeSpots(spots);
      }
      return 1;
    }
    if (item.type === "simulate12h") {
      const spots = readSpotsWithTrust().map((s) => ({ ...s, hoursAge: s.hoursAge + 12 }));
      writeSpots(spots);
      return 1;
    }
    if (item.type === "verify") {
      const spots = readSpotsWithTrust();
      const i = spots.findIndex((s) => s.id === item.payload.id);
      if (i >= 0) {
        spots[i].verified = true;
        spots[i].verifiedBy = item.payload.verifiedBy;
        spots[i].verifiedAt = Date.now();
        writeSpots(spots);
        awardCredit(spots[i].reporterName, 1);
      }
      return 1;
    }
    if (item.type === "reject") {
      const spots = readSpotsWithTrust();
      const i = spots.findIndex((s) => s.id === item.payload.id);
      if (i >= 0) {
        spots[i].verified = false;
        spots[i].verifiedBy = item.payload.rejectedBy;
        spots[i].verifiedAt = Date.now();
        writeSpots(spots);
      }
      return 1;
    }
    return 0;
  }

  function setupQueueSync() {
    window.addEventListener("online", () => {
      const queue = getJSON(KEYS.queue, []);
      if (!queue.length) return;
      let count = 0;
      queue.forEach((q) => count += processQueuedItem(q));
      setJSON(KEYS.queue, []);
      markActivity(PAGE_KEYS);
      showToast(`${count} reports synced from queue.`, "green");
      const badge = document.querySelector("[data-queue-badge]");
      if (badge) badge.hidden = true;
    });
  }

  function init() {
    ensureSeedData();
    setupQueueSync();
    const page = document.body.dataset.page || "index";
    const protectedPages = ["index", "citizen", "volunteer", "authority", "proof-feed", "notify"];
    const user = getJSON(KEYS.user, null);
    if (protectedPages.includes(page) && !user?.name) {
      const to = encodeURIComponent(window.location.pathname.split("/").pop() || "index.html");
      const requiredRole = roleForPage(page);
      window.location.href = `signup.html?returnTo=${to}${requiredRole ? `&requiredRole=${encodeURIComponent(requiredRole)}` : ""}`;
      return;
    }
    const requiredRole = roleForPage(page);
    if (protectedPages.includes(page) && requiredRole && user?.role !== requiredRole) {
      const to = encodeURIComponent(window.location.pathname.split("/").pop() || "index.html");
      window.location.href = `signup.html?returnTo=${to}&requiredRole=${encodeURIComponent(requiredRole)}`;
      return;
    }
    setupNav(page);
    const queue = getJSON(KEYS.queue, []);
    const badge = document.querySelector("[data-queue-badge]");
    if (badge) badge.hidden = !queue.length;
    if (page === "index") initIndex();
    if (page === "citizen") initCitizen();
    if (page === "volunteer") initVolunteer();
    if (page === "authority") initAuthority();
    if (page === "proof-feed") initProofFeed();
    if (page === "signup") initSignup();
    if (page === "notify") initNotify();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
