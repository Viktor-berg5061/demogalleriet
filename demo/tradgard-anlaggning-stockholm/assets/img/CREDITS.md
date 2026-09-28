# Bildkällor — Trädgård & Anläggning Stockholm

Alla bilder på sajten ligger som lokala filer i `assets/img/` och serveras från den egna
domänen. Sajten gör inga anrop till `images.pexels.com` eller någon annan extern bildhost.

Filerna hämtades 2026-09-28 15:10 som nedladdade kopior från Pexels och används enligt
Pexels-licensen: <https://www.pexels.com/license/>. Fotografens namn och licensvillkoren för
varje foto finns på källsidan `https://www.pexels.com/photo/<foto-ID>/` (sidan svarar 403 mot
automatisk hämtning, så namnen kan inte föras in här maskinellt).

Maskinellt verifierat 2026-09-28 (asset-audit): varje fil är en giltig JPEG (börjar med
FF D8 FF), är minst 49 440 byte, och dess bildmått matchar exakt de `width`/`height` som
står i `index.html`. Varje fil är dessutom byte-identisk med den angivna ursprungs-URL:en
(HTTP 200 och exakt samma antal byte som den lokala filen).

| Lokal fil | Fotograf / källa | Ursprungs-URL |
|---|---|---|
| `og-1200x630.jpg` | Pexels, foto-ID 37601618 (fotograf anges på [källsidan](https://www.pexels.com/photo/37601618/)) | `https://images.pexels.com/photos/37601618/pexels-photo-37601618.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=1200&h=630` |
| `pexels-14388457-markarbete.jpg` | Pexels, foto-ID 14388457 (fotograf anges på [källsidan](https://www.pexels.com/photo/14388457/)) | `https://images.pexels.com/photos/14388457/pexels-photo-14388457.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=720&h=540` |
| `pexels-16680725-redskap.jpg` | Pexels, foto-ID 16680725 (fotograf anges på [källsidan](https://www.pexels.com/photo/16680725/)) | `https://images.pexels.com/photos/16680725/pexels-photo-16680725.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=900&h=700` |
| `pexels-24595771-hackklippning.jpg` | Pexels, foto-ID 24595771 (fotograf anges på [källsidan](https://www.pexels.com/photo/24595771/)) | `https://images.pexels.com/photos/24595771/pexels-photo-24595771.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=720&h=540` |
| `pexels-25283561-bevattning.jpg` | Pexels, foto-ID 25283561 (fotograf anges på [källsidan](https://www.pexels.com/photo/25283561/)) | `https://images.pexels.com/photos/25283561/pexels-photo-25283561.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=720&h=540` |
| `pexels-31372139-ljusslinga.jpg` | Pexels, foto-ID 31372139 (fotograf anges på [källsidan](https://www.pexels.com/photo/31372139/)) | `https://images.pexels.com/photos/31372139/pexels-photo-31372139.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=900&h=600` |
| `pexels-32158834-villahus.jpg` | Pexels, foto-ID 32158834 (fotograf anges på [källsidan](https://www.pexels.com/photo/32158834/)) | `https://images.pexels.com/photos/32158834/pexels-photo-32158834.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=1400&h=700` |
| `pexels-33425081-belysning.jpg` | Pexels, foto-ID 33425081 (fotograf anges på [källsidan](https://www.pexels.com/photo/33425081/)) | `https://images.pexels.com/photos/33425081/pexels-photo-33425081.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=720&h=540` |
| `pexels-34909157-stenlaggning.jpg` | Pexels, foto-ID 34909157 (fotograf anges på [källsidan](https://www.pexels.com/photo/34909157/)) | `https://images.pexels.com/photos/34909157/pexels-photo-34909157.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=720&h=540` |
| `pexels-34909165-grusgang.jpg` | Pexels, foto-ID 34909165 (fotograf anges på [källsidan](https://www.pexels.com/photo/34909165/)) | `https://images.pexels.com/photos/34909165/pexels-photo-34909165.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=900&h=700` |
| `pexels-34927711-innergard.jpg` | Pexels, foto-ID 34927711 (fotograf anges på [källsidan](https://www.pexels.com/photo/34927711/)) | `https://images.pexels.com/photos/34927711/pexels-photo-34927711.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=900&h=600` |
| `pexels-37601618-hero.jpg` | Pexels, foto-ID 37601618 (fotograf anges på [källsidan](https://www.pexels.com/photo/37601618/)) | `https://images.pexels.com/photos/37601618/pexels-photo-37601618.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=1100&h=800` |
| `pexels-3999647-grasklippning.jpg` | Pexels, foto-ID 3999647 (fotograf anges på [källsidan](https://www.pexels.com/photo/3999647/)) | `https://images.pexels.com/photos/3999647/pexels-photo-3999647.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=720&h=540` |
| `pexels-4975358-beskarning.jpg` | Pexels, foto-ID 4975358 (fotograf anges på [källsidan](https://www.pexels.com/photo/4975358/)) | `https://images.pexels.com/photos/4975358/pexels-photo-4975358.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=720&h=540` |

## Byt till egna foton

Demobilderna är utbytbara. Lägg företagets egna projektbilder i `assets/img/` och uppdatera
`src` i `index.html` (samt `og-1200x630.jpg` för delningsbilden) — filnamnen behöver inte
följa Pexels-mönstret. Uppdatera `width`/`height` i `index.html` så att de matchar den nya
filens bildmått, och byt bildtexterna samtidigt så att de beskriver det egna projektet
(område, yta och årtal).
