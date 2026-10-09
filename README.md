
# AnalystHub 📊

A web-based data analytics workspace built with React and FastAPI. AnalystHub aims to bring dataset management, data profiling, data cleaning, and data analysis into one place.

> **Status:** In development

## ✨ Current Features

- **Dashboard** — Overview of the workspace and dataset statistics.
- **Dataset Management** — Upload datasets through the web interface.
- **Data Profiling** — Explore dataset structure and column information.
- **Data Cleaning** — A dedicated workspace for data-cleaning operations.
- **Data Analysis** — A workspace for data summaries and visualizations.
- **Dark and Light Mode** — Switch between different interface themes.
- **Responsive Interface** — A sidebar and navigation structure for accessing different sections.

*Feature availability and completeness may vary as development continues.*

## 🛠️ Technology Stack

### Frontend
- React
- Vite
- React Router
- Recharts
- CSS

### Backend
- Python
- FastAPI

## 📁 Project Structure

```text
AnalystHub/
├── backend/
│   ├── app/
│   │   └── main.py
│   └── requirements.txt
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   └── pages/
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Python
- Node.js and npm
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/QH0811/AnalystHub.git
cd AnalystHub
```

### 2. Start the Backend

Open a terminal in the project root.

```bash
cd backend
```

Create and activate a virtual environment if you do not already have one.

**Windows PowerShell:**

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

Install the Python dependencies:

```bash
pip install -r requirements.txt
```

Start FastAPI:

```bash
uvicorn app.main:app --reload
```

Backend: http://127.0.0.1:8000

API documentation: http://127.0.0.1:8000/docs

### 3. Start the Frontend

Open a **second terminal** in VS Code.

```bash
cd frontend
npm install
npm run dev
```

Open the local URL displayed in your terminal, usually:

http://localhost:5173

## 🔧 Development

AnalystHub is an ongoing personal project. Planned improvements may include more flexible analysis tools, additional visualizations, and enhanced data-cleaning workflows.

## 👨‍💻 Author

**Qian Han**

GitHub: [@QH0811](https://github.com/QH0811)

## 📌 Project Status

This project is actively being developed. Features, interface design, and functionality may change as development progresses.
