# Agent & AI Usage Report

This document details how AI models and agentic workflows were designed, used, verified, and constrained in the **Release Communication & Readiness Brief Assistant**.

---

## 1. LLM & Provider Information
- **Model Selected**: `gemini-2.5-flash` via Google Generative AI SDK (`@google/generative-ai`).
- **Generation Parameters**:
  - `temperature: 0.1` (low temperature to minimize hallucination and enforce deterministic grounding in release evidence).
  - `responseMimeType: 'application/json'` (structured output mode).
  - System Instructions with strict safety and citation constraints.

---

## 2. Tools & Libraries Used
- **Google Generative AI SDK**: Communicates with Gemini API.
- **Zod**: Validates input payloads and parses AI responses against `AIResponseSchema` before application consumption.
- **Mongoose & MongoDB Atlas**: Persistent storage of release packages, AI analyses, human reviews, comparisons, and structured logs.
- **Vitest**: Automated test suite for deterministic validation, stale statement detection, AI response verification, and governance workflows.

---

## 3. Delegation: Deterministic Code vs. AI Reasoning

A fundamental architectural principle of this system is the separation between deterministic logic and LLM reasoning:

| Task / Responsibility | Handled By | Rationale |
| :--- | :--- | :--- |
| **Required Section Completeness** | **Deterministic Code** | Checking if 8 release sections exist is factual; delegating to an LLM introduces hallucination risk. |
| **Semver History & Immutability** | **Deterministic Code** | Version records must be permanently stored and never overwritten. |
| **Stable ID Generation** | **Deterministic Code** | Prefixes (`FEATURE-001`, `QA-001`) must remain stable for citation traceability. |
| **Release Comparison (Diffs)** | **Deterministic Code** | Set intersection/difference for additions and removals is factual. |
| **Stale Statement Detection** | **Deterministic Code** | Keyword and limitation change detection between versions is rule-based. |
| **User Impact Classification** | **AI Reasoning** | Requires contextual understanding of how behavior changes affect workflows. |
| **Contextual Gap Detection** | **AI Reasoning** | Identifies subtle ambiguities (e.g. migration mentioned without time window). |
| **Unsupported Claim Detection** | **AI Reasoning** | Critical reasoning task: comparing narrative claims against QA test numbers. |
| **Technical Brief Generation** | **AI Reasoning** | Synthesizes technical details into structured engineer-facing prose. |
| **Stakeholder Brief Generation**| **AI Reasoning** | Translates technical details into non-technical language for clients/business. |
| **Final Release Approval** | **Human Reviewer** | **AI is strictly forbidden from approving releases.** |

---

## 4. Representative Prompts

### System Instruction (`AI_SYSTEM_PROMPT`)
```
You are a senior release management analyst. Your role is to analyze software release packages and provide structured, evidence-based analysis.

CRITICAL RULES:
1. NEVER invent release information that is not present in the input.
2. NEVER claim tests passed when evidence does not show this.
3. NEVER claim software is bug-free.
4. NEVER automatically approve a release.
5. NEVER invent affected user groups, limitations, or migration requirements.
6. When evidence is insufficient, explicitly state "Insufficient evidence."
7. Every important claim MUST reference a release item ID (e.g., [FEATURE-001], [QA-001]).
8. Only use IDs that appear in the release package you receive.

YOUR TASKS:
A. User Impact Classification: Classify each change as high/medium/low/none impact with reason and evidence IDs.
B. Missing Information Analysis: Identify contextual gaps (not required-field validation — that is already done deterministically).
C. Unsupported Claim Detection: Compare release claims against QA evidence. Flag claims not supported by evidence.
D. Risk Identification: Identify risks from the release package only (failed tests, behavior changes, migration requirements, limitations).
E. Technical Brief: Generate a detailed technical release summary for developers and QA engineers.
F. Stakeholder Brief: Generate a non-technical summary for customers and business stakeholders. Translate technical details. Do NOT copy the technical brief.
```

### Context Formatting Provided to LLM
```
RELEASE VERSION: 2.5.0

COMPLETED FEATURES:
  [FEATURE-001] Added CSV export functionality
  [FEATURE-002] Added dark mode theme option

CHANGED BEHAVIOUR:
  [BEHAVIOR-001] Session timeout changed from 60 days to 30 days

QA SUMMARY:
  [QA-001] 120 tests executed
  [QA-002] 115 passed
  [QA-003] 5 failed
  [QA-004] CSV export tests failed
...
```

---

## 5. Important AI Mistakes Observed & Prevented

1. **Attempting to Declare Readiness as "Approved"**:
   - *Observation*: During early experiments, the LLM returned `"readiness": "ready"` or suggested immediate deployment readiness despite failed tests.
   - *Guardrail*: The database schema and API routes do not accept `"approved"` from the AI. The AI's readiness output is restricted to `"ready"`, `"needs_review"`, or `"not_ready"`, and the release status is set to `analysis_complete` until a human explicitly approves.

2. **Inventing Missing Technical Specifics**:
   - *Observation*: Without strict prompts, LLMs occasionally invent migration roll-back scripts or external infrastructure dependencies.
   - *Guardrail*: Enforced rule: *"Do not invent release information that is not present in the input. When evidence is insufficient, explicitly state 'Insufficient evidence.'"*

3. **Duplicating Technical Brief into Stakeholder Brief**:
   - *Observation*: LLMs often reproduce database migration numbers (`v12`) and internal API details in stakeholder summaries.
   - *Guardrail*: Explicit prompt instructions to translate technical jargon into business value and omit internal migration indices.

---

## 6. Verification & Human-in-the-Loop Safeguards

1. **Zod Schema Validation**:
   - All AI output is parsed through `AIResponseSchema.safeParse()`. If fields are missing or types mismatch, the application returns a controlled error rather than crashing or storing corrupted data.
2. **Clickable Evidence Inspector**:
   - In the UI, every citation tag (`[QA-001]`, `[FEATURE-001]`) is interactive. Clicking it displays the original text from the release package.
3. **Editable Briefs**:
   - Human reviewers can edit both Technical and Stakeholder summaries in-place. The application records which fields were human-modified and preserves reviewer notes.
4. **Audit Logging**:
   - Every lifecycle event (`AI_ANALYSIS_STARTED`, `AI_ANALYSIS_COMPLETED`, `BRIEF_EDITED`, `BRIEF_APPROVED`, `BRIEF_REJECTED`) is written to the database with sanitized metadata (no secrets or keys).
