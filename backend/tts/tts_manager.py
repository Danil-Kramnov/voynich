import edge_tts
import asyncio
import os
from typing import Optional

class TTSManager:
    def __init__(self, voices_dir: str):
        self.voices_dir = voices_dir
        self.default_voice = "en-US-AriaNeural"

    def synthesize(
        self,
        text: str,
        output_path: str,
        voice_file: Optional[str] = None,
        language: str = "en"
    ) -> str:
        # Use voice parameter or default
        voice = self.default_voice
        if voice_file:
            # voice_file can be used to specify an edge-tts voice name
            voice = voice_file

        # Run async edge-tts in sync context
        asyncio.run(self._synthesize_async(text, output_path, voice))
        return output_path

    async def _synthesize_async(self, text: str, output_path: str, voice: str):
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(output_path)

    def get_available_voices(self):
        """Return list of available edge-tts voices"""
        voices = asyncio.run(self._get_voices_async())
        return voices

    async def _get_voices_async(self):
        voices = await edge_tts.list_voices()
        return [v["ShortName"] for v in voices]
