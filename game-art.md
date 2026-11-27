# Game Art

## Art Direction Overview

Gaya kasual 3D seperti mainan yang dirender sebagai antarmuka 2D. Gunakan siluet bulat, warna jenuh, pencahayaan lembut dari kiri atas, dan aksen emas untuk kemenangan. Suasana ceria pada Home, kompetitif pada Gameplay, dan meriah pada Match Result.

## Concept Art

- **Kota fantasi pastel** menjadi latar Home dan tempat Luna memperkenalkan papan.
- **Arena ungu bercahaya** menjadi latar lobby untuk kartu pemain dan panel stage.
- **Arena biru gelap** menonjolkan panel dan warna target pada Gameplay.
- **Panggung hasil** memakai sorot biru-ungu, konfeti, pita magenta, dan podium metalik.

## Style Guides

| Peran | Acuan |
| --- | --- |
| Latar Home | Biru langit `#3B8EE9` dan warna pastel. |
| Arena dan panel | Ungu `#5738BF`, indigo `#3E3D97`, dan ungu gelap `#302360`. |
| Papan | Warna alas dan dudukan mengikuti varian bingkai. |
| Aksi dan juara | Emas `#FFBD20`. |
| Penalti | Merah `#FF274D` di tepi Gameplay. |
| Tipografi | Arial Rounded MT Bold, Trebuchet MS, lalu font sistem. |

Plastik mainan yang mengilap digunakan pada tombol dan bingkai. Bubble menggunakan silikon matte dengan gradasi lembut. Logam podium dan koin memakai pantulan yang lebih tajam.

## Characters

| Karakter | Ciri visual | Kostum podium |
| --- | --- | --- |
| Luna | Kelinci putih, telinga panjang, pipi merah muda, visor dan headset biru. | Jaket olahraga biru-putih, tawa lebar, dan kedua tangan di depan. |
| Rex | Beruang karamel dengan moncong krem dan aksesori pilot di potret. | Jaket pilot biru gelap dengan detail emas. |
| Momo | Kucing krem dengan pipi merah muda dan pita di telinga. | Busana lavender dengan dasi kupu-kupu biru muda. |
| Kiko | Katak hijau dengan mata menonjol dan pipi hangat. | Rompi teal, syal biru, dan tangan terbuka. |

Gunakan potret PNG transparan untuk kartu dan sprite dengan torso serta tangan untuk podium. Sprite podium berukuran **512 × 512 px** dengan titik duduk yang diselaraskan. [Aset karakter podium](pages/match_results/manifest.json)

## Environments

| Layar | Suasana | Aset |
| --- | --- | --- |
| Home | Kota pastel yang terang dan ramah. | [Home](pages/home/background/home.png) |
| Lobby dan Gameplay | Arena ungu dan biru, dengan area HUD lebih gelap untuk menjaga keterbacaan. | [Waiting Room](pages/Waiting_Room/background/waiting_room.png) |
| Match Result | Sorot di atas podium, dengan dasar lavender yang tenang untuk peringkat dan tombol. | [Stage](pages/match_results/stage.webp) |

## Equipment & Props

### Bingkai Board

| Papan | Ornamen | Aset |
| --- | --- | --- |
| Aqua Wave | Kristal biru dan tepi perak | [PNG](pages/gameplay/board-aqua-wave.png) |
| Sapphire Blue | Ombak toska, kerang, dan mutiara | [PNG](pages/gameplay/board-sapphire-blue.png) |
| Royal Gem | Permata ungu-emas, bintang, sayap, dan pita | [PNG](pages/gameplay/board-gemmed-purple.png) |
| Candy Pink | Permen, ceri, dan permata hati | [PNG](pages/gameplay/board-candy-pink.png) |
| Rainbow Pop | Bingkai ungu membulat dengan empat baris warna pelangi (16 bubble 4 × 4) | [PNG](pages/gameplay/board-rainbow-pop.png) |
| Star Pop | Papan silikon bentuk bintang kuning-ungu (11 bubble, baris 1-4-3-3) | [PNG](pages/gameplay/board-star-pop.png) |
| Paw Pop | Papan silikon bentuk telapak kaki merah muda (4 bubble jari + 1 pad tengah) | [PNG](pages/gameplay/board-paw-pop.png) |

Gambar bingkai menjadi lapisan dasar. Untuk empat papan klasik, CSS mengikuti siluet bingkai dan menutup bubble yang tercetak pada gambar dengan grid interaktif 4 × 4. Di Gameplay, grid memakai 80% dari sisi bingkai dan diameter bubble 17,3%. Bingkai dapat melebar hingga 120% dari kontainer HUD pada layar potret, dibatasi oleh lebar aman layar. Pratinjau Board memakai grid 74% dan diameter 15,2%. Untuk **Rainbow Pop**, **Star Pop**, dan **Paw Pop**, CSS menempatkan bubble Matte Soft sesuai palet mode langsung di atas tiap lubang pada gambar bingkai sehingga warna dasar pelangi, bintang, dan telapak tetap terlihat di sekeliling setiap bubble. Pad tengah **Paw Pop** memakai sprite khusus `paw-pad-{idle,white,shallow,deep,popped}.png` dengan siluet selaras lubang tengah. [Sprite bubble](pages/gameplay/manifest.json)

- **Podium dan pita.** Podium menempatkan emas di tengah, perak di kiri, dan perunggu di kanan. HTML mengisi nomor dan judul. [Aset hasil](pages/match_results/manifest.json)

## Cutscenes

Perayaan kemenangan ditampilkan lewat Match Result interaktif. Gunakan pose karakter di podium, mahkota juara, dan konfeti sebagai penutup visual pertandingan.

<a id="gameplay"></a>

## UI / UX Art

- Tepi membulat, teks tebal, ikon mudah dikenali, dan area ketuk nyaman pada layar HP.
- Panel informasi menampilkan data dinamis lewat HTML. Badge **Vs Bots**, status **Bot**, dan label **Open seat** membantu pemain mengenali jenis lobby dan isi kursinya.
- Di Gameplay, tampilkan peringkat pertama tanpa bingkai kartu, dengan sprite podium karakter pemain, cahaya emas, mahkota, dan lencana emas. Gunakan pil untuk nilai. Posisikan nama pemain di tengah dan sedikit melewati tepi atas pil. Beri kartu peringkat kedua hingga keempat lencana biru.
- Tampilkan warna target sebagai bubble kecil di kanan atas papan dengan bingkai emas. Di Classic Hunt, undi merah, hijau, kuning, atau biru sekali per pertandingan dan pakai warna itu di keempat stage. Bubble pengecoh tetap putih. Tampilkan sisa nyawa Frenzy di sebelahnya dan tampilkan petunjuk Memory pada tahap menghafal atau menjawab.
- Tempatkan meter **Pop Power** dengan isi hijau di atas dock ungu berisi empat skill. Letakkan tombol **Pop Rush** sebagai pil emas terpisah di bawah dock, dengan warna aktif selama ronde. Gunakan gaya redup saat hitung mundur atau pratinjau Memory. Tekanan terlalu awal memicu umpan balik penalti.
- Animasi bubble target berlangsung **120 ms** melalui kubah, lesung dangkal, lesung dalam, dan cekungan penuh. Pop Rush mengangkat bubble kembali.
- Penalti memicu guncangan **240 ms** dan kilatan tepi yang mereda dalam **320 ms**. Saat **Kurangi Gerakan** aktif, gunakan perubahan bentuk langsung dan sorotan merah statis.

### Komponen antarmuka

| Komponen | Aturan visual |
| --- | --- |
| Logo dan judul | Gunakan dua PNG transparan untuk logo Pop Rush dan pita tagline. Posisikan area gambar yang terlihat di tengah dan pertahankan proporsinya saat diskalakan. Untuk judul berbasis teks, gunakan Arial Rounded MT Bold, Trebuchet MS, lalu font sistem. [Logo PNG](pages/home/branding/logo-hd.png) · [Tagline PNG](pages/home/branding/tagline-hd.png) |
| Akun dan saldo | Sejajarkan avatar, level, koin, dan diamond dalam satu baris. Samakan tinggi panel dan lebar kedua panel saldo. Sisakan ruang antara ikon, angka, dan tombol plus. |
| Pintasan Home | Gunakan panel ungu, skala ikon, dan posisi label yang konsisten untuk Events, Missions, Shop, dan Rewards. Ikon boleh memiliki warna khas selama bentuknya tetap jelas. |
| Tombol | Gunakan bentuk pil emas untuk aksi utama dan pil biru atau perak untuk aksi pendamping. Dock Gameplay memakai kapsul ungu yang dirender dengan CSS dan empat ikon skill (`skill-blast.png`, `skill-shield.png`, `skill-rush.png`, `skill-freeze.png`). Tombol Pop Rush berada di bawah dock. Buat keadaan ditekan dan fokus terlihat jelas. |
| Navigasi bawah | Bentangkan panel sampai tepi bawah halaman pada tampilan HP potret. Bulatkan sudut atas, beri warna yang lebih terang pada tab aktif, dan posisikan ikon serta label di atas area gestur. |
| Mode di lobby | Gunakan badge **Vs Bots** di layar **Quick Match** dan badge **Private Room** di layar **Multiplayer Room**. Tempatkan tombol **Room code** di bawah panel stage pada ruang privat. Tampilkan kode 6 karakter dengan huruf kapital. |
| Kartu di lobby | Gunakan panel biru-ungu dengan potret, nama, dan status tepat di bawah nama. Beri bingkai emas untuk pemain di perangkat tersebut. Tampilkan **Bot** pada tiga lawan Quick Match dan **Open seat** pada kursi kosong di Private Room. |
| Panel stage | Tampilkan nama papan pilihan dan aksen warna bingkai di panel Stage x4. |

### Popup Events

| Komponen | Aset |
| --- | --- |
| Bingkai, judul, Luna, dan tombol tutup | [frame.png](pages/events/popup/frame.png) |
| Panel Coins dan Gems | [wallet.png](pages/events/popup/wallet.png) |
| Banner Rainbow Pop Rush Festival | [festival-banner.png](pages/events/popup/festival-banner.png) |
| Latar kartu milestone polos | [card-background.png](pages/events/popup/milestone/card-background.png) |
| Tombol aksi milestone | [Claim](pages/events/popup/milestone/button-claim.png) · [Play](pages/events/popup/milestone/button-play.png) · [Claimed](pages/events/popup/milestone/button-claimed.png) |
| Progress bar milestone | [Track](pages/events/popup/milestone/progress-track.png) · [Fill](pages/events/popup/milestone/progress-fill.png) |
| Tombol Play Quick Match | [play-quick-match.png](pages/events/popup/play-quick-match.png) |

Gunakan bingkai PNG potret dengan proporsi aslinya. Letakkan panel saldo, banner, kartu milestone, dan tombol di dalam bingkai. Pangkas margin transparan melalui CSS. Tombol HTML mengikuti area aksi pada gambar. Pada kartu milestone, susun judul, deskripsi, hadiah, tombol, dan angka progres di atas latar polos tanpa ikon. Track dan fill progress bar terpisah agar lebarnya bisa mengikuti data. Banner festival dan panel saldo mempertahankan ilustrasinya dengan teks HTML.

## Technical Art Considerations

- Gunakan komposisi potret tanpa bingkai perangkat. Perhatikan area aman HP dan keterbacaan pada **320 × 568 px**.
- Acuan koordinat layar adalah **174 × 350** untuk Home, **160 × 350** untuk Waiting Room, dan **178 × 366** untuk Gameplay. Match Result memakai tata letak responsif.
- CSS mengatur gradasi, bayangan, transisi, dan penempatan sprite. Latar mengisi layar dengan `cover`. Potret dan ikon mempertahankan proporsi.

## Asset Pipeline & Naming

- Gunakan nama file deskriptif sesuai folder fitur, seperti `luna.png`, `matte-press-popped.png`, dan `reload-sound.mp3`.
- Simpan aset sesuai layar di `pages/home/`, `pages/Waiting_Room/`, `pages/gameplay/`, dan `pages/match_results/`. Simpan SFX di `sounds/`.
- Ekspor sprite dengan alpha transparan, cek ukuran, lalu uji di layar game. Simpan sumber, dimensi, dan prompt generatif di manifest aset.

### Asset Formats

| Format | Penggunaan |
| --- | --- |
| PNG RGBA | Potret, sprite podium, ikon, pita, dan frame animasi bubble. |
| PNG / WebP | Latar dan ilustrasi statis. WebP dipakai untuk latar Match Result. |
| MP3 | Efek ketukan, penalti, dan Pop Rush. |
| JSON | Manifest sumber dan spesifikasi aset per layar. |

[Manifest Home](pages/home/manifest.json) · [Manifest Waiting Room](pages/Waiting_Room/manifest.json) · [Manifest Gameplay](pages/gameplay/manifest.json) · [Manifest Match Result](pages/match_results/manifest.json)
