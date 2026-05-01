import os
import struct

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

def convert_to_wav(audio_data: bytes, sample_rate=24000, bits_per_sample=16, num_channels=1) -> bytes:
    data_size = len(audio_data)
    bytes_per_sample = bits_per_sample // 8
    block_align = num_channels * bytes_per_sample
    byte_rate = sample_rate * block_align
    chunk_size = 36 + data_size
    header = struct.pack(
        "<4sI4s4sIHHIIHH4sI",
        b"RIFF", chunk_size, b"WAVE", b"fmt ",
        16, 1, num_channels, sample_rate,
        byte_rate, block_align, bits_per_sample,
        b"data", data_size
    )
    return header + audio_data

fixed = 0
skipped = 0

for filename in sorted(os.listdir(DATA_DIR)):
    if not (filename.startswith("commentary_") and filename.endswith(".wav")):
        continue

    path = os.path.join(DATA_DIR, filename)
    with open(path, "rb") as f:
        data = f.read()

    if data[:4] == b"RIFF":
        print(f"Zaten düzgün, atlanıyor: {filename}")
        skipped += 1
        continue

    wav_bytes = convert_to_wav(data)
    with open(path, "wb") as f:
        f.write(wav_bytes)
    print(f"Düzeltildi: {filename}")
    fixed += 1

print(f"\nTamamlandı! {fixed} düzeltildi, {skipped} zaten düzgündü.")