import re
from typing import List

class TextChunker:
    def __init__(self, max_chars: int = 500):
        self.max_chars = max_chars

    def normalize_text(self, text: str) -> str:
        """Normalize whitespace to prevent TTS pausing at line breaks."""
        # Replace ALL whitespace characters (including Unicode) with regular space
        # \s matches [ \t\n\r\f\v] and Unicode whitespace
        text = re.sub(r'\s+', ' ', text)
        return text.strip()

    def chunk_by_sentences(self, text: str) -> List[str]:
        # Normalize text first to remove line breaks
        text = self.normalize_text(text)

        # Split on sentence-ending punctuation followed by space
        sentences = re.split(r'(?<=[.!?])\s+', text)

        chunks = []
        current_chunk = ""

        for sentence in sentences:
            if len(current_chunk) + len(sentence) <= self.max_chars:
                current_chunk += sentence + " "
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                current_chunk = sentence + " "

        if current_chunk:
            chunks.append(current_chunk.strip())

        return chunks
