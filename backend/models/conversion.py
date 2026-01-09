from sqlalchemy import Column, Integer, String, DateTime, Enum, Float, Text
from sqlalchemy.sql import func
import enum
from models.database import Base

class ConversionStatus(enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class Conversion(Base):
    __tablename__ = "conversions"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    file_format = Column(String, nullable=False)
    status = Column(Enum(ConversionStatus), default=ConversionStatus.PENDING)
    voice_id = Column(String, nullable=True)
    output_path = Column(String, nullable=True)
    progress = Column(Float, default=0.0)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    task_id = Column(String, nullable=True)

class VoiceProfile(Base):
    __tablename__ = "voice_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    voice_type = Column(String, nullable=False)
    file_path = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())