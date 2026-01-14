from celery import Task
from sqlalchemy.orm import Session
from celery_app import celery_app
from models.database import SessionLocal
from models.conversion import Conversion, ConversionStatus
from extractors.factory import ExtractorFactory
from tts.tts_manager import TTSManager
from tts.chunker import TextChunker
from audio.processor import AudioProcessor
from config import get_settings
import os
import tempfile
from datetime import datetime

settings = get_settings()

class ConversionTask(Task):
    def on_failure(self, exc, task_id, args, kwargs, einfo):
        db = SessionLocal()
        conversion_id = args[0]
        conversion = db.query(Conversion).filter(Conversion.id == conversion_id).first()
        if conversion:
            conversion.status = ConversionStatus.FAILED
            conversion.error_message = str(exc)
            db.commit()
        db.close()

@celery_app.task(base=ConversionTask, bind=True)
def convert_to_audiobook(self, conversion_id: int):
    db = SessionLocal()

    try:
        conversion = db.query(Conversion).filter(Conversion.id == conversion_id).first()
        conversion.status = ConversionStatus.PROCESSING
        conversion.started_at = datetime.utcnow()
        db.commit()

        file_path = os.path.join(settings.upload_dir, conversion.filename)
        file_ext = os.path.splitext(conversion.filename)[1]

        extractor = ExtractorFactory.get_extractor(file_ext)
        if not extractor:
            raise ValueError(f"Unsupported format: {file_ext}")

        text = extractor.extract(file_path)

        chunker = TextChunker(max_chars=500)
        chunks = chunker.chunk_by_sentences(text)

        tts_manager = TTSManager(settings.voices_dir)

        # voice_id is now an edge-tts voice name (e.g., "en-US-AriaNeural")
        voice_name = conversion.voice_id if conversion.voice_id else None

        temp_audio_files = []
        total_chunks = len(chunks)

        conversion.chunks_total = total_chunks
        conversion.chunks_completed = 0
        db.commit()

        for idx, chunk in enumerate(chunks):
            temp_output = os.path.join(tempfile.gettempdir(), f"chunk_{conversion_id}_{idx}.mp3")
            tts_manager.synthesize(chunk, temp_output, voice_name)
            temp_audio_files.append(temp_output)

            progress = ((idx + 1) / total_chunks) * 100
            conversion.progress = progress
            conversion.chunks_completed = idx + 1
            db.commit()

        output_filename = f"{os.path.splitext(conversion.filename)[0]}.mp3"
        output_path = os.path.join(settings.output_dir, output_filename)

        AudioProcessor.merge_audio_files(temp_audio_files, output_path)

        conversion.status = ConversionStatus.COMPLETED
        conversion.output_path = output_filename
        conversion.progress = 100.0
        conversion.completed_at = datetime.utcnow()
        db.commit()

    except Exception as e:
        conversion.status = ConversionStatus.FAILED
        conversion.error_message = str(e)
        db.commit()
        raise
    finally:
        db.close()