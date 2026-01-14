from extractors.base import BaseExtractor
from extractors.ocr import get_ocr_processor

class ImageExtractor(BaseExtractor):
    """Extract text from image files using OCR."""

    SUPPORTED_FORMATS = ['.png', '.jpg', '.jpeg', '.tiff', '.tif', '.bmp', '.webp']

    def extract(self, file_path: str) -> str:
        ocr = get_ocr_processor()
        text = ocr.extract_from_file(file_path)
        return text

    def supports_format(self, file_extension: str) -> bool:
        return file_extension.lower() in self.SUPPORTED_FORMATS
