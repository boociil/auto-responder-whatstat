// SETUP LIBRARY
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const { checkAuth, authWablas } = require("./checkAuth");

require("dotenv").config();

const cors = require("cors");

const {
  databaseAddUser,
  databaseAddDataLayanan,
  databasePushChat,
  databaseGetRekapEvalSiakip,
  databaseGetDataWhatStat,
} = require("./db.js");

const app = express();

app.use(cors());
app.use(bodyParser.json()); // untuk JSON
app.use(bodyParser.urlencoded({ extended: true }));

// app.use((req, res, next) => {
//   // jika request datang dari HTTP, redirect ke HTTPS
//   if (!req.secure && req.get("x-forwarded-proto") !== "https") {
//     return res.redirect("https://" + req.headers.host + req.url);
//   }
//   next();
// });

const {
  announcePagi,
  announceSore,
  test,
  alertSore,
} = require("./siakip-announcer.js"); // Import fungsi announcePagi dan announceSore dari siakip-announcer.js

/////////////////////// END OF SETUP LIBRARY

// Ganti dengan API token dan URL Wablas-mu
const WABLAS_TOKEN = process.env.WABLAS_TOKEN;
const WABLAS_URL = "https://texas.wablas.com/api/v2/send-message"; // endpoint v2 untuk support listMessage
const WABLAS_LIST_URL = "https://texas.wablas.com/api/v2/send-list"; // endpoint v2 untuk support listMessage
const WABLAS_SECRET = process.env.WABLAS_SECRET;

// Message
const messageEnd = `*Terimakasih* sudah menggunakan layanan WhatStat 😁🙏🏻\n\nJika ada pertanyaan atau butuh bantuan terkait data statistik Kabupaten Majene, jangan ragu hubungi kami 😊\n\nKunjungi website BPS Majene di https://majenekab.bps.go.id/ untuk info terbaru!  Ohiya, untuk meningkatkan layanan kami, mohon bantuan untuk mengisi Survei kebutuhan data ya 😁🙏🏻 \n\nLink SKD dapat diakses pada link berikut : \nhttps://s.bps.go.id/SKD7601`;

// Const untuk menyimpan data user yang masuk
const listMessage = [
    
];

// Const kata kata sapaan
const openingWord = [
  "halo",
  "selamat",
  "pagi",
  "sore",
  "malam",
  "hi",
  "selamat pagi bps",
  "hallo",
  "hai",
  "menu",
  "woi",
  "ass",
  "aslmlkm",
  "aslm",
  "tes",
  "test",
  "tabe",
  "menu",
  "oi",
  "p",
  "pp",
  "pppppp",
  "oiiiii",
  "oyyyy",
  "permisi",
  "saya mau tanya",
  "mau tanya",
  "tanya",
  "nanya",
];

const cekIsSalamPembuka = (msg) => {
  const listMsg = msg.split(" ");
  console.log("list msg", listMsg);

  for (i = 0; i < listMsg.length; i++) {
    if (openingWord.includes(listMsg[i])) {
      console.log("salam pembuka : true");

      return true;
    }
  }
  return false;
};

let chatId = 0;

function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

const deleteDataUser = (phoneNumber) => {
  // Cari index user yang ingin dihapus
  const index = listMessage.findIndex((user) => user.noTelp === phoneNumber);

  // Jika ditemukan, hapus
  if (index !== -1) {
    listMessage.splice(index, 1); // hapus 1 elemen di posisi index
  }

  console.log(`User ${phoneNumber} telah dihapus`);
  console.log(listMessage);
};

// Fungsi parsing:
function parseListString(input) {
  // Pisahkan bagian sebelum dan sesudah <~
  const [title, rest] = input.split("<~").map((s) => s.trim());
  // Pisahkan bagian setelah <~ menjadi title dan description
  const [listTitle, description] = rest.split("#").map((s) => s.trim());
  return {
    menu: title,
    title: listTitle,
    description: description,
  };
}

// Kirim pesan LIST MESSAGE
const kirimListMenuPetugas = async (
  phone,
  namaPetugas,
  layanan,
  namaTamu,
  phoneTamu,
  instansi,
  detail
) => {
  phone, namaPetugas, layanan, namaTamu, phoneTamu, instansi, detail;

  try {
    await axios.post(
      WABLAS_LIST_URL,
      {
        data: [
          {
            phone: phone,
            messageType: "list",
            message: {
              menu: "menu petugas",
              title: "Menu Petugas",
              description: `Halo ${namaPetugas}, ada tamu dengan jenis layanan "*${layanan}*" nih, namanya *${namaTamu}* dari ${instansi}, detailnya : ${detail}`,
              buttonText: "Pilih Menu",
              lists: [
                {
                  title: "Ok, saya akan respon",
                  description: `${phoneTamu};${namaTamu};${namaPetugas}`,
                },
                {
                  title: "Akhiri, sesi telah berakhir",
                  description: `${phoneTamu};${namaTamu};${namaPetugas}`,
                },
              ],
              footer: "BPS Majene",
            },
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: WABLAS_TOKEN + "." + WABLAS_SECRET,
        },
      }
    );
  } catch (error) {
    console.error(
      "Gagal kirim list message:",
      error.response?.data || error.message
    );
  }
};

const kirimListMessageMenu = async (phone, nama) => {
  try {
    await axios.post(
      WABLAS_LIST_URL,
      {
        data: [
          {
            phone: phone,
            messageType: "list",
            message: {
              menu: "menu layanan",
              title: "Menu Layanan",
              description: `Halo *${nama}*, Selamat datang di *WhatStat BPS Kabupaten Majene*👋😊, silahkan pilih layanan.`,
              buttonText: "Pilih Menu",
              lists: [
                {
                  title: "Konsultasi Statistik",
                  description:
                    "Layanan Permintaan Data atau Konsultasi terkait data statistik",
                },
                {
                  title: "Pengaduan Terkait Layanan",
                  description: "Layanan pengaduan terkait layanan kami",
                },
                {
                  title: "Pengaduan Lainnya",
                  description: "Layanan pengaduan di luar layanan kami",
                },
                // { title: "Rekrutmen Mitra BPS", description: "" },
                { title: "Panduan", description: "" },
                { title: "Lainnya", description: "" },
              ],
              footer: "BPS Majene",
            },
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: WABLAS_TOKEN + "." + WABLAS_SECRET,
        },
      }
    );
  } catch (error) {
    console.error(
      "Gagal kirim list message:",
      error.response?.data || error.message
    );
  }
};

const kirimListMessageYaTidak = async (phone, nama) => {
  try {
    await axios.post(
      WABLAS_LIST_URL,
      {
        data: [
          {
            phone: phone,
            messageType: "list",
            message: {
              menu: "Hubungkan ke Petugas",
              title: "Hubungkan ke Petugas",
              description: `Apakah informasi yang kami berikan sudah jelas? Jika belum, silahkan pilih "*Ya*" untuk menghubungkan dengan Petugas kami.`,
              buttonText: "Pilih Menu",
              lists: [
                {
                  title: "Ya",
                  description: "Hubungkan saya dengan Petugas",
                },
                {
                  title: "Tidak",
                  description: "Informasi sudah jelas, terimakasih",
                },
              ],
              footer: "BPS Majene",
            },
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: WABLAS_TOKEN + "." + WABLAS_SECRET,
        },
      }
    );
  } catch (error) {
    console.error(
      "Gagal kirim list message:",
      error.response?.data || error.message
    );
  }
};

// Kirim pesan biasa
const kirimPesan = async (phone, message) => {
  try {
    isProcessing = true;
    await axios.post(
      WABLAS_URL,
      {
        data: [
          {
            phone: phone,
            message: message,
            secret: false,
            priority: true,
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: WABLAS_TOKEN + "." + WABLAS_SECRET,
        },
      }
    );
  } catch (error) {
    console.error("Gagal kirim pesan:", error.response?.data || error.message);
  } finally {
    isProcessing = false; // Set isProcessing ke false setelah selesai
  }
};

const akhiriChat = async (phone) => {
  await kirimPesan(phone, messageEnd);
  deleteDataUser(phone);
};

function isJamLayanan() {
  const now = new Date();
  const totalMenit = now.getHours() * 60 + now.getMinutes();

  const batasAwal = 8 * 60; // 08:00 → 480 menit
  const batasAkhir = 15 * 60 + 30; // 15:30 → 930 menit

  return totalMenit >= batasAwal && totalMenit <= batasAkhir;

  // return false;
}

const petugas = [
  { nama: "Ryan", phone: "6282246657077" },
  { nama: "Haris", phone: "6281241157987" },
  { nama: "Maya", phone: "6285804357544" },
  // { nama: "Tiara", phone: "6285777595273" },
];

const notifPetugas = async (
  nama,
  instansi,
  layanan,
  detail,
  phoneTamu,
  isRekrutmen = false
) => {
  const tanggalSekarang = new Date();
  const bulanSekarang = tanggalSekarang.getMonth() + 1; // hasilnya 0 - 11

  if (isRekrutmen) {
    await kirimListMenuPetugas(
      petugas[3].phone,
      petugas[3].nama,
      layanan,
      nama,
      phoneTamu,
      instansi,
      detail
    );
    console.log(
      `Notifikasi dikirim ke ${petugas[3].nama} (${petugas[3].phone}) untuk layanan ${layanan} dari ${nama} (${instansi}) (${phoneTamu}) dengan detail: ${detail}`
    );
  } else {
    await kirimListMenuPetugas(
      petugas[bulanSekarang % 3].phone,
      petugas[bulanSekarang % 3].nama,
      layanan,
      nama,
      phoneTamu,
      instansi,
      detail
    );
    console.log(
      `Notifikasi dikirim ke ${petugas[bulanSekarang % 3].nama} (${
        petugas[bulanSekarang % 3].phone
      }) untuk layanan ${layanan} dari ${nama} (${instansi}) (${phoneTamu}) dengan detail: ${detail}`
    );
  }
  // await kirimListMenuPetugas(petugas[0].phone, petugas[0].nama, layanan, nama, phoneTamu, instansi, detail);
};

const pesanRekrutmen =
  "Seputar Rekrutmen Mitra Statistik BPS Kabupaten Majene 2026\n\n" +
  "1. Mitra statistik adalah tenaga kerja yang direkrut untuk menunjang kegiatan sensus/survei baik kegiatan pendataan lapangan maupun pengolahan di Badan Pusat Statistik.\n\n" +
  "2. Tahapan & Jadwal Rekrutmen:\n" +
  "- Registrasi: 11–14 November 2025\n" +
  "- Seleksi Administrasi: 11–17 November 2025\n" +
  "- Seleksi Kompetensi & Wawancara: 18–26 November 2025\n" +
  "- Seleksi Akhir: 26 November–1 Desember 2025\n" +
  "- Pengumuman: 9 Desember 2025\n\n" +
  "3. Pendaftaran dapat diakses melalui website:\n" +
  "https://mitra.bps.go.id/beranda\n" +
  "(dapat diakses mulai tanggal 11 November 2025)\n\n" +
  "4. Dokumen pendaftaran:\n" +
  "- KTP\n" +
  "- Surat Keterangan Domisili\n" +
  "- Ijazah\n" +
  "- Foto Terbaru\n\n" +
  "*Catatan:* KTP dan Surat Keterangan Domisili digabung menjadi 1 dokumen.";

const pesanRekrutmen2 =
  "Mekanisme Pendaftaran\n\n" +
  "Calon Mitra yang *BELUM PERNAH TERDAFTAR* pada aplikasi SOBAT:\n" +
  "• Registrasi dan aktivasi akun melalui https://mitra.bps.go.id\n" +
  "• Melengkapi data profil\n" +
  "• Mendaftar pada kegiatan “Rekrutmen Mitra BPS 2026 - Pendaftaran”\n\n" +
  "Calon Mitra yang *SUDAH TERDAFTAR* pada aplikasi SOBAT:\n" +
  "• Melengkapi data profil\n" +
  "• Mendaftar pada kegiatan “Rekrutmen Mitra BPS 2026 - Pendaftaran”";

const queue = [];
let isProcessingQueue = false;

// Middleware untuk menangani antrian pesan
const processingQueue = () => {
  if (isProcessingQueue || queue.length === 0) return;
  isProcessingQueue = true;

  const item = queue.shift();

  try {
    console.log(item);
  } catch (error) {
  } finally {
    isProcessingQueue = false;
    while (queue.length > 0) {
      processingQueue();
    }
  }
};

app.post("/webhook", async (req, res) => {
  const xff =
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress;
  console.log("== WEBHOOK CALL ==");
  console.log("Time:", new Date().toISOString());
  console.log("Source IP (X-Forwarded-For):", xff);
  console.log("RemoteAddress:", req.connection.remoteAddress);
  console.log("Headers:", JSON.stringify(req.headers));
  console.log("Body:", JSON.stringify(req.body));
  const { phone, message, isFromMe, pushName, isGroup } = req.body;
  const msg = message.toLowerCase();

  console.log("Incoming message:", req.body);
  console.log("Headers : ", req.headers);

  const foundUser = listMessage.find((user) => user.noTelp === phone);

  if (isFromMe || isGroup || (foundUser && foundUser.hasOwnProperty("isCS"))) {
    if (msg.includes("terimakasih sudah")) {
      akhiriChat(phone);
    }

    if (foundUser && foundUser.hasOwnProperty("isCS")) {
      if (!foundUser.hasOwnProperty("chat")) {
        foundUser.chat = [];
      }

      const msgPush = `${isFromMe ? "whatstat : " : "client : "}${msg} `;
      foundUser.chat.push(msgPush);
    }

    console.log(
      "Abaikan pesan dari nomor sendiri atau ada property atau dari group"
    );
    console.log(listMessage);
    return res.sendStatus(200);
  }

  const isPetugas = petugas.find((p) => p.phone === phone);
  if (isPetugas) {
    if (msg.includes("<~")) {
    }
    const generateMsg = parseListString(msg);
    if (generateMsg.menu === "menu petugas") {
      console.log("gmsg", generateMsg);
      const [phoneTamu, namaTamu, namaPetugas] =
        generateMsg.description.split(";");

      if (generateMsg.title === "ok, saya akan respon") {
        const user = listMessage.find((user) => user.noTelp === phoneTamu);
        if (user.layanan == "1") {
          await kirimPesan(
            phoneTamu,
            `Halo ${namaTamu}, saya ${namaPetugas}😄, mohon berkenan untuk menunggu sembari saya mengecek data yang anda butuhkan.`
          );
        } else if (user.layanan == "4") {
          await kirimPesan(
            phoneTamu,
            `Halo ${namaTamu}, saya ${namaPetugas}😄, ada yang bisa kami bantu?.`
          );
        } else if (user.layanan == "6") {
          await kirimPesan(
            phoneTamu,
            `Halo ${namaTamu}, saya ${namaPetugas}😄, ada yang bisa kami bantu?.`
          );
        }
      } else if (generateMsg.title === "akhiri, sesi telah berakhir") {
        const userEnd = listMessage.find((user) => user.noTelp === phoneTamu);
        // userEnd.isCS = false;
        console.log(userEnd.dbId, userEnd.chat);
        databasePushChat(userEnd.dbId, JSON.stringify(userEnd.chat));
        await kirimPesan(
          phoneTamu,
          `Baik ${namaTamu}, Terimakasih sudah menghubungi Whatstat, saya ${namaPetugas} sebagai petugas PST izin mengakhiri sesi ini, terimakasih.🙏🏻`
        );
        akhiriChat(phoneTamu);
      }
      return;
    }
  }

  if (message) {
    if (foundUser) {
      if (foundUser.layanan) {
        if (foundUser.layanan == "1") {
          if (foundUser.namaLengkap) {
            if (foundUser.email) {
              if (foundUser.instansi) {
                if (isJamLayanan()) {
                  foundUser.dataYangDibutuhkan = msg;
                  notifPetugas(
                    foundUser.namaLengkap,
                    foundUser.instansi,
                    "Konsultasi",
                    foundUser.dataYangDibutuhkan,
                    phone
                  );
                  await kirimPesan(
                    phone,
                    "Terimakasih, anda akan segera dihubungkan ke petugas kami"
                  );
                  foundUser.isCS = true;

                  const time = new Date();

                  const dbId = await databaseAddDataLayanan(
                    foundUser.layanan,
                    foundUser.dataYangDibutuhkan,
                    phone,
                    time
                  );
                  foundUser.dbId = dbId;

                  return;
                } else {
                  // if (!foundUser.isAI) {
                  //   foundUser.dataYangDibutuhkan = msg;
                  //   // foundUser.isAI = true;
                  //   // await kirimPesan(phone, `Baik, terimakasih ${foundUser.namaLengkap}, mohon berkenan menunggu untuk saya carikan datanya ya😁.`);
                  //   await kirimPesan(
                  //     phone,
                  //     `Disclaimer ya ${foundUser.namaLengkap}, karena ${foundUser.namaLengkap} menghubungi diluar jam layanan, maka untuk pelayanan akan dibantu oleh AI, mohon tunggu sebentar sembari saya carikan datanya, terimakasih😁.`
                  //   );
                  const balasan = `Maaf, silahkan hubungi kami pada jam layanan, yaitu Senin - Jumat pukul 08.00 - 15.30 WITA. Terimakasih🙏🏻`;
                  await kirimPesan(phone, balasan);
                  // }
                }
              } else {
                // bisa validasi terkait instansi yang dikirim user
                foundUser.instansi = msg;
                //
                await kirimPesan(
                  phone,
                  "Silahkan masukkan data yang anda butuhkan atau sampaikan keluhan anda terkait data statistik."
                );
              }
            } else {
              if (isValidEmail(msg)) {
                foundUser.email = msg;
                await kirimPesan(
                  phone,
                  "Silahkan masukkan data yang anda butuhkan atau sampaikan keluhan anda terkait data statistik."
                );
              } else {
                await kirimPesan(
                  phone,
                  "Mohon maaf, email yang anda masukkan tidak valid, silahkan masukkan email dengan format yang benar. "
                );
              }
            }
          } else {
            const lines = msg.split("\n");
            console.log(lines);

            let nama, email, instansi;

            lines.forEach((line) => {
              const [key, value] = line.split(/\s*:\s*/).map((s) => s.trim());

              console.log(key, value);

              if (key === "nama") nama = value;
              else if (key === "email") email = value;
              else if (key === "instansi") instansi = value;
            });

            console.log(nama, email, instansi);

            foundUser.namaLengkap = nama;
            foundUser.instansi = instansi;
            if (isValidEmail(email)) {
              foundUser.email = email;
              databaseAddUser(
                pushName,
                phone,
                foundUser.namaLengkap,
                foundUser.email,
                foundUser.instansi
              );
              await kirimPesan(
                phone,
                "Silahkan masukkan data yang anda butuhkan atau sampaikan keluhan anda terkait data statistik."
              );
            } else {
              await kirimPesan(
                phone,
                "Mohon maaf, email yang anda masukkan tidak valid, silahkan masukkan email dengan format yang benar. "
              );
            }
            // foundUser.email = email;
          }
        } else if (foundUser.layanan == "2") {
          if (foundUser.namaLengkap) {
            if (foundUser.email) {
              if (foundUser.instansi) {
                foundUser.pengaduan = msg;
                const dbId = await databaseAddDataLayanan(
                  foundUser.layanan,
                  foundUser.pengaduan,
                  phone,
                  time
                );
                foundUser.dbId = dbId;
                console.log("database add user ini");
                await kirimPesan(
                  phone,
                  "Terimakasih Sudah menghubungi *WhatStat*, Pengaduan anda akan kami proses paling lambat 1x24 Jam"
                );
                akhiriChat(phone);
              } else {
                foundUser.instansi = msg;

                await kirimPesan(
                  phone,
                  `Kami mohon maaf atas ketidaknyamanannya Bapak/Ibu ${foundUser.namaLengkap}🙏🏻. Silahkan sampaikan pengaduan anda.`
                );
              }
            } else {
              if (isValidEmail(msg)) {
                foundUser.email = msg;
                if (foundUser.instansi) {
                  await kirimPesan(
                    phone,
                    "Terimakasih Sudah menghubungi *WhatStat*, Pengaduan anda akan kami proses paling lambat 1x24 Jam"
                  );
                  akhiriChat(phone);
                } else {
                  await kirimPesan(
                    phone,
                    "Silahkan Masukan Nama Instansi Anda."
                  );
                }
                await kirimPesan(phone, "Silahkan Masukan Nama Instansi Anda.");
              } else {
                await kirimPesan(
                  phone,
                  "Mohon maaf, email yang anda masukkan tidak valid, silahkan masukkan email dengan format yang benar."
                );
              }
            }
          } else {
            const lines = msg.split("\n");
            let nama, email, instansi;

            lines.forEach((line) => {
              const [key, value] = line.split(/\s*:\s*/).map((s) => s.trim());

              if (key === "nama") nama = value;
              else if (key === "email") email = value;
              else if (key === "instansi") instansi = value;
            });

            foundUser.namaLengkap = nama;
            if (isValidEmail(email)) {
              foundUser.email = email;
              await kirimPesan(
                phone,
                `Kami mohon maaf atas ketidaknyamanannya Bapak/Ibu *${foundUser.namaLengkap}*🙏🏻. Silahkan sampaikan pengaduan anda.`
              );
            } else {
              await kirimPesan(
                phone,
                "Mohon maaf, email yang anda masukkan tidak valid, silahkan masukkan email dengan format yang benar."
              );
            }
            // foundUser.email = email;
            foundUser.instansi = instansi;
          }
        } else if (foundUser.layanan == "3") {
          await kirimPesan(
            phone,
            `Halo ${pushName}, Berikut kami sampaikan terkait Layanan Statistik BPS Kabupaten Majene.\n` +
              `Secara umum, BPS Kabupaten Majene memiliki 3 Layanan yang diberikan kepada masyarakat.\n` +
              `1. Layanan Konsultasi Statistik\n` +
              `Merupakan layanan konsultasi/permintaan data Statistik bagi Instansi Daerah atau Masyarakat Sipil. Layanan Konsultasi Statistik maksimal kami layani 1x24 Jam dari pengajuan layanan. Pengajuan layanan dapat dilakukan melalui *WhatStat* pada menu 1.\n\n` +
              `2. Layanan Perpustakaan Statistik\n` +
              `Merupakan layanan yang membantu pengguna data dalam mengakses Perpustakaan Statistik tercetak maupun digital yang berisi Publikasi data Statistik yang dirilis oleh BPS. Layanan Perpustakaan Statistik maksimal kami layani 1x24 Jam dari pengajuan. Pengajuan layanan dapat dilakukan melalui *WhatStat* pada menu 1.\n\n` +
              `3. Layanan Rekomendasi Statistik\n` +
              `Merupakan layanan Rekomendasi untuk kegiatan statistik yang dilaksanakan oleh OPD terkait agar data yang dihasilkan merupakan data yang berkualitas. Layanan Rekomendasi Statistik maksimal kami layani 20 Hari kerja setelah pengajuan rekomendasi kami terima. Layanan ini akan segera diadakan di *WhatStat*.\n\n\n` +
              `Jika anda sudah menentukan layanan mana yang mau anda gunakan, silahkan ketik "Menu".`
          );
          deleteDataUser(phone);
        } else if (foundUser.layanan == "4") {
          if (foundUser.namaLengkap) {
            if (foundUser.email) {
              console.log(
                "4:",
                phone,
                foundUser.namaLengkap,
                foundUser.instansi,
                foundUser.noTelp
              );

              const time = new Date();
              const dbId = await databaseAddDataLayanan(
                foundUser.layanan,
                "-",
                phone,
                time
              );
              foundUser.dbId = dbId;

              notifPetugas(
                foundUser.namaLengkap,
                foundUser.instansi,
                "Lainnya",
                "-",
                phone
              );
              await kirimPesan(
                phone,
                "Terimakasih, anda akan segera dihubungkan ke Petugas kami, mohon tunggu sebentar."
              );
              foundUser.isCS = true;
            } else {
              if (isValidEmail(msg)) {
                foundUser.email = msg;
                if (foundUser.instansi) {
                  console.log(
                    "4:",
                    phone,
                    foundUser.namaLengkap,
                    foundUser.instansi,
                    foundUser.noTelp
                  );
                  notifPetugas(
                    foundUser.namaLengkap,
                    foundUser.instansi,
                    "Lainnya",
                    "-",
                    phone
                  );
                  await kirimPesan(
                    phone,
                    "Terimakasih, anda akan segera dihubungkan ke Petugas kami, mohon tunggu sebentar."
                  );
                  foundUser.isCS = true;
                } else {
                  await kirimPesan(
                    phone,
                    "Silahkan Masukan Nama Instansi Anda."
                  );
                }
              } else {
                await kirimPesan(
                  phone,
                  "Mohon maaf, email yang anda masukkan tidak valid, silahkan masukkan email dengan format yang benar."
                );
              }
            }
          } else {
            // bisa validasi nama lengkap

            const lines = msg.split("\n");
            let nama, email, instansi;

            lines.forEach((line) => {
              const [key, value] = line.split(/\s*:\s*/).map((s) => s.trim());

              if (key === "nama") nama = value;
              else if (key === "email") email = value;
              else if (key === "instansi") instansi = value;
            });

            foundUser.namaLengkap = nama;
            foundUser.instansi = instansi;
            if (isValidEmail(email)) {
              foundUser.email = email;
              notifPetugas(
                foundUser.namaLengkap,
                foundUser.instansi,
                "Lainnya",
                "-",
                phone
              );
              await kirimPesan(
                phone,
                "Terimakasih, anda akan segera dihubungkan ke Petugas kami, mohon tunggu sebentar."
              );
              foundUser.isCS = true;
            } else {
              await kirimPesan(
                phone,
                "Mohon maaf, email yang anda masukkan tidak valid, silahkan masukkan email dengan format yang benar."
              );
            }
            // foundUser.email = email;
          }
        } else if (foundUser.layanan == "5") {
          if (foundUser.namaLengkap) {
            if (foundUser.email) {
              if (foundUser.instansi) {
                foundUser.pengaduan = msg;
                const time = new Date();
                const dbId = await databaseAddDataLayanan(
                  foundUser.layanan,
                  foundUser.pengaduan,
                  phone,
                  time
                );
                foundUser.dbId = dbId;
                console.log("database add user ini");
                await kirimPesan(
                  phone,
                  "Terimakasih Sudah menghubungi *WhatStat*, Pengaduan anda akan kami proses paling lambat 1x24 Jam"
                );
                akhiriChat(phone);
              } else {
                foundUser.instansi = msg;
                await kirimPesan(
                  phone,
                  `Kami mohon maaf atas ketidaknyamanannya Bapak/Ibu ${foundUser.namaLengkap}🙏🏻. Silahkan sampaikan pengaduan anda.`
                );
              }
            } else {
              if (isValidEmail(msg)) {
                foundUser.email = msg;
                if (foundUser.instansi) {
                  await kirimPesan(
                    phone,
                    "Terimakasih Sudah menghubungi *WhatStat*, Pengaduan anda akan kami proses paling lambat 1x24 Jam"
                  );
                  akhiriChat(phone);
                } else {
                  await kirimPesan(
                    phone,
                    "Silahkan Masukan Nama Instansi Anda."
                  );
                }
                await kirimPesan(phone, "Silahkan Masukan Nama Instansi Anda.");
              } else {
                await kirimPesan(
                  phone,
                  "Mohon maaf, email yang anda masukkan tidak valid, silahkan masukkan email dengan format yang benar."
                );
              }
            }
          } else {
            const lines = msg.split("\n");
            let nama, email, instansi;

            lines.forEach((line) => {
              const [key, value] = line.split(/\s*:\s*/).map((s) => s.trim());

              if (key === "nama") nama = value;
              else if (key === "email") email = value;
              else if (key === "instansi") instansi = value;
            });

            foundUser.namaLengkap = nama;
            if (isValidEmail(email)) {
              foundUser.email = email;
              databaseAddUser(
                pushName,
                phone,
                foundUser.namaLengkap,
                foundUser.email,
                foundUser.instansi
              );
              await kirimPesan(
                phone,
                `Kami mohon maaf atas ketidaknyamanannya Bapak/Ibu *${foundUser.namaLengkap}*🙏🏻. Silahkan sampaikan pengaduan anda.`
              );
            } else {
              await kirimPesan(
                phone,
                "Mohon maaf, email yang anda masukkan tidak valid, silahkan masukkan email dengan format yang benar."
              );
            }
            // foundUser.email = email;
            foundUser.instansi = instansi;
          }
        } else if (foundUser.layanan == "6") {
          // Menu Rekrutmen
          if (foundUser.infoRekrutmenDiberikan) {
            if (msg.includes("<~")) {
              const generateMsg = parseListString(msg);
              // console.log("gmsg", generateMsg);
              if (generateMsg.menu === "hubungkan ke petugas") {
                if (generateMsg.title === "ya") {
                  // Hubungkan ke petugas
                  await kirimPesan(
                    phone,
                    "Anda akan segera dihubungkan ke petugas."
                  );

                  notifPetugas(
                    pushName,
                    foundUser.instansi,
                    "Rekrutmen Mitra Statistik BPS 2026",
                    "Mau bicara lebih lanjut tentang rekrutmen mitra statistik BPS 2026",
                    phone,
                    true
                  );

                  foundUser.isCS = true;

                  const time = new Date();

                  const dbId = await databaseAddDataLayanan(
                    foundUser.layanan,
                    foundUser.dataYangDibutuhkan,
                    phone,
                    time
                  );
                  foundUser.dbId = dbId;
                } else {
                  deleteDataUser(phone);
                }
              }
            } else {
              await kirimListMessageYaTidak(phone, pushName);
            }
          } else {
            await kirimPesan(phone, pesanRekrutmen);
            setTimeout(async () => {
              await kirimPesan(phone, pesanRekrutmen2);
            }, 1000);
            foundUser.infoRekrutmenDiberikan = true;
          }
        }
      } else {
        // Jika user belum memilih layanan, maka akan di parsing
        console.log("Parsing pesan masuk");
        if (msg.includes("<~")) {
          const generateMsg = parseListString(msg);
          console.log("gmsg", generateMsg);

          if (generateMsg.menu === "menu layanan") {
            if (generateMsg.title === "konsultasi statistik") {
              foundUser.layanan = 1;
              await kirimPesan(
                phone,
                `
    Mohon bantuan anda untuk mengisi form data diri.             
                    `
              );
              await kirimPesan(
                phone,
                `
  Nama : \nEmail : \nInstansi : \n
                  `
              );
            } else if (generateMsg.title === "pengaduan terkait layanan") {
              foundUser.layanan = 2;
              await kirimPesan(
                phone,
                `
        Mohon bantuan anda untuk mengisi form data diri.             
                        `
              );
              await kirimPesan(
                phone,
                `
      Nama : \nEmail : \nInstansi : \n
                      `
              );
            } else if (generateMsg.title === "pengaduan lainnya") {
              foundUser.layanan = 5;
              await kirimPesan(
                phone,
                `
        Mohon bantuan anda untuk mengisi form data diri.             
                        `
              );
              await kirimPesan(
                phone,
                `
      Nama : \nEmail : \nInstansi : \n
                      `
              );
            } else if (generateMsg.title === "panduan") {
              foundUser.layanan = 3;
              await kirimPesan(
                phone,
                `Halo *${pushName}*, Berikut kami sampaikan terkait Layanan Statistik BPS Kabupaten Majene.\n` +
                  `Secara umum, BPS Kabupaten Majene memiliki 3 Layanan yang diberikan kepada masyarakat.\n` +
                  `1. Layanan Konsultasi Statistik\n` +
                  `Merupakan layanan konsultasi/permintaan data Statistik bagi Instansi Daerah atau Masyarakat Sipil. Layanan Konsultasi Statistik maksimal kami layani 1x24 Jam dari pengajuan layanan. Pengajuan layanan dapat dilakukan melalui *WhatStat* pada menu 1.\n\n` +
                  `2. Layanan Perpustakaan Statistik\n` +
                  `Merupakan layanan yang membantu pengguna data dalam mengakses Perpustakaan Statistik tercetak maupun digital yang berisi Publikasi data Statistik yang dirilis oleh BPS. Layanan Perpustakaan Statistik maksimal kami layani 1x24 Jam dari pengajuan. Pengajuan layanan dapat dilakukan melalui *WhatStat* pada menu 1.\n\n` +
                  `3. Layanan Rekomendasi Statistik\n` +
                  `Merupakan layanan Rekomendasi untuk kegiatan statistik yang dilaksanakan oleh OPD terkait agar data yang dihasilkan merupakan data yang berkualitas. Layanan Rekomendasi Statistik maksimal kami layani 20 Hari kerja setelah pengajuan rekomendasi kami terima. Layanan ini akan segera diadakan di *WhatStat*.\n\n\n` +
                  `Jika anda sudah menentukan layanan mana yang mau anda gunakan, silahkan ketik "Menu".`
              );
              deleteDataUser(phone);
            } else if (generateMsg.title === "lainnya") {
              foundUser.layanan = 4;
              await kirimPesan(
                phone,
                `
    Mohon bantuan anda untuk mengisi form data diri.             
                    `
              );
              await kirimPesan(
                phone,
                `
  Nama : \nEmail : \nInstansi : \n
                  `
              );
            } else if (generateMsg.title === "rekrutmen mitra bps") {
              foundUser.layanan = 6;

              await kirimPesan(phone, pesanRekrutmen);
              setTimeout(async () => {
                await kirimPesan(phone, pesanRekrutmen2);
              }, 1000);
              foundUser.infoRekrutmenDiberikan = true;
            }
          }
        }
      }
    } else {
      await kirimListMessageMenu(phone, pushName);
      databaseAddUser(pushName, phone);

      listMessage.push({
        nama: pushName,
        noTelp: phone,
        chatId: chatId + 1,
      });

      chatId = chatId + 1;
    }
  }

  console.log(JSON.stringify(listMessage, null, 2));

  res.sendStatus(200); // wajib respon ke webhook
});

app.get("/", async (req, res) => {
  console.log("diakses nih");

  res.send("Hallo");
});

app.get("/siakip", async (req, res) => {
  // const hasil = await databaseGetRekapEvalSiakip("2025-07");
  try {
    const hasil = await databaseGetRekapEvalSiakip("2025-07");
    // res.status(200).send(hasil);
    res.send(hasil);
  } catch (err) {
    console.error(err);
    res.send(err);
  }
});

app.get("/announcePagi1", async (req, res) => {
  // const hasil = await databaseGetRekapEvalSiakip("2025-07");
  announcePagi(1);
});

app.get("/announcePagi2", async (req, res) => {
  // const hasil = await databaseGetRekapEvalSiakip("2025-07");
  announcePagi(2);
});

app.get("/alertSore", async (req, res) => {
  // const hasil = await databaseGetRekapEvalSiakip("2025-07");
  alertSore();
});
app.get("/announceSore", async (req, res) => {
  // const hasil = await databaseGetRekapEvalSiakip("2025-07");
  announceSore();
});

app.post("/test-api", async (req, res) => {
  await kirimPesan(6282246657077, `Message From Server`);
  announcePagi(1, false);
  announceSore(false);
});

function isValidMonth(month) {
  const regex = /^(0[1-9]|1[0-2])$/;
  return regex.test(month);
}

function isValidYear(year) {
  // regex: hanya angka 4 digit, contoh 2025
  return /^\d{4}$/.test(year);
}

app.post("/api/v1/rekap-eval-siakip", checkAuth, async (req, res) => {
  try {
    const { tahun, bulan } = req.body;
    if (!tahun || !bulan) {
      return res.status(400).json({ error: "Tahun dan bulan missing" });
    }
    if (!isValidMonth(bulan)) {
      return res.status(400).json({ error: "Bulan tidak valid" });
    }
    if (!isValidYear(tahun)) {
      return res.status(400).json({ error: "Tahun tidak valid" });
    }
    const q = `${tahun}-${bulan}`;
    const hasil = await databaseGetRekapEvalSiakip(q);
    res.status(200).send({
      status: "success",
      data: hasil,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Terjadi kesalahan" });
  }
});

app.post("/api/v1/data-whatstat", checkAuth, async (req, res) => {
  try {
    const { tahun, bulan } = req.body;
    console.log(req.body);

    if (!tahun || !bulan) {
      return res.status(400).json({ error: "Tahun dan bulan missing" });
    }

    if (!isValidMonth(bulan)) {
      return res.status(400).json({ error: "Bulan tidak valid" });
    }
    if (!isValidYear(tahun)) {
      return res.status(400).json({ error: "Tahun tidak valid" });
    }

    const q = `${tahun}-${bulan}`;
    const hasil = await databaseGetDataWhatStat(q);
    if (hasil.length === 0) {
      return res.status(404).json({ error: "Data tidak ditemukan" });
    }
    return res.status(200).send({
      status: "success",
      data: hasil,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Terjadi kesalahan" });
  }
});

app.post("/status_msg", async (req, res) => {
  sendPrompt("PDRB", "Berapa jumlah laki laki di majene tahun 2023");
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
