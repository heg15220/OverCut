from generate_rondo import generar_rosco
import json

for lang in ['es', 'en']:
    roscos = []
    for i in range(20):  # puedes subir a 100 o más según estabilidad
        print(f"Generando rosco {i+1}/50 en idioma {lang}...")
        rosco = generar_rosco(lang)
        roscos.append(rosco)

    with open(f'rosco_cache_{lang}.json', 'w', encoding='utf-8') as f:
        json.dump(roscos, f, ensure_ascii=False, indent=2)
