# Continuum — Scheduler & Work Continuity Platform

> **"Never lose track of where you stopped."**
> Plan the work. Execute the work. Remember where you stopped. Help you continue.

---

## 🌟 Overview

**Continuum** is a modern, full-stack Scheduler and Work Continuity Management Platform engineered for students, professionals, developers, researchers, and project teams.

Unlike standard to-do lists and calendar tools that suffer from context amnesia, Continuum maintains deep work continuity:
- **Preserved Stopping Points**: Every scheduled session captures the exact sub-unit (exercise, chapter, code module) where you paused.
- **Contextual Resumption**: One-click quick resume with live session timers and step-by-step progress checklists.
- **Grounded Anti-Hallucination AI**: The AI assistant accesses real recorded continuity states and never makes up completed work.
- **Rich Multi-View Scheduler**: Day, Week, Month, Agenda, and Timeline views.
- **Collaborative Workspaces**: Project milestone tracking, digital learning material attachments, team channels, and integrated WebRTC audio/video meetings.

---

## 🏗️ Architecture & Tech Stack

- **Backend**:
  - Node.js 24 LTS + TypeScript + Express.js
  - Native high-performance SQLite engine (`DatabaseSync`) in WAL mode with normalized 18-table schema
  - Real-time WebSocket server (`ws`) for live session syncing and WebRTC signaling
  - Vitest + Supertest integration test suite
- **Frontend**:
  - React 19 + TypeScript + Vite
  - Custom Vanilla CSS Design System with CSS tokens, rich dark theme, glassmorphism, and micro-animations
  - Lucide icons, responsive layout across desktop, tablet, and mobile
- **Work Continuity Engine**:
  - Deterministic state machine: `Scheduled` ➔ `In Progress` ➔ `Paused` ➔ `Completed`
  - Granular work unit sequence tracking ($u_1, u_2, \dots, u_n$)
  - Progress calculation: $\frac{\text{Completed Units}}{\text{Total Units}} \times 100$

---

## 🚀 Quick Start

### 1. Install & Build
```bash
# Root directory
npm install

# Run backend tests (Vitest)
npm run test
```

### 2. Start Local Development Environment
```bash
npm run dev
```
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:4000](http://localhost:4000)
- **WebSocket Gateway**: `ws://localhost:4000/ws`

### 3. Native Mobile (iOS & Android via Capacitor)
Continuum is configured as a cross-platform native app powered by Capacitor 8:
- **Thumb-friendly Mobile Bottom Bar**: Visible on mobile screens and devices.
- **Native Haptics**: Vibration feedback on checkpoint toggles and session pauses.
- **Status Bar Integration**: Deep midnight theme matching the device notch.
- **Hardware Back Button**: Android system back-stack handling.

```bash
# In client/ directory:
cd client

# Build web assets and sync to native mobile container:
npm run mobile:build

# Open native Android project (requires Android Studio):
npm run mobile:android

# Open native iOS project (requires Xcode on macOS):
npm run mobile:ios
```

---

## 👥 Demo Personas (Instant 1-Click Switcher in UI)

| Persona | Email | Default Password | Role | Scenario |
|---|---|---|---|---|
| **Alex Rivers** | `alex.student@continuum.dev` | `Password123!` | Student | Studying Python Functions (Exercises 1–10). Checkpoint at **Exercise 7: Recursive Fibonacci** (60% complete). Attached: *Fluent Python Chapter 4.pdf*. |
| **Sam Chen** | `dev.sam@continuum.dev` | `Password123!` | Developer | Building Auth Gateway. Checkpoint at **JWT authentication middleware** (50% complete). Attached: *RFC 7519 Specification*. |
| **Sarah Miller** | `sarah.lead@continuum.dev` | `Password123!` | Team Lead | Managing Sprint Milestones and collaborative workspace. |

---

## 📁 Repository Structure

```
Blanc-Scheduler/
├── server/
│   ├── src/
│   │   ├── db/
│   │   │   ├── schema.sql         # 18-table relational schema with indexes & constraints
│   │   │   ├── index.ts           # SQLite service with WAL mode and transaction depth control
│   │   │   └── seed.ts            # Realistic student, dev, and team scenarios
│   │   ├── engine/
│   │   │   ├── continuityEngine.ts # Core Work Continuity & Resume Point calculation engine
│   │   │   └── schedulingEngine.ts # Multi-view calendar generator & dependency DAG checker
│   │   ├── services/
│   │   │   └── aiService.ts       # Grounded AI assistant with anti-hallucination context manager
│   │   ├── realtime/
│   │   │   └── index.ts           # WebSocket server & WebRTC signaling
│   │   ├── routes/
│   │   │   ├── auth.ts            # Authentication & JWT tokens
│   │   │   ├── tasks.ts           # Task & work unit CRUD
│   │   │   ├── continuity.ts      # "Continue Where You Left Off" & session endpoints
│   │   │   ├── scheduler.ts       # Day/Week/Agenda calendar endpoints
│   │   │   ├── workspaces.ts      # Multi-tenant workspace management
│   │   │   ├── projects.ts        # Project milestones & progress breakdown
│   │   │   ├── materials.ts       # Digital learning materials & PDFs
│   │   │   ├── chat.ts            # Team messaging channels
│   │   │   ├── ai.ts              # Grounded AI chat & auto-breakdown
│   │   │   └── analytics.ts       # Focus metrics & velocity
│   │   └── tests/
│   │       ├── continuityEngine.test.ts # Core continuity unit tests
│   │       └── api.test.ts              # End-to-end API integration tests
│   └── package.json
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx         # Header with persona switcher & search
│   │   │   ├── Sidebar.tsx        # Navigation tabs & continuity counter
│   │   │   ├── ContinueSection.tsx # "Continue Where You Left Off" card deck
│   │   │   ├── ContinuityDrawer.tsx # Live execution timer & sub-unit checklist
│   │   │   ├── CalendarView.tsx   # Day/Week/Agenda/Timeline scheduler
│   │   │   ├── ProjectsView.tsx   # Milestone progress bars
│   │   │   ├── MaterialsView.tsx  # Attached textbooks & digital resources
│   │   │   ├── ChatView.tsx       # Live team chat & video launcher
│   │   │   ├── VideoCallModal.tsx # WebRTC video meeting simulator
│   │   │   ├── AnalyticsView.tsx  # Focus hours & completion rate charts
│   │   │   ├── AIAssistantModal.tsx # Grounded AI assistant drawer
│   │   │   ├── TaskModal.tsx      # Schedule task modal with AI auto-breakdown
│   │   │   └── OverrideModal.tsx  # Manual checkpoint adjustment modal
│   │   ├── context/
│   │   │   └── AuthContext.tsx    # Reactive user & workspace context
│   │   ├── services/
│   │   │   └── api.ts             # Typed REST API client
│   │   ├── index.css              # Custom Vanilla CSS design tokens & animations
│   │   ├── App.tsx                # Master application layout
│   │   └── main.tsx
│   └── package.json
├── ARCHITECTURE.md                # Comprehensive architectural blueprint
├── package.json                   # Root workspace orchestration
└── README.md
```
