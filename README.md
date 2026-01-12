# Voynich

Document to audiobook converter. Upload a PDF, EPUB, DOCX, or FB2 and get an MP3 audiobook.

Uses Microsoft Edge TTS for high-quality speech synthesis with 200+ voices.

## Requirements

- Python 3.9+
- Docker (for PostgreSQL and Redis)
- FFmpeg

## Setup

### 1. Start Docker containers

```bash
docker run -d --name redis -p 6379:6379 redis
docker run -d --name postgres -p 5432:5432 -e POSTGRES_PASSWORD=yourpassword postgres
```

### 2. Install dependencies

**Windows:**
```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

**macOS/Linux:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Configure environment

Create `backend/.env`:
```
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/postgres
REDIS_URL=redis://localhost:6379
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/1
```

### 4. Run migrations

```bash
cd backend
alembic upgrade head
```

## Running

**Windows:**
```
start.bat    # start everything
stop.bat     # stop everything
status.bat   # check status
```

**macOS/Linux:**
```bash
./start.sh   # start everything
./stop.sh    # stop everything
./status.sh  # check status
```

Open http://localhost:8000

API docs at http://localhost:8000/docs

## Notes

- Requires internet connection (edge-tts uses Microsoft's online TTS service)
- Max upload size is 500MB by default
