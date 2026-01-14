import pytesseract
from PIL import Image
from typing import Optional
import io
import os
import platform

class OCRProcessor:
    """OCR processor using Tesseract for extracting text from images."""

    def __init__(self):
        # Set Tesseract path for Windows if not in PATH
        if platform.system() == 'Windows':
            tesseract_paths = [
                r'C:\Program Files\Tesseract-OCR\tesseract.exe',
                r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
                os.path.expanduser(r'~\AppData\Local\Programs\Tesseract-OCR\tesseract.exe'),
            ]
            for path in tesseract_paths:
                if os.path.exists(path):
                    pytesseract.pytesseract.tesseract_cmd = path
                    break

    def extract_from_image(self, image: Image.Image, lang: str = 'eng') -> str:
        """Extract text from a PIL Image using OCR."""
        try:
            # Convert to RGB if necessary (handles RGBA, P mode, etc.)
            if image.mode not in ('RGB', 'L'):
                image = image.convert('RGB')

            text = pytesseract.image_to_string(image, lang=lang)
            return text.strip()
        except Exception as e:
            raise RuntimeError(f"OCR failed: {str(e)}")

    def extract_from_bytes(self, image_bytes: bytes, lang: str = 'eng') -> str:
        """Extract text from image bytes using OCR."""
        image = Image.open(io.BytesIO(image_bytes))
        return self.extract_from_image(image, lang)

    def extract_from_file(self, file_path: str, lang: str = 'eng') -> str:
        """Extract text from an image file using OCR."""
        image = Image.open(file_path)
        return self.extract_from_image(image, lang)

    @staticmethod
    def is_tesseract_available() -> bool:
        """Check if Tesseract is installed and available."""
        try:
            pytesseract.get_tesseract_version()
            return True
        except Exception:
            return False


# Singleton instance
_ocr_processor: Optional[OCRProcessor] = None


def get_ocr_processor() -> OCRProcessor:
    """Get the OCR processor singleton instance."""
    global _ocr_processor
    if _ocr_processor is None:
        _ocr_processor = OCRProcessor()
    return _ocr_processor
