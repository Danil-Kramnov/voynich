import fitz
from extractors.base import BaseExtractor

class PDFExtractor(BaseExtractor):
    def extract(self, file_path: str) -> str:
        doc = fitz.open(file_path)
        text = ""
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            text += page.get_text()
        
        doc.close()
        return text
    
    def supports_format(self, file_extension: str) -> bool:
        return file_extension.lower() == '.pdf'