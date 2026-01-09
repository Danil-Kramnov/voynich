from TTS.api import TTS
import os
from typing import Optional

class TTSManager:
    def __init__(self, voices_dir: str):
        self.voices_dir = voices_dir
        self.model = None
        self._initialize_model()

    def _initialize_model(self):
        # Use a smaller, faster English TTS model
        # This model doesn't require voice cloning but is more reliable
        os.environ['COQUI_TOS_AGREED'] = '1'
        self.model = TTS("tts_models/en/ljspeech/tacotron2-DDC")

    def synthesize(
        self,
        text: str,
        output_path: str,
        voice_file: Optional[str] = None,
        language: str = "en"
    ) -> str:
        # Note: This simpler model doesn't support voice cloning
        # voice_file parameter is kept for API compatibility
        self.model.tts_to_file(
            text=text,
            file_path=output_path
        )

        return output_path
    
    def get_available_voices(self):
        voices = []
        if os.path.exists(self.voices_dir):
            for file in os.listdir(self.voices_dir):
                if file.endswith(('.wav', '.mp3')):
                    voices.append(file)
        return voices