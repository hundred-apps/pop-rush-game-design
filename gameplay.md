# Aturan Permainan

## Aturan Umum
- Gelembung memiliki 3 state: ON, OFF & PUSHED
- Masing-masing gelembung memiliki ID unik
- Ketika sesi permainan dimulai semua gelembung yang tidak ditarget berada dalam state OFF, dan setiap gelembung yang ditarget berada dalam state ON (Kecuali dalam Mode Memory)
- Gelembung akan berubah state dari ON/OFF ke PUSHED ketika pemain menekannya
- Setiap gelembung yang berubah state dari ON/OFF ke PUSHED lakukan Penilaian
- Gelembung yang sudah berubah state menjadi PUSHED, tidak bisa dikembalikan lagi ke state sebelumnya
- Untuk menyelesaikan 1 sesi permainan, pemain harus menekan tombol "POP IT!"
- Jika tombol "POP IT!" ditekan maka sesi permainan berhenti dan lanjut ke sesi permainan berikutnya
- Gelembung mana saja yang ditarget diatur dalam **Aturan Khusus** masing-masing mode permainan dan disimpan di dalam memory Sesi
- Pemain tidak dilarang untuk menekan gelembung yang berada dalam state OFF


## Aturan Khusus

**1. Mode Classic**
- Mode Classic terdiri dari level 1-100
- Setiap level terdiri dari 10 sesi
- Sesi dimulai dengan 50% gelembung menjadi target secara acak


**2. Mode Memory**
- Mode Memory terdiri dari level 1-100
- Setiap level terdiri dari 10 sesi
- Sesi dimulai dengan 30% gelembung menjadi target secara acak
- Sebelum sesi permainan dimulai diawali dengan sesi Spill
- Pada sesi Spill, setiap gelembung yang ditarget dikedipkan (OFF->ON->OFF) secara bergantian
- Sesi permainan dimulai ketika sesi Spill selesai


**3. Mode Rush**
- Mode Rush memiliki 3 pilihan durasi waktu: 30, 45 & 60 detik
- Pemain harus mengumpulkan skor sebanyak mungkin dalam durasi waktu yang dipilih
- Aturan main sama seperti Mode Classic
- Permainan dan sesi selesai jika durasi waktu yang ditentukan sudah habis

**4. Mode Sequence**
- Mode Sequence terdiri dari level 1-100
- Setiap level terdiri dari 10 sesi
- Sesi dimulai dengan 50% gelembung menjadi target secara acak
- Saat Penilaian, jika target == `benar`: Pilih 1 ID gelembung yang berada dalam state OFF secara acak -> Masukkan ID gelembung tersebut ke dalam daftar gelembung yang ditarget -> Ubah state gelembung dengan ID tersebut menjadi state ON


**5. Mode Color Hunt**
- Mode Color Hunt terdiri dari level 1-100
- Setiap level terdiri dari 10 sesi
- Pilihan warna: Merah, Hijau, Kuning, Biru
- Setiap 1 sesi hanya memiliki 2 warna
- Sesi dimulai dengan 50% gelembung menjadi target
- Seluruh gelembung target memiliki warna yang sama
- Seluruh gelembung yang berada dalam state OFF memiliki warna yang sama yang berbeda dengan gelembung target

**6. Mode Frenzy**
- Mode Frenzy hanya memiliki 1 level dan sesi yang tidak akan berakhir hingga nyawa pemain habis
- Mode Frenzy memiliki atribut pencapaian bernama `Pop Streak` dengan ketentuan:
    - Pemain memecahkan gelembung dengan benar secara berturut-turut
    - Jika salah maka Streak direset menjadi 0
- Sesi dimulai dengan 50% gelembung menjadi target
- Setiap 1 gelembung berubah state menjadi PUSHED: lakukan Penilaian, jika target == `benar`: Ambil ID uniknya dan hapus ID gelembung tersebut dari daftar target -> Selain gelembung dengan ID tersebut, ubah semua gelembung yang berada dalam state PUSHED menjadi state OFF -> Pilih 1 ID gelembung yang berada dalam state OFF secara acak -> Masukkan ID gelembung tersebut ke dalam daftar gelembung target -> Ubah state gelembung dengan ID tersebut menjadi state ON -> Streak += 1
- Saat penilaian jika streak tercapai maka akan ada ketentuan nilai = `poin` dikali `pengali` dan memunculkan suara pada `SFX`

## Skill


### Attack (Mengganggu Lawan)
- **ice**: Membekukan papan lawan sehingga tidak bisa menekan gelembung apa pun selama 2 detik.
- **Shuffle**: Mengacak ulang posisi seluruh target gelembung aktif di papan lawan secara tiba-tiba.
- **Fog / Ink**: Menutupi sebagian area papan lawan dengan kabut atau bercak tinta selama 4 detik sehingga target sulit terlihat.
- **Fake Target**: Memunculkan 3 gelembung jebakan (`void`/`salah`) yang terlihat mirip dengan target `benar` di papan lawan selama 4 detik.
- **Reverse**: Membalikkan arah urutan target atau membuat papan lawan berputar/bergetar kencang selama 3 detik untuk memecah fokus.

### Defend (Bertahan & Pemulihan)
- **Shield**: Target `salah` atau `void` tidak mengurangi skor, nyawa, maupun memutus *streak* selama 3 detik.
- **Revive**: Mengisi ulang 1 nyawa (hati) yang hilang (memiliki *cooldown* 10 detik atau hanya aktif saat nyawa berkurang).
- **Cleanse**: Langsung menghapus seluruh efek gangguan (*debuff* seperti *Paralyze*, *Fog*, atau *Fake Target*) yang dikirim oleh lawan.
- **Time Slow**: Memperlambat kecepatan kemunculan atau batas waktu gelembung target selama 4 detik agar lebih mudah ditekan dengan akurat.
- **Streak Saver**: Melindungi *streak* saat ini agar tidak kembali ke 0 jika tidak sengaja menekan 1 target `salah` (aktif pasif hingga terpakai).

### Power Up (Peningkat Skor & Kecepatan)
- **Blast**: Langsung menekan 3 gelembung target berikutnya secara otomatis dan terhitung masuk ke dalam *streak*.
- **Double**: Skor dari setiap target `benar` dikali 2 selama 5 detik.
- **Magnet / Auto-Pop**: Cukup menekan 1 gelembung mana saja untuk otomatis meletuskan seluruh target `benar` yang sedang aktif di layar.
- **Golden Bubble**: Mengubah semua target `benar` berikutnya menjadi gelembung emas bernilai +50 poin ekstra per *pop* selama 3 detik.
- **Frenzy Boost**: Langsung menaikkan level pengali (*multiplier*) satu tingkat lebih tinggi selama 5 detik tanpa harus menunggu batas *streak*.

## Penilaian
- Target `benar` menambah skor
- Target `salah` atau `void` mengurangi skor dan nyawa

## Pencapaian
- Pencapaian diterapkan untuk masing-masing Mode
- Pencapaian yang dicatat/disimpan adalah Level, Waktu & Skor tertinggi
- Urutan prioritas pancapaian: Skor, Level, Waktu



---


# Aturan Permainan - Game Pop It

## 1. Aturan Umum
- Gelembung memiliki 3 state: `ON`, `OFF`, dan `PUSHED`.
- Masing-masing gelembung memiliki ID unik.
- Ketika sesi permainan dimulai, semua gelembung yang tidak ditarget berada dalam state `OFF`, dan setiap gelembung yang ditarget berada dalam state `ON` (kecuali diatur lain dalam **Aturan Khusus**).
- Gelembung akan berubah state dari `ON` atau `OFF` menjadi `PUSHED` ketika pemain menekannya.
- Setiap gelembung yang berubah state menjadi `PUSHED` langsung memicu proses **Penilaian**.
- Gelembung yang sudah berada dalam state `PUSHED` tidak dapat dikembalikan ke state sebelumnya dalam sesi yang sama (kecuali di-reset oleh mekanik khusus seperti Mode Frenzy).
- Pemain tidak dilarang menekan gelembung dalam state `OFF`, tetapi tindakan tersebut dihitung sebagai target `salah`.
- Untuk menyelesaikan 1 sesi permainan, pemain harus menekan tombol **"POP IT!"** (kecuali pada **Mode Frenzy**).
- Tombol **"POP IT!"** hanya dapat ditekan jika seluruh gelembung target (`ON`) pada sesi tersebut sudah berubah menjadi `PUSHED` (jika ditekan sebelum target habis, sisa target yang terlewat dihitung sebagai penalti).
- Daftar ID gelembung yang ditarget disimpan di dalam memori sesi aktif.

---

## 2. Aturan Khusus Mode Permainan

### 1. Mode Classic
- Terdiri dari **Level 1–100**, dengan **10 sesi** di setiap level.
- Sesi dimulai dengan **50% gelembung** dipilih secara acak sebagai target (`ON`).
- Sesi selesai saat semua target ditekan dan pemain menekan tombol **"POP IT!"**.

### 2. Mode Memory
- Terdiri dari **Level 1–100**, dengan **10 sesi** di setiap level.
- Sesi dimulai dengan **30% gelembung** dipilih secara acak sebagai target.
- Sebelum pemain dapat menekan papan, sesi diawali dengan **Fase Spill**: seluruh gelembung target dikedipkan (`OFF` -> `ON` -> `OFF`) secara bergantian, lalu kembali menjadi `OFF`.
- Pemain harus menekan gelembung berdasarkan ingatan setelah Fase Spill selesai, lalu menekan **"POP IT!"**.

### 3. Mode Rush
- Memiliki 3 pilihan durasi waktu: **30, 45, dan 60 detik**.
- Pemain harus menyelesaikan sesi sebanyak mungkin dan mengumpulkan skor tertinggi sebelum waktu habis.
- Aturan papan dan target sama seperti **Mode Classic** (50% target acak per sesi).
- Permainan langsung berakhir begitu timer menyentuh `00:00`.

### 4. Mode Sequence
- Terdiri dari **Level 1–100**, dengan **10 sesi** di setiap level.
- Sesi dimulai dengan **50% gelembung** menjadi target (`ON`) secara acak.
- Saat Penilaian, jika target == `benar`:
  1. Pilih 1 ID gelembung yang berada dalam state `OFF` secara acak.
  2. Masukkan ID gelembung tersebut ke dalam daftar target sesi.
  3. Ubah state gelembung tersebut dari `OFF` menjadi `ON`.
- Sesi berlanjut hingga seluruh gelembung di papan berubah menjadi `PUSHED`, lalu pemain menekan **"POP IT!"**.

### 5. Mode Color Hunt
- Terdiri dari **Level 1–100**, dengan **10 sesi** di setiap level.
- Pilihan warna tersedia: **Merah, Hijau, Kuning, Biru**.
- Setiap 1 sesi hanya memunculkan **2 warna** (1 warna target, 1 warna pengecoh) dengan indikator warna target ditampilkan di layar.
- Sesi dimulai dengan **50% gelembung** menjadi target (`ON`) dengan warna yang sama, sementara 50% gelembung `OFF` menggunakan warna kedua.

### 6. Mode Frenzy
- Hanya memiliki **1 level** dan **1 sesi tanpa batas** yang terus berjalan hingga nyawa pemain habis (tidak menggunakan tombol **"POP IT!"**).
- Memiliki atribut pencapaian **`Pop Streak`**:
  - Bertambah `+1` setiap pemain menekan target `benar` secara berturut-turut.
  - Direset menjadi `0` jika pemain menekan target `salah` atau `void`.
- Sesi dimulai dengan **50% gelembung** menjadi target (`ON`).
- Setiap 1 gelembung berubah state menjadi `PUSHED`, lakukan Penilaian. Jika target == `benar`:
  1. Ambil ID unik gelembung yang baru ditekan dan hapus dari daftar target.
  2. Ubah semua gelembung lain yang berstatus `PUSHED` kembali menjadi `OFF` (kecuali gelembung yang baru saja ditekan).
  3. Pilih 1 ID gelembung berstatus `OFF` secara acak, masukkan ke daftar target, dan ubah statenya menjadi `ON`.
  4. Tambahkan `Streak += 1`.
- Saat penilaian streak tercapai, perhitungan skor menggunakan rumus: `Nilai = Poin × Pengali` dan memicu efek suara (`SFX`) sesuai tingkatan streak.

---

## 3. Sistem Skill
- **Aturan Penggunaan:**
  - Kategori **Defend** dan **Power Up** dapat digunakan di mode *Single-player* maupun *Multiplayer*.
  - Kategori **Attack** hanya aktif pada mode *Multiplayer* (PvP).
  - Pemain dapat membawa maksimal **3 Skill** sebelum memulai permainan, yang diaktifkan melalui *cooldown* atau pengisian *Energy Bar* dari setiap *pop* yang benar.

### Attack (Mengganggu Lawan - Khusus Multiplayer)
- **Paralyze**: Membekukan papan lawan sehingga tidak bisa menekan gelembung apa pun selama 2 detik.
- **Shuffle**: Mengacak ulang posisi seluruh target gelembung aktif di papan lawan secara tiba-tiba.
- **Fog / Ink**: Menutupi sebagian area papan lawan dengan kabut atau bercak tinta selama 4 detik sehingga target sulit terlihat.
- **Fake Target**: Memunculkan 3 gelembung jebakan (`void`/`salah`) yang terlihat mirip dengan target `benar` di papan lawan selama 4 detik.
- **Reverse**: Membalikkan arah urutan target atau membuat papan lawan berputar/bergetar kencang selama 3 detik untuk memecah fokus.

### Defend (Bertahan & Pemulihan)
- **Shield**: Target `salah` atau `void` tidak mengurangi skor, nyawa, maupun memutus *streak* selama 3 detik.
- **Revive**: Mengisi ulang 1 nyawa (hati) yang hilang (*cooldown* 10 detik, hanya aktif jika nyawa kurang dari maksimal).
- **Cleanse**: Langsung menghapus seluruh efek gangguan (*debuff* seperti *Paralyze*, *Fog*, atau *Fake Target*) yang dikirim oleh lawan.
- **Time Slow**: Memperlambat kecepatan kemunculan atau batas waktu gelembung target selama 4 detik agar lebih mudah ditekan dengan akurat.
- **Streak Saver**: Melindungi *streak* saat ini agar tidak kembali ke 0 jika tidak sengaja menekan 1 target `salah` (aktif pasif hingga terpakai).

### Power Up (Peningkat Skor & Kecepatan)
- **Blast**: Langsung menekan 3 gelembung target berikutnya secara otomatis dan terhitung masuk ke dalam *streak*.
- **Double**: Skor dari setiap target `benar` dikali 2 selama 5 detik.
- **Magnet / Auto-Pop**: Cukup menekan 1 gelembung mana saja untuk otomatis meletuskan seluruh target `benar` yang sedang aktif di layar.
- **Golden Bubble**: Mengubah semua target `benar` berikutnya menjadi gelembung emas bernilai `+50` poin ekstra per *pop* selama 3 detik.
- **Frenzy Boost**: Langsung menaikkan level pengali (*multiplier*) satu tingkat lebih tinggi selama 5 detik tanpa harus menunggu batas *streak*.

### Alur Pemilihan & Penyimpanan Loadout Skill

Pemain dapat membawa maksimal **3 Skill** dalam satu kali permainan dengan tempat pemilihan yang berbeda berdasarkan mode permainan:

1. **Mode Solo (Pemilihan di Beranda / Home Screen):**
   - Pemain wajib mengatur susunan skill (*Loadout*) terlebih dahulu melalui menu **Skill / Deck** di **Beranda** sebelum memilih mode permainan (*Classic, Memory, Rush, Color Hunt, Sequence,* atau *Frenzy*).
   - **Persistent Loadout:** Susunan skill yang sudah dipilih di Beranda akan **tersimpan dan terbawa terus** ke setiap sesi maupun level berikutnya secara otomatis hingga pemain menggantinya kembali di Beranda.
   - Pada pengaturan *Loadout* Solo, hanya kategori **Defend** dan **Power Up** yang dapat dipasang (kategori **Attack** terkunci/tidak tersedia).

2. **Mode Multiplayer & VS Bot (Pemilihan di Ruang Tunggu / Lobby):**
   - Pemain dapat memilih atau mengganti susunan **3 Skill** secara langsung saat berada di **Ruang Tunggu (*Lobby*)** sebelum menekan tombol **Ready / Start** (dengan batas waktu persiapan `15 detik` pada *Online Matchmaking*).
   - Seluruh kategori skill (**Attack, Defend, dan Power Up**) terbuka untuk dipilih.
   - Khusus pada **VS Bot**, pemain juga dapat mengatur *Loadout* skill masing-masing bot di dalam *Lobby* sebelum permainan dimulai.
   - Perubahan skill yang dilakukan di dalam *Lobby* bersifat sementara untuk pertandingan tersebut (atau dapat disimpan sebagai *default* jika pemain mencentang opsi simpan).

## 4. Mode Bermain: Solo vs. Bot & 4-Player Multiplayer

### A. Solo Murni vs. Lawan Bot (VS AI & Custom Skill Bot)
- **Solo Murni (Single-Player Progression):** Diterapkan pada progresi **Level 1–100** (*Classic, Memory, Color Hunt, Sequence*) serta mode rekor pribadi (*Rush* dan *Frenzy*).
- **Bermain Melawan Bot (VS AI — Hingga 4 Pemain):**
  - **Pengaturan Lobby Sebelum Mulai:** Pemain dapat memilih **1 hingga 3 Bot** (`1v1`, `1v2`, atau `1v3`) serta menentukan **Level Bot** (*Easy, Medium, Hard, Insane*) di setiap slot lawan.
  - **Pemilihan Skill Bot (Bot Loadout):** Sebelum pertandingan dimulai, setiap bot membawa maksimal **3 Skill** dengan 2 mode pengaturan:
    1. **Auto-Loadout (Default):** Bot otomatis memilih 3 skill acak yang sesuai dengan tingkat kesulitannya.
    2. **Custom Bot Loadout (Manual):** Pemain dapat memilihkan langsung 3 skill spesifik untuk masing-masing bot (cocok untuk latihan menghadapi kombinasi serangan tertentu, misalnya melawan 3 bot yang sama-sama membawa `Paralyze`).
  - **Mekanik Penggunaan Skill oleh Bot:**
    - Bot memiliki **Energy Bar** dan **Cooldown** yang sama persis dengan pemain manusia (energi terisi setiap bot menekan target `CORRECT`).
    - Bot mengeksekusi skill berdasarkan **Logika Situasional AI**:
      - *Defend (`Revive` / `Cleanse` / `Shield`):* Dipakai saat nyawa bot berkurang, saat terkena *debuff* serangan, atau saat *Pop Streak* bot sedang tinggi.
      - *Power Up (`Blast` / `Double` / `Magnet`):* Dipakai segera setelah energi penuh untuk mengejar ketertinggalan skor.
      - *Attack (`Paralyze` / `Fog` / `Shuffle`, dll.):* Dipakai saat bot berada di peringkat bawah untuk menyerang pemain peringkat 1 (tetap mengikuti aturan *Grace Period* 2.5 detik).
  - **Reward VS Bot:** Memberikan **50% Coin & XP** dari pertandingan standar (tidak memengaruhi *Rank Points*).
  - **Matchmaking Backfill (Online):** Pada antrean *Online Multiplayer* 4 pemain, jika ruangan belum penuh setelah **12 detik**, sistem otomatis mengisi slot kosong dengan **AI Bot** (menggunakan *Auto-Loadout* sesuai Tier Rank ruangan).

## Sistem Peringatan Serangan (Attack Telegraphing & Counter-Play)

Untuk menciptakan kedalaman strategi dalam pemilihan *loadout* skill dan manajemen energi, setiap **Attack Skill** tidak langsung mengenai target secara instan, melainkan melalui **Fase Peringatan (*Warning Window*)**.

### 1. Alur & Durasi Peringatan
- **Durasi Warning Window:** `1.5 detik` (`1500 ms`) sejak lawan menekan tombol *Attack Skill* hingga efek serangan mendarat di papan target.
- **Indikator Visual & Audio di Layar Target:**
  1. **Edge Screen Alert:** Bingkai tepi layar pemain berkedip merah/oranye sebagai tanda bahaya.
  2. **Skill Telegraphed Icon:** Muncul ikon peringatan melayang di bagian atas papan yang menampilkan **jenis skill yang akan datang** (misal: ikon *Es/Petir* untuk `Paralyze`, ikon *Tinta* untuk `Fog`, atau ikon *Tanda Tanya* untuk `Fake Target`) lengkap dengan *timer ring* hitung mundur `1.5 detik`.
  3. **Warning SFX:** Memicu suara peringatan khusus (*alert chime*) agar pemain langsung waspada tanpa harus melepas pandangan dari gelembung.

### 2. Dampak Strategi pada Pemilihan Skill (Counter-Play)
Adanya jeda `1.5 detik` membuat pemain harus memperhitungkan komposisi **3 Slot Skill** dan waktu penggunaannya (*timing*):
- **Taktik Blokir Aktif (`Shield`):** Jika pemain melihat peringatan `Paralyze` atau `Reverse` muncul dan segera menekan **Shield** sebelum `1.5 detik` berakhir, serangan akan **terblokir total (`BLOCKED!`)** dan energi lawan terbuang sia-sia.
- **Taktik Pemulihan (`Cleanse`):** Jika pemain memilih tidak membawa `Shield` (atau terlambat menekan saat peringatan), pemain masih bisa menggunakan **Cleanse** *setelah* efek serangan mendarat untuk menghapus *debuff* secara instan.
- **Mind Games & Baiting:**
  - Pemain tidak bisa asal membuang energi untuk *Power Up* (`Blast`/`Double`) jika melihat *Energy Bar* lawan sudah penuh, karena pemain harus menyisakan energi untuk berjaga-jaga mengaktifkan `Shield` saat peringatan muncul.
  - Lawan dapat memancing pemain membuang `Shield` lebih awal menggunakan *Attack Skill* berbiaya rendah sebelum mengirim serangan utama.

### 3. Reaksi AI Bot Terhadap Peringatan
- **Easy & Medium:** Tidak bereaksi terhadap *Warning Window* (menerima serangan secara penuh).
- **Hard:** Memiliki peluang **40%** untuk mengaktifkan `Shield` selama *Warning Window* jika energi tersedia.
- **Insane:** Memiliki peluang **75%** untuk mengaktifkan `Shield` tepat sebelum serangan mendarat jika membawa skill `Shield` dalam *loadout*-nya.

---

## 5. Mekanik Reset Papan ("POP IT!" / Push-Back Action)

Mengadaptasi mekanik tombol pelat belakang pada mainan *Quick Push* fisik—di mana pemain mendorong gelembung yang sudah masuk (`PUSHED`) agar kembali menyembul ke atas untuk melanjutkan ke sesi berikutnya[cite: 1]—pemain di HP dapat memicu aksi **POP IT!** melalui interaksi fisik berikut:

### 1. Swipe Up / Flick ke Atas (Rekomendasi Utama)
- **Mekanik:** Pemain mengusap layar dari bawah ke atas (*swipe up*) melewati papan gelembung (seolah-olah mendorong bagian belakang papan ke atas).
- **Efek Visual & Audio:** Gelembung menyembul kembali baris demi baris dari bawah ke atas secara berurutan disertai suara *"plop-plop-plop!"* dan getaran *haptic* beruntun.
- **Keunggulan:** Sangat cepat untuk mode kejar waktu seperti **Mode Rush** dan nyaman dimainkan satu jempol.

### 2. Shake to Pop-Back (Goyang HP untuk Mengembalikan Gelembung)
- **Mekanik:** Setelah seluruh target selesai ditekan, pemain cukup menghentakkan/menggoyangkan HP sekali (*quick flick/shake*) menggunakan sensor *Accelerometer*.
- **Efek Visual & Audio:** Seluruh gelembung langsung memantul kembali ke posisi semula secara serentak disertai efek pegas (*bounce animation*) dan getaran kuat (*heavy haptic*).

### 3. Two-Thumb Squeeze / Pinch Out (Cubitan Keluar)
- **Mekanik:** Pemain meletakkan dua jempol di tengah papan lalu menggesernya melebar ke luar (*spread/pinch out*), memberikan sensasi menekan bagian belakang silikon agar gelembung menyembul keluar.

### 4. Tilt / Flip HP (Membalikkan Perangkat)
- **Mekanik:** Memanfaatkan sensor *Gyroscope*—pemain memiringkan HP sedikit ke depan/bawah (seperti membalikkan papan Pop It fisik untuk menekan sisi sebaliknya) lalu kembali ke posisi tegak.

---

### Pengaturan Opsi Kontrol di Menu Settings
Agar nyaman di semua situasi (baik saat bermain santai maupun kompetitif di *Ranked*), pemain dapat memilih gaya pemicu **POP IT! (Board Reset)** di menu pengaturan:
- **Mode Classic Tap:** Menekan tombol **"POP IT!"** di bagian bawah layar (paling stabil untuk *Ranked*).
- **Mode Gesture (Swipe Up):** Mengusap papan ke atas untuk mendorong gelembung kembali.
- **Mode Motion (Shake):** Menghentakkan HP untuk me-reset papan (otomatis tetap menampilkan tombol **"POP IT!"** di layar sebagai cadangan).

## 6. Penilaian & Nyawa
- **Nyawa Awal:** Setiap pemain memulai permainan dengan **3 Nyawa (Hati)** (kecuali Mode Rush).
- **Target `benar` (`ON`):** Menambah skor dasar (dikalikan *multiplier* jika aktif) dan mempertahankan/menambah `Pop Streak`.
- **Target `salah` (`OFF`) atau `void`:** Mengurangi skor, mengurangi **1 Nyawa**, dan mereset `Pop Streak` menjadi `0`.

---

## 7. Pencapaian (Leaderboard & Rekor)
- Pencapaian diterapkan dan disimpan secara terpisah untuk masing-masing Mode.
- Pencapaian yang dicatat/disimpan adalah **Skor Tertinggi**, **Level Tertinggi**, dan **Waktu Terbaik**.
- Urutan prioritas penentuan pencapaian terbaik: **1. Skor -> 2. Level -> 3. Waktu**.


## 8. Sistem Retensi & Replayability: Mode Sequence & Mode Frenzy

Untuk membuat pemain ketagihan mengulang (**"one more try"**) pada **Mode Sequence** dan **Mode Frenzy**, kedua mode ini dibekali sistem pencapaian khusus yang memicu adrenalin, kepuasan ritme, dan gengsi kompetitif.

---

### 1. Daya Tarik & Pencapaian Mode Sequence (Flow & Speedrun)

Karena gelembung target muncul berantai satu per satu hingga seluruh papan habis (`PUSHED`), keseruan utama Mode Sequence terletak pada **kecepatan refleks tanpa putus (*flow state*)**:

#### A. Musical Scale & Flow Chain (Kombo Ritme)
- **Mekanik:** Jika pemain menekan gelembung target baru dalam waktu `< 400 ms` sejak kemunculannya, pemain masuk ke status **Flow Chain**.
- **Efek Audio-Visual:** Setiap *pop* dalam *Flow Chain* menaikkan nada suara satu tangga nada (*Do-Re-Mi-Fa-Sol-La-Si-Do*), sehingga saat seluruh papan `4x4` berhasil dibersihkan dengan mulus, tercipta harmoni musik yang memuaskan disertai efek kilau garis penghubung antar gelembung.
- **Bonus Skor:** `Full Board Flow` (menyelesaikan 1 papan tanpa jeda lambat) memberikan bonus **+50% Skor Sesi**.

#### B. Sistem 3 Bintang & Speedrun Medal (Par Time)
- Setiap level di Mode Sequence memiliki target waktu penyelesaian (*Par Time*) untuk mendorong pemain mengulang level demi rekor sempurna:
  - **1 Bintang:** Menyelesaikan level sebelum waktu habis.
  - **2 Bintang:** Selesai tanpa salah tekan (`0 WRONG`).
  - **3 Bintang (Lightning Medal):** Selesai dengan `0 WRONG` **dan** waktu di bawah batas *Speedrun* (misal: `< 5 detik` untuk papan `4x4`).
- **Reward Koleksi Bintang:** Mengumpulkan total bintang tertentu membuka **Board Skin Eksklusif** (contoh: *50 Bintang* = Skin *Piano Keys*, *150 Bintang* = Skin *Cyber Grid*).

---

### 2. Daya Tarik & Pencapaian Mode Frenzy (High-Stakes & Gengsi)

Karena Mode Frenzy bersifat *endless* hingga nyawa habis, pemain akan terus mengulang jika ada **target jarak dekat yang terlihat di depan mata** dan **hadiah prestise yang tidak bisa dibeli**:

#### A. Live Ghost Marker (Penanda Rekor Pribadi & Teman)
- Di bagian atas layar Mode Frenzy, terdapat *Progress Bar* vertikal/horizontal yang menampilkan penanda posisi rekor secara *real-time*:
  - **Personal Best Marker:** Garis batas rekor *Pop Streak* tertinggi milik pemain sendiri (misal: *"Rekormu: 142 Streak"*).
  - **Rival / Friend Marker:** Menampilkan avatar teman atau pemain lain yang rekornya berada tepat di atas skor pemain saat ini (misal: *"15 pop lagi untuk menyalip @Budi!"*). Mekanik ini memicu dorongan psikologis untuk langsung menekan tombol **Play Again** saat gagal tipis.

#### B. Exclusive Streak Milestone Rewards (Hadiah Prestise Non-Shop)
Item kosmetik tertentu **tidak dijual dengan Coin maupun Gem**, melainkan hanya terbuka jika pemain berhasil menembus batas *Pop Streak* di Mode Frenzy:
- **50 Streak (`Amazing!`):** Membuka *Pop SFX Pack: Arcade Synth*.
- **100 Streak (`FEVER!`):** Membuka *VFX Explosion: Blue Flame* (efek api biru tiap gelembung meletus).
- **200 Streak (`SUPER FRENZY!!!`):** Membuka *Board Skin: Magma Core* + Gelar Profil **Frenzy Maniac**.
- **300+ Streak (`GODLIKE POPPER`):** Membuka *Avatar Frame* animasi petir khusus penghuni papan atas.

#### C. Weekly Frenzy Survival Leaderboard (Reset Mingguan)
- Selain *Leaderboard* skor sepanjang masa, Mode Frenzy memiliki papan peringkat khusus **Streak Terpanjang Mingguan** yang di-reset setiap hari Senin.
- **Top 100 Pemain Mingguan** mendapatkan lencana sementara (*Weekly Crown*) di samping *username* mereka saat masuk ke ruang tunggu **4-Player Multiplayer**, sehingga pemain rutin kembali ke Mode Frenzy setiap minggu untuk mempertahankan statusnya.

#### D. Mystery Fever Box (Peti Kejutan Kelipatan 50 Streak)
- Setiap kali pemain berhasil menembus kelipatan **50 Streak** (`50, 100, 150, 200, dst.`) dalam satu sesi, sebuah **Mystery Fever Box** otomatis masuk ke inventaris pemain (dibuka setelah sesi berakhir) yang berisi kombinasi acak **Coin, Gem, atau Skill Card**.

## 9. Sistem Ekonomi Skill, Coin Sink & Monetisasi

### 1. Mekanik Biaya Coin per Penggunaan Skill (*Coin-to-Cast*)

Setiap kali pemain mengaktifkan skill di dalam pertandingan (*Single-player*, *VS Bot*, maupun *Online Multiplayer*), sistem langsung memotong saldo **Coin** pemain sesuai tingkat kekuatan skill tersebut (selain memenuhi syarat *Energy Bar* / *Cooldown*).

### Tabel Biaya Coin per Skill
| Kategori | Nama Skill | ID Skill | Biaya Coin / Pakai | Tingkat Dampak |
| :--- | :--- | :--- | :--- | :--- |
| **Attack** | Shuffle | `shuffle` | **15 Coin** | Ringan (Gangguan cepat) |
| **Attack** | Reverse | `reverse` | **20 Coin** | Sedang (Pecah fokus) |
| **Attack** | Fog / Ink | `fog` | **25 Coin** | Sedang (Tutup pandangan) |
| **Attack** | Fake Target | `fake_target` | **30 Coin** | Tinggi (Jebakan nyawa) |
| **Attack** | Paralyze | `paralyze` | **40 Coin** | Sangat Tinggi (Stun papan) |
| **Defend** | Time Slow | `time_slow` | **15 Coin** | Ringan (Bantu akurasi) |
| **Defend** | Streak Saver | `streak_saver` | **20 Coin** | Sedang (Jaga multiplier) |
| **Defend** | Cleanse | `cleanse` | **25 Coin** | Sedang (Hapus debuff) |
| **Defend** | Shield | `shield` | **30 Coin** | Tinggi (Blokir serangan) |
| **Defend** | Revive | `revive` | **50 Coin** | Krusial (Tambah 1 Nyawa) |
| **Power Up** | Blast | `blast` | **20 Coin** | Ringan (3 auto-pop) |
| **Power Up** | Double | `double` | **25 Coin** | Sedang (2x skor 5 detik) |
| **Power Up** | Frenzy Boost | `frenzy_boost` | **30 Coin** | Tinggi (Naik tier pengali) |
| **Power Up** | Golden Bubble | `golden_bubble` | **35 Coin** | Tinggi (+50 poin/pop) |
| **Power Up** | Magnet / Auto-Pop | `magnet` | **45 Coin** | Sangat Tinggi (Clear layar) |

---

### 2. Dampak Strategi pada Penyusunan Loadout

Adanya biaya **Coin** per pemakaian membuat pemain tidak bisa asal membawa 3 skill termahal di setiap pertandingan:
- **Manajemen Anggaran (*Coin Budgeting*):** Sebelum masuk ke *Lobby* atau *Beranda*, pemain melihat estimasi **"Total Biaya 1x Rotasi Skill"** di bawah 3 slot *Loadout*-nya (misal: `Shuffle (15) + Cleanse (25) + Blast (20) = 60 Coin`).
- **Strategi Hemat vs. Agresif:**
  - *Pemain Hemat:* Membawa skill berbiaya murah (`15–20 Coin`) agar tetap untung secara bersih (*net profit*) dari hadiah kemenangan pertandingan.
  - *Pemain Kompetitif (Ranked):* Membawa kombinasi skill mahal (`Paralyze + Shield + Revive`) demi mengamankan **Rank Points (RP)** dan gengsi peringkat, meskipun pengeluaran Coin lebih besar daripada hadiah dasar pertandingan.
- **Kondisi Saldo Tidak Cukup (`Insufficient Coins`):** Jika di tengah pertandingan saldo Coin pemain di bawah biaya skill, tombol skill berubah menjadi abu-abu dengan ikon **`+ Top Up`** kecil.

---

### 3. Alur Monetisasi & Konversi Gem ke Coin

Untuk memaksimalkan konversi tanpa merusak alur permainan cepat, sistem menyediakan titik penawaran (*monetization hooks*) di momen krusial:

#### A. Quick Gem-to-Coin Exchange (Tukar Instan di Lobby & In-Game)
- **Di Ruang Tunggu (*Lobby*):** Jika saldo Coin pemain kurang dari estimasi biaya *Loadout* yang dipilih, muncul tombol kilat **"Tukar 10 Gem -> 500 Coin"** tanpa perlu keluar dari *Lobby* (menghindari batal *matchmaking*).
- **Mid-Match Emergency Popup (Saat Saldo Habis di Tengah Duel):**
  - Ketika tombol skill ditekan dalam kondisi Coin habis (misal saat nyawa tersisa 1 dan butuh `Revive` seharga `50 Coin`), muncul *overlay* transparan super-ringkas di bagian bawah layar (tidak menutupi papan gelembung):
  - **1-Tap Convert:** Pemain cukup mengetuk tombol **"Tukar 5 Gem = 250 Coin"** untuk langsung mengisi saldo Coin dan seketika mengaktifkan skill tersebut.

#### B. Kurs Konversi Gem ke Coin (Shop)
| Paket Konversi | Biaya Gem | Coin Didapat | Bonus | Target Pengguna |
| :--- | :--- | :--- | :--- | :--- |
| **Pouch of Coins** | 10 Gem | 500 Coin | - | Darurat tengah pertandingan |
| **Bag of Coins** | 45 Gem | 2.500 Coin | +10% | Sesi bermain harian |
| **Chest of Coins** | 150 Gem | 10.000 Coin | +33% | Pemain *Ranked* aktif |
| **Vault of Coins** | 500 Gem | 40.000 Coin | +60% | *Hardcore / Leaderboard* |

#### C. Bundel Monetisasi Pendukung (High-Value Offers)
1. **Skill Pass / VIP Popper (Langganan Bulanan):**
   - Diskon **30% biaya Coin** untuk seluruh penggunaan skill selama 30 hari.
   - Gratis **200 Coin** setiap hari saat login + *Badge* eksklusif di *Lobby*.
2. **Clutch Rescue Pack (Penawaran Kalah Tipis):**
   - Muncul otomatis setelah pemain kalah di *Ranked Match* dalam kondisi kehabisan Coin: menawarkan **100 Gem + 1.500 Coin** dengan diskon spesial sekali beli (*limited-time 24 jam*).
3. **Free Coin Ad-Watch (Monetisasi Non-Paying User):**
   - Bagi pemain gratis yang kehabisan Coin dan Gem, tersedia opsi menonton **1 Iklan Video (Rewarded Ads)** untuk mendapatkan **150 Coin** (maksimal 5x sehari) agar tetap bisa bermain dan memutar ekonomi game.