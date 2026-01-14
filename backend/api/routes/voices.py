from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from models.database import get_db
from models.conversion import VoiceProfile
from api.schemas.conversion import VoiceProfileResponse
from config import get_settings
import os
import shutil
import asyncio
import hashlib
import edge_tts
from typing import List
from pydantic import BaseModel

router = APIRouter()
settings = get_settings()

# Preview text for voice samples
PREVIEW_TEXT = "Hello! This is a preview of my voice. I can read your books and documents aloud."

class EdgeVoice(BaseModel):
    id: str
    name: str
    gender: str
    locale: str
    locale_name: str

# Map locale codes to friendly names
LOCALE_NAMES = {
    "en-US": "English (US)",
    "en-GB": "English (UK)",
    "en-AU": "English (Australia)",
    "en-CA": "English (Canada)",
    "en-IN": "English (India)",
    "en-IE": "English (Ireland)",
    "en-NZ": "English (New Zealand)",
    "en-ZA": "English (South Africa)",
    "en-SG": "English (Singapore)",
    "en-PH": "English (Philippines)",
    "en-HK": "English (Hong Kong)",
    "en-KE": "English (Kenya)",
    "en-NG": "English (Nigeria)",
    "en-TZ": "English (Tanzania)",
}

def get_locale_name(locale: str) -> str:
    return LOCALE_NAMES.get(locale, locale)

@router.post("/upload-voice", response_model=VoiceProfileResponse)
async def upload_voice(
    name: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    file_ext = os.path.splitext(file.filename)[1]
    
    if file_ext.lower() not in ['.wav', '.mp3']:
        raise HTTPException(status_code=400, detail="Only WAV and MP3 files supported")
    
    os.makedirs(settings.voices_dir, exist_ok=True)
    
    voice_filename = f"{name}{file_ext}"
    file_path = os.path.join(settings.voices_dir, voice_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    voice_profile = VoiceProfile(
        name=name,
        voice_type="custom",
        file_path=voice_filename
    )
    
    db.add(voice_profile)
    db.commit()
    db.refresh(voice_profile)
    
    return voice_profile

@router.get("/voices", response_model=List[VoiceProfileResponse])
async def list_voices(db: Session = Depends(get_db)):
    voices = db.query(VoiceProfile).all()
    return voices


@router.get("/edge-voices", response_model=List[EdgeVoice])
async def list_edge_voices(locale_filter: str = "en"):
    """List available edge-tts voices, filtered by locale prefix."""
    try:
        voices = await edge_tts.list_voices()

        # Filter and transform voices
        result = []
        for v in voices:
            if v["Locale"].startswith(locale_filter):
                # Extract friendly name from ShortName (e.g., "en-US-AriaNeural" -> "Aria")
                short_name = v["ShortName"]
                name_parts = short_name.split("-")
                friendly_name = name_parts[2].replace("Neural", "").replace("Multilingual", " (Multi)")

                result.append(EdgeVoice(
                    id=short_name,
                    name=friendly_name,
                    gender=v["Gender"],
                    locale=v["Locale"],
                    locale_name=get_locale_name(v["Locale"])
                ))

        # Sort by locale, then by name
        result.sort(key=lambda x: (x.locale, x.name))
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch voices: {str(e)}")


@router.get("/preview/{voice_id}")
async def get_voice_preview(voice_id: str):
    """Generate or return cached preview audio for a voice."""
    # Create preview cache directory
    preview_dir = os.path.join(settings.voices_dir, "previews")
    os.makedirs(preview_dir, exist_ok=True)

    # Create a hash-based filename for caching
    preview_file = os.path.join(preview_dir, f"{voice_id}.mp3")

    # Generate preview if not cached
    if not os.path.exists(preview_file):
        try:
            communicate = edge_tts.Communicate(PREVIEW_TEXT, voice_id)
            await communicate.save(preview_file)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to generate preview: {str(e)}")

    return FileResponse(
        preview_file,
        media_type="audio/mpeg",
        filename=f"{voice_id}_preview.mp3"
    )