import os

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

renamed = 0
for filename in os.listdir(DATA_DIR):
    if filename.endswith(".wav") and filename.startswith("commentary_"):
        old_path = os.path.join(DATA_DIR, filename)
        new_path = os.path.join(DATA_DIR, filename[:-4] + ".mp3")
        os.rename(old_path, new_path)
        print(f"{filename} → {filename[:-4]}.mp3")
        renamed += 1

print(f"\nTamamlandı! {renamed} dosya yeniden adlandırıldı.")