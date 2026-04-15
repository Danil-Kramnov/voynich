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
import asyncio
import shutil
from datetime import datetime

settings = get_settings()

class ConversionTask(Task):
    def on_failure(self, exc, task_id, args, kwargs, einfo):
        db = SessionLocal()
        conversion_id = args[0]
        try:
            conversion = db.query(Conversion).filter(Conversion.id == conversion_id).first()
            if conversion:
                conversion.status = ConversionStatus.FAILED
                conversion.error_message = str(exc)
                db.commit()
        finally:
            db.close()

@celery_app.task(base=ConversionTask, bind=True)
def convert_to_audiobook(self, conversion_id: int):
    db = SessionLocal()

    try:
        conversion = db.query(Conversion).filter(Conversion.id == conversion_id).first()
        if not conversion:
            raise ValueError(f"Conversion {conversion_id} not found in database")
        conversion.status = ConversionStatus.PROCESSING
        conversion.started_at = datetime.utcnow()
        db.commit()

        file_path = os.path.join(settings.upload_dir, conversion.filename)
        file_ext = os.path.splitext(conversion.filename)[1]

        extractor = ExtractorFactory.get_extractor(file_ext)
        if not extractor:
            raise ValueError(f"Unsupported format: {file_ext}")

        text = extractor.extract(file_path)

        chunker = TextChunker(max_chars=5000)
        chunks = chunker.chunk_by_sentences(text)

        tts_manager = TTSManager(settings.voices_dir)

        # voice_id is now an edge-tts voice name (e.g., "en-US-AriaNeural")
        voice_name = conversion.voice_id if conversion.voice_id else None

        total_chunks = len(chunks)
        temp_audio_files = [None] * total_chunks

        chunks_dir = os.path.join(settings.output_dir, f"chunks_{conversion_id}")
        os.makedirs(chunks_dir, exist_ok=True)

        already_done = sum(
            1 for i in range(total_chunks)
            if os.path.exists(os.path.join(chunks_dir, f"chunk_{i}.mp3"))
        )

        conversion.chunks_total = total_chunks
        conversion.chunks_completed = already_done
        conversion.progress = (already_done / total_chunks) * 100 if total_chunks else 0
        db.commit()

        completed = [already_done]
        semaphore = asyncio.Semaphore(3)

        async def synthesize_chunk(idx, chunk):
            temp_output = os.path.join(chunks_dir, f"chunk_{idx}.mp3")
            if os.path.exists(temp_output):
                temp_audio_files[idx] = temp_output
                return
            for attempt in range(5):
                try:
                    async with semaphore:
                        await tts_manager.synthesize_async(chunk, temp_output, voice_name)
                    break
                except Exception:
                    if attempt == 4:
                        raise
                    await asyncio.sleep(2 ** attempt)
            temp_audio_files[idx] = temp_output
            completed[0] += 1
            if completed[0] % 5 == 0 or completed[0] == total_chunks:
                conversion.progress = (completed[0] / total_chunks) * 100
                conversion.chunks_completed = completed[0]
                db.commit()

        async def run_all():
            await asyncio.gather(*[synthesize_chunk(i, c) for i, c in enumerate(chunks)])

        if os.name == 'nt':
            asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        print(f"[DEBUG] Total chunks: {total_chunks}, already done: {already_done}, remaining: {total_chunks - already_done}")
        asyncio.run(run_all())

        output_filename = f"{os.path.splitext(conversion.filename)[0]}.mp3"
        output_path = os.path.join(settings.output_dir, output_filename)

        AudioProcessor.merge_audio_files(temp_audio_files, output_path)
        shutil.rmtree(chunks_dir, ignore_errors=True)

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