# Interface

Pop Rush adalah game web kasual untuk HP. Pemain menekan target hijau, menyelesaikan empat stage, dan berlomba mencapai progres tertinggi. **Quick Match** dimainkan melawan tiga bot. **Private Room** dimainkan oleh 2–4 orang lewat kode ruang.

## Visual System

### Pages

#### **1. Home**

- **5 section dengan urutan layout**
  - **Layout row, alignment space-between.** Tiga komponen di HUD atas, yaitu Profile, Coins, dan Gems.
  - **Logo Pop Rush dan tagline.** Tombol Mail dengan ikon amplop dan badge berada di kanan atas. [Logo PNG](pages/home/branding/logo-hd.png) · [Tagline PNG](pages/home/branding/tagline-hd.png)
  - **Layout row, alignment space-between.** Ilustrasi Luna berada di tengah dengan dua kolom pintasan.
    - Layout column kiri, alignment start. Events, Missions, dan Shop.
    - Layout column kanan, alignment start. Rewards.
  - **Layout column, alignment center.**
    - Tombol Play berlabel **Quick Match**.
    - Layout row, alignment center. **Private Room** dan **Ranking**.
  - **Bottom navigation.** Empat komponen, yaitu **Home**, **Character**, **Board**, dan **Inventory**.
- **Components**
  - Profile, Coins, Gems, Mail, Events, Missions, Shop, dan Rewards.
  - Fullscreen Button, Quick Match Button, Private Room Button, dan Ranking Button.
  - Bottom Navigation. Inventory membuka dialog saldo.
- **Background** — Kota fantasi pastel. [Aset Home](pages/home/background/home.png)
- **Music** — Backsound Pop Rush. [Music](#music)

#### **2. Profile**

- **Urutan layout**
  - Judul **Player profile**.
  - Detail profil dengan nama Luna dan level.
  - Kontrol tutup dialog.
- **Components**
  - Profile Button pada HUD Home, dialog, dan tombol tutup.
- **Background** — Home di belakang dialog.
- **Music** — Backsound Pop Rush. [Music](#music)

#### **3. Game Mode**

- **Urutan layout**
  - Layout column di Home dengan **Quick Match** menuju `#room`.
  - Layout row di bawahnya dengan **Private Room** dan **Ranking**.
  - Dialog Private Room berisi tombol **Create Room**, kolom kode enam karakter, dan tombol **Join Room**. Membuat ruang atau memasukkan kode valid membuka `#private-room`.
- **Components**
  - Quick Match Button, Private Room Button, Create Room Button, Room Code Input, dan Join Room Button.
- **Background** — Home di belakang dialog.
- **Music** — Backsound Pop Rush. [Music](#music)

#### **Board**

- **5 section dengan urutan layout**
  - Header dengan tombol kembali di kiri dan judul **Board** di tengah.
  - Layout row, alignment center. Nama papan dan badge ukuran (**4 × 4**, **11 Bubbles**, atau **5 Bubbles**).
  - Pratinjau besar bingkai dan bubble yang dipilih.
  - Strip pilihan horizontal dapat digeser berisi tujuh papan dengan bingkai aktif disorot: **Aqua Wave**, **Sapphire Blue**, **Royal Gem**, **Candy Pink**, **Rainbow Pop**, **Star Pop**, dan **Paw Pop**.
  - Layout column dengan **Use Board** di atas Bottom Navigation. Tombol menampilkan **Equipped** untuk papan yang dipakai.
- **Components**
  - Back Button, Board Name, Size Badge, Board Preview, Board Cards, Use Board Button, dan Bottom Navigation.
  - Pilihan tersimpan di browser, tampil di lobby, dan dipakai pada keempat stage. Di Private Room, tiap pemain dapat memakai papan dan tata letak bubblenya sendiri (16 bubble dengan 28 target pada papan 4 × 4 dan **Rainbow Pop**, 11 bubble dengan 20 target pada **Star Pop**, serta 5 bubble dengan 12 target pada **Paw Pop**).
- **Background** — Kota fantasi biru-ungu. [Aset bingkai](game-art.md#bingkai-board)
- **Music** — Backsound Pop Rush. [Music](#music)

#### **Character**

- **Urutan layout**
  - Judul **Character** di atas.
  - Pratinjau karakter dan podium sebagai dua aset dengan titik pijak yang sama.
  - Layout row empat kartu dengan nama dan level. Luna, Rex, Momo, dan Kiko.
  - Layout column berisi **Select** dan Bottom Navigation.
- **Components**
  - Character Preview, Pedestal, Character Cards, Select Button, dan Bottom Navigation. **Select** menyimpan karakter untuk Quick Match.
- **Background** — Kota fantasi pastel. [Aset Character](pages/character/manifest.json)
- **Music** — Backsound Pop Rush. [Music](#music)

#### **4. Settings**

- **Urutan layout**
  - Kontrol layar penuh tersedia di Home dan Waiting Room.
  - Kontrol **Enable shake** muncul di Gameplay saat izin sensor gerak diperlukan.
- **Components**
  - Fullscreen Button dan Enable Shake Button. Animasi mengikuti pengaturan **Kurangi Gerakan** perangkat.
- **Background** — Mengikuti layar tempat kontrol ditampilkan.
- **Music** — Backsound Pop Rush. [Music](#music)

#### **5. Gameplay Single**

- **4 section dengan urutan layout**
  - Layout row di bagian atas dengan nomor stage, nama papan, tombol kembali, dan timer.
  - Layout row kartu pemain dengan potret, posisi, dan progres. Quick Match berisi karakter pilihan dan tiga bot.
  - Layout column dengan **Pop only GREEN!** di atas papan interaktif. Area petunjuk juga menampilkan status **Tap Pop Rush!** dan pesan penalti sesuai kondisi.
  - Layout column di bagian bawah berisi pil **Pop Power** di atas dock kapsul ungu berisi empat ikon skill (**Blast**, **Shield**, **Rush**, **Freeze**) di kiri pemisah dan tombol bulat **Pop Rush** di kanan.
- **Components**
  - Stage Badge, Timer, Back Button, Player Cards, Bubble Matte Soft, Pop Rush Button, Penalty Banner, Pop Power Meter, dan Skill Cards. Kartu skill masih berupa tampilan.
  - **Play** di Quick Match membuka `#gameplay`. Browser menghitung waktu dan progres bot secara lokal.
- **Background** — Arena biru-ungu gelap. [Panduan visual Gameplay](game-art.md#gameplay)
- **Music** — Backsound Pop Rush. [Music](#music) Efek suara tercantum di bagian [Sound Effects](#sound-effects).

<a id="gameplay"></a>

#### **6. Gameplay PvP**

- **4 section dengan urutan layout**
  - Layout row header berisi stage, nama papan pilihan pemain, tombol kembali, dan timer bersama.
  - Layout row kartu peserta dengan posisi dan progres terkini.
  - Layout column dengan petunjuk, pesan penalti atau status **Tap Pop Rush!**, dan papan.
  - Layout column dengan pil **Pop Power**, empat ikon skill (**Blast**, **Shield**, **Rush**, **Freeze**), dan tombol bulat **Pop Rush** di dock bawah.
- **Components**
  - Stage Badge, Timer, Back Button, Player Cards, Bubble Matte Soft, Pop Rush Button, Penalty Banner, Pop Power Meter, dan Skill Cards.
  - Server menyelaraskan waktu, penalti, skor, dan hasil. Saat koneksi terputus, tab mencoba menyambung kembali.
- **Background** — Arena biru-ungu gelap. [Aset Gameplay](pages/gameplay/manifest.json)
- **Music** — Backsound Pop Rush. [Music](#music) Efek suara tercantum di bagian [Sound Effects](#sound-effects).

#### **Waiting Room Quick Match**

- **Urutan layout**
  - Header dengan tombol kembali, judul **Quick Match**, dan badge **Vs Bots**.
  - Grid kartu karakter pilihan dan tiga lawan berstatus **Bot**.
  - Panel **Stage x4** dengan nama papan pilihan.
  - Area aksi dengan **Room chat**, **Ready**, dan **Play**.
- **Components**
  - Back Button, Fullscreen Button, Player Cards, Stage Panel, Room Chat Button, Ready Button, dan Play Button.
  - **Ready** mengubah status pemain. **Play** memulai pertandingan lokal.
- **Background** — Arena ungu bercahaya. [Aset Waiting Room](pages/Waiting_Room/manifest.json)
- **Music** — Backsound Pop Rush. [Music](#music)

#### **7. Waiting Room PvP**

- **Urutan layout**
  - Header dengan tombol kembali, judul **Multiplayer Room**, dan badge **Private Room**.
  - Grid empat kursi dengan nama dan status pemain. Kursi kosong berlabel **Open seat**.
  - Panel **Stage x4** dengan nama papan pilihan dan tombol **Room code** di bawahnya.
  - Area aksi dengan **Room chat**, **Ready**, dan **Play**.
- **Components**
  - Back Button, Fullscreen Button, Player Cards, Stage Panel, Room Code Button, Room Chat Button, Ready Button, dan Play Button.
  - Host membagikan kode enam karakter lewat **Room code**. Setelah sedikitnya dua pemain terhubung dan semua siap, host menekan **Play**. Pesan chat tersimpan di sesi halaman.
- **Background** — Arena ungu bercahaya. [Aset Waiting Room](pages/Waiting_Room/manifest.json)
- **Music** — Backsound Pop Rush. [Music](#music)

#### **8. Match Result**

- **5 section dengan urutan layout**
  - Pita judul **Match Result** dan mahkota di atas konfeti.
  - Podium dengan posisi perak di kiri, emas di tengah, dan perunggu di kanan. Maksimal tiga karakter tampil dan mahkota mengikuti juara.
  - Daftar peringkat dengan nomor, potret, nama, dan progres akhir. Baris juara diberi aksen emas.
  - Layout row tiga statistik pemain, yaitu **Pops**, **Progress**, dan **Rank**.
  - Layout row, alignment center. **Play Again** dan **Back to Home**.
- **Components**
  - Result Ribbon, Podium, Ranking List, Personal Stats, Play Again Button, dan Back to Home Button.
  - Layar hasil muncul saat seseorang menyelesaikan semua target atau waktu habis. **Play Again** langsung mengulang Quick Match atau kembali ke lobby Private Room untuk bersiap. **Back to Home** membuka Home dan keluar dari ruang.
- **Background** — Panggung biru-ungu dengan konfeti. [Aset Match Result](pages/match_results/manifest.json)
- **Music** — Backsound Pop Rush. [Music](#music)

### Menus

| Lokasi | Menu | Perilaku |
| --- | --- | --- |
| Navigasi bawah | Home, Character, Board, Inventory | Home, Character, dan Board menuju layar masing-masing. Inventory membuka dialog informasi. |
| Pintasan Home | Events, Missions, Shop, Rewards | Membuka dialog sesuai pilihan. |
| HUD Home | Player profile, Coins, Gems, Mail | Menampilkan informasi akun, saldo, dan pesan. Badge Mail diperbarui saat pesan dibuka. |
| Lobby | Stage x4 | Nama papan yang dipakai pemain. |

### Components

| Komponen | Tampilan | Aksi |
| --- | --- | --- |
| [Quick Match](pages/home/button/quick_match.png) | Pil emas dengan ikon Play | Buka lobby bot. |
| [Private Room](pages/home/button/private_room.png) | Pil biru di bawah Quick Match | Buka dialog buat atau masuk ruang. |
| [Ready](pages/Waiting_Room/button/ready.png) | Pil emas di dasar lobby | Ubah status siap pemain. |
| Room code | Pil biru dengan kode terlihat | Tampilkan kode ruang yang bisa disalin. |
| Pop Rush | Tombol bulat emas mengilap berbingkai neon ungu di kanan dock bawah | Naikkan bubble dan lanjutkan ke pola stage berikutnya. |
| Kartu pemain | Potret PNG, nama, dan status atau progres dinamis | Tampilkan identitas, kesiapan, atau posisi pemain sesuai layar. |
| Bubble Matte Soft | Kubah silikon bulat | Target berwarna mendelep pada ketukan yang valid. |

## Control System

- Pertandingan berlangsung **45 detik** dalam **4 stage**. Papan 4 × 4 (**Aqua Wave**, **Sapphire Blue**, **Royal Gem**, **Candy Pink**, dan **Rainbow Pop**) berisi **7 target hijau** dan **9 bubble putih** per stage (total **28 target**); **Star Pop** (11 bubble) berisi **5 target hijau** dan **6 bubble putih** per stage (total **20 target**); dan **Paw Pop** (5 bubble) berisi **3 target hijau** dan **2 bubble putih** per stage (total **12 target**). Kecepatan bot dan progres peringkat disesuaikan dengan jumlah target masing-masing papan.
- Ketuk di mana saja dalam sel untuk menekan bubble. Satu sentuhan dihitung sekali. Keyboard memakai Tab untuk fokus serta Enter atau Space untuk mengaktifkan tombol.
- Target yang berhasil ditekan tetap cekung sampai papan direset. Menekan bubble putih atau target yang sudah cekung mengunci papan pemain selama **1 detik**. Waktu dan progres lawan terus berjalan.
- Setelah target stage 1–3 habis, aktifkan **Pop Rush** dengan tombol atau dengan goyangan HP pada browser yang mendukung sensor lewat HTTPS. Saat browser memerlukan izin, gunakan **Enable shake**.
- Setelah target stage 4 habis, hasil langsung tampil. Jika waktu habis, urutan ditentukan oleh jumlah target yang selesai dan waktu pencapaian saat progres sama.
- Private Room menggunakan server Pop Rush di port **8000** dengan HTTP dan Server-Sent Events. Jalankan `node server.cjs` atau `npm start`, lalu gunakan alamat IP komputer server dari perangkat di Wi-Fi yang sama.

## Audio

### Music

Backsound otomatis mulai saat halaman dibuka jika browser mengizinkan autoplay bersuara. Jika diblokir, backsound mulai pada ketukan pertama. Musik berulang dan terus berjalan saat pemain berpindah layar. Efek ketukan, penalti, dan pergantian stage tetap diputar saat dibutuhkan. [Backsound Pop Rush](sounds/backsound-poprush.mp3)

### Sound Effects

| Momen | Aset | Umpan balik |
| --- | --- | --- |
| Target berwarna berhasil ditekan | [gun-shoot.mp3](sounds/gun-shoot.mp3) | Suara singkat dengan getaran **18 ms** pada perangkat yang mendukungnya. |
| Ketukan salah | [incorrect.mp3](sounds/incorrect.mp3) | Suara kesalahan disertai kunci papan dan sorotan merah. |
| Pop Rush | [reload-sound.mp3](sounds/reload-sound.mp3) | Suara saat bubble naik dan pola stage berikutnya muncul. |

Jalankan `node server.cjs` atau `npm start` untuk membuka server di port 8000. Pemain di Wi-Fi yang sama dapat membuka alamat IP komputer yang menjalankan server.

[Struktur layar](index.html) · [Logika navigasi dan dialog](app.js) · [Logika pertandingan](gameplay.js) · [Server multiplayer](server.cjs) · [Panduan visual](game-art.md)
