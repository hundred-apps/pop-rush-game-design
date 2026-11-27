# Interface

Pop Rush adalah game web kasual untuk HP. Pemain menekan bubble target, menyelesaikan sesi, dan berlomba meraih skor tertinggi. **Quick Match** mendukung Solo atau 1–3 bot. **Private Room** untuk 2–4 pemain lewat kode. **Find Online Match** membuka antrean publik. **Ranked Match** membuka duel 1v1 untuk pemain mulai Level 15.

## Visual System

### Pages

#### **1. Home**

- **Loading awal.** Layar loading menunggu aset halaman saat pertama dibuka dan saat berpindah di antara layar utama. Saat membuka Waiting Room, game juga menyiapkan potret pemain, sprite bubble, dan bingkai papan pilihan sebelum tombol lobby dapat dipakai. Gameplay mulai setelah aset siap. Game juga menyiapkan aset Match Result saat masuk Gameplay. Jika aset belum selesai setelah 8 detik, halaman tetap dibuka.
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
  - Pilihan tersimpan di browser, tampil di lobby, dan dipakai di semua stage. Di Private Room, tiap pemain dapat memakai papan dan tata letak bubblenya sendiri (16 bubble dengan 70 target pada papan 4 × 4 dan **Rainbow Pop**, 11 bubble dengan 50 target pada **Star Pop**, serta 5 bubble dengan 30 target pada **Paw Pop**).
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
  - Header berisi tombol kembali, mode, level permainan, sesi saat ini, nama papan, dan timer.
  - Baris peringkat menampilkan karakter dan skor. Quick Match mendukung Solo serta 1–3 bot.
  - Papan menggunakan indikator warna target di kanan atas, indikator nyawa, dan petunjuk sesuai mode.
  - Bagian bawah berisi Coins, Energy, skill yang tersedia, tombol **POP IT!**, atau indikator streak di Frenzy.
- **Mode dan level**
  - **Classic Hunt, Memory, Rush, Sequence, dan Color Hunt** memiliki level 1–15. Tiap level berisi 5, 7, 8, atau 9 sesi sesuai tabel. [Tabel Game Levels](game-level.md#game-levels)
  - **Classic Hunt** menghitung durasi sesi dari rasio target × jumlah bubble × durasi per pop. Warna target dipilih sekali per pertandingan. Jumlah target dibulatkan ke bubble terdekat.
  - **Memory** mengikuti jarak antar awal kilatan pada tabel. Timer menjawab mulai setelah Spill.
  - **Rush** memberikan 3 detik per sesi. Target yang terlewat mengurangi poin. Mode ini tidak memakai nyawa.
  - **Sequence** mengikuti rasio awal pada tabel. Batas waktu memakai durasi per pop × jumlah bubble papan karena target terus muncul sampai semua selesai.
  - **Color Hunt** memakai dua warna sampai level 5 dan tiga warna mulai level 6.
  - **Frenzy** memakai timer per pop, dari 1.200 ms pada awal permainan hingga 550 ms pada streak 200. Melewati batas waktu memicu penalti dan mengulang timer. [Tabel Frenzy](game-level.md#mode-frenzy)
- **Components**
  - Stage Badge, Timer, Player Cards, Bubble Matte Soft, Lives Counter, Coin Balance, Energy, Skill Cards, dan POP IT! Button.
  - Saat waktu habis, sesi berganti otomatis dan sisa target dikenai penalti. Pemain juga dapat menekan **POP IT!** untuk langsung lanjut. Setelah level selesai, tombol **Next Level** tersedia di hasil Solo atau VS Bot.
- **Background** — Arena biru-ungu gelap. [Panduan visual Gameplay](game-art.md#gameplay)
- **Music** — Backsound Pop Rush. [Music](#music)

<a id="gameplay"></a>

#### **6. Gameplay PvP**

- **4 section dengan urutan layout**
  - Layout row header berisi stage/sesi mode, nama papan pilihan pemain, tombol kembali, dan waktu pertandingan.
  - Layout row kartu peserta dengan posisi dan skor terkini.
  - Papan dengan indikator warna di kanan atas. Nyawa, petunjuk Memory, dan peringatan serangan muncul sesuai kondisi.
  - Layout column dengan saldo **Coins**, Energy, maksimal tiga skill di dalam dock, dan tombol **POP IT!** di bawahnya.
- **Components**
  - Stage Badge, Timer, Back Button, Player Cards, Bubble Matte Soft, POP IT! Button, Penalty Banner, Lives Counter, Coin Balance, dan Skill Cards.
  - Server menyelaraskan mode pilihan Host (**Classic**, **Memory**, **Rush**, **Sequence**, **Color Hunt**, **Frenzy**), waktu, penalti, skor, dan hasil. Saat koneksi terputus, tab mencoba menyambung kembali.
- **Background** — Arena biru-ungu gelap. [Aset Gameplay](pages/gameplay/manifest.json)
- **Music** — Backsound Pop Rush. [Music](#music) Efek suara tercantum di bagian [Sound Effects](#sound-effects).

#### **Waiting Room Quick Match**

- **Urutan layout**
  - Header dengan tombol kembali, **Deck**, judul **Quick Match**, dan badge **Solo** atau **Vs Bots**.
  - Grid kartu karakter pilihan dan hingga tiga bot. Atur jumlah bot, tingkat kesulitan, dan deck masing-masing lewat **Deck**.
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
  - Di Private Room, host membagikan kode enam karakter dan menekan **Play** setelah minimal dua pemain siap. Antrean publik mengisi kursi yang kosong dengan bot setelah 12 detik. Ranked menunggu dua pemain dengan tier yang sama. Setelah peserta lengkap, waktu persiapan maksimal 15 detik.
- **Background** — Arena ungu bercahaya. [Aset Waiting Room](pages/Waiting_Room/manifest.json)
- **Music** — Backsound Pop Rush. [Music](#music)

#### **8. Match Result**

- **5 section dengan urutan layout**
  - Lapisan ambient bercahaya parallax di belakang lembaran hasil (`results-ambient`), diikuti pita judul **Match Result** dan mahkota di atas konfeti.
  - Podium 3D dengan posisi perak di kiri, emas di tengah, dan perunggu di kanan. Maksimal tiga karakter tampil dengan efek aura bercahaya pada juara 1.
  - Daftar peringkat kaca buram (*frosted glassmorphism* & *spatial 3D tilt*) dengan nomor, potret, nama, skor akhir, dan animasi masuk bertahap (*staggered*). Baris juara diberi aksen emas.
  - Panel tiga kartu statistik vertikal bertema kaca buram (**Pops**, **Score**, dan **Rank**) agar angka skor tetap lega dan tidak terhimpit.
  - Baris tombol simetris sejajar penuh **Play Again** dan **Back to Home** (serta **Next Level** setelah level selesai) dengan ruang padding pill yang rapi.
- **Components**
  - Result Ribbon, Podium, Ranking List, Personal Stats, Play Again Button, dan Back to Home Button.
  - Layar hasil muncul saat level selesai, nyawa habis, atau sesi terakhir selesai. Di multiplayer, hasil muncul setelah semua pemain menyelesaikan level atau kehabisan nyawa. **Play Again** mengulang Quick Match atau kembali ke lobby online. **Back to Home** membuka Home dan keluar dari ruang.
- **Background** — Panggung biru-ungu dengan konfeti. [Aset Match Result](pages/match_results/manifest.json)
- **Music** — Backsound Pop Rush. [Music](#music)

### Menus

| Lokasi | Menu | Perilaku |
| --- | --- | --- |
| Navigasi bawah | Home, Character, Board, Inventory | Home, Character, dan Board menuju layar masing-masing. Inventory membuka dialog **Items**, **Boards**, dan **Currency** beserta stok power-up. |
| Pintasan Home | Events, Missions, Shop, Rewards, Deck | Membuka dialog bertema Pop Rush dengan klaim hadiah, progres misi, toko power-up/bundel/board, dan rentetan login 7 hari. |
| HUD Home | Player profile, Coins, Gems, Mail | Membuka dialog **Profile** (stat, XP, ubah nickname), **Add Points**, **Add Gems**, dan **Pesan & Mail** (lampiran hadiah yang tersinkron ke badge HUD). |
| Home aksi | Ranking | Membuka tab Records, Ranked Season, dan Frenzy Survival Leaderboard. |
| Lobby | Stage and mode | Nama papan yang dipakai pemain. |

### Components

| Komponen | Tampilan | Aksi |
| --- | --- | --- |
| [Quick Match](pages/home/button/quick_match.png) | Pil emas dengan ikon Play | Buka lobby Solo atau VS Bot. |
| [Private Room](pages/home/button/private_room.png) | Pil biru di bawah Quick Match | Buka pilihan buat ruang, masuk dengan kode, atau cari pertandingan publik. |
| [Ready](pages/Waiting_Room/button/ready.png) | Pil emas di dasar lobby | Ubah status siap pemain. |
| Room code | Pil biru dengan kode terlihat | Tampilkan kode ruang yang bisa disalin. |
| POP IT! | Tombol pil emas di bawah dock skill | Lanjutkan setelah target habis. Menekan saat target masih tersisa memicu penalti. |
| Kartu pemain | Potret PNG, nama, dan status atau progres dinamis | Tampilkan identitas, kesiapan, atau posisi pemain sesuai layar. |
| Bubble Matte Soft | Kubah silikon bulat | Target berwarna mendelep pada ketukan yang valid. |

## Control System

- Ketuk target untuk mendapat 10 poin dan 20 Energy dasar. Salah tekan mengurangi 5 poin serta satu nyawa. Skor minimum 0. Rush memakai timer dan penalti skor.
- Bubble dari state ON maupun OFF tetap cekung setelah ditekan. Ketukan ulang pada bubble yang sudah cekung diabaikan sampai reset.
- **POP IT!** mengakhiri sesi. Jika masih ada target, setiap target yang tertinggal dihitung sebagai satu penalti. Gunakan Tap, Swipe / Pinch, atau Shake / Tilt dari pengaturan Deck. Mode sensor memerlukan browser dan izin perangkat yang sesuai.
- Skill memerlukan 100 Energy serta biaya 15–50 Coins sesuai kategori. Jika Coin kurang, pemain dapat menukar 5 Gems menjadi 250 Coins dan mengaktifkan skill. Deck lobby menawarkan paket 10 Gems jika biaya satu rotasi melebihi saldo.
- Serangan menampilkan peringatan selama 1,5 detik. Pemain dapat memakai Shield saat peringatan atau Cleanse setelah efek aktif. Grace period serangan berturut-turut berlangsung 2,5 detik.
- Solo dan VS Bot berjalan di browser. Hadiah Coin dan XP VS Bot sebesar 50% dari standar. Empat kesulitan bot memakai rentang jeda, akurasi, dan pola deck dari tabel. [Tabel Bot Level](game-level.md#bot-level) Private Room dan antrean publik memakai HTTP serta Server-Sent Events. Jalankan `node server.cjs` untuk melayani game dan multiplayer dari port **8000**.
- Ranking menampilkan rekor lokal per mode serta leaderboard Frenzy dari pertandingan online yang selesai. Minggu dimulai Senin UTC. Server menyimpan hasil Frenzy, RP, dan progres event di `.poprush-data` atau lokasi yang diatur melalui `POPRUSH_DATA_DIR`.

## Player Levels, Missions & Events

- Profil menampilkan XP kumulatif, level akun, hadiah, dan fitur tiap milestone. Level akun membuka mode, skill, serta jumlah slot Deck. Ambang untuk level di antara milestone dihitung secara linear.
- **Missions** menampilkan Daily, Weekly, dan Achievements. Daily direset pada pukul 00.00 UTC dan Weekly pada Senin pukul 00.00 UTC. Pop, penggunaan skill, kemenangan online, dan sesi sempurna dibukukan saat hasil pertandingan.
- **Events** menampilkan Weekend Frenzy, Global Pop Milestone, Ranked Season, dan Theme Showcase. Rotasi 7, 14, dan 30 hari dimulai 23 November 2026 pukul 00.00 UTC. Theme Showcase memberi 1 Event Token per sesi selesai.
- Ranked memberi +25 RP untuk menang dan −15 RP untuk kalah dengan batas minimum 0. Tier baru tercapai pada 100, 250, 450, 700, dan 1.000 RP. Hadiah akhir musim dimulai dari 300 Coins di Bronze, lalu bertambah 250 Coins dan 5 Gems untuk setiap kenaikan tier.
- **Inventory** memakai satu kartu Shield untuk naik ke Level 2 dengan durasi proteksi 3,5 detik. **Shop → Boosters** menyediakan Double Score Ticket (250 Coins), Shield Start Ticket (180 Coins), dan XP Booster (15 Gems). Deck memakai satu tiket per pertandingan. XP Booster memberi tambahan 50% XP selama satu jam dari waktu aktivasi. [Tabel hadiah dan progresi](game-level.md#rewards)

## Audio

### Music

Backsound otomatis mulai saat halaman dibuka jika browser mengizinkan autoplay bersuara. Jika diblokir, backsound mulai pada ketukan pertama. Musik berulang dan terus berjalan saat pemain berpindah layar. Efek ketukan, penalti, dan pergantian stage tetap diputar saat dibutuhkan. [Backsound Pop Rush](sounds/backsound-poprush.mp3)

### Sound Effects

| Momen | Aset | Umpan balik |
| --- | --- | --- |
| Target berwarna berhasil ditekan | [gun-shoot.mp3](sounds/gun-shoot.mp3) | Suara singkat dengan getaran **18 ms** pada perangkat yang mendukungnya. |
| Ketukan salah | [incorrect.mp3](sounds/incorrect.mp3) | Suara kesalahan disertai kunci papan dan sorotan merah. |
| Pakai skill | [coin-drop.mp3](sounds/coin-drop.mp3) | Bunyi koin saat pemakaian skill berhasil dan saldo berkurang. |
| POP IT! | [reload-sound.mp3](sounds/reload-sound.mp3) | Suara saat bubble naik dan pola stage berikutnya muncul. |

Jalankan `node server.cjs` atau `npm start` untuk membuka server di port 8000. Pemain di Wi-Fi yang sama dapat membuka alamat IP komputer yang menjalankan server.

[Struktur layar](index.html) · [Logika navigasi dan dialog](app.js) · [Logika pertandingan](gameplay.js) · [Server multiplayer](server.cjs) · [Panduan visual](game-art.md)
