# Aset merek KITO

`logo textless.png`, `logo 2.webp`, `logo 3.png` adalah berkas asli dari
perancang: 1408x768, latar putih pejal, tanpa alpha.

Turunannya dibuat dengan memangkas ke isi lalu membalik komposit terhadap
putih, yang tepat untuk render datar seperti ini dan tidak meninggalkan
pinggiran putih pada tepi anti-alias.

Yang dilayani ada di `public/`:

| Berkas | Dipakai di |
| --- | --- |
| `kito-mark.png` | stempel kop portal dan meja, sumber `app/icon.png` |
| `kito-wordmark.png` | kop halaman masuk, mode terang |
| `kito-wordmark-gelap.png` | kop halaman masuk, mode gelap |

Sisanya di folder ini belum terpakai di antarmuka.

## Kenapa ada dua varian wordmark

Navy `#152350` berkontras 15,13:1 di permukaan terang tapi 1,13:1 di
permukaan gelap, jadi praktis hilang. Varian gelap mengecat ulang piksel
navy dengan warna teks mode gelap; mark biru `#2b6fde` (3,61:1) dan teal
`#1d8c83` (4,18:1) dibiarkan karena keduanya lolos ambang 3:1 untuk grafik.

## Kenapa semboyan dipotong dari gambar

Di dalam lockup, semboyan mengecil jadi sekitar tiga piksel pada tinggi
pakai. Ia ditulis sebagai teks di halaman supaya ikut membesar mengikuti
setelan ukuran huruf pengguna dan terbaca pembaca layar.
