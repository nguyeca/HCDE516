# How the Qualtrics survey is wired

Survey: **HCDE 516 - Tipping Point - V2 photo version** (UW Qualtrics).

## Survey flow (order matters)

1. **Set Embedded Data** (declares every field; leave values empty):
   `condition`, `tip_choice`, `tip_percent`, `tip_amount`, `custom_opened`, `decision_ms`,
   `service`, `defaults`, `scenario`, `reminder`
2. **Randomizer**: present **1** of the 4 elements below, **Evenly Present Elements** checked.
   Each element is a *Set Embedded Data* with:

   | Condition | `service` | `defaults` | Tip buttons |
   |---|---|---|---|
   | C1 | counter | low | 10 / 15 / 20% |
   | C2 | counter | high | 20 / 25 / 30% |
   | C3 | sitdown | low | 10 / 15 / 20% |
   | C4 | sitdown | high | 20 / 25 / 30% |

   Each also sets `scenario` (page 1 text) and `reminder` (page 2 text). Counter conditions share
   one wording, sit-down conditions share the other.
   `defaults` is saved for analysis only: the scripts decide low/high tips from `condition`
   (C1/C3 = low, C2/C4 = high), so editing `defaults` does not change the buttons.
3. **Scenario + checkout (Q1–Q2)** block: Q1, page break, Q2
4. **Manipulation check (Q3)** block: Q3

## Questions

| Q | Type | Question text | JavaScript |
|---|---|---|---|
| Q1 | Text / Graphic | the piped field `scenario` (insert via *Piped text → Embedded data → scenario*) | `qualtrics/check-screen.js` |
| Q2 | Text / Graphic | the piped field `reminder` | `qualtrics/tip-screen.js` |
| Q3 | Multiple choice, force response | "Thanks! Before you continue, think back to the scenario. Where did you pay?" — *At the counter, after I ordered* / *At my table, after my meal* | none |

The scripts hide Qualtrics' Next button on Q1 and Q2; the tablet's own buttons move people forward.

## Scene photos

Qualtrics Graphics Library (both 1200×675, same restaurant, color/brightness matched):

- counter: `IM_chCQClsbTgyeNfU`
- sit-down: `IM_6qB3StlKbskQQhv`

The scripts pick the photo from `service`. To swap a photo, upload the new one to the library,
copy its `IM_…` ID, and update `SCENES` near the top of **both** scripts.

## Saved data

| Field | Values | Notes |
|---|---|---|
| `condition` | C1–C4 | from the Randomizer |
| `tip_choice` | preset_1, preset_2, preset_3, custom, none | preset_1 = leftmost button |
| `tip_percent` | number | % of the **pre-tax subtotal** ($22.60) — use this as the DV |
| `tip_amount` | dollars | |
| `custom_opened` | 1 / 0 | opened the keypad at any point |
| `decision_ms` | milliseconds | tip screen shown → final choice |

Manipulation check: C1/C2 should answer "At the counter", C3/C4 "At my table". Decide as a team,
before collecting data, what to do with people who miss it.

## Layout behavior

- 1100px+ wide: side-by-side (text + photo left, tablet right); the scripts widen Qualtrics' page.
- Narrower: stacked, photo on top with the tablet overlapping it.
- The UW logo is shrunk by the scripts; it stays small for the rest of the survey (Q3 and the end page).
