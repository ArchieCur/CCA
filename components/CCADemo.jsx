import { useState, useRef } from "react";

const CSV_ROW = {
  role: "Finance",
  tier: "Tier 2 — Common Enterprise",
  domain: "Domain 1: Agentic Architecture & Orchestration",
  taskStatement: "Apply Agent SDK hooks for tool call interception and data normalization",
  taskID: "1.5",
  rationale: `Finance's materiality thresholds and approval limits are non-negotiable business rules — not preferences. PostToolUse hooks that intercept transactions exceeding dollar thresholds and redirect to human approval workflows are the architecture pattern that maps directly to internal controls. This is the technical implementation of separation of duties.`,
  verticalNotes: `Public companies: SOX requires documented evidence that controls fired — hook logs must be audit-trail quality. Financial services: regulatory thresholds (e.g. BSA/AML reporting limits) may require hooks that trigger external reporting workflows, not just internal escalation.`
};

const SCENARIO = `You are reviewing an AI system built for Meridian Capital's Accounts Payable team,
a publicly traded financial services firm subject to SOX compliance. The system processes
invoice approvals and routes payment authorizations. The developer has delivered the following
architecture for handling large payment approvals:`;

const CODE_SNIPPET = `// Agent SDK configuration for AP approval workflow
const agent = new ClaudeAgent({
  system: \`You are an accounts payable assistant for Meridian Capital.

  When processing invoices:
  - Extract vendor name, amount, and invoice date
  - Match against approved vendor list
  - For invoices over $50,000, you MUST require manager approval before processing
  - Never process payments without proper authorization
  - Always document your actions in the audit log

  Remember: Separation of duties is critical. Never allow the same
  person to both submit and approve a payment.\`,

  tools: [
    get_invoice_details,
    check_vendor_approval,
    process_payment,        // Can execute payments up to any amount
    notify_manager,
    write_audit_log
  ]
});

// No hooks configured
// Agent handles all workflow logic through prompt instructions`;

const QUESTION = `The Finance Director at Meridian Capital has flagged this system during pre-deployment review.
She states: "This architecture will not pass our SOX audit and cannot go to production."

Identify what is architecturally wrong with this implementation and describe what changes
are required to make it SOX-compliant. Your answer should address both the technical
failure and why it matters in this specific enterprise context.`;

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

3. SOX AUDIT TRAIL REQUIREMENT: The candidate must address that SOX compliance requires documented
   evidence that controls actually fired, not just that controls were instructed to fire. Hook logs
   must be audit-trail quality — timestamped, tamper-evident records showing that the control
   intercepted the tool call, verified authorization, and either permitted or blocked execution.

GRADING SCALE:
- PASS: Demonstrates clear understanding of all three concepts. Language may differ from the rubric
  but the underlying reasoning must be present.
- PARTIAL: Demonstrates understanding of two of three concepts. Shows real knowledge but has a
  material gap that would matter in production.
- FAIL: Demonstrates understanding of one or zero concepts. Likely focuses on surface issues
  (prompt wording, missing fields) without understanding the architectural failure.

IMPORTANT GRADING PRINCIPLES:
- Do not require exact terminology. A candidate who says "the rule needs to be enforced in code,
  not just told to the AI" has demonstrated concept 1 even without using the word "hook."
- Do not penalize for additional correct observations beyond the rubric.
- Do penalize for actively wrong statements (e.g., "adding more detail to the system prompt would fix this").
- Be direct and specific. Name exactly which concepts were demonstrated and which were missing.
- Your grade must be one of: PASS, PARTIAL, or FAIL.

Respond in this exact JSON structure:
{
  "grade": "PASS" | "PARTIAL" | "FAIL",
  "summary": "One sentence verdict",
  "concepts_demonstrated": ["list of rubric concepts the candidate clearly showed"],
  "concepts_missing": ["list of rubric concepts absent or insufficient"],
  "key_strength": "The most impressive thing the candidate demonstrated",
  "key_gap": "The most important thing missing or wrong",
  "examiner_note": "2-3 sentences of specific, actionable feedback grounded in the SOX context"
}`;

const TEST_ANSWERS = {
  "strong-pass": `The core architectural failure is that this system relies entirely on system prompt instructions to enforce a financial control. That is not a control — it is a suggestion. Language model behavior is probabilistic. In a SOX-regulated environment, any control with a non-zero failure rate is an audit finding waiting to happen. The $50,000 approval threshold is a material internal control under SOX Section 302/404. It cannot live in a prompt.

The fix requires PostToolUse hooks on the process_payment tool. The hook intercepts every call to that tool before execution, reads the invoice amount, checks whether a documented manager approval exists in the authorization record, and blocks execution if the threshold is exceeded without it. The agent's instructions become irrelevant to enforcement — the hook either permits or denies the call regardless of what the prompt says.

The second issue the Finance Director is almost certainly flagging is the audit trail. SOX doesn't just require that controls exist — it requires documented evidence that they fired on specific transactions. A write_audit_log tool call that the agent decides to make is not sufficient. The hook must generate its own tamper-evident log entry: timestamped, recording the tool call parameters, the authorization check result, and the permit/block decision. This record needs to exist independent of the agent's behavior, because the agent's behavior is exactly what auditors are verifying.

Putting process_payment in the tools list with no hook is the functional equivalent of telling your AP clerk "please remember to get approval for large payments" and calling that your internal control.`,

  "weak-pass": `The problem is that the approval requirement for payments over $50,000 is written into the system prompt as an instruction, not enforced programmatically. LLMs don't guarantee that they follow instructions 100% of the time — there's always some probability of the instruction being ignored, misinterpreted, or bypassed in an edge case. For a financial control that needs to be reliable, that's not acceptable.

The right approach is to implement hooks in the Agent SDK that intercept the process_payment tool call. Before the payment executes, the hook should check whether manager approval has been documented for that invoice. If not, the hook blocks the call and routes it to the approval workflow. This makes the control deterministic — it doesn't matter what the agent was told to do, the hook enforces the rule at the infrastructure level.

For SOX compliance you also need logging. Every time the hook fires, it should record what happened — which invoice, what amount, whether it was approved or blocked, and when. This gives auditors the evidence they need to verify the control is working. The system currently relies on the agent calling write_audit_log itself, which isn't reliable enough because it's still just an instruction.`,

  "partial": `The architecture has two problems. First, the system prompt instructions are the only thing enforcing the approval requirement, and they're not specific enough. The prompt says "you MUST require manager approval" but doesn't define what counts as approval, how to verify it, or what to do if the manager doesn't respond. The agent could interpret this in different ways.

Second, and more importantly, there are no hooks configured. The Agent SDK has a hook system specifically designed for this kind of workflow enforcement. A pre-execution hook on the process_payment tool would intercept the call before it runs, verify that the invoice amount has been approved, and block it if not. This is much more reliable than relying on the agent to make the right decision based on prompt instructions alone.

To fix this: implement hooks on process_payment, strengthen the prompt language to be more explicit about the approval verification steps, and make sure the notify_manager tool is called before process_payment in any workflow involving amounts over the threshold. The Finance Director is right that this needs to be tightened up before it can go to a SOX audit.`,

  "fail": `The Finance Director's concern is valid. Looking at the code, there are several issues that would cause problems in a SOX audit.

The system prompt mentions the $50,000 threshold but the process_payment tool has no amount limit — the comment even says "Can execute payments up to any amount." This is a direct contradiction. The tool should have validation built in to reject payments over the threshold unless an approval flag is set.

The audit log is also a concern. The agent is instructed to "always document your actions in the audit log" but this is vague. For SOX compliance, audit entries need to include specific fields — invoice ID, amount, approver name, timestamp, and approval date. The current instruction doesn't specify any of this.

I would recommend rewriting the system prompt to be much more specific: require the agent to call notify_manager and wait for a confirmation response before calling process_payment on any invoice over $50,000. Add validation parameters to the process_payment tool itself. And define a structured format for audit log entries that captures all the fields an auditor would need to see.`
};

export default function CCADemo() {
  const [activeTab, setActiveTab] = useState("question");
  const [answer, setAnswer] = useState("");
  const [grading, setGrading] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedExample, setSelectedExample] = useState("");
  const textareaRef = useRef(null);

  const loadExample = (key) => {
    setSelectedExample(key);
    setAnswer(TEST_ANSWERS[key] || "");
    setGrading(null);
    setError(null);
  };

  const gradeAnswer = async () => {
    if (answer.trim().length < 50) {
      setError("Please provide a substantive answer before submitting for grading.");
      return;
    }
    setError(null);
    setLoading(true);
    setGrading(null);

    try {
      const response = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: GRADING_SYSTEM,
          messages: [{
            role: "user",
            content: `Grade this candidate response to the Finance/SOX architecture question:\n\n${answer}`
          }]
        })
      });

      const data = await response.json();
      const text = data.content[0].text;
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setGrading(parsed);
      setActiveTab("result");
    } catch (err) {
      setError("Grading failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const gradeColor = grading ? {
    PASS: { bg: "#0f4c2a", border: "#22c55e", text: "#4ade80", label: "PASS" },
    PARTIAL: { bg: "#4a2e00", border: "#f59e0b", text: "#fbbf24", label: "PARTIAL" },
    FAIL: { bg: "#4a0f0f", border: "#ef4444", text: "#f87171", label: "FAIL" }
  }[grading.grade] : null;

  return (
    <div style={{
      fontFamily: "'Georgia', 'Times New Roman', serif",
      background: "#0a0e1a",
      minHeight: "100vh",
      color: "#e2e8f0",
      padding: "0"
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #0f1729 0%, #1a2744 100%)",
        borderBottom: "1px solid #2a3a5c",
        padding: "24px 32px",
        display: "flex",
        alignItems: "flex-start",
        gap: "20px"
      }}>
        <div style={{
          background: "#1e3a6e",
          border: "1px solid #3b5a9a",
          borderRadius: "8px",
          padding: "10px 14px",
          flexShrink: 0
        }}>
          <div style={{ fontSize: "10px", color: "#7a9fd4", letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "monospace" }}>CCA</div>
          <div style={{ fontSize: "20px", fontWeight: "bold", color: "#60a5fa", fontFamily: "monospace" }}>1.5</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "11px", color: "#7a9fd4", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "4px", fontFamily: "'Courier New', monospace" }}>
            Section 6.1 Demonstration — Role-Based CCA Framework
          </div>
          <div style={{ fontSize: "22px", fontWeight: "bold", color: "#e2e8f0", lineHeight: 1.3 }}>
            Finance Architecture Review
          </div>
          <div style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>
            Domain 1: Agentic Architecture & Orchestration &nbsp;·&nbsp; SOX Vertical
          </div>
        </div>
        <div style={{
          background: "#1a2a1a",
          border: "1px solid #2d5a2d",
          borderRadius: "6px",
          padding: "6px 12px",
          fontSize: "11px",
          color: "#4ade80",
          fontFamily: "monospace",
          letterSpacing: "0.08em"
        }}>
          LIVE AI GRADING
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: "flex",
        borderBottom: "1px solid #1e2d4a",
        background: "#0d1424",
        padding: "0 32px"
      }}>
        {[
          { id: "question", label: "Question" },
          { id: "source", label: "CSV Source Row" },
          { id: "rubric", label: "Grading Rubric" },
          { id: "result", label: grading ? `Result: ${grading.grade}` : "Result" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: "none",
              border: "none",
              borderBottom: activeTab === tab.id ? "2px solid #60a5fa" : "2px solid transparent",
              color: activeTab === tab.id ? "#60a5fa" : "#64748b",
              padding: "14px 20px",
              fontSize: "13px",
              cursor: "pointer",
              fontFamily: "'Georgia', serif",
              letterSpacing: "0.02em",
              transition: "color 0.15s"
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "32px", maxWidth: "900px", margin: "0 auto" }}>

        {/* QUESTION TAB */}
        {activeTab === "question" && (
          <div>
            {/* Scenario */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ fontSize: "11px", color: "#7a9fd4", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "12px", fontFamily: "monospace" }}>Scenario</div>
              <p style={{ fontSize: "15px", color: "#cbd5e1", lineHeight: "1.7", margin: 0 }}>{SCENARIO}</p>
            </div>

            {/* Code */}
            <div style={{
              background: "#0d1117",
              border: "1px solid #21262d",
              borderRadius: "8px",
              marginBottom: "24px",
              overflow: "hidden"
            }}>
              <div style={{
                background: "#161b22",
                borderBottom: "1px solid #21262d",
                padding: "10px 16px",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ff5f57" }} />
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#febc2e" }} />
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#28c840" }} />
                <span style={{ marginLeft: "8px", fontSize: "11px", color: "#8b949e", fontFamily: "monospace" }}>ap_approval_agent.js</span>
              </div>
              <pre style={{
                margin: 0,
                padding: "20px",
                fontSize: "12.5px",
                lineHeight: "1.7",
                color: "#c9d1d9",
                fontFamily: "'Courier New', Courier, monospace",
                overflowX: "auto",
                whiteSpace: "pre-wrap"
              }}>{CODE_SNIPPET}</pre>
            </div>

            {/* Question */}
            <div style={{
              background: "#111827",
              border: "1px solid #1e3a5c",
              borderLeft: "4px solid #3b82f6",
              borderRadius: "8px",
              padding: "20px 24px",
              marginBottom: "24px"
            }}>
              <div style={{ fontSize: "11px", color: "#60a5fa", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "12px", fontFamily: "monospace" }}>Question</div>
              <p style={{ fontSize: "15px", color: "#e2e8f0", lineHeight: "1.7", margin: 0 }}>{QUESTION}</p>
            </div>

            {/* Example answer loader */}
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "11px", color: "#7a9fd4", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "10px", fontFamily: "monospace" }}>
                Load Example Answer
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {[
                  { key: "strong-pass", label: "Strong PASS", color: "#22c55e", bg: "#0f2a1a", border: "#2d5a2d" },
                  { key: "weak-pass",   label: "Weak PASS",   color: "#86efac", bg: "#0a1f14", border: "#1e3a28" },
                  { key: "partial",     label: "PARTIAL",     color: "#fbbf24", bg: "#2a1f00", border: "#4a3800" },
                  { key: "fail",        label: "FAIL",        color: "#f87171", bg: "#2a0f0f", border: "#4a1a1a" }
                ].map(({ key, label, color, bg, border }) => (
                  <button
                    key={key}
                    onClick={() => loadExample(key)}
                    style={{
                      background: selectedExample === key ? bg : "#0d1424",
                      border: `1px solid ${selectedExample === key ? border : "#2a3a5c"}`,
                      borderRadius: "6px",
                      color: selectedExample === key ? color : "#64748b",
                      fontSize: "12px",
                      padding: "8px 16px",
                      cursor: "pointer",
                      fontFamily: "monospace",
                      letterSpacing: "0.05em",
                      transition: "all 0.15s"
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Answer area */}
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "11px", color: "#7a9fd4", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "10px", fontFamily: "monospace" }}>
                Your Answer
              </div>
              <textarea
                ref={textareaRef}
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                placeholder="Identify the architectural flaw and describe the correct approach. Address both the technical failure and why it matters in this SOX-regulated enterprise context."
                style={{
                  width: "100%",
                  minHeight: "200px",
                  background: "#0d1424",
                  border: "1px solid #2a3a5c",
                  borderRadius: "8px",
                  color: "#e2e8f0",
                  fontSize: "14px",
                  lineHeight: "1.7",
                  padding: "16px",
                  fontFamily: "'Georgia', serif",
                  resize: "vertical",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
              <div style={{ fontSize: "12px", color: "#475569", marginTop: "6px", textAlign: "right" }}>
                {answer.length} characters
              </div>
            </div>

            {error && (
              <div style={{ color: "#f87171", fontSize: "13px", marginBottom: "12px", padding: "10px 14px", background: "#1f0f0f", borderRadius: "6px", border: "1px solid #7f1d1d" }}>
                {error}
              </div>
            )}

            <button
              onClick={gradeAnswer}
              disabled={loading}
              style={{
                background: loading ? "#1e2d4a" : "#1d4ed8",
                border: "1px solid " + (loading ? "#2a3a5c" : "#3b82f6"),
                borderRadius: "8px",
                color: loading ? "#64748b" : "#e2e8f0",
                fontSize: "14px",
                padding: "14px 28px",
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "'Georgia', serif",
                letterSpacing: "0.03em",
                transition: "all 0.2s",
                width: "100%"
              }}
            >
              {loading ? "Grading your answer against the SOX rubric..." : "Submit for AI Grading"}
            </button>
          </div>
        )}

        {/* SOURCE ROW TAB */}
        {activeTab === "source" && (
          <div>
            <p style={{ fontSize: "14px", color: "#94a3b8", marginBottom: "24px", lineHeight: "1.7" }}>
              This question was generated directly from the row below in the Role-Based CCA Mapping Framework CSV.
              The claim in Section 6.1 is that each row is a complete question seed — the Relevance Rationale
              contains the correct answer logic, and the Vertical Notes contain the personalization variables.
            </p>

            {[
              { label: "Role", value: CSV_ROW.role },
              { label: "Tier", value: CSV_ROW.tier },
              { label: "CCA Domain", value: CSV_ROW.domain },
              { label: "Task Statement", value: CSV_ROW.taskStatement },
              { label: "Task Statement ID", value: CSV_ROW.taskID },
              { label: "Relevance Rationale", value: CSV_ROW.rationale, highlight: true },
              { label: "Vertical Notes", value: CSV_ROW.verticalNotes, highlight: true }
            ].map((row, i) => (
              <div key={i} style={{
                display: "flex",
                gap: "0",
                marginBottom: "2px"
              }}>
                <div style={{
                  background: "#1a2744",
                  border: "1px solid #2a3a5c",
                  borderRight: "none",
                  padding: "12px 16px",
                  width: "180px",
                  flexShrink: 0,
                  fontSize: "11px",
                  color: "#7a9fd4",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  fontFamily: "monospace",
                  display: "flex",
                  alignItems: "flex-start"
                }}>
                  {row.label}
                </div>
                <div style={{
                  background: row.highlight ? "#0f1f0f" : "#0d1424",
                  border: "1px solid " + (row.highlight ? "#2d5a2d" : "#2a3a5c"),
                  padding: "12px 16px",
                  flex: 1,
                  fontSize: "13px",
                  color: row.highlight ? "#86efac" : "#cbd5e1",
                  lineHeight: "1.6",
                  fontFamily: row.label === "Task Statement ID" ? "monospace" : "'Georgia', serif"
                }}>
                  {row.value}
                </div>
              </div>
            ))}

            <div style={{
              marginTop: "24px",
              background: "#0f1a2e",
              border: "1px solid #1e3a5c",
              borderRadius: "8px",
              padding: "16px 20px"
            }}>
              <div style={{ fontSize: "11px", color: "#60a5fa", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "8px", fontFamily: "monospace" }}>
                How the rationale became the question
              </div>
              <p style={{ fontSize: "13px", color: "#94a3b8", lineHeight: "1.7", margin: 0 }}>
                The scenario presents a developer who built what the rationale describes as the wrong approach:
                prompt-based instructions enforcing the $50,000 threshold instead of programmatic hooks.
                The Finance Director's objection is the voice of the role profile. The SOX audit trail
                requirement comes directly from the Vertical Notes. A candidate who studied only the CCA
                guide knows that hooks exist. Only a candidate who understands the enterprise context
                knows why prompt instructions are insufficient for SOX compliance.
              </p>
            </div>
          </div>
        )}

        {/* RUBRIC TAB */}
        {activeTab === "rubric" && (
          <div>
            <p style={{ fontSize: "14px", color: "#94a3b8", marginBottom: "24px", lineHeight: "1.7" }}>
              The grading rubric is derived directly from the Relevance Rationale and Vertical Notes.
              A passing answer must demonstrate all three concepts below. The AI grader evaluates
              open-ended responses against these elements — not requiring exact language, but requiring
              demonstrated understanding of the underlying reasoning.
            </p>

            {[
              {
                num: "1",
                title: "Programmatic Enforcement Gap",
                source: "Relevance Rationale",
                description: "The candidate must identify that relying on system prompt instructions alone to enforce the $50,000 threshold is architecturally insufficient. Prompt-based compliance has a non-zero failure rate. In a SOX-regulated environment, a control that 'usually works' is not a control — it is a gap auditors will find and flag.",
                key: "The prompt cannot guarantee deterministic behavior. Only code can."
              },
              {
                num: "2",
                title: "Hook-Based Solution",
                source: "Relevance Rationale",
                description: "The candidate must describe using Agent SDK hooks to intercept process_payment tool calls, programmatically verify authorization before execution is permitted, and block payment processing when the threshold is exceeded without documented approval. The hook — not the prompt — makes the control deterministic.",
                key: "PostToolUse or pre-execution hooks that intercept and block, not instruct."
              },
              {
                num: "3",
                title: "SOX Audit Trail Requirement",
                source: "Vertical Notes",
                description: "The candidate must address that SOX compliance requires documented evidence that controls actually fired — not just that controls were instructed to fire. Hook logs must be audit-trail quality: timestamped, tamper-evident records showing the control intercepted, verified, and permitted or blocked the tool call.",
                key: "Evidence that the control fired, not just that it was configured."
              }
            ].map(concept => (
              <div key={concept.num} style={{
                background: "#0d1424",
                border: "1px solid #2a3a5c",
                borderRadius: "8px",
                marginBottom: "16px",
                overflow: "hidden"
              }}>
                <div style={{
                  background: "#1a2744",
                  borderBottom: "1px solid #2a3a5c",
                  padding: "12px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px"
                }}>
                  <div style={{
                    background: "#1d4ed8",
                    color: "#e2e8f0",
                    borderRadius: "50%",
                    width: "24px",
                    height: "24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: "bold",
                    fontFamily: "monospace",
                    flexShrink: 0
                  }}>{concept.num}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "14px", color: "#e2e8f0", fontWeight: "bold" }}>{concept.title}</div>
                  </div>
                  <div style={{
                    fontSize: "10px",
                    color: "#4ade80",
                    background: "#0f2a1a",
                    border: "1px solid #2d5a2d",
                    borderRadius: "4px",
                    padding: "3px 8px",
                    fontFamily: "monospace",
                    letterSpacing: "0.08em"
                  }}>{concept.source}</div>
                </div>
                <div style={{ padding: "16px 20px" }}>
                  <p style={{ fontSize: "13px", color: "#94a3b8", lineHeight: "1.7", margin: "0 0 12px" }}>{concept.description}</p>
                  <div style={{
                    background: "#0f1a0f",
                    border: "1px solid #2d4a2d",
                    borderRadius: "6px",
                    padding: "10px 14px",
                    fontSize: "12px",
                    color: "#86efac",
                    fontFamily: "monospace"
                  }}>
                    Core insight: {concept.key}
                  </div>
                </div>
              </div>
            ))}

            <div style={{
              background: "#1a1000",
              border: "1px solid #4a3000",
              borderRadius: "8px",
              padding: "16px 20px",
              marginTop: "8px"
            }}>
              <div style={{ fontSize: "11px", color: "#fbbf24", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "8px", fontFamily: "monospace" }}>
                What a wrong answer looks like
              </div>
              <p style={{ fontSize: "13px", color: "#94a3b8", lineHeight: "1.7", margin: 0 }}>
                A developer who only studied the CCA guide might answer: "Add more specific language to the system
                prompt about the approval requirement" or "Add logging statements to track approval decisions."
                Both answers show CCA awareness. Neither demonstrates understanding of why prompt-based enforcement
                fails SOX requirements — which is exactly what the Finance Director's objection is testing.
              </p>
            </div>
          </div>
        )}

        {/* RESULT TAB */}
        {activeTab === "result" && (
          <div>
            {!grading && (
              <div style={{
                textAlign: "center",
                padding: "60px 20px",
                color: "#475569"
              }}>
                <div style={{ fontSize: "40px", marginBottom: "16px" }}>⚖</div>
                <div style={{ fontSize: "15px" }}>Submit your answer on the Question tab to receive AI grading.</div>
              </div>
            )}

            {grading && gradeColor && (
              <div>
                {/* Grade banner */}
                <div style={{
                  background: gradeColor.bg,
                  border: "1px solid " + gradeColor.border,
                  borderRadius: "12px",
                  padding: "24px 28px",
                  marginBottom: "24px",
                  display: "flex",
                  alignItems: "center",
                  gap: "20px"
                }}>
                  <div style={{
                    fontSize: "36px",
                    fontWeight: "bold",
                    color: gradeColor.text,
                    fontFamily: "'Courier New', monospace",
                    letterSpacing: "0.05em",
                    flexShrink: 0
                  }}>{gradeColor.label}</div>
                  <div>
                    <div style={{ fontSize: "15px", color: gradeColor.text, fontWeight: "bold", marginBottom: "4px" }}>
                      {grading.summary}
                    </div>
                    <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                      Graded against SOX compliance rubric · Task 1.5 · Finance vertical
                    </div>
                  </div>
                </div>

                {/* Concepts */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                  <div style={{
                    background: "#0f2a1a",
                    border: "1px solid #2d5a2d",
                    borderRadius: "8px",
                    padding: "16px"
                  }}>
                    <div style={{ fontSize: "11px", color: "#4ade80", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "10px", fontFamily: "monospace" }}>
                      Concepts Demonstrated
                    </div>
                    {grading.concepts_demonstrated.length === 0
                      ? <div style={{ fontSize: "13px", color: "#64748b", fontStyle: "italic" }}>None identified</div>
                      : grading.concepts_demonstrated.map((c, i) => (
                          <div key={i} style={{ fontSize: "13px", color: "#86efac", marginBottom: "6px", display: "flex", gap: "8px" }}>
                            <span style={{ color: "#22c55e", flexShrink: 0 }}>✓</span>
                            <span>{c}</span>
                          </div>
                        ))
                    }
                  </div>
                  <div style={{
                    background: "#1f0f0f",
                    border: "1px solid #4a1a1a",
                    borderRadius: "8px",
                    padding: "16px"
                  }}>
                    <div style={{ fontSize: "11px", color: "#f87171", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "10px", fontFamily: "monospace" }}>
                      Concepts Missing
                    </div>
                    {grading.concepts_missing.length === 0
                      ? <div style={{ fontSize: "13px", color: "#4ade80", fontStyle: "italic" }}>None — complete answer</div>
                      : grading.concepts_missing.map((c, i) => (
                          <div key={i} style={{ fontSize: "13px", color: "#fca5a5", marginBottom: "6px", display: "flex", gap: "8px" }}>
                            <span style={{ color: "#ef4444", flexShrink: 0 }}>✗</span>
                            <span>{c}</span>
                          </div>
                        ))
                    }
                  </div>
                </div>

                {/* Strength and gap */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                  <div style={{ background: "#0d1424", border: "1px solid #2a3a5c", borderRadius: "8px", padding: "16px" }}>
                    <div style={{ fontSize: "11px", color: "#7a9fd4", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "8px", fontFamily: "monospace" }}>Key Strength</div>
                    <p style={{ fontSize: "13px", color: "#cbd5e1", lineHeight: "1.6", margin: 0 }}>{grading.key_strength}</p>
                  </div>
                  <div style={{ background: "#0d1424", border: "1px solid #2a3a5c", borderRadius: "8px", padding: "16px" }}>
                    <div style={{ fontSize: "11px", color: "#7a9fd4", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "8px", fontFamily: "monospace" }}>Key Gap</div>
                    <p style={{ fontSize: "13px", color: "#cbd5e1", lineHeight: "1.6", margin: 0 }}>{grading.key_gap}</p>
                  </div>
                </div>

                {/* Examiner note */}
                <div style={{
                  background: "#0f1a2e",
                  border: "1px solid #1e3a5c",
                  borderLeft: "4px solid #3b82f6",
                  borderRadius: "8px",
                  padding: "16px 20px",
                  marginBottom: "20px"
                }}>
                  <div style={{ fontSize: "11px", color: "#60a5fa", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "8px", fontFamily: "monospace" }}>
                    Examiner Note
                  </div>
                  <p style={{ fontSize: "13px", color: "#94a3b8", lineHeight: "1.7", margin: 0 }}>{grading.examiner_note}</p>
                </div>

                {/* Try again */}
                <button
                  onClick={() => { setActiveTab("question"); setGrading(null); }}
                  style={{
                    background: "none",
                    border: "1px solid #2a3a5c",
                    borderRadius: "8px",
                    color: "#64748b",
                    fontSize: "13px",
                    padding: "10px 20px",
                    cursor: "pointer",
                    fontFamily: "'Georgia', serif"
                  }}
                >
                  ← Revise and resubmit
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        borderTop: "1px solid #1e2d4a",
        padding: "16px 32px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "#0a0e1a"
      }}>
        <div style={{ fontSize: "11px", color: "#334155", fontFamily: "monospace" }}>
          Role-Based CCA Exam Framework · Section 6.1 Demonstration
        </div>
        <div style={{ fontSize: "11px", color: "#334155", fontFamily: "monospace" }}>
          ArchieCur + Claude Sonnet + Claude Code · 2026
        </div>
      </div>
    </div>
  );
}
