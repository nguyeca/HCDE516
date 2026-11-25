/* =====================================================================
   Tipping Point — Square-style ORDER SUMMARY (page 1 of 2) for Qualtrics
   ---------------------------------------------------------------------
   WHERE THIS GOES: Q1 (page 1). Click the question > JavaScript (left
   panel) > replace everything with this file > Save.
   Question text: the piped field "scenario" from Survey flow. The script
   adds the scene photo + tablet below it (no extra HTML needed).

   WHAT IT DOES
   Shows the order on the tablet (items, subtotal, tax, total) and a
   "Continue" button that moves to the checkout page. Saves no data.
   The order is identical in all four conditions.

   HOW THIS FILE IS ORGANIZED
   1. Shared block: settings (restaurant, menu, tax, photos, conditions),
      styles and page layout. Identical in tip-screen.js; change both.
   2. This page: the order summary screen.
   ===================================================================== */

Qualtrics.SurveyEngine.addOnload(function () {
  var q = this;

  /* ===================== SHARED BLOCK: START =====================
     This block is IDENTICAL in check-screen.js and tip-screen.js.
     If you change anything between START and END, paste the same
     change into the other file. The preview page warns you if the two
     copies stop matching. (Each file is pasted into its own Qualtrics
     question, so they can't load a shared file.)
     ================================================================ */

  // ---------- Study settings (same in every condition) ----------
  var MERCHANT = "Corner Kitchen";  // name at the top of the tablet
  var MERCHANT_TAGLINE = "";        // optional small line under the name; "" = none
  var ITEMS = [                     // [name, price]; subtotal is added up from these ($22.60)
    ["Roasted turkey sandwich + side salad", 16.75],
    ["Iced latte", 5.85]
  ];
  var TAX_RATE = 10.55;             // percent; Seattle combined sales tax, Q4 2026

  // Scene photos from the Qualtrics Graphics Library (one per service type).
  var SCENES = {
    counter: "https://uwashington.qualtrics.com/ControlPanel/Graphic.php?IM=IM_chCQClsbTgyeNfU",
    sitdown: "https://uwashington.qualtrics.com/ControlPanel/Graphic.php?IM=IM_6qB3StlKbskQQhv"
  };

  // The 2 x 2 design. To add or change a condition, edit this table only.
  //   service: which scene photo / setting   tips: which preset list in tip-screen.js
  var CONDITIONS = {
    C1: { service: "counter", tips: "low" },
    C2: { service: "counter", tips: "high" },
    C3: { service: "sitdown", tips: "low" },
    C4: { service: "sitdown", tips: "high" }
  };
  var TEST_CONDITION = "C4";        // used only when "condition" is empty (e.g., Qualtrics preview)
  var WIDE_MIN = 1100;              // px; side-by-side desktop layout from here up (also in the CSS below)

  // ---------- Which condition is this person in? ----------
  // Qualtrics fills in the two piped fields below with this person's embedded data before the script runs.
  var condition = "${e://Field/condition}";
  if (!CONDITIONS.hasOwnProperty(condition)) { condition = TEST_CONDITION; }
  var service = "${e://Field/service}";
  if (!SCENES.hasOwnProperty(service)) { service = CONDITIONS[condition].service; }

  // ---------- Money ----------
  function money(n) { return "$" + n.toFixed(2); }
  function round2(n) { return Math.round(n * 100) / 100; }
  var SUBTOTAL = round2(ITEMS.reduce(function (sum, item) { return sum + item[1]; }, 0));  // $22.60
  var TAX = Math.round(SUBTOTAL * TAX_RATE) / 100;                                         // $2.38
  var CHECK_TOTAL = round2(SUBTOTAL + TAX);                                                // $24.98

  // ---------- Styles (colors are the Figma "Tip UI" variables) ----------
  var BASE_CSS = [
    // Tablet frame + Figma color tokens
    ".tp{--blue:#3E3EF4;--blue-pressed:#2A2AC4;--blue-subtle:#ECECFE;--text:#1A1A1A;--muted:#6B6B70;--key:#F4F4F5;",
    "font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;",
    "width:100%;max-width:720px;margin:16px 0 0;background:#18181B;padding:14px;border-radius:28px;box-sizing:border-box;",
    "box-shadow:0 12px 32px rgba(0,0,0,.18)}",
    ".tp *{box-sizing:border-box}",
    ".tp-screen{background:#fff;color:var(--text);border-radius:14px;padding:40px 32px 28px;text-align:center}",
    ".tp h2{font-size:32px;font-weight:400;margin:0 0 24px;letter-spacing:-.01em;color:var(--text);line-height:1.2}",
    // Buttons
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
    // Merchant header
    ".tp-merchant{display:flex;flex-direction:column;align-items:center;gap:8px;margin:0 0 20px}",
    ".tp-logo{width:48px;height:48px;border-radius:50%;background:#1A1A1A;display:flex;align-items:center;justify-content:center}",
    ".tp-logo svg{width:28px;height:28px;display:block}",
    ".tp-logo svg *{fill:none !important;stroke:#fff !important}",
    ".tp-mname{font-size:16px;font-weight:600;color:var(--text);line-height:1.2}",
    ".tp-mtag{font-size:10px;font-weight:600;letter-spacing:.22em;color:#8A6F62;text-transform:uppercase;margin-top:-4px}",
    // Pay / approved / receipt
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
    ".tp h2.tp-tight{margin-bottom:4px}",
    // Custom-tip keypad
    ".tp-custom h2{margin-bottom:8px}",
    ".tp-amount{font-size:48px;font-weight:700;margin:0 0 4px;color:var(--text)}",
    ".tp-err{color:#C0362C;font-size:14px;min-height:20px;margin:0 0 12px}",
    ".tp-keys{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;max-width:360px;margin:0 auto}",
    ".tp-key{background:var(--key);color:var(--text);font-size:26px;height:60px}",
    ".tp-key:active{filter:brightness(.93)}",
    ".tp-key.blank{visibility:hidden}",
    ".tp-actions{max-width:360px;margin:0 auto}",
    ".tp-row span:last-child{white-space:nowrap;padding-left:12px;flex:none}",
    // Stop Qualtrics' theme from restyling our buttons
    ".tp .tp-btn:hover,.tp .tp-btn:focus{box-shadow:none !important;border:0 !important}",
    ".tp .tp-preset,.tp .tp-preset:hover,.tp .tp-preset:focus{background:var(--blue) !important;color:#fff !important}",
    ".tp .tp-preset:active,.tp .tp-preset.is-pressed{background:var(--blue-pressed) !important}",
    ".tp .tp-secondary,.tp .tp-secondary:hover,.tp .tp-secondary:focus{background:var(--blue-subtle) !important;color:var(--blue) !important}",
    ".tp .tp-primary,.tp .tp-primary:hover,.tp .tp-primary:focus{background:var(--blue) !important;color:#fff !important}",
    ".tp .tp-key,.tp .tp-key:hover,.tp .tp-key:focus{background:var(--key) !important;color:var(--text) !important}",
    ".tp .tp-btn:hover{filter:brightness(.96)}",
    ".tp .tp-btn:focus-visible{outline:2px solid #1A1A1A !important;outline-offset:2px}",
    // Scene photo with the tablet overlapping it (stacked layout)
    ".tp-stage{width:100%;max-width:720px;margin:16px 0 0}",
    ".tp-scene{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:16px;background:#ddd}",
    ".tp-scene.banner{aspect-ratio:12/5;object-position:50% 72%}",
    ".tp-stage .tp{margin:-72px auto 0 !important;max-width:640px;position:relative}",
    ".tp-stage.banner .tp{margin-top:-56px !important}",
    "#logo-container{padding-top:12px !important;padding-bottom:4px !important}#logo-container img{height:56px !important;width:auto !important}",
    ".tp-caption{display:none}",
    // Desktop: text + photo on the left, tablet on the right (1100px = WIDE_MIN)
    "@media (min-width:1100px){.tp-stage.tp-wide{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(400px,1fr);gap:44px;align-items:center;max-width:none;margin-top:8px}.tp-wide .tp-left .tp-scene{aspect-ratio:16/9;border-radius:18px;box-shadow:0 12px 32px rgba(0,0,0,.18)}.tp-stage.tp-wide .tp{margin:0 !important;max-width:none;width:auto}.tp-wide .tp-caption{display:block;font-size:20px;line-height:1.5;color:#1f1f1f;margin:0 0 20px}.tp-orig-wide{display:none !important}html.tp-wide-page #survey-canvas{width:min(1320px,calc(100vw - 64px)) !important;max-width:none !important;flex:none !important}.tp-q-wide{max-width:none !important}}",
    // Phones
    "@media (max-width:520px){.tp-stage .tp,.tp-stage.banner .tp{margin-top:-32px !important;width:94%}.tp-scene{border-radius:12px}}",
    "@media (max-width:520px){.tp{padding:8px;border-radius:20px}.tp-screen{padding:28px 12px 20px;border-radius:12px}",
    ".tp h2{font-size:26px;margin-bottom:18px}.tp-presets{gap:8px}.tp-preset{min-height:104px}",
    ".tp-preset .pct{font-size:28px}.tp-preset .amt{font-size:14px}.tp-secondary,.tp-primary{height:52px;margin-top:8px}",
    ".tp-key{height:54px}.tp-amount{font-size:40px}}"
  ].join("");

  // Puts the styles on the page (replacing the previous page's copy).
  function installStyles(css) {
    var old = document.getElementById("tp-style");
    if (old) { old.parentNode.removeChild(old); }
    var style = document.createElement("style");
    style.id = "tp-style";
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ---------- Small helpers ----------
  // Runs fn when any element matching selector inside `container` is clicked.
  function onClick(container, selector, fn) {
    Array.prototype.forEach.call(container.querySelectorAll(selector), function (el) {
      el.addEventListener("click", function () { fn(el); });
    });
  }
  // One line of an order or receipt: label on the left, amount on the right.
  function row(label, value, className) {
    return '<div class="tp-row' + (className ? " " + className : "") + '"><span>' + label + '</span><span>' + value + '</span></div>';
  }
  function el(tag, className) {
    var node = document.createElement(tag);
    if (className) { node.className = className; }
    return node;
  }

  var BOWL_ICON = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M3.5 12.5h17a8.5 7 0 0 1-17 0z"/><path d="M9 21h6"/>' +
    '<path d="M8.5 3.5c-1 1 1 2 0 3.2"/><path d="M12 2.5c-1 1.1 1 2.2 0 3.6"/><path d="M15.5 3.5c-1 1 1 2 0 3.2"/></svg>';
  var MERCHANT_HTML = '<div class="tp-merchant"><div class="tp-logo">' + BOWL_ICON + '</div>' +
    '<div class="tp-mname">' + MERCHANT + '</div>' +
    (MERCHANT_TAGLINE ? '<div class="tp-mtag">' + MERCHANT_TAGLINE + '</div>' : '') + '</div>';

  // ---------- Page layout: scene photo + tablet ----------
  // Builds the layout inside the question and returns the pieces each page fills in:
  //   frame = the dark tablet bezel, screen = the white screen inside it.
  // Phones/tablets: photo on top, tablet overlapping it.
  // Desktop (WIDE_MIN and up): question text + photo on the left, tablet on the right;
  //   Qualtrics' page column is widened while this page is showing.
  // options.banner:       use the shorter, wide photo crop
  // options.fallbackText: shown if the Qualtrics question text is empty
  function buildLayout(q, options) {
    var qtext = q.getQuestionTextContainer();
    var root = q.getQuestionContainer().querySelector("#tip-root");
    if (!root) { root = el("div"); qtext.appendChild(root); }
    root.innerHTML = "";

    var stage = el("div", "tp-stage" + (options.banner ? " banner" : ""));
    var left = el("div", "tp-left");
    var caption = el("div", "tp-caption");
    var scene = el("img", "tp-scene" + (options.banner ? " banner" : ""));
    var frame = el("div", "tp");
    var screen = el("div", "tp-screen");
    scene.alt = "";
    scene.src = SCENES[service];

    // Move Qualtrics' question text into its own box so it can be hidden on desktop,
    // where a copy (the caption) sits above the photo instead.
    var orig = el("div", "tp-orig");
    Array.prototype.slice.call(qtext.childNodes).forEach(function (n) {
      if (n !== root && !(n.contains && n.contains(root))) { orig.appendChild(n); }
    });
    qtext.insertBefore(orig, qtext.firstChild);
    if (options.fallbackText && !(orig.textContent || "").trim()) {
      orig.innerHTML = '<p style="margin:0">' + options.fallbackText + '</p>';
    }
    caption.innerHTML = orig.innerHTML;

    left.appendChild(caption);
    left.appendChild(scene);
    frame.appendChild(screen);
    stage.appendChild(left);
    stage.appendChild(frame);
    root.appendChild(stage);

    function applyWideLayout() {
      var wide = window.innerWidth >= WIDE_MIN;
      stage.classList.toggle("tp-wide", wide);
      orig.classList.toggle("tp-orig-wide", wide);
      document.documentElement.classList.toggle("tp-wide-page", wide);
      var questionBox = root.closest ? root.closest(".question-display") : null;
      if (questionBox) { questionBox.classList.toggle("tp-q-wide", wide); }
    }

    // Stacked layout only: center the photo + tablet on the whole question column
    // (Qualtrics' question-text box can be narrower than the column and pinned left).
    function centerStage() {
      stage.style.transform = "";
      if (stage.classList.contains("tp-wide")) { return; }   // wide layout fills the column already
      var col = q.getQuestionContainer().getBoundingClientRect();
      var box = stage.getBoundingClientRect();
      if (window.innerWidth < 700 || col.width < box.width + 40) { return; }  // phones: leave as is
      var shift = (col.left + col.width / 2) - (box.left + box.width / 2);
      if (Math.abs(shift) > 1) { stage.style.transform = "translateX(" + Math.round(shift) + "px)"; }
    }

    function onResize() { applyWideLayout(); centerStage(); }
    applyWideLayout();
    window.addEventListener("resize", onResize);
    scene.addEventListener("load", function () { setTimeout(centerStage, 0); });
    if (Qualtrics.SurveyEngine.addOnReady) { Qualtrics.SurveyEngine.addOnReady(centerStage); }
    setTimeout(centerStage, 0);
    setTimeout(centerStage, 300);   // again after Qualtrics finishes its own layout

    // Leaving the page: stop listening and give Qualtrics its normal page width back.
    if (Qualtrics.SurveyEngine.addOnUnload) {
      Qualtrics.SurveyEngine.addOnUnload(function () {
        window.removeEventListener("resize", onResize);
        document.documentElement.classList.remove("tp-wide-page");
      });
    }

    return { frame: frame, screen: screen };
  }

  /* ====================== SHARED BLOCK: END ====================== */

  // ===================== THIS PAGE: ORDER SUMMARY =====================

  var PAGE_CSS =
    ".tp-total{font-size:18px;color:var(--muted);margin:-16px 0 24px}" +
    ".tp-order{max-width:420px;margin:8px auto 4px;text-align:left;font-size:17px;color:var(--text)}" +
    ".tp-row.sub{border-top:1px solid #E4E4E7;margin-top:4px;padding-top:10px}" +
    ".tp-order h3{font-size:15px;font-weight:600;color:var(--muted);margin:0 0 4px;text-transform:uppercase;letter-spacing:.06em}";

  function showOrderScreen(screen) {
    var rows = ITEMS.map(function (item) { return row(item[0], money(item[1])); }).join("");
    screen.innerHTML = MERCHANT_HTML +
      '<div class="tp-order"><h3>Your order</h3>' + rows +
        row("Subtotal", money(SUBTOTAL), "sub") +
        row("Tax", money(TAX)) +
        row("Total", money(CHECK_TOTAL), "total") +
      '</div>' +
      '<div class="tp-actions"><button type="button" class="tp-btn tp-primary" data-act="continue">Continue</button></div>';
    onClick(screen, '[data-act="continue"]', function () { q.clickNextButton(); });
  }

  // ---------- Start ----------
  installStyles(BASE_CSS + PAGE_CSS);
  var layout = buildLayout(q, { banner: false });
  q.hideNextButton();
  showOrderScreen(layout.screen);
});
