from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from models.conversion import ConversionStatus

class ConversionCreate(BaseModel):
    voice_id: Optional[str] = None

class ConversionResponse(BaseModel):
    id: int
    filename: str
    status: ConversionStatus
    progress: float
    output_path: Optional[str]
    error_message: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class VoiceProfileResponse(BaseModel):
    id: int
    name: str
    voice_type: str
    
    class Config:
        from_attributes = True