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
    "goal_penalty": [
        "Kaleciyi bakkala gönderdi! Çok temiz gol!",
        "Çok soğukkanlı! Adeta buz adam!",
        "Ters köşe! Kaleci sağa, top sola!",
        "Panenka vuruşu! İnanılmaz bir özgüven, stadyum çıldırdı!",
        "Vurdu ve golü yaptı! Penaltıyı adeta nakış gibi işledi!",
        "Kalecinin üstüne üstüne, çok sert! Ellerinin arasından ağlara!",
        "Direk dibine plase! Kaleci uzandı ama nafile!",
        "Hiç acımadı! Topu adeta kaleye mühürledi!",
        "Öyle bir vurdu ki direkler titredi ama top içeride!",
        "Penaltı nasıl atılır dersi verdi! Tertemiz bir bitiriş!",
    ],
    "goal_freekick": [
        "Barajı aştı, tam çatala! İnanılmaz bir frikik!",
        "Ölü yaprak vuruşu! Kalecinin yapacak hiçbir şeyi yok!",
        "Mükemmel bir kavis! Fiziğe aykırı bir gol!",
        "Usta işi bir vuruş! Şapka çıkarılır bu gole!",
        "Baraj bozuldu, top ağlarla buluştu!",
        "Roberto Carlos misali! Uzaklardan inanılmaz bir füze!",
        "Barajın altından yerden zekice bir vuruş! Kaleci donakaldı!",
        "Direk içine çarpıp ağlara gitti! Geometrinin sınırlarını zorladı!",
        "Kalecinin kapattığı köşeden avladı onu! Müthiş zeka!",
        "Kaleci uçtu ama sadece fotoğrafa girdi! Harika gol!",
    ],
    "goal_corner": [
        "Karambolde dokundu ve goool!",
        "Herkesin üzerinden yükseldi, harika bir kafa vuruşu!",
        "Ön direkte usta işi bir dokunuş! Fırsatçılığını konuşturdu!",
        "Adeta uçarak kafayı vurdu! Defans uyudu, o affetmedi!",
        "Arka direkte kendini unutturdu, gelişine mükemmel vurdu!",
        "Kornerden doğrudan kaleye! İnanılmaz! Olimpik gol!",
        "Kalecinin elinden seken topu tamamladı! Fırsatçılık bu!",
        "Defans uzaklaştıramadı, ceza yayı üzerinden harika bir vole!",
        "Dönen topa gelişine mermi gibi vurdu, ağları havalandırdı!",
        "Kafa vuruşu yere çarptı ve hızlandı, kaleci çaresiz!",
    ],
    "miss_penalty": [
        "Dağlara taşlara vurdu! İnanılır gibi değil!",
        "Kaleci panterleşti! İnanılmaz bir refleks!",
        "Direkte patladı! Taraftar saç baş yoluyor!",
        "Kötü vurdu, kaleci köşeyi doğru tahmin etti!",
        "Aut! Böyle penaltı mı kullanılır? Büyük fırsat tepti!",
        "Üstten farklı şekilde dışarıda! Takımını yaktı!",
        "Panenka denedi ama kaleci yerinden kımıldamadı! Rezillik!",
        "Kalecinin kucağına çok cılız bir şut! Neredeyse geri pas oldu!",
        "Topu stadyumdan dışarı yolladı! Baskıyı kaldıramadı!",
        "Yan direği yaladı geçti! Şans yanında değildi!",
    ],
    "miss_freekick": [
        "Top barajdan sekmedi bile, doğrudan duvara nişanladı!",
        "Direği yalayarak dışarı çıktı! Yüreklerin ağza geldiği an!",
        "Farklı şekilde aut! Topu tribünlere hediye etti!",
        "Kaleci uzandı ve topu doksandan çıkardı! Müthiş!",
        "Şut mu orta mı belli değil, çok kötü bir vuruş!",
        "Kuşları avladı! Bu mesafeden bu kadar kötü vurulmaz.",
        "Reklam panolarında patladı! Kaleci için rahat bir an.",
        "Barajdan sekti, kornere gidiyor. Fırsat kaçtı.",
        "Yerden seken topu kaleci rahatça kontrol etti.",
        "Az farkla üstten aut! Stad bir an Gooool diye ayağa kalkmıştı!",
    ],
    "miss_corner": [
        "Kimse dokunamadı, top doğrudan taca çıktı!",
        "Kaleci kalesinden çıktı ve çift yumrukla uzaklaştırdı!",
        "Defans etten duvar ördü, tehlike savuşturuldu!",
        "Çok arkaya kesildi, herkes topun altından geçti!",
        "Ön direkte defans kafayı vuruyor. Kötü bir orta.",
        "Çok kavisli gitti, havadan çizgiyi geçti! Hakem autu gösterdi.",
        "Karambolde top kalecinin kucağında kaldı.",
        "Hızlı atakta topu kaptırdılar, rakip kontra atağa çıkıyor!",
        "Kaleciye şarj var! Hakem faul düdüğünü çaldı.",
        "Ceza sahası ana baba günü ama topu uzaklaştırmayı başardılar.",
    ],
    "card_yellow": [
        "Hakem tereddütsüz elini cebine attı, sarı kart!",
        "Gereksiz bir itiraz ve sarıyı gördü!",
        "Çok sert girdi, hakem affetmedi!",
        "Taktik faul! Takımı için sarıyı bilerek yedi!",
        "Formasından çekti bıraktı, bu net bir sarı kart!",
        "Topa değil direkt adama müdahale, hakem sarıyı çıkardı.",
        "Hakemi aldatmaya yönelik hareket! Kendini yere attı ve sarıyı yedi.",
        "Zaman geçirmekten dolayı sarı kart görüyor.",
        "Düdükten sonra topa vurdu, hakem bu saygısızlığı affetmez!",
        "Gerginlik tırmandı, hakem araya girip sarıyı gösterdi.",
    ],
    "card_red": [
        "Kızardı! Direkt kırmızı! Takımını yalnız bırakıyor!",
        "Erken duş! Bu müdahalenin affı olmazdı!",
        "Ortalık karıştı! Hakem acımadı, kırmızıyı çıkardı!",
        "Takımını yaktı! Çok kritik bir dakikada atılıyor!",
        "İkinci sarıdan kırmızı! Evinin yolunu tutuyor.",
        "Son adam! Hakem mutlak gol şansını engellediği için kırmızıyı yapıştırdı!",
        "Topsuz alanda inanılmaz bir hareket, direkt kırmızı kart!",
        "VAR uyarısı geldi! Hakem kenara gitti, izledi ve kırmızıyı çıkardı!",
        "Hem penaltı yaptırdı hem kırmızı gördü! Felaket bir an!",
        "Hakeme fiili müdahale! Bunun cezası çok ağır olur!",
    ],
    "foul": [
        "Adamı adeta biçti! Serbest vuruş!",
        "Arkadan müdahale, hakem düdüğünü çaldı.",
        "Kendini yere bıraktı ama hakem faulü veriyor.",
        "Çok tehlikeli bir yerden serbest vuruş kazandılar!",
        "Hızlı hücumu çekerek durdurdu. Klasik bir taktik faul.",
        "Tabanını gösterdi, endirekt serbest vuruş.",
        "Tehlikeli hareket! Rakibinin kafasının hizasına ayak kaldırdı.",
        "Hava topu mücadelesinde dirsek geldi, hakem oyunu durdurdu.",
        "Avantaja bırakmıştı ama pozisyon kaybolunca düdüğünü çaldı.",
        "Orta sahada kıran kırana bir ikili mücadele, faul!",
    ],
    "offside": [
        "Yardımcı hakemin bayrağı havada! Enfes bir ofsayt taktiği!",
        "Çok net ofsayt! Hiç itiraz etmeye gerek yok.",
        "Burun farkıyla ofsayta düştü! Çok erken koşmuş.",
        "Defans çizgi halinde ileri çıktı, ofsayt bayrağı kalkıyor!",
        "Ağlara giden top ofsayt gerekçesiyle iptal ediliyor!",
        "VAR odasında çizgi çekiliyor... Evet, yarım omuzla ofsayt!",
        "Pasif alandaydı ama topa hareketlendiği için bayrak kalktı.",
        "Tam kaleciyle karşı karşıya kalmıştı ki o kahreden düdük çaldı!",
        "Zamanlamayı ayarlayamadı, rakip savunmanın arkasına çok erken sızdı.",
        "Gol sevinci kursaklarında kaldı, yardımcı hakem bayrağıyla bekliyor!",
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