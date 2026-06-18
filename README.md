# 🎯 Preproute — Test Management Application

A production-ready admin panel for creating, managing, and publishing MCQ-based tests. Built as a complete 5-page flow application with full CRUD operations, JWT auth, and rich question editing.

> **Frontend Developer Task Submission**

---

## 🌐 Live Demo

| Resource | Link |
|---|---|
| 🚀 **Deployed App** | https://test-prep-smoky.vercel.app/dashboard |
| 📦 **GitHub Repo** | https://github.com/prabhattopi/test-prep |
| 🎥 **Walkthrough Video** | [your-google-drive-link-here] |

---

## ✨ Features

### Page-Level Implementation

#### 🔐 Page 1 — Login
- userId + password form with validation
- JWT token persisted in `localStorage`
- Redirect to dashboard on success
- Inline error banner for failed attempts

#### 📊 Page 2 — Dashboard
- Tabular list of all tests with status badges (Draft / Live / Scheduled)
- **View** (👁), **Edit** (✏️), **Delete** (🗑) actions per row
- Debounced search filter (name / subject)
- "Create New Test" CTA
- Beautiful confirmation modals for destructive actions

#### 📝 Page 3 — Create / Edit Test
- Cascading dropdowns: **Subject → Topics → Sub-topics** (multi-select)
- Test type tabs: Chapter Wise / PYQ / Mock Test
- Marking scheme stepper (correct / wrong / unattempt marks)
- Difficulty radio (Easy / Medium / Hard)
- **Smart field locking** when questions exist or test is published

#### ❓ Page 4 — Add Questions
- **TipTap rich text editor** with toolbar (bold, italic, underline, lists, link, image)
- 4 options with radio for correct answer
- Solution / Explanation textarea
- **Standalone Media URL** input with live image preview
- Per-question difficulty, topics, sub-topics (filtered to test scope)
- Sidebar with question navigation + saved state indicators

#### 🚀 Page 5 — Preview & Publish
- Full test summary card matching design system
- **Sidebar-driven single-question preview** (click to switch)
- Publish Now / Schedule Publish toggle
- "Live Until" duration options + custom date/time
- Success modal with auto-redirect to dashboard

---

## 🎨 UX Highlights

| Feature | Why it matters |
|---|---|
| 🔒 **Smart Field Locking** | Subject / Topics locked once questions exist — prevents data integrity issues. Live tests only allow name change. |
| 💬 **Hover Tooltips** | Locked fields explain *why* they can't be edited |
| 💾 **Persisted Drafts** | Zustand + localStorage survives refresh — no data loss mid-creation |
| 🔄 **Question Order Preservation** | Server returns shuffled — restored client-side via ID map |
| 🎯 **Single-Question Preview** | Sidebar navigation instead of endless scroll — better focus |
| ⏱ **Debounced Search** | 300ms delay prevents excessive re-renders |
| ✅ **Beautiful Modals** | All `alert()` replaced with blur-backdrop modals (success, error, delete, locked) |
| 🚫 **Duplicate Prevention** | `questionsAlreadySent` flag prevents re-publishing duplicates |

---

## 🛠 Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| **Framework** | React 19 + TypeScript + Vite | Fast HMR, type safety, modern toolchain |
| **Routing** | React Router v7 | Data routers with loader-based auth guards |
| **UI State** | Zustand + persist middleware | Lightweight, survives refresh for drafts |
| **Server State** | TanStack Query v5 | Cache, mutations, 5-min staleTime |
| **Forms** | TanStack Form | Field-level subscriptions = no full re-renders |
| **Styling** | Tailwind CSS v4 | CSS variables via `@theme`, zero runtime |
| **HTTP** | Axios | Interceptor pattern for JWT injection |
| **Editor** | TipTap (StarterKit + extensions) | Modular, ProseMirror-based |
| **Icons** | Lucide React | Tree-shakeable, consistent design |

---

## 📁 Project Structure

```
src/
├── components/
│   ├── AppLayout.tsx          # Sidebar + header layout
│   └── AuthLayout.tsx         # Login page wrapper
├── config/
│   └── api.ts                 # Axios instance + JWT interceptor
├── features/
│   ├── auth/
│   │   └── LoginPage.tsx
│   ├── dashboard/
│   │   └── DashboardPage.tsx  # List + View modal + delete
│   ├── tests/
│   │   ├── CreateTestPage.tsx # Form with smart locking
│   │   └── PublishConfirmationPage.tsx
│   └── questions/
│       ├── AddQuestionsPage.tsx
│       └── components/
│           ├── QuestionEditor.tsx   # TipTap + form
│           └── QuestionSidebar.tsx
├── services/
│   └── api.ts                 # taxonomyApi, testApi, questionApi
├── store/
│   ├── useAuthStore.ts        # JWT + user
│   └── useTestStore.ts        # Persisted test drafts
├── types/
│   └── index.ts               # TypeScript interfaces
├── router.tsx                 # Routes with auth loaders
├── App.tsx                    # App page
├── main.tsx                   # App page
└── index.css                  # Tailwind v4 theme
```

---

## 🔌 API Integration

All 12 documented endpoints are integrated:

| # | Endpoint | Used In |
|---|---|---|
| 1 | `POST /auth/login` | Login page |
| 2 | `GET /subjects` | CreateTest, QuestionEditor |
| 3 | `GET /topics/subject/:id` | CreateTest, QuestionEditor |
| 4 | `GET /sub-topics/topic/:id` | Fallback for single topic |
| 5 | `GET /tests` | Dashboard list |
| 6 | `POST /tests` | Create new test |
| 7 | `PUT /tests/:id` | Update test |
| 8 | `GET /tests/:id` | Dashboard View modal |
| 9 | `POST /questions/bulk` | Publish flow |
| 10 | `PUT /tests/:id` (status) | Publish / Schedule |
| 11 | `POST /sub-topics/multi-topics` | Multi-topic subtopics |
| 12 | `POST /questions/fetchBulk` | View modal questions |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ and npm

### Installation

```bash
# Clone the repository
git clone https://github.com/prabhattopi/test-prep
cd test-prep

# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment

The base API URL is set in `src/config/api.ts`:

```ts
const BASE_URL = 'https://admin-moderator-backend-staging.up.railway.app/api';
```

---

## 🔑 Key Technical Decisions

### 1. Two-Layer State Management
- **Zustand** for UI/draft state (persisted to localStorage)
- **TanStack Query** for server state (with cache invalidation on mutations)

This separation prevents accidental over-fetching while preserving in-progress work.

### 2. Field-Level Form Subscriptions
TanStack Form's `<form.Field>` pattern means typing in option 1 doesn't re-render options 2-4. Critical for the question editor with 10+ fields.

### 3. Smart Locking Logic

```
Field                    | New | Questions | Scheduled | Live
-------------------------|-----|-----------|-----------|------
Subject / Topics / SubT  |  ✅  |    🔒     |    🔒     |  🔒
Test Type tabs           |  ✅  |    🔒     |    🔒     |  🔒
Name                     |  ✅  |    ✅     |    ✅     |  ✅
Duration / Marks / Diff  |  ✅  |    ✅     |    ✅     |  🔒
```

### 4. Question Order Preservation
`POST /questions/fetchBulk` returns questions in random order. Solution:

```ts
const questionMap = new Map(rawQuestions.map(q => [q.id, q]));
const ordered = testData.questions.map(id => questionMap.get(id)).filter(Boolean);
```

### 5. CSS Variables in Tailwind v4
All design tokens defined in `@theme` block — easy to maintain dark mode or rebrand later without touching components.

### 6. Modal-First Error UX
No `alert()` anywhere — all feedback (errors, success, confirmations) uses centered blur-backdrop modals so users don't have to scroll to find them.

---

## 🎥 Walkthrough Coverage

The video demonstrates:
- ✅ Login flow with credentials
- ✅ Dashboard navigation, search, and actions
- ✅ Creating a test with cascading dropdowns
- ✅ Adding MCQ questions with rich text formatting
- ✅ Adding image via Media URL field
- ✅ TipTap editor toolbar (bold, italic, lists, link, image)
- ✅ Setting difficulty, topics, sub-topics per question
- ✅ Preview with sidebar navigation
- ✅ Publishing the test → success modal
- ✅ Dashboard reflects "LIVE" status
- ✅ View modal showing published test with all questions
- ✅ Edit modal demonstrating locked-field behavior

---

## 👤 Author

**Prabhat Singh**
📧 topi9864@gmail.com
📱 +91 9864924106
📍 Guwahati, Assam

---

## 📝 License

This project was built as a frontend developer task submission.