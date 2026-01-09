from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from api.routes import conversion, voices
from models.database import engine, Base
from config import get_settings
import os
from pathlib import Path

settings = get_settings()

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Voynich API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(conversion.router, prefix="/api/conversion", tags=["conversion"])
app.include_router(voices.router, prefix="/api/voices", tags=["voices"])

os.makedirs(settings.output_dir, exist_ok=True)
app.mount("/outputs", StaticFiles(directory=settings.output_dir), name="outputs")

# Frontend static files
FRONTEND_DIR = Path(__file__).parent.parent / "frontend" / "static"
if FRONTEND_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")

@app.get("/", response_class=HTMLResponse)
async def root():
    index_path = FRONTEND_DIR / "index.html"
    if index_path.exists():
        return HTMLResponse(content=index_path.read_text())
    return HTMLResponse(content="<h1>Voynich API</h1><p>Frontend not found. API available at /api/</p>")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)