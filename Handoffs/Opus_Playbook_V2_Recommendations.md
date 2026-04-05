# Playbook V2 Recommendations: Enterprise AI Adoption Dev Guide

**From:** Claude Opus (Deputy, CCA Posse)  
**To:** ArchieCur + Claude Sonnet + Claude Code  
**Date:** 2026-04-05  
**Re:** Recommended changes for Playbook V2, based on review of the repo, role profiles, and CCA mapping work

---

## Design Principle for All Recommendations

The playbook works because it's short enough to read the night before a meeting. Every recommendation below is evaluated against that constraint. Nothing here adds more than a few lines to any single file. If a recommendation would make a developer glaze over mid-role, it doesn't belong.

---

## Recommendation 1: "Before You Choose a Model Tier" Gate

**Where:** Introduction (Appendix C / Start Here section) — add a short section before the four-cluster framing or immediately after it, before developers encounter individual role files.

**What:** Five yes/no questions that signal a task needs deterministic code, not a model of any size. These are role-independent and task-level — a developer applies them before opening a role file.

**Proposed content:**

> ### Before You Choose a Model Tier
>
> Not every task needs a model. Before selecting Small, Medium, or Large,
> ask whether the task needs a model at all. If the answer to any of
> these is yes, the task needs deterministic code — not a prompt.
>
> 1. Does the task have a single correct answer that can be looked up or calculated?
> 2. Does a wrong output create legal, financial, or compliance liability?
> 3. Is the task enforcing a rule that must fire 100% of the time?
> 4. Does the output need to be identical every time the same input is provided?
> 5. Is the task a gatekeeping decision (permit/block, approve/reject) with no ambiguity in the criteria?
>
> A model that is told to enforce a rule will usually enforce it.
> Code that is written to enforce a rule will always enforce it.
> The difference between "usually" and "always" is the difference
> between a system that passes an audit and one that doesn't.

**Rationale:** This connects directly to the CCA mapping finding — that the distinction between prompt-based guidance and programmatic enforcement is the most common architectural mistake in regulated enterprise environments. It also prevents developers from defaulting to "use a model" for tasks where a model introduces unnecessary risk.

**Length impact:** ~15 lines added to the introduction. Zero lines added to any role file.

---

## Recommendation 2: "Enforce Outside the Prompt" Section in Workflow Starters

**Where:** Every role file's Fill-in-the-Blank Workflow Starter template, as a new section at the bottom.

**What:** A short structural element that forces the developer to identify which rules from the system prompt must be programmatically enforced rather than prompt-instructed.

**Proposed addition to the template:**

```
ENFORCE OUTSIDE THE PROMPT:
Before deploying this workflow, review every rule in the
Always and Never sections above. List any rule that must
fire 100% of the time — these cannot live in the prompt.
They require programmatic enforcement (hooks, middleware,
tool-level validation, or application logic).

Rules requiring programmatic enforcement:
- [RULE 1 — e.g., "approval threshold for payments
  over $50,000 must be enforced by a pre-execution
  hook, not a prompt instruction"]
- [RULE 2]
- [RULE 3]

If this section is empty, confirm that no rule in this
workflow carries legal, financial, or compliance liability
if it fails to fire on a single transaction.
```

**Rationale:** This is the bridge between the playbook and the CCA architectural insight. A developer who fills in this section has identified the hooks they need to build. A developer who writes "none" has at least considered the question. The final sentence — "confirm that no rule carries liability if it fails to fire" — is designed to make the developer pause before leaving the section empty.

**Length impact:** ~15 lines added to each workflow starter template. The section is structural (fill-in-the-blank), not prose, so it doesn't add reading time — it adds thinking time, which is the point.

---

## Recommendation 3: Elevate the Seventeen-Conversation Table

**Where:** README and Introduction.

**What:** The seventeen-conversation table in the introduction is the single highest-value artifact for a developer in a hurry. It should be more prominent.

**Proposed changes:**

- In the README "Start Here" section, add a direct callout: something like "If you read nothing else, read the seventeen-conversation table in the Introduction. It tells you who to talk to before development begins and what to bring when you do. Every conversation in that table is one whose absence becomes a deployment failure six months later."
- Consider whether the table itself (just the table, not the surrounding prose) should appear directly in the README as well as the introduction, so a developer scanning the README encounters it without clicking through.

**Rationale:** The table is practical, scannable, and immediately actionable. A developer can look at it, identify the three conversations relevant to their deployment, and schedule them today. That's the fastest path from "found this repo" to "changed my deployment process." It deserves the most prominent placement you can give it.

**Length impact:** 2-3 lines added to the README callout. If the table is duplicated in the README, ~20 lines (the table itself). This is the one recommendation where adding visible length is justified by the value density.

---

## Recommendation 4: Adjacent Role Cross-References in the CCA Mapping CSV

**Where:** This is a future recommendation for the CCA Role Mapping Framework, not the playbook itself — but it connects the two.

**What:** The playbook's role files end with "Adjacent Roles to Consider" sections. The CCA mapping CSV does not currently capture adjacency. When the CSV is used to generate exam questions, the adjacent roles are the source of the best distractor logic — because the architectural mistake for one role is often the correct answer for an adjacent role.

**Example:** The Finance profile says "also read Auditor." A CCA question about Finance Task 1.5 (hooks for threshold enforcement) could use a distractor drawn from the Auditor profile's emphasis on evidence completeness — a candidate who focuses on audit trail completeness but misses the programmatic enforcement requirement has answered the Auditor question, not the Finance question.

**Proposed change:** Add an `Adjacent Roles` column to the CSV in a future version. This enables automated distractor generation from adjacent role rationale language.

**Length impact on playbook:** Zero. This is a CSV structure change.

---

## Recommendation 5: "What This Role Does NOT Need From AI" — One Line Per Role

**Where:** Each role file, as a single sentence added to the "What They Care About" section or as its own one-line section.

**What:** One sentence per role identifying the most common task that developers mistakenly try to automate with a model for this role when deterministic code is the correct answer.

**Examples:**

- **Finance:** "Finance does not need AI to enforce approval thresholds — that is a programmatic control, not a model task."
- **Auditor:** "Auditors do not need AI to generate audit evidence — evidence must originate from the system being audited, not from a model."
- **Support Engineer:** "Support Engineers do not need AI to classify tickets into escalation paths — if the classification criteria are unambiguous, a rules engine is more reliable and more auditable."

**Rationale:** This is the role-specific version of Recommendation 1. The introduction gives the general principle; this gives the developer the one mistake they're most likely to make for this specific role. One sentence. No glazing.

**Length impact:** One sentence per role file. Approximately 15-25 words per file.

---

## Recommendations NOT Made

For transparency, here are changes I considered and rejected:

- **Adding code examples to role files.** Would make the profiles dramatically more useful for developers but would double the length and shift the register from "practitioner guide" to "technical reference." Wrong trade-off for V2. Possibly right for a companion repo.
- **Adding industry-specific sub-profiles (Finance → Healthcare Finance, Finance → Public Sector Finance).** This is the vertical notes layer from the CCA mapping. It's the right idea but the wrong time — the role profiles need to stabilize before vertical specialization is layered on. The CCA CSV already captures this in the Vertical Notes column; the playbook doesn't need to duplicate it yet.
- **Adding a "How to Test This" section to each role.** Would connect the playbook to the CCA exam framework directly but adds significant length and shifts the document's purpose from "understand the role" to "assess the developer." The CCA mapping framework already serves that function.
- **Restructuring the tier system.** The five-tier structure works. The four-cluster framing in the introduction provides the alternative mental model. No reason to change either.

---

## Implementation Priority

If the posse has limited time and wants to ship the highest-value changes first:

1. **Recommendation 1** (model gate) + **Recommendation 2** (enforce outside the prompt) — these two together connect the playbook to the CCA architectural insight and take maybe 30 minutes to implement across all files.
2. **Recommendation 3** (elevate the seventeen-conversation table) — 10 minutes, high visibility improvement.
3. **Recommendation 5** (one line per role) — requires per-role thinking, maybe 60-90 minutes across 25 roles, but each line is high-value.
4. **Recommendation 4** (adjacent roles in CSV) — future work, no urgency.

---

*Deputy Opus — CCA Posse*
