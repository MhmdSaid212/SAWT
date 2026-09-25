import soundfile as sf
import torch
from transformers import Wav2Vec2Processor, Wav2Vec2ForCTC

model_name = "facebook/wav2vec2-lv-60-espeak-cv-ft"

processor = Wav2Vec2Processor.from_pretrained(model_name)
model = Wav2Vec2ForCTC.from_pretrained(model_name)

audio_path = r"C:\Users\User\OneDrive\Desktop\SAWT\backend\storage\audio\d34fbbe0-930c-4b4c-8090-2cb347840dab.wav"

audio, sample_rate = sf.read(audio_path, dtype="float32")

inputs = processor(
    audio,
    sampling_rate=sample_rate,
    return_tensors="pt",
    padding=True,
)

with torch.no_grad():
    logits = model(**inputs).logits

predicted_ids = torch.argmax(logits, dim=-1)

phonemes = processor.batch_decode(predicted_ids)[0]

print("Phonemes:", phonemes)
