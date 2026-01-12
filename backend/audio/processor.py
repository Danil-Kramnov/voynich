from pydub import AudioSegment
from typing import List
import os

class AudioProcessor:
    @staticmethod
    def merge_audio_files(file_paths: List[str], output_path: str) -> str:
        combined = AudioSegment.empty()
        
        for file_path in file_paths:
            audio = AudioSegment.from_file(file_path)
            combined += audio
        
        combined.export(output_path, format="mp3", bitrate="128k")
        
        for file_path in file_paths:
            os.remove(file_path)
        
        return output_path
    
    @staticmethod
    def convert_to_mp3(input_path: str, output_path: str) -> str:
        audio = AudioSegment.from_file(input_path)
        audio.export(output_path, format="mp3", bitrate="128k")
        return output_path