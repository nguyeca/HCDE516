# Tipping Point – Qualtrics checkout code

HCDE 516 · Fall 2026 · Team Tipping Point (Julia Brooks, Tasnim Hasan, Jocelyn Le, Kelly Lee, Katie Nguyen)

This repo holds the code for the Square-style payment tablet used in our 2×2 tipping experiment
(tip defaults low/high × counter/sit-down). The code runs inside two Qualtrics questions.

| What | Where |
|---|---|
| **Live survey (main)** | Qualtrics → *HCDE 516 - Tipping Point - V2 photo version* |
| **Design (source of truth for looks)** | Figma → payment screens file in the HCDE 516 team folder (see its **Handoff** page) |
| **Try the code in a browser** | **https://nguyeca.github.io/HCDE516/** (preview page, pick C1–C4 at the top) |
| **Code (source of truth for behavior)** | This repo, `qualtrics/` folder |

## What's in here

```
qualtrics/
  check-screen.js      Page 1 – order summary on the tablet (Q1's JavaScript)
  tip-screen.js        Page 2 – Add a tip → Tap to pay → Approved (Q2's JavaScript)
  question-html.html   Optional one-line HTML for a question's text box
index.html             Preview page: runs both scripts with any condition (C1–C4)
docs/qualtrics-setup.md  How the survey is wired: Survey flow fields, questions, data
CHANGELOG.md           What changed, when, and who changed it
```

The scene photos are **not** in this repo; they live in the Qualtrics Graphics Library and the
scripts load them from there.

## Where each kind of change happens

| I want to change… | Edit it in… | Code change? |
|---|---|---|
| Scenario wording (page 1) or reminder line (page 2) | Qualtrics → Survey flow → the `scenario` / `reminder` fields in each condition | No |
| Manipulation-check question (page 3) | Qualtrics → Builder → Q3 | No |
| Restaurant name, menu items, prices, tax | Settings near the top of **both** JS files (`MERCHANT`, `ITEMS`/`SUBTOTAL`, `TAX_RATE`; keep them matching) | Yes, small |
| Tip percentages, button labels, max custom tip | Settings block in `tip-screen.js` | Yes, small |
| Colors, sizes, layout | Figma first, then the CSS list in the JS files | Yes |
| New screen / new button / different flow | Figma first, then ask whoever codes (or Claude) | Yes, bigger |

## How to make a code change (no software to install)

1. **Design first (if it's visual).** Update the Figma file and leave a comment on the frame.
2. **Edit on GitHub.** Open the file in `qualtrics/`, click the ✏️ pencil (*Edit this file*), make
   the change, then click **Commit changes…**. Write a short note like "Raise max custom tip to $30".
3. **Check it.** Open the preview link, pick each condition (C1–C4), and click through. Changes show
   up about a minute after you commit. Then add a line to `CHANGELOG.md`.
4. **Put it in Qualtrics.** Open the file on GitHub → click the **Copy raw file** button (two
   overlapping squares). In Qualtrics: click the question → **JavaScript** (left panel) → select
   everything in the box → paste → **Save**. `check-screen.js` goes in **Q1**, `tip-screen.js` in **Q2**.
5. **Preview the survey** (Restart Survey a few times to see both settings) and tell the group chat.

Rules of thumb:
- Edit the survey copy you're testing in, not the live one, once data collection starts.
- Don't type `${...}` in code comments: Qualtrics fills those in even inside comments.
- One person edits Qualtrics at a time.

## Data the tablet saves (embedded data)

`condition` (C1–C4) · `tip_choice` (preset_1/2/3, custom, none) · `tip_percent` (% of the $22.60
pre-tax subtotal) · `tip_amount` ($) · `custom_opened` (1/0) · `decision_ms` (time to choose, ms).
Details in [`docs/qualtrics-setup.md`](docs/qualtrics-setup.md).
