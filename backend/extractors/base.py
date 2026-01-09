from abc import ABC, abstractmethod
from typing import Optional

class BaseExtractor(ABC):
    @abstractmethod
    def extract(self, file_path: str) -> str:
        pass
    
    @abstractmethod
    def supports_format(self, file_extension: str) -> bool:
        pass