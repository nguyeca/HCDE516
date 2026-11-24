/* =====================================================================
   Tipping Point — Square-style ORDER SUMMARY (page 1 of 2) for Qualtrics
   ---------------------------------------------------------------------
   WHERE THIS GOES: the scenario question (page 1). Gear > Question
   behavior > JavaScript: delete everything, paste this file.
   Question text: the scenario wording, then <div id="tip-root"></div>
   in HTML view (same one line as the tip question).

   Shows the order on the same tablet design (subtotal $22.60, tax, Total $24.98) and a
   "Continue" button that moves to the checkout page. Saves no data.
   Keep items/total identical in all four conditions.
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
  var MERCHANT = "Corner Kitchen";
  var ITEMS = [["Roasted turkey sandwich + side salad", 16.75], ["Iced latte", 5.85]];  // subtotal $22.60
  var TAX_RATE = 10.55;  // Seattle combined sales tax, Q4 2026. Must match tip-screen.js

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
    ".tp-total{font-size:18px;color:var(--muted);margin:-16px 0 24px}",
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
  css += ".tp-order{max-width:420px;margin:8px auto 4px;text-align:left;font-size:17px;color:var(--text)}" +
         ".tp-row.sub{border-top:1px solid #E4E4E7;margin-top:4px;padding-top:10px}" +
         ".tp-order h3{font-size:15px;font-weight:600;color:var(--muted);margin:0 0 4px;text-transform:uppercase;letter-spacing:.06em}";
  var old = document.getElementById("tp-style");
  if (old) { old.parentNode.removeChild(old); }
  {
    var style = document.createElement("style");
    style.id = "tp-style";
    style.textContent = css;
    document.head.appendChild(style);
  }

  function money(n) { return "$" + n.toFixed(2); }
  var MERCHANT_TAGLINE = "";  // optional small line under the name; "" = none
  var bowlIcon = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M3.5 12.5h17a8.5 7 0 0 1-17 0z"/><path d="M9 21h6"/>' +
    '<path d="M8.5 3.5c-1 1 1 2 0 3.2"/><path d="M12 2.5c-1 1.1 1 2.2 0 3.6"/><path d="M15.5 3.5c-1 1 1 2 0 3.2"/></svg>';
  var merchantHtml = '<div class="tp-merchant"><div class="tp-logo">' + bowlIcon +
    '</div><div class="tp-mname">' + MERCHANT + '</div>' +
    (MERCHANT_TAGLINE ? '<div class="tp-mtag">' + MERCHANT_TAGLINE + '</div>' : '') + '</div>';


  var root = q.getQuestionContainer().querySelector("#tip-root");
  if (!root) { root = document.createElement("div"); q.getQuestionTextContainer().appendChild(root); }
  root.innerHTML = "";
  var stage = document.createElement("div"); stage.className = "tp-stage"; root.appendChild(stage);
  var scene = document.createElement("img"); scene.className = "tp-scene"; scene.alt = ""; scene.src = SCENES[svc]; stage.appendChild(scene);
  scene.addEventListener("load", function () { setTimeout(centerFrame, 0); });
  var frame = document.createElement("div"); frame.className = "tp"; stage.appendChild(frame);

  // ---------- Desktop (1000px+): side-by-side, wider than Qualtrics' text column ----------
  // Left: scenario text + photo. Right: the tablet. Phones keep the stacked layout.
  var qtext = q.getQuestionTextContainer();
  var orig = document.createElement("div"); orig.className = "tp-orig";
  Array.prototype.slice.call(qtext.childNodes).forEach(function (n) {
    if (n !== root && !(n.contains && n.contains(root))) { orig.appendChild(n); }
  });
  qtext.insertBefore(orig, qtext.firstChild);
  var left = document.createElement("div"); left.className = "tp-left";
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
  var wrap = document.createElement("div"); wrap.className = "tp-screen"; frame.appendChild(wrap);

  var subtotal = 0, rows = "";
  ITEMS.forEach(function (it) { subtotal += it[1]; rows += '<div class="tp-row"><span>' + it[0] + '</span><span>' + money(it[1]) + '</span></div>'; });
  subtotal = Math.round(subtotal * 100) / 100;
  var tax = Math.round(subtotal * TAX_RATE) / 100;
  var total = Math.round((subtotal + tax) * 100) / 100;
  rows += '<div class="tp-row sub"><span>Subtotal</span><span>' + money(subtotal) + '</span></div>' +
          '<div class="tp-row"><span>Tax</span><span>' + money(tax) + '</span></div>';
  wrap.innerHTML = merchantHtml +
    '<div class="tp-order"><h3>Your order</h3>' + rows +
    '<div class="tp-row total"><span>Total</span><span>' + money(total) + '</span></div></div>' +
    '<div class="tp-actions"><button type="button" class="tp-btn tp-primary" data-act="continue">Continue</button></div>';
  wrap.querySelector('[data-act="continue"]').addEventListener("click", function () { q.clickNextButton(); });

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

  q.hideNextButton();
});
