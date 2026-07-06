# 🔬 PhysicsLab AI
### IBM AICTE Problem Statement: AI Lab Manual & Experiment Generator
> Powered by **IBM watsonx.ai** with **IBM Granite** Models · Deployed on **IBM Cloud**

---

## 📌 Overview

**PhysicsLab AI** is an intelligent web application that generates complete physics laboratory manuals for undergraduate engineering students. Built on IBM watsonx.ai with IBM Granite models, it helps students, lab instructors, and educators instantly generate:

- ✅ Complete lab manuals (Aim → Theory → Apparatus → Procedure → Result)
- ✅ Observation tables and calculation formats
- ✅ Viva questions with detailed model answers
- ✅ Common mistakes and troubleshooting guides
- ✅ Simplified beginner-friendly explanations
- ✅ Exam-style notes with derivations

---

## 🏗️ Tech Stack

| Layer        | Technology                                          |
|--------------|-----------------------------------------------------|
| **AI Model** | IBM Granite (`ibm/granite-3-3-8b-instruct`)         |
| **AI API**   | IBM watsonx.ai Foundation Models SDK                |
| **Backend**  | Python · Flask · Flask-CORS                         |
| **Frontend** | HTML5 · Bootstrap 5 · Font Awesome 6 · Vanilla JS   |
| **Markdown** | Marked.js · Highlight.js                            |
| **Deploy**   | IBM Cloud Foundry / IBM Code Engine                 |
| **WSGI**     | Gunicorn                                            |

---

## 📁 Project Structure

```
physicslab-ai/
├── app.py                  # Flask backend + watsonx.ai integration
├── requirements.txt        # Python dependencies
├── runtime.txt             # Python runtime for IBM Cloud
├── Procfile                # Gunicorn command for IBM Cloud
├── manifest.yml            # IBM Cloud Foundry deployment config
├── .env.example            # Environment variable template
├── .gitignore              # Git ignore rules
├── .cfignore               # IBM Cloud ignore rules
├── README.md               # This file
├── templates/
│   └── index.html          # Main frontend (single-page app)
├── static/
│   ├── css/
│   │   └── style.css       # Custom stylesheet (dark/light theme)
│   └── js/
│       └── app.js          # Frontend application controller
└── uploads/                # RAG document uploads (future use)
    └── .gitkeep
```

---

## ⚡ Quick Start — Run Locally

### Prerequisites
- Python 3.11+
- IBM Cloud account with watsonx.ai service enabled
- IBM API Key and watsonx.ai Project ID

### Step 1: Clone / Navigate to Project
```bash
cd physicslab-ai
```

### Step 2: Create Virtual Environment
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Configure Environment Variables
```bash
# Copy the example file
cp .env.example .env

# Edit .env with your IBM credentials:
# IBM_API_KEY=your_actual_api_key
# IBM_PROJECT_ID=your_actual_project_id
```

### Step 5: Run the Application
```bash
python app.py
```

Open your browser: **http://localhost:5000**

---

## 🔑 Getting IBM Credentials

### 1. IBM Cloud API Key
1. Go to [IBM Cloud Console](https://cloud.ibm.com)
2. Navigate to **Manage → Access (IAM) → API keys**
3. Click **Create an IBM Cloud API key**
4. Copy the key immediately (it won't be shown again)

### 2. IBM watsonx.ai Project ID
1. Go to [IBM watsonx.ai](https://dataplatform.cloud.ibm.com)
2. Open or create a project
3. Click the project → **Settings** tab
4. Copy the **Project ID** from the General section

### 3. Enable Granite Model Access
1. In your watsonx.ai project, navigate to **Foundation Models**
2. Ensure `ibm/granite-3-3-8b-instruct` is available
3. If not, request access from IBM watsonx.ai catalog

---

## 🧪 Supported Experiments

| # | Experiment                          | Category        |
|---|-------------------------------------|-----------------|
| 1 | Newton's Rings                      | Optics          |
| 2 | Young's Double Slit Experiment      | Optics          |
| 3 | Diffraction Grating                 | Optics          |
| 4 | Brewster's Law                      | Optics          |
| 5 | Malus' Law                          | Optics          |
| 6 | Simple Pendulum                     | Mechanics       |
| 7 | Compound Pendulum                   | Mechanics       |
| 8 | Photoelectric Effect                | Modern Physics  |
| 9 | Hall Effect                         | Modern Physics  |
|10 | RC Circuit (Charging & Discharging) | Electricity     |
|11 | Resonance Tube                      | Mechanics       |
|12 | Spectrometer (Prism)                | Optics          |
|13 | Biot-Savart Law Verification        | Electricity     |
|14 | Potentiometer Experiments           | Electricity     |

---

## 🎯 Generated Sections

Each experiment can generate:

| Section           | Description                                        |
|-------------------|----------------------------------------------------|
| **Full Manual**   | All sections combined in one complete document     |
| **Aim & Theory**  | Experiment objective + theoretical background      |
| **Procedure**     | Apparatus list + numbered step-by-step procedure   |
| **Tables**        | Observation tables + calculation format            |
| **Viva Q&A**      | 10+ viva questions with model answers              |
| **Common Mistakes** | Mistakes table with effects and fixes            |
| **Simplified**    | Plain-English explanation for beginners            |
| **Exam Mode**     | Formal exam-style derivations and key points       |

---

## 💬 Sample Prompts

Try these in the AI Chat interface:

```
1. Generate a complete lab manual for Newton's Rings experiment
2. Explain the theory behind Young's Double Slit Experiment with derivation
3. Give me 10 viva questions with answers for Diffraction Grating
4. What are common mistakes in the RC Circuit experiment?
5. Explain Photoelectric Effect simply for a beginner
6. Write the observation table for Hall Effect experiment
7. What precautions should I take during Brewster's Law experiment?
8. Give an exam-style answer for the Malus' Law experiment
9. What is the formula for Newton's Rings and derive it
10. Explain why we use sodium light in Newton's Rings experiment
```

---

## 📤 Sample Output Format

```markdown
## Newton's Rings Experiment

### Aim
To determine the wavelength of monochromatic light using Newton's rings phenomenon.

### Theory
When a plano-convex lens is placed on a flat glass plate, a thin air film
is formed between them. When illuminated with monochromatic light, circular
interference fringes (Newton's rings) are observed due to the air wedge.

**Key Formula:**
λ = (D²_n+m - D²_n) / (4mR)

Where:
- λ = wavelength of light
- D_n = diameter of nth ring
- R = radius of curvature of the lens
- m = number of rings counted

### Apparatus
1. Plano-convex lens (R ≈ 100 cm)
2. Plane glass plate
3. Sodium lamp (λ = 589.3 nm)
...
```

---

## 🤖 AGENT_INSTRUCTIONS — Customization Guide

The `AGENT_INSTRUCTIONS` dictionary in [`app.py`](app.py) lets you fully customize the AI agent:

```python
AGENT_INSTRUCTIONS = {
    "role":            "Customize the agent's identity and expertise",
    "teaching_style":  "Adjust how concepts are explained",
    "physics_level":   "Set the academic level (high school / undergraduate / grad)",
    "tone":            "Professional / friendly / formal / casual",
    "output_format":   "Customize the markdown structure of responses",
    "safety_rules":    "Lab safety and content safety guidelines",
    "exam_mode_instruction": "How to handle exam-style requests",
    "supported_experiments": ["List of experiments the agent covers"],
}
```

---

## ☁️ Deploy on IBM Cloud Foundry

### Prerequisites
- [IBM Cloud CLI](https://cloud.ibm.com/docs/cli) installed
- IBM Cloud Foundry runtime enabled
- App running locally first (verify credentials work)

### Deployment Steps

```bash
# Step 1: Login to IBM Cloud
ibmcloud login --sso

# Step 2: Target Cloud Foundry space
ibmcloud target --cf
ibmcloud target -o YOUR_ORG -s YOUR_SPACE

# Step 3: Set secret environment variables
ibmcloud cf set-env physicslab-ai IBM_API_KEY "your-api-key-here"
ibmcloud cf set-env physicslab-ai IBM_PROJECT_ID "your-project-id-here"

# Step 4: Deploy
ibmcloud cf push

# Step 5: Check status
ibmcloud cf logs physicslab-ai --recent
ibmcloud cf app physicslab-ai
```

Your app will be available at: `https://physicslab-ai.mybluemix.net`

---

## ☁️ Deploy on IBM Code Engine (Alternative)

```bash
# Build and deploy using IBM Code Engine
ibmcloud ce project create --name physicslab-ai-project
ibmcloud ce project select --name physicslab-ai-project

ibmcloud ce app create \
  --name physicslab-ai \
  --image ibmcom/physicslab-ai:latest \
  --env IBM_API_KEY=your-key \
  --env IBM_PROJECT_ID=your-project-id \
  --port 5000 \
  --min-scale 1 --max-scale 5
```

---

## 🔒 Security Notes

- ✅ `.env` file is **NEVER** committed (protected by `.gitignore`)
- ✅ All IBM credentials loaded from environment variables
- ✅ API keys never exposed in frontend JavaScript
- ✅ Flask-CORS configured for controlled cross-origin access
- ✅ `.cfignore` prevents accidental upload of credentials to IBM Cloud

---

## 🗺️ Future Enhancements (RAG Architecture Ready)

The project is designed to be extended with RAG (Retrieval-Augmented Generation):

```python
# Future: Upload physics lab manuals as PDFs
# The architecture supports:
# 1. PDF upload → text extraction
# 2. Embedding with sentence-transformers
# 3. Vector storage with ChromaDB
# 4. Retrieval during generation for accuracy
# 5. Citation of source documents

# To enable, uncomment in requirements.txt:
# langchain, langchain-ibm, chromadb, sentence-transformers, pypdf
```

---

## 🏫 IBM AICTE Project Information

| Field         | Value                                              |
|---------------|----------------------------------------------------|
| **Problem**   | AI Lab Manual & Experiment Generator               |
| **Domain**    | Education Technology (EdTech)                      |
| **Tech**      | IBM watsonx.ai, IBM Granite, IBM Cloud             |
| **Audience**  | B.Tech / B.E. First Year Engineering Students      |
| **Subject**   | Engineering Physics Laboratory                     |
| **Purpose**   | Automate and enhance lab manual generation         |

---

## 📄 License

This project is developed as part of the **IBM AICTE Internship Program**.  
Built with IBM watsonx.ai · IBM Granite Models · IBM Cloud

---

<p align="center">
  🔬 <strong>PhysicsLab AI</strong> · Made with ❤️ for IBM AICTE Internship<br>
  Powered by <strong>IBM watsonx.ai</strong> with <strong>IBM Granite</strong> · Deployed on <strong>IBM Cloud</strong><br>
  Developed by <strong>Harshal Tushar Bhange</strong>
</p>
