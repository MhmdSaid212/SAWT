import subprocess
from pathlib import Path

import soundfile as sf
import torch
import whisper
from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor


WHISPER_MODEL = whisper.load_model("base")

WAV2VEC_PROCESSOR = Wav2Vec2Processor.from_pretrained(
    "facebook/wav2vec2-base-960h"
)

WAV2VEC_MODEL = Wav2Vec2ForCTC.from_pretrained(
    "facebook/wav2vec2-base-960h"
)

ESPEAK_PATH = r"C:\Program Files\eSpeak NG\espeak-ng.exe"


def transcribe_audio(audio_path: str) -> str:
    result = WHISPER_MODEL.transcribe(audio_path)
    return result["text"].strip()


def wav2vec_transcribe(audio_path: str) -> str:
    audio, sample_rate = sf.read(
        audio_path,
        dtype="float32",
    )

    inputs = WAV2VEC_PROCESSOR(
        audio,
        sampling_rate=sample_rate,
        return_tensors="pt",
        padding=True,
    )

    with torch.no_grad():
        logits = WAV2VEC_MODEL(**inputs).logits

    predicted_ids = torch.argmax(logits, dim=-1)

    return WAV2VEC_PROCESSOR.batch_decode(
        predicted_ids
    )[0].strip()


def phonemize_word(word: str) -> str:
    result = subprocess.run(
        [
            ESPEAK_PATH,
            "-q",
            "--ipa=3",
            "-v",
            "en",
            word,
        ],
        capture_output=True,
        text=True,
        check=True,
    )

    return result.stdout.strip()