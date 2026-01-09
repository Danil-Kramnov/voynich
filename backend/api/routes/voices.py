from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from models.database import get_db
from models.conversion import VoiceProfile
from api.schemas.conversion import VoiceProfileResponse
from config import get_settings
import os
import shutil
from typing import List

router = APIRouter()
settings = get_settings()

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