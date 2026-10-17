# AI Complaint Management System

## Requirements

- Windows 10/11
- Python 3.12
- Node.js 20.19+ or 22.12+
- Internet access the first time the AI model starts (the model and NLTK data may need to download)

The backend uses a local SQLite database by default. Docker and PostgreSQL are not needed for local development.

## Run locally on Windows

Open two PowerShell terminals in the project directory.

### 1. Start the backend

In the first terminal:

```powershell
Set-Location .\backend
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn main:app --reload
```

On first start, the AI dependencies and model may take a while to initialize. Keep this terminal running. The API is at <http://127.0.0.1:8000>, and its interactive documentation is at <http://127.0.0.1:8000/docs>.

### 2. Start the frontend

In the second terminal:

```powershell
Set-Location .\frontend
npm install
npm run dev
```

Open the local URL printed by Vite (usually <http://localhost:5173>). Use the login page to choose a portal and register or sign in.

## Optional checks

Run these from the project directory:

```powershell
Set-Location .\frontend
npm run build
npm run lint
```

Run the AI sample cases from a third terminal:

```powershell
Set-Location .\backend
.\.venv\Scripts\python.exe -m ai_module.tests.run_sample_cases
```

The API creates/uses `backend\complain_db.sqlite` when started from the `backend` directory. Keep the backend and frontend terminals open while using the application.
