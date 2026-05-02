import mimetypes
import os
import struct
import time
from google import genai
from google.genai import types

client = genai.Client(
    api_key=os.environ.get("GEMINI_API_KEY"),
)

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(OUTPUT_DIR, exist_ok=True)

SCENE = """## Scene:
A packed football stadium with 80,000 roaring fans. 
The atmosphere is electric and tense. 
The commentator is a passionate, experienced Turkish football broadcaster 
speaking directly into a professional microphone in the press box. 
His voice carries the weight of every moment — 
calm before the play, explosive on goals, 
dramatic on cards and misses.

## Sample Context:
The match is in its 78th minute. The score is level at 1-1. 
The crowd is on edge. The commentator has been calling the game 
for 90 minutes and knows every player on the pitch. 
He reacts instantly — no delay, no hesitation. 
Every word lands with conviction.

## Transcript:
"""

COMMENTARY = {

    "action_penalty": [
        "Hakem beyaz noktayı gösterdi! Penaltı!",
        "İtirazlar fayda etmedi, hakem penaltı kararında ısrar ediyor!",
        "Ceza sahasında net faul! Penaltı noktasına top konuluyor!",
        "Müthiş karar! Hakem tereddütsüz beyaz noktayı işaret etti!",
        "Tartışmalı ama net! Bu penaltı, hakem kesin emin.",
        "Kaleci-oyuncu 1'e 1! Penaltı düdüğü çaldı, saha fırladı!",
        "VAR onayladı, penaltı kesinleşti! Kritik bir an!",
        "Bu penaltıyı görmemek imkânsız! Hakem doğru karar verdi!",
        "Atış noktasına top konuluyor, tribünler nefesini tutuyor!",
        "Penaltı! Maçın en kritik anı olabilir bu!",
    ],

    "action_freekick_near": [
        "Çok tehlikeli bir noktadan serbest vuruş! Buradan gol olur!",
        "Ceza sahasına yakın, tehlikeli bir yerden duran top!",
        "Barajın tam gerisinden serbest vuruş! Kaleci tetikte!",
        "İşte tam isabet yeri! Burayı boşa harcamazlar!",
        "Yakın mesafeden frikik, defans panikte bariyer kuruyor!",
        "Bu pozisyondan en az 3'te 2 oranında gol olur! Heyecan dorukta!",
        "Ceza sahası sınırından tehlikeli duran top şansı!",
        "Bariyer hazırlanıyor, kaleci sağa sola koordinat veriyor!",
    ],

    "action_freekick_far": [
        "Uzak mesafeden serbest vuruş kullanılacak!",
        "Standart mesafeden duran top şansı, ama zor bir açı.",
        "Uzaktan topla buluşacaklar, iyi bir teknikle gol çıkabilir!",
        "Bu mesafeden nadiren gol olur ama imkânsız değil!",
        "Bariyer yerini aldı, kaleci pozisyon ayarlıyor.",
        "Serbest vuruş için atışa hazırlanıyorlar, stadyum sessiz.",
        "Uzaktan topu çerçeveleyebilirler, bekleyip göreceğiz!",
        "Uzak frikik, kolay değil ama fırsat her zaman fırsattır!",
    ],

    "action_freekick": [
        "Serbest vuruş kazandılar! Duran top şansı geldi!",
        "Hakem düdüğünü çaldı, serbest vuruş kullanılacak!",
        "Önemli bir duran top şansı, fırsat değerlendirilmeli!",
        "Frikik pozisyonu iyi, defans mevzi kurmaya çalışıyor!",
        "Serbest vuruş için hazırlanıyorlar, bariyer geride değil!",
        "Bu vuruşu kim kullanacak? Tüm gözler o oyuncuda!",
        "Kritik bir serbest vuruş, stadyum gergin bekleyiş içinde!",
        "Vuruş için hazır pozisyon, kaleci çizgide hazır!",
    ],

    "action_corner": [
        "Korner! Top köşe bayrağına yönleniyor!",
        "Kaleci kornere çıkardı! Fırsat buradan devam edecek.",
        "Köşe vuruşu kullanılacak! Ceza sahasında hava topu mücadelesi bekleniyor!",
        "Korner, tribünler coştu! Buradan gol gelebilir!",
        "Top kornere çıktı. Orta sahada yerli yerinde hazırlanıyorlar.",
        "Köşe bayrağına koşuyor! Standartta ne çıkar göreceğiz.",
        "Korner atışı için pozisyon alıyorlar, defans mevzilenmeye çalışıyor!",
        "Beşinci korner bu maçta! Baskı sürüyor, köşeyi değerlendirmeli!",
    ],
}


def convert_to_wav(audio_data: bytes, mime_type: str) -> bytes:
    parameters = parse_audio_mime_type(mime_type)
    bits_per_sample = parameters["bits_per_sample"]
    sample_rate = parameters["rate"]
    num_channels = 1
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


def parse_audio_mime_type(mime_type: str) -> dict:
    bits_per_sample = 16
    rate = 24000
    parts = mime_type.split(";")
    for param in parts:
        param = param.strip()
        if param.lower().startswith("rate="):
            try:
                rate = int(param.split("=", 1)[1])
            except (ValueError, IndexError):
                pass
        elif param.startswith("audio/L"):
            try:
                bits_per_sample = int(param.split("L", 1)[1])
            except (ValueError, IndexError):
                pass
    return {"bits_per_sample": bits_per_sample, "rate": rate}


def generate_audio(text: str, file_path: str):
    contents = [
        types.Content(
            role="user",
            parts=[types.Part.from_text(text=SCENE + text)],
        )
    ]
    config = types.GenerateContentConfig(
        temperature=1,
        response_modalities=["audio"],
        speech_config=types.SpeechConfig(
            voice_config=types.VoiceConfig(
                prebuilt_voice_config=types.PrebuiltVoiceConfig(
                    voice_name="Sadachbia"
                )
            )
        ),
    )

    audio_data = b""
    ext = ".wav"

    for chunk in client.models.generate_content_stream(
        model="gemini-3.1-flash-tts-preview",
        contents=contents,
        config=config,
    ):
        if chunk.parts is None:
            continue
        part = chunk.parts[0]
        if part.inline_data and part.inline_data.data:
            mime = part.inline_data.mime_type
            guessed_ext = mimetypes.guess_extension(mime)
            if guessed_ext:
                ext = guessed_ext
                audio_data += part.inline_data.data
            else:
                ext = ".wav"
                audio_data += part.inline_data.data

    if audio_data:
        wav_bytes = convert_to_wav(audio_data, "audio/L16;rate=24000")
        full_path = file_path + ".wav"
        with open(full_path, "wb") as f:
            f.write(wav_bytes)
        print(f"Kaydedildi: {full_path}")
        return True
    return False


def main():
    total = sum(len(v) for v in COMMENTARY.items() if isinstance(v, list))
    done = 0

    for category, lines in COMMENTARY.items():
        for i, line in enumerate(lines, start=1):
            num = str(i).zfill(2)
            file_path = os.path.join(OUTPUT_DIR, f"commentary_{category}_{num}")

            wav_path = file_path + ".wav"
            if os.path.exists(wav_path):
                print(f"Zaten var, atlanıyor: {wav_path}")
                done += 1
                continue

            print(f"[{done+1}] Üretiliyor: commentary_{category}_{num} — {line}")
            success = generate_audio(line, file_path)
            if success:
                done += 1
            else:
                print(f"HATA: {category}_{num} üretilemedi!")

            time.sleep(7)

    print(f"\nTamamlandı! {done} dosya üretildi.")


if __name__ == "__main__":
    main()