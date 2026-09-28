# Image credits — Flytt & Transport Stockholm

Demo photos for a fictional business. These images are placeholder/demo material for a
fictional moving company ("Flytt & Transport Stockholm"); they do not depict the company
or any real customer move.

All three photos are from Pexels and used under the **Pexels License** (free to use,
attribution not required; credit given here as courtesy). Files were downloaded from the
Pexels CDN and cropped locally to the exact layout dimensions — nothing is hotlinked.

---

## 1. hero-flytt-stockholm.jpg
- Subject: mover loading cardboard boxes into a white van on a temperate residential street, golden hour
- Dimensions: 1600 x 1000 (16:10 crop of the 2400 x 1350 original, centering 0.5 / 0.45)
- Pexels photo ID: 5025663 — "Man Putting Boxes Inside a van"
- Photographer: Artem Podrez (Pexels). The credit is read from the sibling shots in the same
  shoot series (5025665 and 5025669, whose CDN filenames are `pexels-artempodrez-*.jpg`).
- Source page: https://www.pexels.com/photo/man-stacking-boxes-in-a-van-5025663/
- CDN URL used: https://images.pexels.com/photos/5025663/pexels-photo-5025663.jpeg?cs=srgb&fm=jpg&w=2400
- Licence: Pexels License (free to use, attribution not required)
- Note: this replaced an earlier candidate (Pexels 20706506) whose background showed palm
  trees and another moving company's shirt logo — wrong signals for a Stockholm firm.

## 2. omraden-stockholm.jpg
- Subject: Stockholm cityscape from above — Gamla stan and Riddarholmen over Riddarfjärden,
  photographed from Södermalm, with Stockholm City Hall on the right
- Dimensions: 1200 x 800 (crop of the 2400 px original, centering 0.5 / 0.45)
- Pexels photo ID: 28297527
- Photographer: Mylo Kaye
- Source page: https://www.pexels.com/photo/stockholm-sweden-28297527/
- CDN URL used: https://images.pexels.com/photos/28297527/pexels-photo-28297527.jpeg?cs=srgb&fm=jpg&w=2400
- Found on search page: https://www.pexels.com/search/?q=stockholm%20aerial
- Licence: Pexels License (free to use, attribution not required)

## 3. om-oss-team.jpg
- Subject: mover carrying cardboard boxes beside a white moving van on a residential street
- Dimensions: 1000 x 700 (crop of the 2400 px original, centering 0.5 / 0.45)
- Pexels photo ID: 5025669
- Photographer: Artem Podrez
- Source page: https://www.pexels.com/photo/man-carrying-boxes-beside-a-van-5025669/
- CDN URL used: https://images.pexels.com/photos/5025669/pexels-photo-5025669.jpeg?cs=srgb&fm=jpg&w=2400
- Found on search page: https://www.pexels.com/search/mover/?page=2
- Licence: Pexels License (free to use, attribution not required)

---

Processing: originals were downloaded at 2400 px width, then centre-cropped with Pillow
`ImageOps.fit(..., method=Image.LANCZOS, centering=(0.5, 0.45))` to the exact layout size and
saved as JPEG (quality 80, optimize=True). Largest file is 205 kB, under the 300 kB budget.
