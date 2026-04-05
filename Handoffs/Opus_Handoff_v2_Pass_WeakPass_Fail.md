# Handoff: Grading Scale Revision — Pass / Weak Pass / Fail

**From:** Claude Opus (second opinion review)  
**To:** Claude Code (implementation)  
**Date:** 2026-04-04  
**Re:** Replace 4-tier grading (Strong Pass / Weak Pass / Partial / Fail) with 3-tier grading (Pass / Weak Pass / Fail), fix grading instability on the Fail example answer, and update all affected code.  
**File:** `CCADemo.jsx`

---

## Context for Claude Code

ArchieCur built a demo for the Role-Based CCA Exam Framework that grades open-ended answers via an API call to Claude. The demo has four example answers (Strong Pass, Weak Pass, Partial, Fail) and a grading prompt that returns PASS, PARTIAL, or FAIL.

Two problems exist:

1. **The Fail example answer grades inconsistently** — sometimes FAIL, sometimes PARTIAL. Root cause: the answer contains a sentence about tool validation that the grader intermittently interprets as partial credit for Concept 2, pushing the grade from FAIL to PARTIAL.

2. **The Partial grade serves no real assessment purpose.** In certification, you either demonstrated the competency or you didn't. The Partial zone creates grader ambiguity without adding value.

The decision is to move to **Pass / Weak Pass / Fail**, where:
- **Pass** = all three concepts demonstrated (current Strong Pass)
- **Weak Pass** = the core architectural insight is present but implementation details are incomplete (current Weak Pass)
- **Fail** = the candidate did not cross the conceptual threshold

This collapses the old Strong Pass and Weak Pass into a Pass/Weak Pass pair (no change needed to those answers), eliminates the Partial grade, and revises the old Partial example answer to work as a proper Weak Pass.

---

## Summary of All Changes

| # | What | Where in CCADemo.jsx | Type |
|---|------|---------------------|------|
| 1 | Replace `GRADING_SYSTEM` prompt | Lines 51–104 | Full replacement |
| 2 | Rename `"partial"` key to `"weak-pass-2"` in `TEST_ANSWERS` and revise its text | Lines 121–125 | Key rename + content edit |
| 3 | Rename existing `"weak-pass"` key to `"pass"` and `"strong-pass"` to — see note | Lines 107–119 | Key renames |
| 4 | Update `gradeColor` mapping | Lines 189–193 | Replace PARTIAL with WEAK_PASS |
| 5 | Update example button array | Lines 344–348 | New labels and colors |
| 6 | Update grade display to handle `WEAK_PASS` | Line 193 | Add mapping |

---

## Change 1: Replace GRADING_SYSTEM Prompt

Replace the entire `GRADING_SYSTEM` constant (lines 51–104) with:

```javascript
const GRADING_SYSTEM = `You are a rigorous examiner for the Claude Certified Architect (CCA) certification,
grading an open-ended scenario question about enterprise AI architecture.

The question tests: Task 1.5 — Apply Agent SDK hooks for tool call interception and data normalization
Role context: Finance professional at a SOX-regulated public company
Vertical: SOX compliance, separation of duties, audit trail requirements

SCORING RUBRIC (derived from the Relevance Rationale and Vertical Notes):

A PASSING answer must demonstrate understanding of ALL THREE of these concepts:

1. PROGRAMMATIC ENFORCEMENT GAP: The candidate must identify that relying on system prompt instructions
   alone to enforce the $50,000 approval threshold is architecturally insufficient. Prompt-based
   compliance has a non-zero failure rate. In a SOX-regulated environment, a control that "usually works"
   is not a control — it is a gap that auditors will find and flag.

2. HOOK-BASED SOLUTION: The candidate must describe using Agent SDK hooks (specifically pre-execution
   or PostToolUse hooks) to intercept process_payment tool calls, programmatically verify that
   authorization has been obtained before execution is permitted, and block payment processing
   when the threshold is exceeded without documented approval. The hook — not the prompt — is
   what makes the control deterministic.

   SPECIFICITY THRESHOLD FOR CONCEPT 2: The candidate must describe an interception mechanism —
   code that executes before or after the tool call, inspects the call parameters or authorization
   state, and makes a programmatic permit/block decision. Acceptable descriptions include Agent SDK
   hooks, pre-execution hooks, PostToolUse hooks, middleware that intercepts tool calls, or equivalent
   descriptions of code that gates execution based on a programmatic check. Vague references to
   "adding validation to the tool," "building constraints into the tool," or "adding parameters to
   the tool" are NOT sufficient — these could describe input schemas, parameter validation, or tool
   redesign, none of which constitute hook-based interception. If you cannot determine whether the
   candidate is describing a hook or a tool parameter change, the concept is not demonstrated.

3. SOX AUDIT TRAIL REQUIREMENT: The candidate must address that SOX compliance requires documented
   evidence that controls actually fired, not just that controls were instructed to fire. Hook logs
   must be audit-trail quality — timestamped, tamper-evident records showing that the control
   intercepted the tool call, verified authorization, and either permitted or blocked execution.
   The audit evidence must be generated by the enforcement mechanism itself (the hook), not by the
   agent following a prompt instruction to log its actions.

GRADING SCALE:
- PASS: Demonstrates clear understanding of all three concepts. Language may differ from the rubric
  but the underlying reasoning must be present.
- WEAK_PASS: Demonstrates the core architectural insight — that enforcement must be programmatic,
  not prompt-based — and describes hook-based interception, but is incomplete on one concept.
  Typically: the candidate understands Concepts 1 and 2 but does not fully address the SOX audit
  trail requirement (Concept 3), or addresses it only as a prompt-level logging concern rather
  than as hook-generated evidence.
- FAIL: Demonstrates understanding of one or zero concepts, OR has Concept 1 disqualified (see below).
  Likely focuses on surface issues (prompt wording, missing fields) without understanding the
  architectural failure.

GRADE CEILING RULE: If Concept 1 is disqualified (see below), the maximum possible grade is FAIL,
regardless of how many other concepts the candidate demonstrates. A candidate who recommends prompt
changes as enforcement has revealed a fundamental misunderstanding of the architectural boundary
this question tests. Correct secondary observations about hooks or audit trails do not offset this —
they indicate surface familiarity with vocabulary, not understanding of why the prompt is irrelevant
to the control. Apply this ceiling before determining the final grade.

IMPORTANT GRADING PRINCIPLES:

EVALUATION ORDER: First, check whether the candidate recommends prompt changes as part of the
enforcement solution. If yes, Concept 1 is disqualified and the grade ceiling is FAIL — do not
proceed to assess other concepts for grade elevation. Then assess Concepts 2 and 3 for the purpose
of feedback (concepts_demonstrated, concepts_missing, examiner_note) but do not allow them to
raise the grade above FAIL.

- Do not require exact terminology. A candidate who says "the rule needs to be enforced in code,
  not just told to the AI" has demonstrated Concept 1 even without using the word "hook."
- Do not penalize for additional correct observations beyond the rubric.
- Do penalize for actively wrong statements. In particular: recommending that the system prompt
  be improved, rewritten, strengthened, or made more specific as part of the enforcement solution
  is not a minor error — it is evidence that the candidate believes prompt-level compliance is
  a viable control. This is the specific misunderstanding the question is designed to detect.
- DISQUALIFYING FOR CONCEPT 1: If the candidate recommends improving, rewriting, or strengthening
  the system prompt as part of the enforcement solution, Concept 1 is NOT demonstrated — regardless
  of any other correct observations in the response. A candidate who understands Concept 1 knows
  the prompt is irrelevant to the control. Recommending prompt changes as a fix proves they do not.
  When this disqualifier fires, the GRADE CEILING RULE above also applies.
- Be direct and specific. Name exactly which concepts were demonstrated and which were missing.
- Your grade must be one of: PASS, WEAK_PASS, or FAIL.

Respond in this exact JSON structure:
{
  "grade": "PASS" | "WEAK_PASS" | "FAIL",
  "summary": "One sentence verdict",
  "concepts_demonstrated": ["list of rubric concepts the candidate clearly showed"],
  "concepts_missing": ["list of rubric concepts absent or insufficient"],
  "key_strength": "The most impressive thing the candidate demonstrated",
  "key_gap": "The most important thing missing or wrong",
  "examiner_note": "2-3 sentences of specific, actionable feedback grounded in the SOX context"
}`;
```

---

## Change 2: Revise TEST_ANSWERS

The old 4-answer structure was: `strong-pass`, `weak-pass`, `partial`, `fail`.

The new 3-answer structure is: `pass`, `weak-pass`, `fail`.

- **`strong-pass`** → rename key to **`pass`**. No text changes — this is now the Pass example.
- **`weak-pass`** → keep key as **`weak-pass`**. No text changes — this already grades correctly as a Weak Pass.
- **`partial`** → **delete entirely**. This answer is no longer needed.
- **`fail`** → keep as-is. No text changes.

The resulting `TEST_ANSWERS` object should be:

```javascript
const TEST_ANSWERS = {
  "pass": `The core architectural failure is that this system relies entirely on system prompt instructions to enforce a financial control. That is not a control — it is a suggestion. Language model behavior is probabilistic. In a SOX-regulated environment, any control with a non-zero failure rate is an audit finding waiting to happen. The $50,000 approval threshold is a material internal control under SOX Section 302/404. It cannot live in a prompt.

The fix requires PostToolUse hooks on the process_payment tool. The hook intercepts every call to that tool before execution, reads the invoice amount, checks whether a documented manager approval exists in the authorization record, and blocks execution if the threshold is exceeded without it. The agent's instructions become irrelevant to enforcement — the hook either permits or denies the call regardless of what the prompt says.

The second issue the Finance Director is almost certainly flagging is the audit trail. SOX doesn't just require that controls exist — it requires documented evidence that they fired on specific transactions. A write_audit_log tool call that the agent decides to make is not sufficient. The hook must generate its own tamper-evident log entry: timestamped, recording the tool call parameters, the authorization check result, and the permit/block decision. This record needs to exist independent of the agent's behavior, because the agent's behavior is exactly what auditors are verifying.

Putting process_payment in the tools list with no hook is the functional equivalent of telling your AP clerk "please remember to get approval for large payments" and calling that your internal control.`,

  "weak-pass": `The problem is that the approval requirement for payments over $50,000 is written into the system prompt as an instruction, not enforced programmatically. LLMs don't guarantee that they follow instructions 100% of the time — there's always some probability of the instruction being ignored, misinterpreted, or bypassed in an edge case. For a financial control that needs to be reliable, that's not acceptable.

The right approach is to implement hooks in the Agent SDK that intercept the process_payment tool call. Before the payment executes, the hook should check whether manager approval has been documented for that invoice. If not, the hook blocks the call and routes it to the approval workflow. This makes the control deterministic — it doesn't matter what the agent was told to do, the hook enforces the rule at the infrastructure level.

For SOX compliance you also need logging. Every time the hook fires, it should record what happened — which invoice, what amount, whether it was approved or blocked, and when. This gives auditors the evidence they need to verify the control is working. The system currently relies on the agent calling write_audit_log itself, which isn't reliable enough because it's still just an instruction.`,

  "fail": `The Finance Director's concern is valid. Looking at the code, there are several issues that would cause problems in a SOX audit.

The system prompt mentions the $50,000 threshold but the process_payment tool has no amount limit — the comment even says "Can execute payments up to any amount." This is a direct contradiction. The tool should have validation built in to reject payments over the threshold unless an approval flag is set.

The audit log is also a concern. The agent is instructed to "always document your actions in the audit log" but this is vague. For SOX compliance, audit entries need to include specific fields — invoice ID, amount, approver name, timestamp, and approval date. The current instruction doesn't specify any of this.

I would recommend rewriting the system prompt to be much more specific: require the agent to call notify_manager and wait for a confirmation response before calling process_payment on any invoice over $50,000. Add validation parameters to the process_payment tool itself. And define a structured format for audit log entries that captures all the fields an auditor would need to see.`
};
```

---

## Change 3: Update gradeColor Mapping

Replace lines 189–193:

```javascript
const gradeColor = grading ? {
  PASS: { bg: "#0f4c2a", border: "#22c55e", text: "#4ade80", label: "PASS" },
  WEAK_PASS: { bg: "#1a3a2e", border: "#86efac", text: "#86efac", label: "WEAK PASS" },
  FAIL: { bg: "#4a0f0f", border: "#ef4444", text: "#f87171", label: "FAIL" }
}[grading.grade] : null;
```

Note: The Weak Pass uses a softer green (`#86efac` / `#1a3a2e`) to visually distinguish it from a full Pass while keeping it in the green family — it's still a pass, just a qualified one.

---

## Change 4: Update Example Button Array

Replace lines 344–348:

```javascript
{[
  { key: "pass",      label: "PASS",      color: "#22c55e", bg: "#0f2a1a", border: "#2d5a2d" },
  { key: "weak-pass", label: "Weak PASS", color: "#86efac", bg: "#0a1f14", border: "#1e3a28" },
  { key: "fail",      label: "FAIL",      color: "#f87171", bg: "#2a0f0f", border: "#4a1a1a" }
].map(({ key, label, color, bg, border }) => (
```

---

## Design Notes for Claude Code

- The grade value returned by the API is now `WEAK_PASS` (with underscore), not `Weak PASS`. The `gradeColor` lookup uses the API value. The button `label` uses the display-friendly `"Weak PASS"` with a space. Make sure these don't get crossed.
- The old `"partial"` key in `TEST_ANSWERS` is deleted, not renamed. If there are any other references to `"partial"` as a key in the codebase beyond what's in this file, they should be removed.
- The `"strong-pass"` key is renamed to `"pass"`. Check for any references to `"strong-pass"` beyond the button array and TEST_ANSWERS object.
- The grading prompt uses `WEAK_PASS` consistently (with underscore) in the JSON schema, grading scale, and instructions. This is intentional — it avoids parsing issues with spaces in JSON values.

---

## Testing Checklist

After applying all changes:

1. **Pass answer** — run 3x, expect consistent PASS
2. **Weak Pass answer** — run 5x, expect consistent WEAK_PASS (this is the old Weak Pass answer, which demonstrates all three concepts but with less depth on the audit trail — it should remain stable)
3. **Fail answer** — run 5x, expect consistent FAIL (this was the unstable one — the grade ceiling rule and Concept 2 specificity threshold should stabilize it)
4. **Verify UI rendering** — confirm the Weak Pass result displays with the softer green styling, not amber/yellow
5. **Verify no PARTIAL references remain** — search the full file for "PARTIAL" and "partial" to confirm cleanup is complete

---

## Files Modified

- `CCADemo.jsx` — GRADING_SYSTEM prompt, TEST_ANSWERS, gradeColor, button array

## Files NOT Modified

- No changes to CSV_ROW, SCENARIO, CODE_SNIPPET, QUESTION, API call logic, or any other UI components.
