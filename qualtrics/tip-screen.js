/* =====================================================================
   Tipping Point — Square-style CHECKOUT (page 2 of 2) for Qualtrics
   ---------------------------------------------------------------------
   WHERE THIS GOES: Q2 (page 2). Click the question > JavaScript (left
   panel) > replace everything with this file > Save.
   Question text: the piped field "reminder" from Survey flow.

   WHAT IT DOES
   - Builds the tablet inside the question, plus the scene photo for the
     condition's setting (photos load from the Qualtrics Graphics Library)
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

   HOW THIS FILE IS ORGANIZED
   1. Shared block: settings (restaurant, menu, tax, photos, conditions),
      styles and page layout. Identical in check-screen.js; change both.
   2. Tip settings: presets, button labels, max custom tip.
   3. Saving the data.
   4. The screens, in order: tip -> (custom keypad) -> tap to pay -> approved.
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

  // ======================== THIS PAGE: CHECKOUT ========================

  // ---------- Tip settings ----------
  // Suggested tips, as % of the pre-tax subtotal (Square-style).
  // Which list a condition gets is set in CONDITIONS (shared block).
  var DEFAULTS = {
    low:  [10, 15, 20],             // C1 (counter) and C3 (sit-down)
    high: [20, 25, 30]              // C2 (counter) and C4 (sit-down)
  };
  var LABELS = { custom: "Custom", none: "No tip", heading: "Add a tip?" };
  var MAX_CUSTOM = 25.00;           // highest custom tip allowed, in dollars
  var MAX_CUSTOM_DIGITS = 6;        // keypad stops accepting digits after $9,999.99
  var PAY_DELAY_MS = 900;           // "Processing…" pause before "Approved"
  var PRESS_DELAY_MS = 250;         // lets the pressed button color show before moving on

  // Page 2 text comes from the Q2 question text (Survey Flow field "reminder").
  // These lines are only a backup if the question text is ever left empty.
  var REMINDERS = {
    counter: "The cashier turns the tablet toward you so you can pay. Complete your payment as you normally would.",
    sitdown: "Your server hands you the tablet at your table so you can pay. Complete your payment as you normally would."
  };

  var presets = DEFAULTS[CONDITIONS[condition].tips];

  var PAGE_CSS =
    ".tp-total{font-size:20px;font-weight:600;color:var(--text);margin:-16px 0 4px}" +
    ".tp-note{font-size:14px;color:var(--muted);margin:0 0 20px}";

  var ICONS = {
    globe: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/>' +
      '<path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" stroke="currentColor" stroke-width="1.6"/></svg>',
    contactless: '<svg class="tp-pay-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke-width="1.6" stroke-linecap="round">' +
      '<path d="M8.5 7.5a6.5 6.5 0 0 1 0 9"/><path d="M12 5a10 10 0 0 1 0 14"/><path d="M15.5 2.5a13.5 13.5 0 0 1 0 19"/><path d="M5 10a3 3 0 0 1 0 4"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  // ---------- Saving the data ----------
  var startTime = Date.now();
  var customOpened = 0;
  var saved = false;

  function tipForPreset(percent) { return round2(SUBTOTAL * percent / 100); }

  // Saves the person's choice once (later taps are ignored), then moves to "tap to pay".
  function saveTip(choice, amount) {
    if (saved) { return; }
    saved = true;
    var percent = round2(amount / SUBTOTAL * 100);
    var data = {
      condition: condition,
      tip_choice: choice,
      tip_percent: String(percent),
      tip_amount: amount.toFixed(2),
      custom_opened: String(customOpened),
      decision_ms: String(Date.now() - startTime)
    };
    Object.keys(data).forEach(function (field) {
      Qualtrics.SurveyEngine.setEmbeddedData(field, data[field]);
    });
    setTimeout(function () { showPayScreen(choice, amount, percent); }, PRESS_DELAY_MS);
  }

  // ---------- Screens ----------
  // Each screen redraws the inside of the tablet (`screen`).
  var frame, screen;   // set at Start, below

  // Screen 1: "Add a tip?" with the condition's three presets, Custom and No tip.
  function showTipScreen() {
    var presetButtons = presets.map(function (percent, i) {
      return '<button type="button" class="tp-btn tp-preset" data-i="' + i + '">' +
        '<span class="pct">' + percent + '%</span><span class="amt">' + money(tipForPreset(percent)) + '</span></button>';
    }).join("");

    frame.className = "tp";
    screen.innerHTML = MERCHANT_HTML +
      '<h2>' + LABELS.heading + '</h2>' +
      '<p class="tp-total">Total ' + money(CHECK_TOTAL) + '</p>' +
      '<p class="tp-note">Suggested tips are based on the ' + money(SUBTOTAL) + ' subtotal, excluding taxes.</p>' +
      '<div class="tp-presets">' + presetButtons + '</div>' +
      '<button type="button" class="tp-btn tp-secondary" data-act="custom">' + LABELS.custom + '</button>' +
      '<button type="button" class="tp-btn tp-secondary" data-act="none">' + LABELS.none + '</button>' +
      '<div class="tp-lang">' + ICONS.globe + 'English</div>';

    onClick(screen, ".tp-preset", function (button) {
      var i = Number(button.getAttribute("data-i"));
      button.classList.add("is-pressed");
      saveTip("preset_" + (i + 1), tipForPreset(presets[i]));
    });
    onClick(screen, '[data-act="custom"]', showCustomScreen);
    onClick(screen, '[data-act="none"]', function () { saveTip("none", 0); });
  }

  // Screen 1b: dollar keypad. Digits fill in from the cents, like Square ("1","2","3" = $1.23).
  function showCustomScreen() {
    customOpened = 1;
    var cents = 0;
    var KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"];
    var keyButtons = KEYS.map(function (k) {
      if (k === "") { return '<span class="tp-btn tp-key blank"></span>'; }
      if (k === "back") { return '<button type="button" class="tp-btn tp-key" data-k="back" aria-label="Delete">⌫</button>'; }
      return '<button type="button" class="tp-btn tp-key" data-k="' + k + '">' + k + '</button>';
    }).join("");

    frame.className = "tp tp-custom";
    screen.innerHTML = MERCHANT_HTML +
      '<h2>Custom tip</h2><p class="tp-sub">Enter a tip amount</p>' +
      '<p class="tp-amount" aria-live="polite">$0.00</p><p class="tp-err"></p>' +
      '<div class="tp-keys">' + keyButtons + '</div>' +
      '<div class="tp-actions">' +
        '<button type="button" class="tp-btn tp-primary" data-act="add" disabled>Add tip</button>' +
        '<button type="button" class="tp-btn tp-secondary" data-act="cancel">Cancel</button>' +
      '</div>';

    var amountText = screen.querySelector(".tp-amount");
    var errorText = screen.querySelector(".tp-err");
    var addButton = screen.querySelector('[data-act="add"]');

    function update() {
      var dollars = cents / 100;
      var tooHigh = dollars > MAX_CUSTOM;
      amountText.textContent = money(dollars);
      errorText.textContent = tooHigh ? "Tip can't be more than " + money(MAX_CUSTOM) + "." : "";
      addButton.disabled = cents === 0 || tooHigh;
    }

    onClick(screen, ".tp-key[data-k]", function (key) {
      var k = key.getAttribute("data-k");
      if (k === "back") { cents = Math.floor(cents / 10); }
      else if (String(cents).length < MAX_CUSTOM_DIGITS) { cents = cents * 10 + Number(k); }
      update();
    });
    onClick(screen, '[data-act="add"]', function () { saveTip("custom", cents / 100); });
    onClick(screen, '[data-act="cancel"]', showTipScreen);
  }

  // Screen 2: "Tap, insert, or swipe" (the tip is already saved).
  function showPayScreen(choice, amount, percent) {
    frame.className = "tp";
    screen.innerHTML = MERCHANT_HTML +
      '<h2 class="tp-tight">Tap, insert, or swipe</h2>' +
      '<p class="tp-sub">Total with tip</p>' +
      '<p class="tp-pay-total">' + money(round2(CHECK_TOTAL + amount)) + '</p>' + ICONS.contactless +
      '<div class="tp-actions"><button type="button" class="tp-btn tp-primary" data-act="pay">Tap card to pay</button></div>';
    onClick(screen, '[data-act="pay"]', function (button) {
      button.disabled = true;
      button.textContent = "Processing…";
      setTimeout(function () { showApprovedScreen(choice, amount, percent); }, PAY_DELAY_MS);
    });
  }

  // Screen 3: "Approved" + receipt. Done moves to the next survey page.
  function showApprovedScreen(choice, amount, percent) {
    var tipLabel = choice === "none" ? "No tip" : money(amount) + ' <span class="muted">(' + percent + '%)</span>';
    screen.innerHTML = MERCHANT_HTML +
      '<div class="tp-done-icon">' + ICONS.check + '</div>' +
      '<h2 class="tp-tight">Approved</h2><p class="tp-sub">Thank you!</p>' +
      '<div class="tp-receipt">' +
        row("Subtotal", money(SUBTOTAL)) +
        row("Tax", money(TAX)) +
        row("Tip", tipLabel) +
        row("Total", money(round2(CHECK_TOTAL + amount)), "total") +
      '</div>' +
      '<div class="tp-actions"><button type="button" class="tp-btn tp-primary" data-act="done">Done</button></div>';
    onClick(screen, '[data-act="done"]', function () { q.clickNextButton(); });
  }

  // ---------- Start ----------
  installStyles(BASE_CSS + PAGE_CSS);
  var layout = buildLayout(q, { banner: true, fallbackText: REMINDERS[service] });
  frame = layout.frame;
  screen = layout.screen;
  q.hideNextButton();
  showTipScreen();
});
