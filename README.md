# 🛠️ Fixie — Service Desk Troubleshooter Assistant

Fixie is an AI-powered assistant designed for **L1 Service Desk Analysts**.  
It helps agents quickly diagnose user issues, provide **step-by-step admin-level resolutions**, generate **ticket-ready work notes**, and suggest **escalation paths** when needed.  

The assistant is meant to plug into existing ITSM platforms (like **ServiceNow, BMC Remedy, Jira Service Management, Freshservice**) or run as a standalone web app.

---

## ✨ Features
- 🎯 **Smart Troubleshooting** — Generates on-point, admin-level resolution steps for common IT issues.  
- 📝 **Auto Work Notes** — Creates concise, ticket-ready notes for service desk logging.  
- ❓ **Follow-Up Questions** — Suggests what additional info to ask if data is missing.  
- 🚦 **Escalation Guidance** — Defines when and where to escalate (L2 / Network / Vendor).  
- ⏱️ **Time-to-Resolution Estimate** — Quick ETA to set user expectations.  
- 🎨 **Modern UI (React + Vite)** — Simple, agent-friendly interface with **dark/light theme switcher**.  

---

## 🏗️ Project Structure
```
fixie-service-desk/
├── src/
│   ├── App.jsx          # Main React app
│   ├── components/      # UI components
│   ├── themes/          # Theme switcher styles
│   ├── assets/          # Icons, images
│   └── prompts/
│       └── fixie_troubleshooter_v2.json  # AI system prompt
├── public/              # Static files
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### 1. Clone the Repoa
```bash
git clone https://github.com/yourusername/fixie-service-desk.git
cd fixie-service-desk
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
Your app will be available at **http://localhost:5173/** (default Vite port).

---

## ⚡ How It Works
1. The **agent** enters:
   - `issue` (short problem label)
   - `symptoms` (user-reported details)
   - `device_info` (OS/app/device model — optional)
   - `steps_taken` (what’s already tried)

2. The **Fixie prompt** (`fixie_troubleshooter_v2.json`) sends these inputs to an LLM.  
3. The LLM returns structured JSON with:
   - Root cause
   - Step-by-step resolution
   - Work notes
   - Escalation guidance
   - ETA + Confidence score  

4. The React UI parses the JSON and shows it in a **clean, modern panel** for the agent.  

---

## 🧩 Example

### Input:
```json
{
  "issue": "Headphones not working",
  "symptoms": "No audio in Teams, device shows connected in Windows",
  "device_info": "Windows 11, Teams v1.6, USB Headset Model X",
  "steps_taken": "Restarted Teams"
}
```

### Output:
```json
{
  "root_cause": "Teams audio device not mapped to headset.",
  "resolution_steps": [
    "Open Teams → Settings → Devices → select 'USB Headset Model X'.",
    "Run 'Make a test call' in Teams.",
    "Open Windows Sound Settings → confirm headset as default input/output.",
    "Clear Teams cache: %appdata%/Microsoft/Teams → restart Teams."
  ],
  "work_note": "Headset not working in Teams. Updated device settings, cleared cache. Audio restored. Resolved.",
  "follow_up_questions": [
    "Does issue occur in other apps?",
    "Is headset USB or Bluetooth?",
    "Was there a recent driver update?"
  ],
  "escalation": { "when": "If still fails after cache clear & driver update.", "to": "Level 2 — Device Support" },
  "eta": "5–15 minutes",
  "confidence": 92
}
```

---

## 🛡️ Roadmap
- ✅ Core troubleshooting JSON template  
- ✅ React UI with theme switcher  
- 🔄 OS-specific troubleshooting (Windows, macOS, Linux)  
- 🔄 Integration with ServiceNow / Jira APIs  
- 🔄 Knowledge Base auto-suggestions  

---

## 📜 License
MIT License © 2025 — Built with ❤️ to make Service Desk agents faster & happier.
