# CCA Demo — Role-Based Open-Ended Exam Framework

**Live demo:** [https://cca-hazel.vercel.app](https://cca-hazel.vercel.app)

A proof-of-concept demonstrating that structured curriculum data can generate, personalize, and AI-grade open-ended exam questions — submitted as part of an application to Anthropic's curriculum team.

---

## The Problem This Addresses

The Claude Certified Architect (CCA) certification currently relies on multiple-choice questions. Multiple choice can verify recognition — whether a candidate has seen a concept before. It cannot verify understanding — whether a candidate can reason about that concept in a real enterprise context under pressure.

This demo argues that the data needed to do better already exists in the CCA curriculum mapping framework, and that Claude can close the gap.

---

## The Core Claim (Section 6.1)

The CCA Role-Based Mapping Framework is a 103-row CSV where each row maps a task statement to a specific professional role. Each row contains two fields that together constitute a complete question seed:

- **Relevance Rationale** — explains *why* this task matters to this role. This is the correct answer logic.
- **Vertical Notes** — describes industry-specific compliance and regulatory context. These are the personalization variables.

The claim tested in this demo: a single CSV row contains everything needed to generate a scenario question, derive a grading rubric, and evaluate a free-text candidate response — without any additional content authoring.

---

## This Demo

**Row used:** Task 1.5 — *Apply Agent SDK hooks for tool call interception and data normalization*
**Role:** Finance
**Vertical:** SOX compliance, publicly traded financial services firm

The demo presents a realistic code review scenario: an accounts payable AI system that enforces a $50,000 payment approval threshold through system prompt instructions rather than programmatic hooks. A Finance Director has flagged it as SOX non-compliant.

Candidates write a free-text response identifying the architectural failure and describing the correct approach. Claude grades the response against a three-concept rubric derived directly from the CSV row's Relevance Rationale and Vertical Notes.

### The Three Rubric Concepts

| # | Concept | Source |
|---|---------|--------|
| 1 | Prompt-based enforcement is architecturally insufficient for SOX controls | Relevance Rationale |
| 2 | Agent SDK hooks must intercept and block `process_payment` programmatically | Relevance Rationale |
| 3 | SOX requires tamper-evident hook logs as evidence that controls fired | Vertical Notes |

### Grading Output

The grader returns structured JSON rendered as:
- **PASS / WEAK PASS / FAIL** verdict
- Concepts demonstrated and concepts missing
- Key strength and key gap
- Examiner note with specific, actionable feedback grounded in the SOX context

**Grading scale:**
- **Pass** — all three concepts demonstrated
- **Weak Pass** — core architectural insight present, one concept incomplete
- **Fail** — conceptual threshold not crossed, or Concept 1 disqualified by prompt-change recommendation

---

## Test Results

Three answers were written at calibrated quality levels and run through the live grader:

| Answer | Expected | Result | Match |
|--------|----------|--------|-------|
| Pass | PASS | PASS | ✓ |
| Weak Pass | WEAK PASS | WEAK PASS | ✓ |
| Fail | FAIL | FAIL | ✓ |

**3 of 3 correct after rubric calibration.**

**Finding F-01 — Full Resolution Story:**

This finding went through two iterations, documented here in full because the iterative diagnosis is itself a demonstration of the framework's refinability.

- **Original problem:** The Fail example answer graded inconsistently — sometimes FAIL, sometimes PARTIAL. Root cause was two interacting gaps: no grade ceiling on the Concept 1 disqualifier, and insufficient specificity threshold on Concept 2 (vague tool-validation language was intermittently credited as hook-based interception).

- **v1 fix (disqualifier rule):** Added a rule that nullified Concept 1 when the candidate recommended prompt changes. This reduced but did not eliminate instability — the grader could still award partial credit on Concepts 2 and 3 and reach PARTIAL even with Concept 1 disqualified.

- **v2 fix (full resolution, current):** Three changes applied together: (a) grade ceiling rule — if Concept 1 is disqualified, maximum grade is FAIL regardless of other concepts; (b) Concept 2 specificity threshold — vague tool-validation language no longer qualifies as demonstrating hook-based interception; (c) grading scale simplified from 4 tiers (Strong Pass / Weak Pass / Partial / Fail) to 3 tiers (Pass / Weak Pass / Fail), eliminating the ambiguous middle zone. Verified stable across repeated runs.
 
---

## Running the Demo Locally

### Prerequisites
- Node.js (v18 or higher) — [nodejs.org](https://nodejs.org)
- An Anthropic API key — [console.anthropic.com](https://console.anthropic.com)

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/ArchieCur/CCA.git
cd CCA

# 2. Install dependencies
npm install

# 3. Add your API key
cp .env.local.example .env.local
# Open .env.local and paste your Anthropic API key

# 4. Start the app
npm run dev

# 5. Open in browser
# http://localhost:3000
```

### Using the Demo

The Question tab includes three **Load Example Answer** buttons (Pass, Weak Pass, Fail) so a reviewer can see the full grading range without typing. Click any button, hit **Submit for AI Grading**, and the result appears in the Result tab within a few seconds.

The **CSV Source Row** tab shows the exact row the question was generated from. The **Grading Rubric** tab shows how the rubric maps to the CSV fields.

---

## What This Is Not

This is a focused proof-of-concept for one CSV row, one role, and one vertical. It is not a production exam system. The intent is to demonstrate that the methodology is sound and that the data structure already in the CCA framework supports this approach — the path from here to a full implementation is a matter of engineering, not invention.

---

## Built With

- [Next.js](https://nextjs.org) — React framework with API routes for secure server-side API calls
- [Claude API](https://anthropic.com) — claude-sonnet-4-6 for live open-ended grading
- ArchieCur + Claude Sonnet + Claude Code · 2026
