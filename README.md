# Voynich

Document to audiobook converter. Upload documents or images and get an MP3 audiobook.

Uses Microsoft Edge TTS for high-quality speech synthesis with 40+ English voices (and 300+ total across languages).

## Features

- **Multiple formats**: PDF, EPUB, DOCX, FB2, MOBI
- **Image/OCR support**: PNG, JPG, TIFF, BMP, WEBP - extracts text from images
- **Scanned PDF detection**: Automatically uses OCR when PDFs contain scanned images
- **Voice selection**: Choose from 40+ English voices with live preview
- **Conversion queue**: Track multiple conversions with progress and ETA
- **Dark mode**: Toggle between light and dark themes

## Requirements

- Python 3.9+
- Docker (for Redis)
- Tesseract OCR (for image/scanned document support)

## Setup

### 1. Start Redis

```bash
docker run -d --name redis -p 6379:6379 redis
```

### 2. Install Tesseract OCR

**Windows:**
Download from: https://github.com/UB-Mannheim/tesseract/wiki

Or via chocolatey:
```powershell
choco install tesseract
```

**macOS:**
```bash
brew install tesseract
```

**Linux:**
```bash
sudo apt install tesseract-ocr
```

### 3. Install Python dependencies

**Windows:**
```powershell
python -m venv venv
venv\Scripts\activate
pip install -r backend/requirements.txt
```

**macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
```

## Running

**Windows:**
```
start.bat
```

**macOS/Linux:**
```bash
./start.sh
```

Open http://localhost:8000

API docs at http://localhost:8000/docs

## Notes

- Requires internet connection (edge-tts uses Microsoft's online TTS service)
- Voice previews are cached after first playback
- OCR quality depends on image resolution (300 DPI recommended for scanned documents)
