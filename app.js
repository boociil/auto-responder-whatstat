
// SETUP LIBRARY
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());


const OpenAI = require("openai");


/////////////////////// END OF SETUP LIBRARY

// Ganti dengan API token dan URL Wablas-mu
const WABLAS_TOKEN = 'A0jiIVpmnhoNp0mHaxUCt3YIE0tXgbJ59zzPEsZP5ZWex1dVA5bwAEu';
const WABLAS_URL = 'https://texas.wablas.com/api/v2/send-message'; // endpoint v2 untuk support listMessage
const WABLAS_LIST_URL = 'https://texas.wablas.com/api/v2/send-list'; // endpoint v2 untuk support listMessage

// Message
const messageEnd = `*Terimakasih*😁🙏🏻  sudah menggunakan layanan WhatStat, Jika ada pertanyaan atau butuh bantuan terkait data statistik Kabupaten Majene, jangan ragu hubungi kami. 😊 Kunjungi website BPS Majene di https://majenekab.bps.go.id/ untuk info terbaru!  Ohiya, untuk meningkatkan layanan kami, mohon bantuan untuk mengisi Survei kebutuhan data ya😌🙏🏻 \n\nBisa diakses pada link berikut : \n https://s.bps.go.id/SKD7601 \n atau \n https://skd.bps.go.id/SKD2025/web/entri/responden/blok1?token=jgcSf9YvKHZ5YZbKeqL89W4_5SR-W7VGv4VDs0OfkyXANF7J1rncivl3_e7VaY1CNfITAezXfFkcJP9gGQfNH5yd_IzjIHncKOWl \n`

// Const untuk menyimpan data user yang masuk
const listMessage = []

// Const kata kata sapaan
const openingWord = ["halo","hallo", "hai", "woi", "tabe", "menu","oi","p", "pp","pppppp","oiiiii","oyyyy","permisi","saya mau tanya","mau tanya","tanya","nanya"]

const openai = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',

    apiKey : "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"
});
const gemma = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',

    apiKey : "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"
});

let chatId = 0;

// 4. Akhiri dengan bilang terimakasih, tapi harus ada "Terimakasih Sudah ..."
async function sendPromptGemma(reqData,idUser) {
  const completion = await gemma.chat.completions.create({
    messages: [
      { role: "system", content: `
      Anda Admin WhatsApp BPS Kabupaten Majene. 
      1. Bersikap santun dan profesional (3S)
      2. Untuk permintaan data:
         - Cek di https://majenekab.bps.go.id/id
         - Jika ada: Berikan link sumber + penjelasan singkat
         - Jika data tidak tersedia, maka arahkan untuk menunggu hingga jam layanan agar bisa dihubungkan ke petugas pada pukul 7.30-15.30 WITA
      3. Hanya jawab pertanyaan terkait statistik
      `},
      { role: "user", content: `id user : ${idUser}; respond user: ${reqData}` }
    ],
    model: "google/gemma-3n-e4b-it:free",
  });

  console.log(completion.choices[0].message.content);
  return completion.choices[0].message.content
}
async function sendPrompt(reqData,idUser) {
  const completion = await openai.chat.completions.create({
    messages: [
      { role: "system", content: `
      Anda Admin WhatsApp BPS Kabupaten Majene. 
      1. Bersikap santun dan profesional (3S)
      2. Untuk permintaan data:
         - Cek di https://majenekab.bps.go.id/id
         - Jika ada: Berikan link sumber + penjelasan singkat
         - Jika data tidak tersedia, maka arahkan untuk menunggu hingga jam layanan agar bisa dihubungkan ke petugas pada pukul 7.30-15.30 WITA
      3. Hanya jawab pertanyaan terkait statistik
      `},
      { role: "user", content: `id user : ${idUser}; respond user: ${reqData}` }
    ],
    model: "deepseek/deepseek-r1-0528:free",
  });

  console.log(completion.choices[0].message.content);
  return completion.choices[0].message.content
}

function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}


const deleteDataUser = (phoneNumber) => {
  // Cari index user yang ingin dihapus
  const index = listMessage.findIndex(user => user.noTelp === phoneNumber);

  // Jika ditemukan, hapus
  if (index !== -1) {
    listMessage.splice(index, 1); // hapus 1 elemen di posisi index
  }

  console.log(`User ${phoneNumber} telah dihapus`); 
  console.log(listMessage);
}

// Kirim pesan LIST MESSAGE
const kirimListMessage = async (phone) => {
  try {
    await axios.post(WABLAS_LIST_URL, {
        data: [
            {
              phone: phone,
              messageType: "list",
              message: {
                title: "Menu Layanan",
                description: "Silakan pilih layanan yang Anda butuhkan 😊",
                buttonText: "Lihat Menu",
                lists: [
                  { title: "Keluhan Gangguan", description: "Gangguan teknis atau jaringan" },
                  { title: "Kebutuhan Informasi", description: "Informasi umum layanan" },
                  { title: "Permintaan", description: "Ajukan permintaan layanan" }
                ],
                footer: "TEREDA - BPS Majene"
              }
            }
          ]
      
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': WABLAS_TOKEN
      }
    });
  } catch (error) {
    console.error('Gagal kirim list message:', error.response?.data || error.message);
  }
};



// Kirim pesan biasa
const kirimPesan = async (phone, message) => {
    try {
      isProcessing = true;
      await axios.post(WABLAS_URL, {
        data: [
          {
            phone: phone,
            message: message,
            secret: false,
            priority: true
          }
        ]
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': WABLAS_TOKEN
        }
      });
    } catch (error) {
      console.error('Gagal kirim pesan:', error.response?.data || error.message);
    } finally {
      isProcessing = false; // Set isProcessing ke false setelah selesai
    }
  };
  
const akhiriChat = async (phone) => {
  await kirimPesan(phone, messageEnd);
  deleteDataUser(phone);
}

function isJamLayanan() {
  const now = new Date();
  const totalMenit = now.getHours() * 60 + now.getMinutes();

  const batasAwal = 8 * 60;     // 08:00 → 480 menit
  const batasAkhir = 15 * 60 + 30; // 15:30 → 930 menit

  return totalMenit >= batasAwal && totalMenit <= batasAkhir;
}

const notifPetugas = async (nama, instansi, layanan, detail) => {
  const petugas = [
    {nama : "Ryan", phone : "6282246657077"},
    {nama : "Harris", phone : "6281241157987"},
    {nama : "Maya", phone : "6285804357544"},
  ]

  const tanggalSekarang = new Date();
  const bulanSekarang = tanggalSekarang.getMonth() + 1; // hasilnya 0 - 11

  await kirimPesan(petugas[bulanSekarang % 3].phone, `Halo ${petugas[bulanSekarang % 3].nama}, ada tamu ${layanan} nih, namanya ${nama} dari ${instansi}, detailnya : ${detail}`);

}

const queue = [];
let isProcessingQueue = false;

// Middleware untuk menangani antrian pesan
const processingQueue = () => {
  if (isProcessingQueue || queue.length === 0) return;
  isProcessingQueue = true;

  const item = queue.shift()

  try {
    console.log(item);
  } catch (error) {
    
  }finally {
    isProcessingQueue = false;
    while (queue.length > 0) {
      processingQueue();
    }
  }
}



// Webhook Wablas *Manual

// Webhook Wablas *DeepSeek
app.post('/webhook', async (req, res) => {
  const { phone, message, isFromMe, pushName } = req.body;
  const msg = message.toLowerCase();

  // Queue
  // queue.push({phone, message, isFromMe, pushName});
  // processingQueue();
  // //////// /// / // / // / / // / / /

  console.log('Incoming message:', req.body);
  const foundUser = listMessage.find(user => user.noTelp === phone);

  if (isFromMe || (foundUser && foundUser.hasOwnProperty("isCS")) ) {
    if (msg.includes("terimakasih sudah")){
      akhiriChat(phone)
    }
    
    console.log("Abaikan pesan dari nomor sendiri atau ada property");
    console.log(listMessage);
    return res.sendStatus(200);
  }

  // console.log(isProcessing);

  // if (isProcessing){
  //   console.log("abaikan pesan karna masih dalam tahap proses");
  //   return;
  // }
  

  if (message) {
    if (openingWord.includes(msg)) {

        listMessage.push(
          {
            nama : pushName,
            noTelp : phone,
            chatId : chatId + 1,
          }
        )

        chatId = chatId + 1;

      await kirimPesan(phone,
        `Halo *${pushName}*, Selamat datang di *WhatStat BPS Kabupaten Majene*👋😊, kami akan membantu anda seputar *Layanan Statistik* di Majene, silahkan pilih layanan kami di bawah ini.\n\n` +
        `1. Konsultasi Statistik/Permintaan Data\n` +
        `2. Pengaduan terkait Layanan\n` +
        `3. Panduan\n` +
        `4. Lainnya\n`
        );
        

    }else if (msg === 'assalamualaikum' || msg === "asalamual'alaikum"){
      await kirimPesan(phone,
        `Waalaikumsalam *${pushName}*, Selamat datang di *WhatStat BPS Kabupaten Majene*👋😊, kami akan membantu anda seputar *Layanan Statistik* di Majene, silahkan pilih layanan kami di bawah ini.\n\n` +
        `1. Konsultasi Statistik/Permintaan Data\n` +
        `2. Pengaduan terkait Layanan\n` +
        `3. Panduan\n` +
        `4. Lainnya\n`
        );
    } else {
      // Chek apakah user ada dalam listMessage
      // Jika tidak, maka kata tidak dikenal
      if(foundUser){
        if (foundUser.layanan){
          if (foundUser.layanan == '1'){
            if (foundUser.namaLengkap){
              if (foundUser.email){
                if(foundUser.instansi){
                  
                  if (isJamLayanan()){
                    foundUser.dataYangDibutuhkan = msg;
                    notifPetugas(foundUser.namaLengkap, foundUser.instansi, "Konsultasi",foundUser.dataYangDibutuhkan);
                    await kirimPesan(phone, 'Terimakasih, anda akan segera dihubungkan ke Petugas kami, mohon tunggu sebentar.');
                    foundUser.isCS = true;
                    return;

                  }else{
                    if (!foundUser.isAI){
                      foundUser.dataYangDibutuhkan = msg;
                      // foundUser.isAI = true;
                      await kirimPesan(phone, `Baik, terimakasih ${foundUser.namaLengkap}, mohon berkenan menunggu untuk saya carikan datanya ya😁.`);
                      await kirimPesan(phone, `Disclaimer ya ${foundUser.namaLengkap}, karena ${foundUser.namaLengkap} menghubungi diluar jam layanan, maka untuk pelayanan akan dipandu oleh AI, silahkan sampaikan data apa yang dibutuhkan, terimakasih😁.`);
                      const balasan = await sendPrompt(msg,foundUser.chatId)
                      await kirimPesan(phone, balasan);
                      }
                    }



                }else{
                  // bisa validasi terkait instansi yang dikirim user
                  foundUser.instansi = msg;
                  // 
                  await kirimPesan(phone, 'Silahkan masukkan data yang anda butuhkan atau sampaikan keluhan anda terkait data statistik.');
                }
              }else{

                if (isValidEmail(msg)){
                  foundUser.email = msg;
                  await kirimPesan(phone, 'Silahkan masukkan data yang anda butuhkan atau sampaikan keluhan anda terkait data statistik.');
                }else{
                  await kirimPesan(phone, 'Mohon maaf, email yang anda masukkan tidak valid, silahkan masukkan email dengan format yang benar. ');
                }

              }
            }else{
              // bisa validasi nama lengkap
              // foundUser.namaLengkap = msg;
              //  
              // bisa validasi nama lengkap
              const lines = msg.split("\n");
              let nama, email, instansi;

              lines.forEach(line => {
                const [key, value] = line.split(" : ").map(s => s.trim());

                if (key === "nama") nama = value;
                else if (key === "email") email = value;
                else if (key === "instansi") instansi = value;
              });


              
              foundUser.namaLengkap = nama;
              if (isValidEmail(email)){
                foundUser.email = email;
                await kirimPesan(phone, 'Silahkan masukkan data yang anda butuhkan atau sampaikan keluhan anda terkait data statistik.');
              }else{
                await kirimPesan(phone, 'Mohon maaf, email yang anda masukkan tidak valid, silahkan masukkan email dengan format yang benar. ');
              }
              // foundUser.email = email;
              foundUser.instansi = instansi;

            }
          }else if (foundUser.layanan == '2'){
            if (foundUser.namaLengkap){
              if (foundUser.email){
                if(foundUser.instansi){
                  foundUser.pengaduan = msg;
                  await kirimPesan(phone, 'Terimakasih Sudah menghubungi *WhatStat*, Pengaduan anda akan kami proses paling lambat 1x24 Jam');
                  akhiriChat(phone);
                  
                }else{
                  foundUser.instansi = msg;
                  await kirimPesan(phone, `Kami mohon maaf atas ketidaknyamanannya Bapak/Ibu ${foundUser.namaLengkap}🙏🏻. Silahkan sampaikan pengaduan anda.`);
                }
              }else{
                if (isValidEmail(msg)){
                  foundUser.email = msg;
                  if (foundUser.instansi){
                    await kirimPesan(phone, 'Terimakasih Sudah menghubungi *WhatStat*, Pengaduan anda akan kami proses paling lambat 1x24 Jam');
                    akhiriChat(phone);
                  }else{
                    await kirimPesan(phone, 'Silahkan Masukan Nama Instansi Anda.');
                  }
                  await kirimPesan(phone, 'Silahkan Masukan Nama Instansi Anda.');
                }else{
                  await kirimPesan(phone, 'Mohon maaf, email yang anda masukkan tidak valid, silahkan masukkan email dengan format yang benar.');
                }
              }

            }else{
              const lines = msg.split("\n");
              let nama, email, instansi;

              lines.forEach(line => {
                const [key, value] = line.split(" : ").map(s => s.trim());

                if (key === "nama") nama = value;
                else if (key === "email") email = value;
                else if (key === "instansi") instansi = value;
              });


              
              foundUser.namaLengkap = nama;
              if (isValidEmail(email)){
                foundUser.email = email;
                await kirimPesan(phone, `Kami mohon maaf atas ketidaknyamanannya Bapak/Ibu *${foundUser.namaLengkap}*🙏🏻. Silahkan sampaikan pengaduan anda.`);
              }else{
                await kirimPesan(phone, 'Mohon maaf, email yang anda masukkan tidak valid, silahkan masukkan email dengan format yang benar.');
              }
              // foundUser.email = email;
              foundUser.instansi = instansi;
            }
          }else if (foundUser.layanan == '3'){
            await kirimPesan(phone, 
              `Halo ${pushName}, Berikut kami sampaikan terkait Layanan Statistik BPS Kabupaten Majene.\n` + 
              `Secara umum, BPS Kabupaten Majene memiliki 3 Layanan yang diberikan kepada masyarakat.\n` + 
              `1. Layanan Konsultasi Statistik\n` + 
              `Merupakan layanan konsultasi/permintaan data Statistik bagi Instansi Daerah atau Masyarakat Sipil. Layanan Konsultasi Statistik maksimal kami layani 1x24 Jam dari pengajuan layanan. Pengajuan layanan dapat dilakukan melalui *WhatStat* pada menu 1.\n\n`+
              `2. Layanan Perpustakaan Statistik\n` +
              `Merupakan layanan yang membantu pengguna data dalam mengakses Perpustakaan Statistik tercetak maupun digital yang berisi Publikasi data Statistik yang dirilis oleh BPS. Layanan Perpustakaan Statistik maksimal kami layani 1x24 Jam dari pengajuan. Pengajuan layanan dapat dilakukan melalui *WhatStat* pada menu 1.\n\n` +
              `3. Layanan Rekomendasi Statistik\n` + 
              `Merupakan layanan Rekomendasi untuk kegiatan statistik yang dilaksanakan oleh OPD terkait agar data yang dihasilkan merupakan data yang berkualitas. Layanan Rekomendasi Statistik maksimal kami layani 20 Hari kerja setelah pengajuan rekomendasi kami terima. Layanan ini akan segera diadakan di *WhatStat*.\n\n\n` + 
              `Jika anda sudah menentukan layanan mana yang mau anda gunakan, silahkan ketik "Menu".`
            );
            deleteDataUser(phone);
          }else if (foundUser.layanan == '4'){
            if (foundUser.namaLengkap){
              if (foundUser.email){
                // bisa validasi terkait instansi yang dikirim user
                // 
                notifPetugas(foundUser.namaLengkap, foundUser.instansi,"Lainnya","-");
                await kirimPesan(phone, 'Terimakasih, anda akan segera dihubungkan ke Petugas kami, mohon tunggu sebentar.');
                foundUser.isCS = true;
              }else{
                if (isValidEmail(msg)){
                  foundUser.email = msg;
                  if (foundUser.instansi){
                    notifPetugas(foundUser.namaLengkap, foundUser.instansi,"Lainnya","-");
                    await kirimPesan(phone, 'Terimakasih, anda akan segera dihubungkan ke Petugas kami, mohon tunggu sebentar.');
                    foundUser.isCS = true;
                  }else{
                    await kirimPesan(phone, 'Silahkan Masukan Nama Instansi Anda.');
                  }
                }else{
                  await kirimPesan(phone, 'Mohon maaf, email yang anda masukkan tidak valid, silahkan masukkan email dengan format yang benar.');
                }
              }
            }else{
              // bisa validasi nama lengkap
              
              const lines = msg.split("\n");
              let nama, email, instansi;

              lines.forEach(line => {
                const [key, value] = line.split(" : ").map(s => s.trim());

                if (key === "nama") nama = value;
                else if (key === "email") email = value;
                else if (key === "instansi") instansi = value;
              });


              
              foundUser.namaLengkap = nama;
              if (isValidEmail(email)){
                foundUser.email = email;
                notifPetugas(foundUser.namaLengkap, foundUser.instansi,"Lainnya","-");
                await kirimPesan(phone, 'Terimakasih, anda akan segera dihubungkan ke Petugas kami, mohon tunggu sebentar.');
                foundUser.isCS = true;
              }else{
                await kirimPesan(phone, 'Mohon maaf, email yang anda masukkan tidak valid, silahkan masukkan email dengan format yang benar.');
              }
              // foundUser.email = email;
              foundUser.instansi = instansi;
            }
          }
        }else{
          if (msg === '1' || msg === '2' || msg === '3' || msg === '4'){
            foundUser.layanan = msg;
            if (foundUser.layanan == '3'){
              await kirimPesan(phone, 
                `Halo *${pushName}*, Berikut kami sampaikan terkait Layanan Statistik BPS Kabupaten Majene.\n` + 
                `Secara umum, BPS Kabupaten Majene memiliki 3 Layanan yang diberikan kepada masyarakat.\n` + 
                `1. Layanan Konsultasi Statistik\n` + 
                `Merupakan layanan konsultasi/permintaan data Statistik bagi Instansi Daerah atau Masyarakat Sipil. Layanan Konsultasi Statistik maksimal kami layani 1x24 Jam dari pengajuan layanan. Pengajuan layanan dapat dilakukan melalui *WhatStat* pada menu 1.\n\n`+
                `2. Layanan Perpustakaan Statistik\n` +
                `Merupakan layanan yang membantu pengguna data dalam mengakses Perpustakaan Statistik tercetak maupun digital yang berisi Publikasi data Statistik yang dirilis oleh BPS. Layanan Perpustakaan Statistik maksimal kami layani 1x24 Jam dari pengajuan. Pengajuan layanan dapat dilakukan melalui *WhatStat* pada menu 1.\n\n` +
                `3. Layanan Rekomendasi Statistik\n` + 
                `Merupakan layanan Rekomendasi untuk kegiatan statistik yang dilaksanakan oleh OPD terkait agar data yang dihasilkan merupakan data yang berkualitas. Layanan Rekomendasi Statistik maksimal kami layani 20 Hari kerja setelah pengajuan rekomendasi kami terima. Layanan ini akan segera diadakan di *WhatStat*.\n\n\n` + 
                `Jika anda sudah menentukan layanan mana yang mau anda gunakan, silahkan ketik "Menu".`
              );
              deleteDataUser(phone);
            }else{

              if (!foundUser.namaLengkap){

                if (foundUser.layanan == '1'){
                  await kirimPesan(phone, `
 Mohon bantuan anda untuk mengisi form data diri.             
                  `);
                }else{
                  await kirimPesan(phone, `
  *Silahkan lengkapi form*             
                  `);
                }
                await kirimPesan(phone, `
Nama : \nEmail : \nInstansi : \n
                `);

              }else{
                await kirimPesan(phone, 'Silahkan masukkan data yang anda butuhkan atau sampaikan keluhan anda terkait data statistik.');
              }
            }
          }else{
            await kirimPesan(phone, 'Mohon maaf, permintaan anda tidak valid, silahkan pilih layanan kami dengan nomor 1-4');
          }
        }
      }else{
        // await kirimPesan(phone, `Mohon maaf, kata yang anda masukan belum tercakup pada sistem automasi kami🙏🏻\nJika anda ingin menghubungi *WhatStat* silahkan menggunakan kata "Halo", "Hai", "Assalamualaikum" atau kata sapaan lainnya.`);
      }
    }
  }

  console.log(JSON.stringify(listMessage, null, 2));

  res.sendStatus(200); // wajib respon ke webhook
});

app.get('/', (req, res) => {
  res.send("Connected");
});

app.post('/evaluasi-siakip', async (req,res) => {

  
});

app.post('/status_msg', async (req, res) => {
  sendPrompt("PDRB","Berapa jumlah laki laki di majene tahun 2023");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
