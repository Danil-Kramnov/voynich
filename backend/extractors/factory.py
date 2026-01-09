from typing import Optional
from extractors.base import BaseExtractor
from extractors.pdf_extractor import PDFExtractor
from extractors.docx_extractor import DOCXExtractor
from extractors.epub_extractor import EPUBExtractor
from extractors.fb2_extractor import FB2Extractor

class ExtractorFactory:
    _extractors = [
        PDFExtractor(),
        DOCXExtractor(),
        EPUBExtractor(),
        FB2Extractor(),
    ]
    
    @classmethod
    def get_extractor(cls, file_extension: str) -> Optional[BaseExtractor]:
        for extractor in cls._extractors:
            if extractor.supports_format(file_extension):
                return extractor
        return None