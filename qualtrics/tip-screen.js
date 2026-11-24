/* =====================================================================
   Tipping Point — Square-style CHECKOUT (page 2 of 2) for Qualtrics
   ---------------------------------------------------------------------
   WHERE THIS GOES: In the tip question, click the gear (Question
   behavior) > JavaScript, delete everything in the box, and paste
   this whole file.

   WHAT IT DOES
   - Builds the tip screen inside the question (no images or outside fonts)
   - Reads the condition from the embedded data field "condition"
     (C1–C4). If it's empty (e.g., during a preview), it uses TEST_CONDITION.
   - Shows the check total ($24.98) under "Add a tip?" + subtotal note.
   - Hides the Next button. Flow (Square's tip-before-payment order):
     Add a tip? -> Tap card to pay -> Approved + receipt -> Done (next page).
     The tip is saved the moment it's tapped.
   - "Custom" opens a dollar keypad (like Square: digits fill from the cents).

   DATA SAVED (each must be declared in Survey Flow > Embedded Data first)
   condition      C1 / C2 / C3 / C4
   tip_choice     preset_1 / preset_2 / preset_3 / custom / none
   tip_percent    tip as % of the pre-tax subtotal ($22.60), e.g. 25 or 15.49
   tip_amount     tip in dollars, e.g. 5.65
   custom_opened  1 if they ever opened the custom keypad, else 0
   decision_ms    milliseconds from screen appearing to final choice
   ===================================================================== */

Qualtrics.SurveyEngine.addOnload(function () {
  var q = this;
  // ---------- Scene photo (same layout in every condition; only the photo changes) ----------
  var SCENES = {
    counter: "https://uwashington.qualtrics.com/ControlPanel/Graphic.php?IM=IM_chCQClsbTgyeNfU",
    sitdown: "https://uwashington.qualtrics.com/ControlPanel/Graphic.php?IM=IM_6qB3StlKbskQQhv"
  };
  var svc = "${e://Field/service}";
  if (svc !== "counter" && svc !== "sitdown") {
    var cnd = "${e://Field/condition}";
    svc = (cnd === "C1" || cnd === "C2") ? "counter" : "sitdown";   // preview fallback
  }

  // ---------- Settings ----------
  var TEST_CONDITION = "C4";        // used only if "condition" is empty
  // Check (Seattle lunch). Must match the order on page 1 (check-screen.js).
  var SUBTOTAL = 22.60;             // Roasted turkey sandwich + side salad $16.75 + Iced latte $5.85
  var TAX_RATE = 10.55;             // Seattle combined sales tax, Q4 2026
  var TAX = Math.round(SUBTOTAL * TAX_RATE) / 100;   // $2.38
  var CHECK_TOTAL = Math.round((SUBTOTAL + TAX) * 100) / 100;  // $24.98
  // Suggested tips are calculated on the pre-tax subtotal (Square-style).
  var MAX_CUSTOM = 25.00;           // highest custom tip allowed
  var DEFAULTS = {
    low:  [10, 15, 20],             // C1 (counter) and C3 (sit-down)
    high: [20, 25, 30]              // C2 (counter) and C4 (sit-down)
  };
  var LABELS = { custom: "Custom", none: "No tip", heading: "Add a tip?" };
  var MERCHANT = "Corner Kitchen";  // shown at the top; same in every condition

  // ---------- Condition ----------
  var condition = "${e://Field/condition}";
  if (!/^C[1-4]$/.test(condition)) { condition = TEST_CONDITION; }
  var level = (condition === "C1" || condition === "C3") ? "low" : "high";
  var presets = DEFAULTS[level];

  // ---------- Styles (Figma tokens: Tip UI collection) ----------
  var css = [
    ".tp{--blue:#3E3EF4;--blue-pressed:#2A2AC4;--blue-subtle:#ECECFE;--text:#1A1A1A;--muted:#6B6B70;--key:#F4F4F5;",
    "font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;",
    "width:100%;max-width:720px;margin:16px 0 0;background:#18181B;padding:14px;border-radius:28px;box-sizing:border-box;",
    "box-shadow:0 12px 32px rgba(0,0,0,.18)}",
    ".tp *{box-sizing:border-box}",
    ".tp-screen{background:#fff;color:var(--text);border-radius:14px;padding:40px 32px 28px;text-align:center}",
    ".tp h2{font-size:32px;font-weight:400;margin:0 0 24px;letter-spacing:-.01em;color:var(--text);line-height:1.2}",
    ".tp-presets{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}",
    ".tp-btn{appearance:none;-webkit-appearance:none;border:0;border-radius:2px;cursor:pointer;font:inherit;width:100%;margin:0;box-shadow:none;text-transform:none;-webkit-tap-highlight-color:transparent;touch-action:manipulation}",
    ".tp-preset{background:var(--blue);color:#fff;min-height:132px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:8px}",
    ".tp-preset .pct{font-size:40px;font-weight:400;letter-spacing:-.01em;line-height:1.1}",
    ".tp-preset .amt{font-size:18px;opacity:.85}",
    ".tp-preset:active,.tp-preset.is-pressed{background:var(--blue-pressed)}",
    ".tp-secondary{background:var(--blue-subtle);color:var(--blue);font-size:18px;font-weight:500;height:56px;margin-top:12px}",
    ".tp-secondary:active{filter:brightness(.95)}",
    ".tp-primary{background:var(--blue);color:#fff;font-size:18px;font-weight:500;height:56px;margin-top:12px}",
    ".tp-primary:disabled{opacity:.35;cursor:default}",
    ".tp-lang{margin-top:32px;font-size:16px;display:inline-flex;align-items:center;gap:6px;color:var(--text)}",
    ".tp-lang svg{width:18px;height:18px;flex:none}",
    ".tp-lang svg *{fill:none !important;stroke:currentColor !important}",
    ".tp-merchant{display:flex;flex-direction:column;align-items:center;gap:8px;margin:0 0 20px}",
    ".tp-logo{width:48px;height:48px;border-radius:50%;background:#1A1A1A;display:flex;align-items:center;justify-content:center}",
    ".tp-logo svg{width:28px;height:28px;display:block}",
    ".tp-logo svg *{fill:none !important;stroke:#fff !important}",
    ".tp-mname{font-size:16px;font-weight:600;color:var(--text);line-height:1.2}",
    ".tp-mtag{font-size:10px;font-weight:600;letter-spacing:.22em;color:#8A6F62;text-transform:uppercase;margin-top:-4px}",
    ".tp-total{font-size:20px;font-weight:600;color:var(--text);margin:-16px 0 4px}",
    ".tp-note{font-size:14px;color:var(--muted);margin:0 0 20px}",
    ".tp-done-icon{width:64px;height:64px;border-radius:50%;background:var(--blue);display:flex;align-items:center;justify-content:center;margin:8px auto 16px}",
    ".tp-done-icon svg{width:32px;height:32px;display:block}",
    ".tp-done-icon svg *{fill:none !important;stroke:#fff !important}",
    ".tp-receipt{max-width:360px;margin:20px auto 8px;text-align:left;font-size:17px;color:var(--text)}",
    ".tp-row{display:flex;justify-content:space-between;padding:8px 0}",
    ".tp-row.total{border-top:1px solid #D6D6DA;margin-top:4px;padding-top:12px;font-weight:600;font-size:20px}",
    ".tp-row .muted{color:var(--muted)}",
    ".tp-pay-icon{width:96px;height:96px;margin:4px auto 8px;display:block}",
    ".tp-pay-icon *{fill:none !important;stroke:var(--blue) !important}",
    ".tp-pay-total{font-size:44px;font-weight:700;margin:4px 0 20px;color:var(--text)}",
    ".tp-sub{color:var(--muted);font-size:16px;margin:0 0 12px}",
    ".tp-custom h2{margin-bottom:8px}",
    ".tp-amount{font-size:48px;font-weight:700;margin:0 0 4px;color:var(--text)}",
    ".tp-err{color:#C0362C;font-size:14px;min-height:20px;margin:0 0 12px}",
    ".tp-keys{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;max-width:360px;margin:0 auto}",
    ".tp-key{background:var(--key);color:var(--text);font-size:26px;height:60px}",
    ".tp-key:active{filter:brightness(.93)}",
    ".tp-key.blank{visibility:hidden}",
    ".tp-actions{max-width:360px;margin:0 auto}",
    ".tp-row span:last-child{white-space:nowrap;padding-left:12px;flex:none}",
    ".tp .tp-btn:hover,.tp .tp-btn:focus{box-shadow:none !important;border:0 !important}",
    ".tp .tp-preset,.tp .tp-preset:hover,.tp .tp-preset:focus{background:var(--blue) !important;color:#fff !important}",
    ".tp .tp-preset:active,.tp .tp-preset.is-pressed{background:var(--blue-pressed) !important}",
    ".tp .tp-secondary,.tp .tp-secondary:hover,.tp .tp-secondary:focus{background:var(--blue-subtle) !important;color:var(--blue) !important}",
    ".tp .tp-primary,.tp .tp-primary:hover,.tp .tp-primary:focus{background:var(--blue) !important;color:#fff !important}",
    ".tp .tp-key,.tp .tp-key:hover,.tp .tp-key:focus{background:var(--key) !important;color:var(--text) !important}",
    ".tp .tp-btn:hover{filter:brightness(.96)}",
    ".tp .tp-btn:focus-visible{outline:2px solid #1A1A1A !important;outline-offset:2px}",
    ".tp-stage{width:100%;max-width:720px;margin:16px 0 0}",
    ".tp-scene{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:16px;background:#ddd}",
    ".tp-scene.banner{aspect-ratio:12/5;object-position:50% 72%}",
    ".tp-stage .tp{margin:-72px auto 0 !important;max-width:640px;position:relative}",
    ".tp-stage.banner .tp{margin-top:-56px !important}",
    "#logo-container{padding-top:12px !important;padding-bottom:4px !important}#logo-container img{height:56px !important;width:auto !important}",
    ".tp-caption{display:none}",
    "@media (min-width:1100px){.tp-stage.tp-wide{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(400px,1fr);gap:44px;align-items:center;max-width:none;margin-top:8px}.tp-wide .tp-left .tp-scene{aspect-ratio:16/9;border-radius:18px;box-shadow:0 12px 32px rgba(0,0,0,.18)}.tp-stage.tp-wide .tp{margin:0 !important;max-width:none;width:auto}.tp-wide .tp-caption{display:block;font-size:20px;line-height:1.5;color:#1f1f1f;margin:0 0 20px}.tp-orig-wide{display:none !important}html.tp-wide-page #survey-canvas{width:min(1320px,calc(100vw - 64px)) !important;max-width:none !important;flex:none !important}.tp-q-wide{max-width:none !important}}",
    "@media (max-width:520px){.tp-stage .tp,.tp-stage.banner .tp{margin-top:-32px !important;width:94%}.tp-scene{border-radius:12px}}",
    "@media (max-width:520px){.tp{padding:8px;border-radius:20px}.tp-screen{padding:28px 12px 20px;border-radius:12px}",
    ".tp h2{font-size:26px;margin-bottom:18px}.tp-presets{gap:8px}.tp-preset{min-height:104px}",
    ".tp-preset .pct{font-size:28px}.tp-preset .amt{font-size:14px}.tp-secondary,.tp-primary{height:52px;margin-top:8px}",
    ".tp-key{height:54px}.tp-amount{font-size:40px}}"
  ].join("");
  var old = document.getElementById("tp-style");
  if (old) { old.parentNode.removeChild(old); }
  {
    var style = document.createElement("style");
    style.id = "tp-style";
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ---------- Helpers ----------
  function money(n) { return "$" + n.toFixed(2); }
  function round2(n) { return Math.round(n * 100) / 100; }
  var start = Date.now();
  var customOpened = 0;
  var done = false;

  function save(choice, amount) {
    if (done) { return; }
    done = true;
    var pct = round2(amount / SUBTOTAL * 100);  // % of pre-tax subtotal
    var ed = Qualtrics.SurveyEngine;
    ed.setEmbeddedData("condition", condition);
    ed.setEmbeddedData("tip_choice", choice);
    ed.setEmbeddedData("tip_percent", String(pct));
    ed.setEmbeddedData("tip_amount", amount.toFixed(2));
    ed.setEmbeddedData("custom_opened", String(customOpened));
    ed.setEmbeddedData("decision_ms", String(Date.now() - start));
    setTimeout(function () { showConfirm(choice, amount, pct); }, 250); // brief pressed state
  }

  // ---------- Build ----------
  var root = q.getQuestionContainer().querySelector("#tip-root");
  if (!root) {
    root = document.createElement("div");
    q.getQuestionTextContainer().appendChild(root);
  }
  root.innerHTML = "";
  var stage = document.createElement("div"); stage.className = "tp-stage banner"; root.appendChild(stage);
  var scene = document.createElement("img"); scene.className = "tp-scene banner"; scene.alt = ""; scene.src = SCENES[svc]; stage.appendChild(scene);
  scene.addEventListener("load", function () { setTimeout(centerFrame, 0); });
  var frame = document.createElement("div");
  frame.className = "tp";
  stage.appendChild(frame);

  // ---------- Desktop (1000px+): side-by-side, wider than Qualtrics' text column ----------
  // Left: scenario text + photo. Right: the tablet. Phones keep the stacked layout.
  var qtext = q.getQuestionTextContainer();
  var orig = document.createElement("div"); orig.className = "tp-orig";
  Array.prototype.slice.call(qtext.childNodes).forEach(function (n) {
    if (n !== root && !(n.contains && n.contains(root))) { orig.appendChild(n); }
  });
  qtext.insertBefore(orig, qtext.firstChild);
  var left = document.createElement("div"); left.className = "tp-left";
  // Page 2 text: comes from the Q2 question text (Survey Flow field "reminder").
  // These built-in lines are only a backup if the question text is ever left empty.
  var REMINDERS = {
    counter: "The cashier turns the tablet toward you so you can pay. Complete your payment as you normally would.",
    sitdown: "Your server hands you the tablet at your table so you can pay. Complete your payment as you normally would."
  };
  if (!(orig.textContent || "").trim()) { orig.innerHTML = "<p style=\"margin:0\">" + REMINDERS[svc] + "</p>"; }
  var cap = document.createElement("div"); cap.className = "tp-caption"; cap.innerHTML = orig.innerHTML;
  left.appendChild(cap);
  stage.insertBefore(left, scene); left.appendChild(scene);
  function layoutWide() {
    var wide = window.innerWidth >= 1100;
    stage.classList.toggle("tp-wide", wide);
    orig.classList.toggle("tp-orig-wide", wide);
    document.documentElement.classList.toggle("tp-wide-page", wide);
    var qd = root.closest ? root.closest(".question-display") : null;
    if (qd) { qd.classList.toggle("tp-q-wide", wide); }
  }
  layoutWide();
  window.addEventListener("resize", function () { layoutWide(); centerFrame(); });
  var wrap = document.createElement("div");
  wrap.className = "tp-screen";
  frame.appendChild(wrap);

  var globe = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/>' +
    '<path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" stroke="currentColor" stroke-width="1.6"/></svg>';

  var MERCHANT_TAGLINE = "";  // optional small line under the name; "" = none
  var bowlIcon = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M3.5 12.5h17a8.5 7 0 0 1-17 0z"/><path d="M9 21h6"/>' +
    '<path d="M8.5 3.5c-1 1 1 2 0 3.2"/><path d="M12 2.5c-1 1.1 1 2.2 0 3.6"/><path d="M15.5 3.5c-1 1 1 2 0 3.2"/></svg>';
  var merchantHtml = '<div class="tp-merchant"><div class="tp-logo">' + bowlIcon +
    '</div><div class="tp-mname">' + MERCHANT + '</div>' +
    (MERCHANT_TAGLINE ? '<div class="tp-mtag">' + MERCHANT_TAGLINE + '</div>' : '') + '</div>';

  function showTipScreen() {
    var html = merchantHtml + '<h2>' + LABELS.heading + '</h2>' +
      '<p class="tp-total">Total ' + money(CHECK_TOTAL) + '</p>' +
      '<p class="tp-note">Suggested tips are based on the ' + money(SUBTOTAL) + ' subtotal, excluding taxes.</p>' +
      '<div class="tp-presets">';
    presets.forEach(function (p, i) {
      html += '<button type="button" class="tp-btn tp-preset" data-i="' + i + '">' +
        '<span class="pct">' + p + '%</span><span class="amt">' + money(round2(SUBTOTAL * p / 100)) + '</span></button>';
    });
    html += '</div>' +
      '<button type="button" class="tp-btn tp-secondary" data-act="custom">' + LABELS.custom + '</button>' +
      '<button type="button" class="tp-btn tp-secondary" data-act="none">' + LABELS.none + '</button>' +
      '<div class="tp-lang">' + globe + 'English</div>';
    frame.className = "tp";
    wrap.innerHTML = html;

    Array.prototype.forEach.call(wrap.querySelectorAll(".tp-preset"), function (b) {
      b.addEventListener("click", function () {
        var i = Number(b.getAttribute("data-i"));
        b.classList.add("is-pressed");
        save("preset_" + (i + 1), round2(SUBTOTAL * presets[i] / 100));
      });
    });
    wrap.querySelector('[data-act="custom"]').addEventListener("click", showCustomScreen);
    wrap.querySelector('[data-act="none"]').addEventListener("click", function () { save("none", 0); });
  }

  // After the tip (data already saved): Square-style "tap to pay", then "Approved".
  var contactless = '<svg class="tp-pay-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke-width="1.6" stroke-linecap="round">' +
    '<path d="M8.5 7.5a6.5 6.5 0 0 1 0 9"/><path d="M12 5a10 10 0 0 1 0 14"/><path d="M15.5 2.5a13.5 13.5 0 0 1 0 19"/><path d="M5 10a3 3 0 0 1 0 4"/></svg>';

  function showConfirm(choice, amount, pct) {
    frame.className = "tp";
    wrap.innerHTML = merchantHtml +
      '<h2 style="margin-bottom:4px">Tap, insert, or swipe</h2>' +
      '<p class="tp-sub">Total with tip</p>' +
      '<p class="tp-pay-total">' + money(round2(CHECK_TOTAL + amount)) + '</p>' + contactless +
      '<div class="tp-actions"><button type="button" class="tp-btn tp-primary" data-act="pay">Tap card to pay</button></div>';
    wrap.querySelector('[data-act="pay"]').addEventListener("click", function () {
      this.disabled = true; this.textContent = "Processing…";
      setTimeout(function () { showApproved(choice, amount, pct); }, 900);
    });
  }

  function showApproved(choice, amount, pct) {
    var tipLabel = choice === "none" ? "No tip" : money(amount) + ' <span class="muted">(' + pct + '%)</span>';
    var check = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    wrap.innerHTML = merchantHtml +
      '<div class="tp-done-icon">' + check + '</div>' +
      '<h2 style="margin-bottom:4px">Approved</h2><p class="tp-sub">Thank you!</p>' +
      '<div class="tp-receipt">' +
        '<div class="tp-row"><span>Subtotal</span><span>' + money(SUBTOTAL) + '</span></div>' +
        '<div class="tp-row"><span>Tax</span><span>' + money(TAX) + '</span></div>' +
        '<div class="tp-row"><span>Tip</span><span>' + tipLabel + '</span></div>' +
        '<div class="tp-row total"><span>Total</span><span>' + money(round2(CHECK_TOTAL + amount)) + '</span></div>' +
      '</div>' +
      '<div class="tp-actions"><button type="button" class="tp-btn tp-primary" data-act="done">Done</button></div>';
    wrap.querySelector('[data-act="done"]').addEventListener("click", function () { q.clickNextButton(); });
  }

  function showCustomScreen() {
    customOpened = 1;
    var cents = 0;
    frame.className = "tp tp-custom";
    var keys = ["1","2","3","4","5","6","7","8","9","","0","back"];
    var html = merchantHtml + '<h2>Custom tip</h2><p class="tp-sub">Enter a tip amount</p>' +
      '<p class="tp-amount" aria-live="polite">$0.00</p><p class="tp-err"></p><div class="tp-keys">';
    keys.forEach(function (k) {
      if (k === "") { html += '<span class="tp-btn tp-key blank"></span>'; return; }
      html += '<button type="button" class="tp-btn tp-key" data-k="' + k + '"' +
        (k === "back" ? ' aria-label="Delete">⌫' : '>' + k) + '</button>';
    });
    html += '</div><div class="tp-actions">' +
      '<button type="button" class="tp-btn tp-primary" data-act="add" disabled>Add tip</button>' +
      '<button type="button" class="tp-btn tp-secondary" data-act="cancel">Cancel</button></div>';
    wrap.innerHTML = html;

    var amountEl = wrap.querySelector(".tp-amount");
    var errEl = wrap.querySelector(".tp-err");
    var addBtn = wrap.querySelector('[data-act="add"]');

    function render() {
      var dollars = cents / 100;
      amountEl.textContent = money(dollars);
      var tooHigh = dollars > MAX_CUSTOM;
      errEl.textContent = tooHigh ? "Tip can't be more than " + money(MAX_CUSTOM) + "." : "";
      addBtn.disabled = cents === 0 || tooHigh;
    }

    Array.prototype.forEach.call(wrap.querySelectorAll(".tp-key[data-k]"), function (b) {
      b.addEventListener("click", function () {
        var k = b.getAttribute("data-k");
        if (k === "back") { cents = Math.floor(cents / 10); }
        else if (cents < 100000) { cents = cents * 10 + Number(k); } // stops runaway typing
        render();
      });
    });
    addBtn.addEventListener("click", function () { save("custom", cents / 100); });
    wrap.querySelector('[data-act="cancel"]').addEventListener("click", showTipScreen);
  }

  // Center the device on the whole question column (Qualtrics' question-text
  // box can be narrower than the column and pinned to the left).
  function centerFrame() {
    stage.style.transform = "";
    var col = q.getQuestionContainer().getBoundingClientRect();
    var f = stage.getBoundingClientRect();
    if (window.innerWidth < 700 || (!stage.classList.contains("tp-wide") && col.width < f.width + 40)) { return; } // phones: leave as is
    if (stage.classList.contains("tp-wide")) { return; } // wide layout fills the (widened) page column
    var shift = (col.left + col.width / 2) - (f.left + f.width / 2);
    if (Math.abs(shift) > 1) { stage.style.transform = "translateX(" + Math.round(shift) + "px)"; }
  }
  window.addEventListener("resize", centerFrame);
  if (Qualtrics.SurveyEngine.addOnReady) { Qualtrics.SurveyEngine.addOnReady(centerFrame); }
  setTimeout(centerFrame, 0);
  setTimeout(centerFrame, 300);

  // Leaving checkout: put Qualtrics' normal page width back for later questions
  if (Qualtrics.SurveyEngine.addOnUnload) {
    Qualtrics.SurveyEngine.addOnUnload(function () { document.documentElement.classList.remove("tp-wide-page"); });
  }
  q.hideNextButton();
  showTipScreen();
});
