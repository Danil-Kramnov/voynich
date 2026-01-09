# Voynich

Document to audiobook converter. Upload a PDF, EPUB, DOCX, or FB2 and get an MP3 audiobook.

Uses Coqui TTS for speech synthesis. You can also upload custom voice samples.

## Requirements

- Python 3.9+
- PostgreSQL
- Redis
- FFmpeg

## Setup

1. Clone and set up the database:
```bash
psql postgres -c "CREATE USER \"user\" WITH PASSWORD 'password';"
psql postgres -c "CREATE DATABASE audiobook_db OWNER \"user\";"
```

2. Install dependencies:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

3. Configure `backend/.env`:
```
DATABASE_URL=postgresql://user:password@localhost:5432/audiobook_db
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/1
```

4. Run migrations:
```bash
cd backend && source venv/bin/activate
alembic upgrade head
```

## Running

```bash
./start.sh   # start everything
./stop.sh    # stop everything
./status.sh  # check what's running
```

For development with auto-reload:
```bash
./dev.sh
```

Open http://localhost:8000

API docs at http://localhost:8000/docs

## Notes

- Max upload size is 500MB by default
