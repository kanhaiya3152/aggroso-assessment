# Release Communication & Readiness Brief Assistant

A production-grade, full-stack AI-assisted release governance platform. It helps engineering and product teams evaluate structured software release packages, deterministically validate completeness, verify claims against QA test evidence, classify changes by user impact, detect outdated/stale statements across semver versions, and generate distinct technical and stakeholder release briefs with mandatory human-in-the-loop review.

---

## 🚀 Key Highlights & Architectural Principles

> **"Deterministic code for facts and validation.  
> AI for reasoning and summarization.  
> Evidence for important claims.  
> Human for final decisions."**

1. **Deterministic Completeness Validation**: Validates the presence of 8 required release sections purely in TypeScript before invoking any AI model. Missing fields are explicitly flagged.
2. **Stable Identifiers & Verifiable Citations**: Every release item receives a persistent identifier (`FEATURE-001`, `BUG-002`, `BEHAVIOR-001`, `QA-001`, `LIMITATION-001`, `MIGRATION-001`, `USERGROUP-001`). AI analysis and briefs must cite these IDs, and users can inspect the underlying evidence.
3. **Unsupported Claim Detection**: Rigorously cross-references claims against supplied QA test execution metrics (e.g., flagging "Payment functionality is fully tested" or "Bug-free release" when tests failed or proof is absent).
4. **Targeted Technical & Stakeholder Briefs**: Generates distinct briefs—one for engineers/QA with technical specifics, and one for clients/business users with translated, non-technical context.
5. **Human-in-the-Loop Governance**: AI **never** automatically approves releases. Human reviewers edit, approve, or reject briefs to produce the final signed-off release brief.
6. **Immutable Semver History & Comparison**: Release versions are permanently persisted in MongoDB. Any two versions can be diffed (added, removed, changed items, QA changes) with automated **Stale Statement Detection**.

---

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling & UI**: Tailwind CSS, Lucide Icons, Radix UI primitives
- **Database & ODM**: MongoDB Atlas, Mongoose
- **AI & Reasoning Engine**: Google Gemini API (`gemini-1.5-flash`) with structured JSON schema output
- **Schema Validation & Guardrails**: Zod (for inputs and AI output validation)
- **Testing**: Vitest (16 unit and domain integration tests)
- **Hosting**: Vercel (Web Application & Serverless API Routes) + MongoDB Atlas (Persistent Cluster)

---

## 🏗 Architecture & Flow

```
User Input Form (8 sections)
          │
          ▼
Deterministic Validation (TypeScript / Zod)
   ├── Missing fields flagged? ──► Indicative Warning Banner
   └── Items assigned stable IDs [FEATURE-001, QA-001, ...]
          │
          ▼
MongoDB Atlas Persistence (Immutable Release Record)
          │
          ▼
AI Reasoning Workflow (Gemini API + JSON Schema Mode)
   ├── User Impact Classification (High / Medium / Low / None)
   ├── Unsupported Claim Detection (Claim vs QA Evidence)
   ├── Known Risk & Contextual Gap Identification
   ├── Technical Brief Generation (Engineering / QA)
   └── Stakeholder Brief Generation (Customers / Non-technical)
          │
          ▼
Zod Schema Verification Guardrail (Ensures clean structured JSON)
          │
          ▼
Human-in-the-Loop Review
   ├── Inspect Evidence Citations
   ├── Edit Technical / Stakeholder Content
   └── Final Decision: [Approve] | [Reject] | [Needs Review]
          │
          ▼
Final Reviewed Release Brief & Version Comparison / Stale Detection
```

---

## 📋 Release Package Structure

A release package contains 8 structured sections:
1. **Version** (e.g., `2.5.0`)
2. **Completed Features** (e.g., `Added CSV export`, `Added dark mode`)
3. **Bug Fixes** (e.g., `Fixed login timeout`)
4. **Changed Behaviour** (e.g., `Session timeout changed from 60 days to 30 days`)
5. **QA Summary & Evidence** (e.g., `120 tests executed, 115 passed, 5 failed`)
6. **Known Limitations** (e.g., `CSV export supports files up to 50MB`)
7. **Migration / Configuration Notes** (e.g., `Database migration v12 required`)
8. **Affected User Groups** (e.g., `All users`, `Enterprise customers`)

---

## 🧪 Testing

The test suite covers all critical business behavior:
1. Deterministic required-field validation
2. Missing release section detection
3. Stable item ID assignment (`FEATURE-001`, `QA-001`)
4. Release package creation & semver preservation
5. Deterministic version comparison (added, removed, QA deltas)
6. Stale statement detection across releases
7. AI response validation guardrails with Zod
8. Human-in-the-loop review workflow (approval/rejection)
9. Strict enforcement that AI cannot set approved status

Run tests locally:
```bash
npm test
```

Test Results:
```
 ✓ tests/reviewWorkflow.test.ts (4 tests)
 ✓ tests/staleDetection.test.ts (4 tests)
 ✓ tests/comparison.test.ts (6 tests)
 ✓ tests/validation.test.ts (4 tests)
 ✓ tests/aiResponse.test.ts (3 tests)

 Test Files  5 passed (5)
      Tests  21 passed (21)
```

---

## 💻 Local Setup & Development

### 1. Prerequisites
- Node.js 18+ or 20+
- npm or pnpm
- MongoDB Atlas cluster URI (or local MongoDB)
- Google Gemini API Key

### 2. Clone & Install
```bash
git clone <repository-url>
cd release-brief-assistant
npm install
```

### 3. Environment Variables
Create a `.env.local` file based on `.env.example`:
```bash
cp .env.example .env.local
```

Fill in your credentials:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/release_assistant?retryWrites=true&w=majority
GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Production Build
```bash
npm run build
npm start
```

---

## 🌐 Deployment (Vercel & MongoDB Atlas)

1. **MongoDB Atlas**:
   - Create a free M0 cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
   - Under Database Access, create a database user.
   - Under Network Access, allow IP access (`0.0.0.0/0` for Vercel serverless connections).
   - Copy connection string to `MONGODB_URI`.

2. **Vercel**:
   - Push repository to GitHub.
   - Import project in Vercel.
   - Set Environment Variables:
     - `MONGODB_URI`: Atlas connection string
     - `GEMINI_API_KEY`: Google Gemini API key
     - `NEXT_PUBLIC_APP_URL`: Your Vercel production URL
   - Deploy.

**Hosted Demo URL**: `https://release-brief-assistant.vercel.app` *(or custom Vercel deployment URL)*

---

## 📝 Sample Evaluation Input

To test the application quickly, click the **"Pre-fill Sample Package"** button on the Create Release page:
- **Version**: `2.5.0`
- **Features**: Added CSV export functionality, Added dark mode theme option, Added user profile editing
- **Bug Fixes**: Fixed login session timeout bug, Fixed incorrect analytics dashboard calculation
- **Changed Behaviour**: Session timeout changed from 60 days to 30 days
- **QA Summary**: 120 tests executed, 115 passed, 5 failed, CSV export tests failed
- **Known Limitations**: CSV export supports files up to 50MB only
- **Migration**: Database migration v12 required prior to deployment
- **Affected Users**: All active web users, Enterprise customers with custom timeouts

---

## 🚫 Excluded Scope (By Design)

As instructed in the assessment specification:
- No automatic deployment or CI/CD pipelines
- No automated production sign-off
- No direct GitHub/GitLab repository integrations
- No public changelog publishing
