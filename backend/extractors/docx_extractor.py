from docx import Document
from extractors.base import BaseExtractor

class DOCXExtractor(BaseExtractor):
    def extract(self, file_path: str) -> str:
        doc = Document(file_path)
        text = ""
        
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        
        return text
    
    def supports_format(self, file_extension: str) -> bool:
        return file_extension.lower() in ['.docx', '.doc']