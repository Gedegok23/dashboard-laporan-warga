# Meja Laporan Warga

Dashboard triase laporan warga untuk staf instansi pemerintah kota. Laporan masuk lewat
bot WhatsApp dan formulir web, dikelompokkan otomatis menjadi klaster laporan serupa,
lalu diverifikasi, didisposisi, dan ditutup oleh petugas dari satu layar.

Port dari prototipe HTML satu berkas ke Next.js App Router. Tampilan dan perilakunya sama;
yang berubah adalah strukturnya menjadi komponen, state, dan data yang bertipe.

> Seluruh isi adalah **data contoh**. Nama, NIK, dan nomor telepon dikarang. Koordinat
> menunjuk ke ruas jalan nyata di Kota Bandung supaya tata letak dan panjang teks realistis.

## Menjalankan

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm build && pnpm start
pnpm lint
```

Butuh Node 20+. Font diambil sekali saat build oleh `next/font` lalu di-host sendiri,
jadi build pertama memerlukan jaringan.

## Yang bisa dilakukan di meja ini

| Aksi | Akibatnya |
| --- | --- |
| Verifikasi, tindak lanjut, selesaikan | Tahap laporan maju satu langkah, riwayat status dan log bot bertambah baris petugas, semua angka ikhtisar dihitung ulang |
| Kembalikan status | Mundur satu tahap, batas tindak lanjut dihidupkan lagi |
| Tandai duplikat | Laporan keluar dari antrean aktif, tetap bisa dibuka lewat saringan Duplikat |
| Ubah kategori | Laporan benar-benar pindah klaster, hitungan "laporan mirip" di dua klaster ikut berubah |
| Alihkan instansi | Menimpa penanggung jawab klaster untuk laporan itu saja, terlihat di beban instansi |
| Batalkan | Mengembalikan seluruh data ke keadaan sebelum aksi terakhir |

Pencarian menyorot kecocokan, saringan dan pengurutan kolom bekerja, `/` melompat ke kotak
cari, panah atas dan bawah berpindah baris di daftar.

Tidak ada penyimpanan: semua perubahan hilang saat halaman dimuat ulang. Menyambungkannya
ke basis data berarti mengganti `dataAwal` dan memindahkan `reducer.ts` ke server action.

## Susunan berkas

```
app/
  layout.tsx        font, metadata, tema
  page.tsx          Server Component, merakit kerangka tiga panel
  globals.css       sistem token dan seluruh gaya komponen
components/
  MejaProvider.tsx  konteks state, jam meja yang berjalan
  TopBar Rail Ringkas GrafikHarian Saringan DaftarKlaster PanelPeriksa Toast
  Lencana.tsx       lencana tahap, batas waktu, duplikat
  Ikon.tsx          pemetaan nama peran ke satu keluarga ikon
  Sorot.tsx         penyorot hasil pencarian
lib/
  tipe.ts           tipe domain
  data.ts           data contoh dan tetapan (tahap, instansi, batas hari kerja)
  logika.ts         turunan murni: tahap klaster, saringan, beban instansi, log bot
  reducer.ts        seluruh aksi petugas, termasuk undo
```

Aturan yang dipakai: `lib/` murni dan bisa diuji tanpa React; komponen hanya menggambar.
Aksi menerima jam dari pemanggil, bukan memanggil `Date` sendiri, supaya reducer tetap murni
dan render server tidak berbeda dengan render klien.

## Keputusan desain

Dibaca sebagai alat kerja internal sektor publik, bukan halaman pemasaran: variasi tata letak
rendah, gerak hampir nol, kerapatan informasi tinggi. Yang menonjol hanya satu, yaitu
klaster laporan serupa sebagai baris induk.

**Warna.** Kertas `#EFF1F4`, tinta `#111721` (18:1), tinta sekunder `#566274` (6,2:1), aksen
indigo `#26418F` (9,4:1). Tahap tindak lanjut memakai satu ramp teal berurutan karena tahap
memang berjenjang, bukan empat kategori setara. Merah `#B22A1F` (6,5:1) dipakai untuk satu
arti saja: batas tindak lanjut 5 hari kerja terlampaui. Palet amber sempat dipakai untuk
status dan dibuang setelah pemeriksaan keterbedaan warna: amber dan merah hanya terpaut
ΔE 0,8 pada penglihatan deutan, jadi keduanya tak terbedakan. Kontras terendah yang dipakai
adalah 4,8:1, lolos WCAG AA di terang maupun gelap.

**Huruf.** IBM Plex Sans untuk teks, IBM Plex Sans Condensed untuk label dan angka besar,
IBM Plex Mono untuk nomor tiket, koordinat, dan stempel waktu. Angka yang berderet memakai
`tabular-nums`.

**Tema.** Token didefinisikan lengkap di `:root`, ditimpa oleh `prefers-color-scheme` dan
oleh `[data-theme="dark"]`. Tidak ada tombol tema di aplikasi: tema ikut setelan sistem.

**Status tidak pernah disampaikan lewat warna saja.** Tiap lencana punya ikon dan teks.

**Ikon.** Satu keluarga, satu bobot, dipetakan lewat nama peran di `Ikon.tsx`. Prototipe
memakai font ikon Google karena aturan keamanan konten di lingkungan artifact; di sini
kendalanya tidak ada, jadi dipakai Phosphor yang tidak bergantung pada ligatur teks.

**Tanpa Tailwind.** Sistem desainnya berbasis token semantik, bukan utilitas. Berkas
`globals.css` memuat token dan gaya komponen; tidak ada kerangka CSS lain di proyek ini.

## Yang sengaja tidak ada

- **Peta.** Lokasi ditampilkan sebagai alamat, kelurahan, kecamatan, dan koordinat yang bisa
  disalin. Menambahkan peta berarti memilih penyedia ubin dan menimbang privasi lokasi pelapor.
- **Foto asli.** Kotak foto berisi metadata berkas dan GPS EXIF, termasuk penanda merah bila
  koordinat EXIF jauh dari lokasi yang ditulis warga. Itu justru sinyal verifikasi yang dipakai
  petugas.
- **Autentikasi dan otorisasi.** Petugas yang sedang masuk masih tetap di `lib/data.ts`.
  Identitas pelapor sudah disamarkan secara bawaan dan membukanya menyatakan akan tercatat
  di jejak audit, tetapi pencatatan itu belum ada.
