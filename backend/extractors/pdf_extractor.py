import fitz
from PIL import Image
import io
from extractors.base import BaseExtractor
from extractors.ocr import get_ocr_processor

class PDFExtractor(BaseExtractor):
    # Minimum characters per page to consider text extraction successful
    MIN_CHARS_PER_PAGE = 50

    def extract(self, file_path: str) -> str:
        doc = fitz.open(file_path)
        text = ""

        # First, try regular text extraction
        for page_num in range(len(doc)):
            page = doc[page_num]
            text += page.get_text()

        # Check if we got meaningful text
        avg_chars_per_page = len(text.strip()) / max(len(doc), 1)

        if avg_chars_per_page < self.MIN_CHARS_PER_PAGE:
            # Text extraction failed or minimal - try OCR
            text = self._extract_with_ocr(doc)

        doc.close()
        return text

    def _extract_with_ocr(self, doc: fitz.Document) -> str:
        """Extract text from PDF using OCR on rendered pages."""
        ocr = get_ocr_processor()
        text_parts = []

        for page_num in range(len(doc)):
            page = doc[page_num]

            # Render page to image at 300 DPI for good OCR quality
            mat = fitz.Matrix(300 / 72, 300 / 72)  # 300 DPI
            pix = page.get_pixmap(matrix=mat)

            # Convert to PIL Image
            img_data = pix.tobytes("png")
            image = Image.open(io.BytesIO(img_data))

            # Extract text with OCR
            page_text = ocr.extract_from_image(image)
            if page_text:
                text_parts.append(page_text)

        return "\n\n".join(text_parts)

    def supports_format(self, file_extension: str) -> bool:
        return file_extension.lower() == '.pdf'
