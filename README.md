# Stellar VisionX

Advanced thermal-optical image super-resolution system powered by a Multi-Agent AI pipeline.

**Powered by Team Genesis**

---

## Architecture

```
Frontend (React/Vite) → Node.js Backend (Express) → Python AI Service (FastAPI)
                              ↕                            ↕
                        MongoDB Atlas                 Cloudinary
```

## Tech Stack

| Layer       | Technology                     |
|-------------|--------------------------------|
| Frontend    | React, Vite, Recharts          |
| Backend     | Node.js, Express, Mongoose     |
| AI Service  | Python, FastAPI, PyTorch, OpenCV |
| Database    | MongoDB Atlas                  |
| Storage     | Cloudinary                     |
| Auth        | JWT (jsonwebtoken + bcryptjs)  |

---

## Project Structure

```
visionX/
├── frontend/           # React app (Vite)
│   └── src/
│       ├── components/ # Layout, Sidebar
│       ├── context/    # AuthContext
│       ├── pages/      # All 9 pages
│       └── services/   # Axios API layer
├── backend-node/       # Express API
│   ├── models/         # User, Session, ActivityLog
│   ├── routes/         # auth, fusion, metrics, activity
│   └── middlewares/    # JWT auth
└── backend-python/     # FastAPI AI Service
    ├── app.py          # FastAPI server
    └── agents.py       # Multi-Agent System
```

---

## Setup Instructions

### 1. Backend (Node.js)

```bash
cd backend-node
cp .env.template .env        # Fill in your secrets
npm install
npm run dev                   # Starts on port 5000
```

### 2. AI Service (Python)

```bash
cd backend-python
python -m venv venv
# Windows: .\venv\Scripts\activate
# macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

### 3. Frontend (React)

```bash
cd frontend
cp .env.template .env         # Set VITE_API_URL
npm install
npm run dev                   # Starts on port 5173
```

---

## Environment Variables

### backend-node/.env
```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/visionx
JWT_SECRET=<random-32-char-string>
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=<your_cloud_name>
CLOUDINARY_API_KEY=<your_api_key>
CLOUDINARY_API_SECRET=<your_api_secret>
PYTHON_SERVICE_URL=http://localhost:8000
```

### frontend/.env
```
VITE_API_URL=http://localhost:5000/api
```

### backend-python (set as OS env vars or in .env)
```
CLOUDINARY_CLOUD_NAME=<your_cloud_name>
CLOUDINARY_API_KEY=<your_api_key>
CLOUDINARY_API_SECRET=<your_api_secret>
```

---

## Deployment

### Frontend → Vercel
1. Push `frontend/` to a GitHub repo
2. Connect repo to Vercel
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Add env variable: `VITE_API_URL=https://your-node-backend.onrender.com/api`

### Node Backend → Render
1. Push `backend-node/` to GitHub
2. Create a new Web Service on Render
3. Build command: `npm install`
4. Start command: `npm start`
5. Add all `.env` variables in Render dashboard

### Python AI Service → Render
1. Push `backend-python/` to GitHub
2. Create a new Web Service on Render
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn app:app --host 0.0.0.0 --port $PORT`
5. Add Cloudinary env vars
6. Update Node backend's `PYTHON_SERVICE_URL` to point to this service

---

## API Endpoints

| Method | Path                | Auth | Description              |
|--------|---------------------|------|--------------------------|
| POST   | /api/auth/register  | No   | Create new user          |
| POST   | /api/auth/login     | No   | Login, returns JWT       |
| GET    | /api/auth/user      | Yes  | Get current user info    |
| POST   | /api/fusion/run     | Yes  | Upload & run fusion      |
| GET    | /api/fusion/sessions| Yes  | List user sessions       |
| GET    | /api/fusion/:id     | Yes  | Get specific session     |
| GET    | /api/metrics/overview| Yes | Aggregated dashboard stats|
| GET    | /api/metrics/history| Yes  | Per-session metric data  |
| GET    | /api/activity       | Yes  | Activity timeline logs   |
| GET    | /api/status         | No   | System health check      |

---

## Multi-Agent Pipeline

```
ManagerAgent
  ├── DataPreprocessingAgent    → Align, denoise, normalize
  ├── FeatureExtractionAgent    → Canny + Sobel + Laplacian features
  ├── FusionAgent               → Cross-attention feature merging
  ├── SuperResolutionAgent      → 2x Lanczos + unsharp masking
  ├── LossFunctionAgent         → L1, MSE, thermal consistency
  └── EvaluationAgent           → PSNR, SSIM, RMSE, fidelity, hotspots
```
