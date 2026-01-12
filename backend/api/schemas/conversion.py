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
    started_at: Optional[datetime]
    chunks_total: Optional[int]
    chunks_completed: Optional[int]
    estimated_seconds_remaining: Optional[float] = None

    class Config:
        from_attributes = True

    @classmethod
    def from_orm_with_eta(cls, conversion):
        data = {
            "id": conversion.id,
            "filename": conversion.filename,
            "status": conversion.status,
            "progress": conversion.progress,
            "output_path": conversion.output_path,
            "error_message": conversion.error_message,
            "created_at": conversion.created_at,
            "started_at": conversion.started_at,
            "chunks_total": conversion.chunks_total,
            "chunks_completed": conversion.chunks_completed,
            "estimated_seconds_remaining": None
        }

        if (conversion.started_at and conversion.chunks_completed
                and conversion.chunks_completed > 0 and conversion.chunks_total):
            from datetime import datetime, timezone
            elapsed = (datetime.now(timezone.utc) - conversion.started_at).total_seconds()
            avg_chunk_time = elapsed / conversion.chunks_completed
            remaining_chunks = conversion.chunks_total - conversion.chunks_completed
            data["estimated_seconds_remaining"] = remaining_chunks * avg_chunk_time

        return cls(**data)

class VoiceProfileResponse(BaseModel):
    id: int
    name: str
    voice_type: str
    
    class Config:
        from_attributes = True