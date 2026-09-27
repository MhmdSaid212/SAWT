# SAWT — AI-Assisted Speech Therapy Companion

SAWT is an **AI-assisted speech therapy companion** designed to help children practice pronunciation between professional speech therapy sessions.

The platform allows children to practice assigned pronunciation exercises, record their speech, and receive AI-assisted pronunciation analysis and feedback. Parents can monitor progress, while therapists can manage exercises, review attempts, and provide professional feedback.

> **SAWT is designed to support speech therapy practice, not replace a speech therapist or provide medical diagnosis.**

---

## ✨ Features

### 👧 Child

* View assigned pronunciation exercises
* Practice target words
* Hear AI-generated example pronunciations
* Record pronunciation attempts
* Receive pronunciation scores and AI-generated feedback
* View previous practice attempts
* Listen to previous recordings
* View therapist feedback
* Track pronunciation progress

### 👨‍👩‍👧 Parent

* Create and manage child profiles
* Enter a child's practice session
* Monitor child practice activity
* View pronunciation scores and progress
* Review AI feedback
* Listen to recorded attempts
* View therapist feedback
* Track practice history

### 🧑‍⚕️ Therapist

* View assigned children
* Create pronunciation exercises
* Assign exercises to children
* Generate child-friendly exercises using AI
* Define target phonemes and words
* Review child pronunciation attempts
* Listen to child recordings
* View pronunciation analysis
* Provide professional therapist feedback
* Monitor individual child progress

### 🛡️ Admin

* Manage users
* Manage therapist accounts
* Verify therapists
* Manage platform access and roles
* Monitor system activity

---

# 🤖 AI Features

SAWT uses multiple AI and speech-processing technologies rather than relying only on traditional speech-to-text.

## 1. AI Exercise Generation

Therapists can generate pronunciation exercises using AI by selecting:

* Language
* Target phoneme
* Difficulty
* Number of target words

The AI generates child-friendly target words and meaningful visual emojis to make exercises easier for children to understand.

Example:

```text
Target phoneme: S

☀️ Sun
🐍 Snake
⭐ Star
```

---

## 2. AI Pronunciation Analysis

A child records a target word and SAWT processes the recording through a speech-analysis pipeline.

```text
Target Word
     ↓
Child Recording
     ↓
Speech Processing
     ↓
Whisper / STT
     ↓
Phoneme-Level Analysis
     ↓
Pronunciation Comparison
     ↓
Score + Detected Errors
     ↓
AI Feedback
```

The goal is to detect pronunciation differences rather than simply checking whether the speech-to-text system understood the intended word.

For example, a child may pronounce a target word incorrectly while a traditional speech-to-text system still recognizes the intended word.

SAWT therefore uses phoneme-level analysis to provide more meaningful pronunciation information.

---

## 3. AI Text-to-Speech

SAWT uses **Gemini Text-to-Speech** to provide example pronunciations of target words.

Children can listen to the target word before recording their own attempt.

The generated audio is returned by the backend and played directly in the child practice interface.

---

## 4. AI Feedback

After pronunciation analysis, SAWT generates simple and understandable feedback for the child.

The system is designed to provide encouraging feedback while keeping professional speech therapy decisions under the therapist's control.

---

# 🧠 Speech Processing Pipeline

The pronunciation analysis pipeline combines several technologies:

```text
                    ┌─────────────────┐
                    │   Target Word   │
                    └────────┬────────┘
                             ↓
                    ┌─────────────────┐
                    │ Child Recording │
                    └────────┬────────┘
                             ↓
                    ┌─────────────────┐
                    │ Audio Processing│
                    └────────┬────────┘
                             ↓
                    ┌─────────────────┐
                    │     Whisper     │
                    │  Transcription  │
                    └────────┬────────┘
                             ↓
                    ┌─────────────────┐
                    │ Phoneme Analysis│
                    │ wav2vec/Open... │
                    └────────┬────────┘
                             ↓
                    ┌─────────────────┐
                    │ Pronunciation   │
                    │     Score       │
                    └────────┬────────┘
                             ↓
                    ┌─────────────────┐
                    │   AI Feedback   │
                    └─────────────────┘
```

---

# 🏗️ Technology Stack

## Frontend

* **Next.js**
* **TypeScript**
* **Tailwind CSS**
* React

## Backend

* **FastAPI**
* **Python**
* REST API

## Database

* **MongoDB**

## AI & Speech

* **Whisper** — speech transcription
* **wav2vec 2.0** — speech representation / phoneme-level analysis
* **OpenPronounce** — pronunciation assessment
* **Groq** — AI processing and feedback
* **Google Gemini** — AI exercise generation and text-to-speech

## Authentication

* JWT authentication
* Role-based access control (RBAC)

## Storage

* Audio recording storage using object-storage-compatible architecture

---

# 🏛️ System Architecture

```text
┌─────────────────────────────────────────────┐
│                  SAWT                       │
│                                             │
│              Next.js Frontend               │
│         TypeScript + Tailwind CSS           │
└──────────────────────┬──────────────────────┘
                       │
                       │ REST API
                       ↓
┌─────────────────────────────────────────────┐
│              FastAPI Backend                │
│                                             │
│ Authentication │ Users │ Exercises          │
│ Attempts │ Progress │ AI Services           │
└──────────────┬───────────────┬──────────────┘
               │               │
               ↓               ↓
       ┌─────────────┐   ┌─────────────────┐
       │   MongoDB   │   │  AI / Speech    │
       │             │   │    Pipeline     │
       └─────────────┘   └────────┬────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    ↓             ↓             ↓
                 Whisper      wav2vec      Gemini/Groq
```

---

# 👥 User Roles

SAWT uses four main roles:

| Role            | Main Responsibility                                  |
| --------------- | ---------------------------------------------------- |
| 👧 Child        | Practice assigned pronunciation exercises            |
| 👨‍👩‍👧 Parent | Manage children and monitor progress                 |
| 🧑‍⚕️ Therapist | Create exercises, analyze attempts, provide feedback |
| 🛡️ Admin       | Manage users and verify therapists                   |

### Account Rules

* Parents create child accounts.
* Children do not self-register.
* Therapists are added by administrators.
* Therapist accounts must be verified before full access.
* Role-based access controls protect each user's functionality.

---

# 📂 Project Structure

```text
SAWT/
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── admin/
│   │   │   ├── child/
│   │   │   ├── parent/
│   │   │   ├── therapist/
│   │   │   ├── login/
│   │   │   └── register/
│   │   │
│   │   ├── components/
│   │   └── lib/
│   │
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── db/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── utils/
│   │
│   └── requirements.txt
│
├── OpenPronounce/
│
└── README.md
```

---

# 🚀 Getting Started

## Prerequisites

Make sure you have installed:

* Node.js
* Python 3.12+
* MongoDB
* FFmpeg
* eSpeak NG
* Git

---

# ⚙️ Backend Setup

Navigate to the backend:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it on Windows:

```powershell
.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file:

```env
MONGODB_URL=your-mongodb-atlas-connection-string
DATABASE_NAME=sawt

JWT_SECRET_KEY=your-secret-key

GROQ_API_KEY=your-groq-api-key
GEMINI_API_KEY=your-gemini-api-key
```

Start MongoDB.

Then run the FastAPI server:

```bash
uvicorn app.main:app --reload
```

The backend will run at:

```text
http://127.0.0.1:8000
```

Health check:

```text
GET /health
```

---

# 💻 Frontend Setup

Navigate to the frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will run at:

```text
http://localhost:3000
```

---

# 🔐 Environment Variables

Never commit API keys or secrets to GitHub.

The following values should remain private:

```env
GROQ_API_KEY=
GEMINI_API_KEY=
JWT_SECRET_KEY=
MONGODB_URL=
```

Make sure `.env` is included in `.gitignore`.

Example:

```gitignore
.env
.env.local
.venv/
__pycache__/
node_modules/
.next/
```

---

# 🔄 Main User Flow

```text
Parent Registers
       ↓
Parent Creates Child
       ↓
Therapist Assigns Exercise
       ↓
Child Enters Practice
       ↓
Child Hears Target Pronunciation
       ↓
Child Records Attempt
       ↓
SAWT Processes Audio
       ↓
Pronunciation Analysis
       ↓
AI Score + Feedback
       ↓
Parent Monitors Progress
       ↓
Therapist Reviews Attempt
       ↓
Therapist Adds Professional Feedback
```

---

# 🎯 Project Goals

SAWT aims to provide:

* Accessible pronunciation practice at home
* Immediate child-friendly feedback
* Useful progress information for parents
* Detailed pronunciation information for therapists
* AI-assisted exercise generation
* AI-assisted pronunciation analysis
* A secure role-based platform
* Support for both Arabic and English

---

# 🔒 Privacy & Safety

SAWT handles children's speech recordings and therefore treats audio data as sensitive project data.

The system is designed around:

* Role-based access control
* Authenticated API requests
* Protected child profiles
* Restricted therapist access
* Secure handling of audio recordings
* Server-side AI API keys
* No exposure of secret credentials in the frontend

SAWT does **not** claim to diagnose speech disorders or replace professional speech therapy.

---

# 🧪 Current Development Status

SAWT is currently being developed as a capstone project.

Implemented areas include:

* Authentication and role-based access
* Parent dashboard
* Child management
* Therapist dashboard
* Admin dashboard
* Exercise management
* AI exercise generation
* Child exercise assignment
* Child pronunciation practice
* Audio recording
* Speech transcription
* Pronunciation analysis
* AI-generated feedback
* Gemini text-to-speech
* Parent progress tracking
* Therapist feedback
* Child practice history
* Audio attempt history

---

# 🔮 Future Improvements

Potential future improvements include:

* More advanced child-specific pronunciation models
* Personalized exercise difficulty
* Personalized exercise generation based on previous errors
* Expanded Arabic phoneme support
* Additional languages
* More detailed phoneme visualizations
* Advanced therapist analytics
* Mobile application
* Long-term pronunciation progress trends
* Improved audio storage and processing infrastructure
* More sophisticated pronunciation error classification

---


# 🎓 Academic Project

SAWT was developed as a **Computer Science capstone project** focused on combining:

* Full-stack web development
* Speech processing
* Artificial intelligence
* Pronunciation analysis
* Child-focused UX
* Role-based healthcare workflows

The project explores how AI and speech technologies can support pronunciation practice between professional therapy sessions.

---

## 📄 License

This project is developed for academic and educational purposes.
