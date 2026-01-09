from bs4 import BeautifulSoup
from extractors.base import BaseExtractor

class FB2Extractor(BaseExtractor):
    def extract(self, file_path: str) -> str:
        with open(file_path, 'r', encoding='utf-8') as f:
            soup = BeautifulSoup(f, 'xml')
        
        body = soup.find('body')
        if body:
            return body.get_text()
        return ""
    
    def supports_format(self, file_extension: str) -> bool:
        return file_extension.lower() == '.fb2'