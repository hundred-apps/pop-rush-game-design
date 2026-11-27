# Interface

Pop Rush adalah game web kasual untuk HP. Pemain menekan bubble warna target, menyelesaikan empat stage, dan berlomba mencapai progres tertinggi. **Quick Match** dimainkan melawan tiga bot. **Private Room** dimainkan oleh 2–4 orang lewat kode ruang.

## Visual System

### Pages

#### **1. Home**

- **Loading awal.** Layar pembuka menunggu aset yang tampil di halaman awal siap sebelum membuka kontrol. Jika aset belum selesai setelah 8 detik, halaman tetap dibuka.
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

#### **2. Profile & Panel Pop-Up Game**

- **Urutan layout**
  - **Player Profile** memakai bingkai biru glossy dengan topper mahkota & awan, hero kartu pemain berlapis emas (level, XP meter, ID & Copy ID), input **Player Nickname**, grid 2×2 kartu statistik berwarna (**Matches**, **Wins**, **Total Pops**, **Best Rank**), dan 2 kartu **Loadout** (**Character** & **Equipped Board**), memakai ikon 3D di `pages/profile/`.
  - **Missions** memakai bingkai biru-periwinkle candy-pop dengan topper 3 bintang emas, maskot Luna & kastil di header, pita subtitle pink, tab **Daily / Weekly**, ringkasan **Daily / Weekly Progress** berikon kalender, 3 kartu misi bergambar 3D di `pages/missions/` dengan tombol **Claim** / **Go**, serta footer awan bertabur 3 bintang emas.
  - **Events** membuka popup **Rainbow Pop Rush Festival** dari Home.
  - **Rewards** memakai pop-up *Candy Treasure Giftland* ramah anak (bingkai pink-ungu-biru berpanji karnaval *scroll parallax*, ikon kado polkadot 3D, pelacak **7-Day Treasure Trail** bernomor langkah, grid 3×2 kartu hadiah harian dengan 7 aset ikon 3D di `pages/rewards/`, efek konfeti saat klaim, serta kartu **Day 7 Grand Prize**).
  - **Pop Shop** memakai pop-up 3D *Candy Toy Wonderland* dengan atap tenda 3D bergaris ([awning-3d.png](pages/shop/awning-3d.png)), pancaran sorotan & podium 3D, spanduk Luna, serta 3 tab (**Board**, **Bundle**, dan **Background**) termasuk latar belakang dunia bermain di `pages/shop/` yang langsung diterapkan ke Home & Gameplay.
  - Panel ekonomi dan fitur lain (**Inventory**, **Add Points**, **Add Gems**, **Pesan & Mail**, dan **Ranking**) memakai header dialog ungu-emas dengan strip saldo Coins & Gems cepat.
- **Components**
  - Header Icon, Wallet Bar, Tab Selector, Progress Meter, Podium & Leaderboard Rows, Claim/Buy/Equip Buttons, dan Status Toast.
- **Background** — Home di belakang dialog.
- **Music** — Backsound Pop Rush. [Music](#music)

#### **Events**

- **Urutan layout**
  - Bingkai biru-ungu dengan judul **Events**, pelangi, Luna, dan tombol tutup di kanan atas.
  - Layout row saldo **Coins** dan **Gems**. Ketuk panel saldo untuk membuka dialog mata uang terkait.
  - Banner **Rainbow Pop Rush Festival**.
  - Layout column berisi **First Rush Warmup**, **Green Bubble Hunter**, dan **Board Explorer**.
  - Tombol emas **Play Quick Match** membuka lobby `#room`.
- **Components**
  - Saldo mengikuti wallet pemain. **Claim** pada First Rush Warmup menambahkan 500 Coins satu kali, lalu kartu menampilkan **Claimed**.
  - Tombol **Play** pada Green Bubble Hunter dan Board Explorer membuka Quick Match. Ubah judul, deskripsi, dan badge waktu di template `event-banner-template` pada [index.html](index.html). Ubah judul, deskripsi, hadiah, target, dan progres kartu di `renderEvents()`. Progress bar mengikuti angka tersebut. Gunakan ID baru untuk hadiah event baru agar riwayat klaim tetap terpisah. Progres masih memakai data contoh. [Konfigurasi milestone](panels.js)
- **Background** — Beranda diredupkan di belakang bingkai popup. [Aset Events](pages/events/popup/)
- **Music** — Backsound mengikuti Beranda.

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
  - Layout row di bagian atas dengan nomor stage/sesi, nama mode & papan, tombol kembali, dan timer.
  - Layout row kartu pemain dengan potret, posisi, dan progres (persentase atau skor pada Rush/Frenzy). Quick Match berisi karakter pilihan dan tiga bot.
  - Papan interaktif dengan indikator warna target di kanan atas. Mode Frenzy menampilkan indikator nyawa di sebelahnya. Petunjuk Memory dan pesan sementara muncul sesuai kondisi.
  - Layout column di bagian bawah diawali meter **Pop Power**, lalu dock kapsul ungu dengan empat ikon skill (**Blast**, **Shield**, **Rush**, **Freeze**), lalu tombol **Pop Rush** di bawah dock.
- **Mode Permainan & Pengacakan**
  - Posisi target bubble diacak ulang setiap match dan setiap stage/sesi lewat `popRules.createClassicStages()` dan `popRules.createSessionTargets()`.
  - Baik **Quick Match** maupun **Multiplayer PvP** berjalan beruntun melalui urutan mode (**Classic → Memory → Rush → Sequence → Color Hunt → Frenzy**): saat satu mode selesai atau waktunya habis, permainan otomatis berpindah ke mode berikutnya dengan hitung mundur `3 → 2 → 1 → PLAY!` hingga **Frenzy** berakhir:
    1. **Classic Hunt**: 4 stage acak. Warna target diundi sekali per pertandingan dari merah, hijau, kuning, dan biru. Bubble pengecoh berwarna putih. Di Private Room, semua pemain memakai warna target yang sama.
    2. **Memory** (Lv 1–100, 10 sesi/level): 30% target acak didahului sesi **Spill** (kedip `OFF -> ON -> OFF` bergantian) lalu ditekan saat papan `OFF`.
    3. **Rush** (durasi **30s / 45s / 60s**): aturan Classic berulang tanpa henti hingga waktu habis untuk skor tertinggi.
    4. **Sequence** (Lv 1–100, 10 sesi/level): mulai 50% target acak; tiap pop benar mengubah 1 bubble `OFF` acak menjadi `ON`.
    5. **Color Hunt** (Lv 1–100, 10 sesi/level): 2 warna acak per sesi dari **Merah, Hijau, Kuning, Biru** (50% target, 50% `OFF` berbeda warna).
    6. **Frenzy** (1 level tanpa batas waktu, 3 nyawa `♥`): mulai 50% target acak; tiap pop benar mengembalikan bubble `PUSHED` lain menjadi `OFF` dan menaikkan 1 bubble `OFF` acak menjadi `ON`.
- **Components**
  - Stage Badge, Timer, Back Button, Player Cards, Bubble Matte Soft, Pop Rush Button, Penalty Banner, Lives Counter, Pop Power Meter, dan Skill Cards.
  - **Play** di Quick Match membuka `#gameplay`. Browser menghitung waktu dan progres bot secara lokal.
- **Background** — Arena biru-ungu gelap. [Panduan visual Gameplay](game-art.md#gameplay)
- **Music** — Backsound Pop Rush. [Music](#music) Efek suara tercantum di bagian [Sound Effects](#sound-effects).

<a id="gameplay"></a>

#### **6. Gameplay PvP**

- **4 section dengan urutan layout**
  - Layout row header berisi stage/sesi mode, nama papan pilihan pemain, tombol kembali, dan timer bersama.
  - Layout row kartu peserta dengan posisi dan progres/skor terkini.
  - Papan dengan indikator warna di kanan atas. Nyawa Frenzy, petunjuk Memory, dan pesan sementara muncul sesuai kondisi.
  - Layout column dengan meter **Pop Power**, empat ikon skill (**Blast**, **Shield**, **Rush**, **Freeze**) di dalam dock, lalu tombol **Pop Rush** di bawahnya.
- **Components**
  - Stage Badge, Timer, Back Button, Player Cards, Bubble Matte Soft, Pop Rush Button, Penalty Banner, Lives Counter, Pop Power Meter, dan Skill Cards.
  - Server menyelaraskan mode pilihan Host (**Classic**, **Memory**, **Rush 30/45/60s**, **Sequence**, **Color Hunt**, **Frenzy**), waktu, penalti, skor, dan hasil. Saat koneksi terputus, tab mencoba menyambung kembali.
- **Background** — Arena biru-ungu gelap. [Aset Gameplay](pages/gameplay/manifest.json)
- **Music** — Backsound Pop Rush. [Music](#music) Efek suara tercantum di bagian [Sound Effects](#sound-effects).

#### **Waiting Room Quick Match**

- **Urutan layout**
  - Header dengan tombol kembali, judul **Quick Match**, dan badge **Vs Bots**.
  - Grid kartu karakter pilihan dan tiga lawan berstatus **Bot**.
  - Panel papan & pemilih 6 mode (**Classic**, **Memory**, **Rush**, **Sequence**, **Color Hunt**, **Frenzy**).
  - Area aksi dengan **Room chat**, **Ready**, dan **Play**.
- **Components**
  - Back Button, Fullscreen Button, Player Cards, Stage & Mode Panel, Room Chat Button, Ready Button, dan Play Button.
  - **Ready** mengubah status pemain. **Play** memulai pertandingan lokal.
- **Background** — Arena ungu bercahaya. [Aset Waiting Room](pages/Waiting_Room/manifest.json)
- **Music** — Backsound Pop Rush. [Music](#music)

#### **7. Waiting Room PvP**

- **Urutan layout**
  - Header dengan tombol kembali, judul **Multiplayer Room**, dan badge **Private Room**.
  - Grid empat kursi dengan nama dan status pemain. Kursi kosong berlabel **Open seat**.
  - Status ruang, tombol **Room code**, dan panel papan + pemilih 6 mode (dikendalikan Host dan tersinkron ke seluruh pemain).
  - Area aksi dengan **Room chat**, **Ready**, dan **Play**.
- **Components**
  - Back Button, Fullscreen Button, Player Cards, Stage & Mode Panel, Room Code Button, Room Chat Button, Ready Button, dan Play Button.
  - Host memilih mode & membagikan kode enam karakter lewat **Room code**. Setelah sedikitnya dua pemain terhubung dan semua siap, host menekan **Play**. Pesan chat tersimpan di sesi halaman.
- **Background** — Arena ungu bercahaya. [Aset Waiting Room](pages/Waiting_Room/manifest.json)
- **Music** — Backsound Pop Rush. [Music](#music)

#### **8. Match Result**

- **5 section dengan urutan layout**
  - Lapisan ambient bercahaya parallax di belakang lembaran hasil (`results-ambient`), diikuti pita judul **Match Result** dan mahkota di atas konfeti.
  - Podium 3D dengan posisi perak di kiri, emas di tengah, dan perunggu di kanan. Maksimal tiga karakter tampil dengan efek aura bercahaya pada juara 1.
  - Daftar peringkat kaca buram (*frosted glassmorphism* & *spatial 3D tilt*) dengan nomor, potret, nama, progres akhir, dan animasi masuk bertahap (*staggered*). Baris juara diberi aksen emas.
  - Panel tiga kartu statistik vertikal bertema kaca buram (**Pops**, **Progress**, dan **Rank**) agar angka skor tetap lega dan tidak terhimpit.
  - Baris tombol simetris sejajar penuh **Play Again** dan **Back to Home** (serta **Next Mode** penuh di atasnya saat mode maraton) dengan ruang padding pill yang rapi.
- **Components**
  - Result Ribbon, Podium, Ranking List, Personal Stats, Play Again Button, dan Back to Home Button.
  - Layar hasil muncul saat seseorang menyelesaikan semua target atau waktu habis. **Play Again** langsung mengulang Quick Match atau kembali ke lobby Private Room untuk bersiap. **Back to Home** membuka Home dan keluar dari ruang.
- **Background** — Panggung biru-ungu dengan konfeti. [Aset Match Result](pages/match_results/manifest.json)
- **Music** — Backsound Pop Rush. [Music](#music)

### Menus

| Lokasi | Menu | Perilaku |
| --- | --- | --- |
| Navigasi bawah | Home, Character, Board, Inventory | Home, Character, dan Board menuju layar masing-masing. Inventory membuka dialog **Items**, **Boards**, dan **Currency** beserta stok power-up. |
| Pintasan Home | Events, Missions, Shop, Rewards | Membuka dialog bertema Pop Rush dengan klaim hadiah, progres misi, toko power-up/bundel/board, dan rentetan login 7 hari. |
| HUD Home | Player profile, Coins, Gems, Mail | Membuka dialog **Profile** (stat, XP, ubah nickname), **Add Points**, **Add Gems**, dan **Pesan & Mail** (lampiran hadiah yang tersinkron ke badge HUD). |
| Home aksi | Ranking | Membuka dialog **Ranking** dengan podium 3 besar dan daftar peringkat **Global** / **Friends**. |
| Lobby | Stage x4 | Nama papan yang dipakai pemain. |

### Components

| Komponen | Tampilan | Aksi |
| --- | --- | --- |
| [Quick Match](pages/home/button/quick_match.png) | Pil emas dengan ikon Play | Buka lobby bot. |
| [Private Room](pages/home/button/private_room.png) | Pil biru di bawah Quick Match | Buka dialog buat atau masuk ruang. |
| [Ready](pages/Waiting_Room/button/ready.png) | Pil emas di dasar lobby | Ubah status siap pemain. |
| Room code | Pil biru dengan kode terlihat | Tampilkan kode ruang yang bisa disalin. |
| Pop Rush | Tombol pil emas di bawah dock skill | Lanjutkan setelah target habis. Menekan saat target masih tersisa memicu penalti. |
| Kartu pemain | Potret PNG, nama, dan status atau progres dinamis | Tampilkan identitas, kesiapan, atau posisi pemain sesuai layar. |
| Bubble Matte Soft | Kubah silikon bulat | Target berwarna mendelep pada ketukan yang valid. |

## Control System

- Pertandingan berlangsung **45 detik** dalam **4 stage**. Papan 4 × 4 (**Aqua Wave**, **Sapphire Blue**, **Royal Gem**, **Candy Pink**, dan **Rainbow Pop**) berisi **7 target berwarna** dan **9 bubble putih** per stage (total **28 target**); **Star Pop** (11 bubble) berisi **5 target berwarna** dan **6 bubble putih** per stage (total **20 target**); dan **Paw Pop** (5 bubble) berisi **3 target berwarna** dan **2 bubble putih** per stage (total **12 target**). Kecepatan bot dan progres peringkat disesuaikan dengan jumlah target masing-masing papan.
- Ketuk di mana saja dalam sel untuk menekan bubble. Satu sentuhan dihitung sekali. Keyboard memakai Tab untuk fokus serta Enter atau Space untuk mengaktifkan tombol.
- Target yang berhasil ditekan tetap cekung sampai papan direset. Menekan bubble putih atau target yang sudah cekung mengunci papan pemain selama **1 detik**. Waktu dan progres lawan terus berjalan.
- Tombol **Pop Rush** aktif selama ronde. Menekannya saat masih ada target memicu penalti yang sama dengan salah menekan bubble. Papan biasa terkunci selama 1 detik. Di Frenzy, pemain juga kehilangan 1 nyawa dan papan terkunci selama 380 ms jika masih ada nyawa. Setelah target habis dan ada stage berikutnya, tekan **Pop Rush** atau goyangkan HP pada browser yang mendukung sensor lewat HTTPS. Gunakan **Enable shake** saat izin diperlukan.
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
