from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from models.database import get_db
from models.conversion import Conversion, ConversionStatus
from api.schemas.conversion import ConversionResponse, ConversionCreate
from tasks.conversion_tasks import convert_to_audiobook
from celery_app import celery_app
from config import get_settings
import os
import shutil

router = APIRouter()
settings = get_settings()

@router.post("/upload", response_model=ConversionResponse)
async def upload_file(
    file: UploadFile = File(...),
    voice_id: str = None,
    db: Session = Depends(get_db)
):
    file_ext = os.path.splitext(file.filename)[1]
    supported_formats = ['.pdf', '.doc', '.docx', '.epub', '.fb2', '.mobi']
    
    if file_ext.lower() not in supported_formats:
        raise HTTPException(status_code=400, detail="Unsupported file format")
    
    os.makedirs(settings.upload_dir, exist_ok=True)
    
    file_path = os.path.join(settings.upload_dir, file.filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    conversion = Conversion(
        filename=file.filename,
        file_format=file_ext,
        voice_id=voice_id,
        status=ConversionStatus.PENDING
    )
    
    db.add(conversion)
    db.commit()
    db.refresh(conversion)
    
    task = convert_to_audiobook.delay(conversion.id)
    conversion.task_id = task.id
    db.commit()
    
    return conversion

@router.get("/list", response_model=List[ConversionResponse])
async def list_conversions(
    active_only: bool = Query(True, description="Only return active conversions"),
    db: Session = Depends(get_db)
):
    query = db.query(Conversion).order_by(Conversion.created_at.desc())

    if active_only:
        query = query.filter(
            Conversion.status.in_([ConversionStatus.PENDING, ConversionStatus.PROCESSING])
        )

    conversions = query.limit(50).all()
    return [ConversionResponse.from_orm_with_eta(c) for c in conversions]

@router.get("/status/{conversion_id}", response_model=ConversionResponse)
async def get_status(conversion_id: int, db: Session = Depends(get_db)):
    conversion = db.query(Conversion).filter(Conversion.id == conversion_id).first()

    if not conversion:
        raise HTTPException(status_code=404, detail="Conversion not found")

    return ConversionResponse.from_orm_with_eta(conversion)

@router.post("/cancel/{conversion_id}", response_model=ConversionResponse)
async def cancel_conversion(conversion_id: int, db: Session = Depends(get_db)):
    conversion = db.query(Conversion).filter(Conversion.id == conversion_id).first()

    if not conversion:
        raise HTTPException(status_code=404, detail="Conversion not found")

    if conversion.status in [ConversionStatus.COMPLETED, ConversionStatus.FAILED, ConversionStatus.CANCELLED]:
        raise HTTPException(status_code=400, detail="Conversion cannot be cancelled")

    if conversion.task_id:
        celery_app.control.revoke(conversion.task_id, terminate=True)

    conversion.status = ConversionStatus.CANCELLED
    db.commit()
    db.refresh(conversion)

    return conversion