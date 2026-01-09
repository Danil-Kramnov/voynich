import ebooklib
from ebooklib import epub
from bs4 import BeautifulSoup
from extractors.base import BaseExtractor

class EPUBExtractor(BaseExtractor):
    def extract(self, file_path: str) -> str:
        book = epub.read_epub(file_path)
        text = ""
        
        for item in book.get_items():
            if item.get_type() == ebooklib.ITEM_DOCUMENT:
                soup = BeautifulSoup(item.get_content(), 'html.parser')
                text += soup.get_text() + "\n"
        
        return text
    
    def supports_format(self, file_extension: str) -> bool:
        return file_extension.lower() == '.epub'