# 🏦 AI-Driven Conversational Loan Sales Assistant

> **An Agentic AI system for processing loan applications through natural conversation**

Built for **EY Hackathon 2024** • Powered by **Llama 3.3 70B** via OpenRouter

![Demo](https://img.shields.io/badge/Status-Demo_Ready-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![React](https://img.shields.io/badge/React-18.2-61dafb)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933)

---

## 🎯 Project Overview

This MVP demonstrates an **Agentic AI architecture** where multiple specialized AI agents collaborate to process loan applications through natural conversation. Unlike traditional chatbots, this system uses a **multi-agent orchestration pattern** where each agent has a specific role.

### ✨ Key Features

- 💬 **Natural Conversation Flow** - Collects loan application data conversationally
- 🤖 **5 Specialized AI Agents** - Each with distinct responsibilities
- ✅ **Deterministic Decision Making** - Rule-based underwriting (no AI randomness)
- 📄 **PDF Sanction Letters** - Auto-generated approval documents
- 🎨 **Modern React UI** - Clean, responsive chat interface
- 🚀 **Free Deployment Ready** - Deploy on Render + Vercel at no cost

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                        │
│   Chat UI → API Calls → Display Responses & PDF Downloads   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────────┐
│                        BACKEND (Express)                      │
│                                                               │
│   ┌─────────────────────────────────────────────────────┐     │
│   │                   MASTER AGENT                      │     │
│   │           (Orchestrator - Controls Flow)            │     │
│   └─────────────────────────────────────────────────────┘     │
│         │              │              │              │        │
│         ▼              ▼              ▼              ▼        │
│  ┌───────────┐  ┌────────────┐  ┌────────────┐  ┌───────────┐ │
│  │   SALES   │  │VERIFICATION│  │UNDERWRITING│  │ SANCTION  │ │
│  │   AGENT   │  │   AGENT    │  │   AGENT    │  │   AGENT   │ │
│  │           │  │            │  │            │  │           │ │
│  │ Collects  │  │    Mock    │  │    Rule    │  │ Generates │ │
│  │   Data    │  │     KYC    │  │   Based    │  │    PDF    │ │
│  └───────────┘  └────────────┘  └────────────┘  └───────────┘ │
│                                                               │
│    ┌─────────────────────────────────────────────────────┐    │
│    │                    SERVICES                         │    │
│    │     OpenRouter (LLM)    │    PDFKit (Documents)     │    │
│    └─────────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────────┘
```

### Agent Responsibilities

| Agent | Role | AI Used? |
|-------|------|----------|
| **MasterAgent** | Orchestrates conversation flow, delegates to other agents | No |
| **SalesAgent** | Collects loan details, personal info, employment data | Optional (fallback) |
| **VerificationAgent** | Validates PAN, retrieves credit score (mock) | No |
| **UnderwritingAgent** | Makes loan decision based on rules | **No** (Deterministic) |
| **SanctionAgent** | Generates PDF sanction letter | No |

---

## 🚀 Quick Start

Deploed link: https://ailoanassistant-1.onrender.com/
### Video demo: 


https://github.com/user-attachments/assets/a97aa631-836c-4b99-8286-49f5404a07ef



### Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenRouter API key (free tier available)

### 1. Clone & Setup

```bash
# Navigate to project
cd loan-assistant-mvp

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 2. Configure Environment

```bash
# In server directory
cp .env.example .env

# Edit .env and add your OpenRouter API key
# Get your key from: https://openrouter.ai/keys
```

**.env file:**
```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
PORT=3001
FRONTEND_URL=http://localhost:5173
```

### 3. Run Locally

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

### 4. Open Application

Navigate to: **http://localhost:5173**

---

## 📋 Demo Flow Script

Use this script to demonstrate the complete loan application flow:

### Step 1: Start Conversation
```
User: Hi, I want to apply for a personal loan
Bot: Welcome! [Shows loan options]
```

### Step 2: Select Loan Type
```
User: Personal loan
Bot: [Shows personal loan details, asks for amount]
```

### Step 3: Enter Loan Amount
```
User: 5 lakhs
Bot: [Confirms amount, asks for tenure]
```

### Step 4: Specify Tenure
```
User: 3 years
Bot: [Confirms tenure, asks for name]
```

### Step 5: Provide Personal Details
```
User: Rahul Sharma
Bot: [Asks for email]

User: rahul.sharma@email.com
Bot: [Asks for phone]

User: 9876543210
Bot: [Asks employment type]
```

### Step 6: Employment Information
```
User: Salaried
Bot: [Asks for employer]

User: Tech Solutions Pvt Ltd
Bot: [Asks for salary]

User: 75000
Bot: [Asks for PAN]
```

### Step 7: KYC Verification
```
User: ABCDE1234F
Bot: [Verifies PAN, shows credit score, processes application]
```

### Step 8: Decision & Sanction Letter
```
Bot: 🎉 Congratulations! Your loan is APPROVED!
     [Shows loan details]
     [Download Sanction Letter button appears]
```

### Test Scenarios

**Approved Application (High Income):**
- Salary: ₹75,000+
- PAN: `ABCDE1234F` (existing customer with 750 credit score)

**Rejected Application (Low Income):**
- Salary: ₹20,000
- Any PAN

**Rejected Application (Low Credit Score):**
- PAN: `LMNOP9012H` (existing customer with 620 credit score)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Vite |
| **Backend** | Node.js, Express, TypeScript |
| **AI Model** | Llama 3.3 70B via OpenRouter |
| **PDF Generation** | PDFKit |
| **Styling** | CSS3 (Custom Design System) |

---

## 📁 Project Structure

```
loan-assistant-mvp/
│
├── client/                      # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── App.tsx             # Main app component
│   │   ├── Chat.tsx            # Chat interface component
│   │   ├── api.ts              # API service layer
│   │   ├── main.tsx            # React entry point
│   │   └── styles.css          # Styling
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── server/                      # Backend (Node + Express + TypeScript)
│   ├── src/
│   │   ├── index.ts            # Express server entry
│   │   ├── routes/
│   │   │   └── chat.ts         # Chat API endpoints
│   │   ├── agents/
│   │   │   ├── types.ts        # Shared TypeScript types
│   │   │   ├── masterAgent.ts  # Orchestrator agent
│   │   │   ├── salesAgent.ts   # Data collection agent
│   │   │   ├── verificationAgent.ts  # KYC agent
│   │   │   ├── underwritingAgent.ts  # Decision engine
│   │   │   └── sanctionAgent.ts      # Document generator
│   │   ├── services/
│   │   │   ├── openrouter.ts   # LLM API integration
│   │   │   └── pdfService.ts   # PDF generation
│   │   └── data/
│   │       └── mockData.json   # Mock customer & loan data
│   ├── downloads/              # Generated PDFs
│   ├── tsconfig.json
│   ├── .env.example
│   └── package.json
│
└── README.md
```

---

## 🌐 Free Deployment

### Backend → Render.com

1. Create account at [render.com](https://render.com)
2. Click **New → Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Root Directory:** `server`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
5. Add environment variable:
   - `OPENROUTER_API_KEY` = your key
   - `FRONTEND_URL` = your Vercel URL (after deploying frontend)
6. Deploy!

### Frontend → Vercel

1. Create account at [vercel.com](https://vercel.com)
2. Click **New Project**
3. Import your GitHub repository
4. Configure:
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Add environment variable:
   - `VITE_API_URL` = your Render backend URL (e.g., `https://loan-assistant-api.onrender.com`)
6. Deploy!

### Post-Deployment

Update the backend's `FRONTEND_URL` environment variable with your Vercel URL for CORS.

---

## 🔌 API Reference

### POST /api/chat

Main chat endpoint for processing messages.

**Request:**
```json
{
  "message": "I want a personal loan",
  "sessionId": "unique-session-id"
}
```

**Response:**
```json
{
  "reply": "Welcome! What loan amount do you need?",
  "status": "IN_PROGRESS",
  "pdfUrl": null
}
```

**Status Values:**
- `IN_PROGRESS` - Application still being processed
- `APPROVED` - Loan approved, PDF available
- `REJECTED` - Loan not approved

### GET /api/chat/health

Health check endpoint.

### GET /downloads/:filename

Download generated PDF sanction letters.

---

## ⚙️ Underwriting Rules

The system uses **deterministic rules** (no AI) for loan decisions:

| Rule | Requirement |
|------|-------------|
| Minimum Salary | ₹25,000/month |
| Minimum Credit Score | 650 |
| Max EMI-to-Income Ratio | 50% |

**Interest Rate Tiers:**
- Credit Score ≥ 750: Base rate
- Credit Score ≥ 700: Base + 0.5%
- Credit Score ≥ 650: Base + 1.0%
- Credit Score < 650: Rejected

---

## 🎨 UI Features

- ✅ Responsive design (mobile-friendly)
- ✅ Real-time typing indicators
- ✅ Message bubbles with timestamps
- ✅ Status badge (In Progress / Approved / Rejected)
- ✅ PDF download button
- ✅ Error handling with retry
- ✅ New application button
- ✅ Smooth animations

---

## 🔧 Development

### Adding New Agents

1. Create agent file in `server/src/agents/`
2. Export a handler function
3. Import and call from `masterAgent.ts`

### Modifying Underwriting Rules

Edit `server/src/agents/underwritingAgent.ts`:
```typescript
const RULES = {
  MIN_SALARY: 25000,
  MIN_CREDIT_SCORE: 650,
  MAX_DTI_RATIO: 0.5,
};
```

### Adding Loan Types

Edit `server/src/data/mockData.json`:
```json
{
  "loanTypes": [
    {
      "id": "new-loan",
      "name": "New Loan Type",
      "minAmount": 10000,
      "maxAmount": 500000,
      "interestRate": 10.0,
      "tenureMonths": [12, 24, 36]
    }
  ]
}
```

---

## 🏆 Hackathon Highlights

1. **Agentic Architecture** - True multi-agent system, not a monolithic chatbot
2. **Separation of Concerns** - AI for NLU, rules for decisions
3. **Production-Ready** - Error handling, logging, type safety
4. **Demo-Friendly** - Mock data for reliable demos
5. **Free to Run** - Uses free-tier LLM and deployment

---

## 📄 License

MIT License - Built for educational and demonstration purposes.

---

## 👥 Team

Built with ❤️ for EY Hackathon 2024

---

## 🙏 Acknowledgments

- [OpenRouter](https://openrouter.ai) for LLM API access
- [Meta AI](https://ai.meta.com) for Llama 3.3
- [PDFKit](http://pdfkit.org) for PDF generation
