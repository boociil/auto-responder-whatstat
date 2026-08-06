// require('dotenv').config();
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize } = format;

// Custom format biar tampilan log-nya enak dibaca
const myFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

const logger = createLogger({
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // Set format waktu di sini
    myFormat
  ),
  transports: [
    new transports.File({ filename: 'error.log', level: 'error' }),
    new transports.Console({
      format: combine(colorize(), myFormat) // Tambah warna khusus di console
    })
  ],
});

const axios = require('axios');
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: "postgresql://majenewe_ryan:Padang2025@10.0.11.164:5432/majenewe_app"
});

const WABLAS_TOKEN = "A0jiIVpmnhoNp0mHaxUCt3YIE0tXgbJ59zzPEsZP5ZWex1dVA5bwAEu"
const WABLAS_SECRET = "7UXqhtqp"
const WABLAS_URL = 'https://texas.wablas.com/api/v2/send-message'; // endpoint v2 untuk support listMessage
const WABLAS_LIST_URL = 'https://texas.wablas.com/api/v2/send-list'; // endpoint v2 untuk support listMessage
// const WABLAS_GROUP_URL = 'https://texas.wablas.com/api/v2/group/text'; // endpoint v2 untuk support groupMessage
const WABLAS_GROUP_URL = 'https://texas.wablas.com/api/v2/send-message'; // endpoint v2 untuk support groupMessage
// const axios = require('axios')
const group_bocah_id = "6282344852209-1476837342"

// FUNGSI MENGECEK APAKAH HARI INI DIBLOCK
const checkTodayBlocked = async () => {
  const url = "https://whatstat.web.bps.go.id/api/v1/today-block";
  try {
    const response = await axios.post(url, {
      "tanggal": String(new Date().getDate()).padStart(2, '0'),
      "bulan": String(new Date().getMonth() + 1).padStart(2, '0'),
      "tahun": new Date().getFullYear()
    }, {
      headers: {
        "Content-Type": "application/json",
        "x-password": "katasore2025",
      }
    });
    console.log("Response:", response.data.data);
    return response.data.data;
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
    return undefined;
  }
};

// FUNGSI UNTUK SIMPAN K DB
const databaseAddEvalSiakip = async (usernames, jenis) => {
  console.log("db add eval siakip", usernames, jenis);

  const client = await pool.connect();
  try {
    const placeholders = usernames.map((_, i) => `$${i + 1}`).join(", ");
    console.log("placeholders :", placeholders);

    console.log("Query SQL:");
    console.log(
      `SELECT id, username FROM Pegawai WHERE username IN (${placeholders})`
    );
    console.log("Params:", usernames);

    const userRes = await client.query(
      `SELECT id, username FROM "Pegawai"
       WHERE username IN (${placeholders})`,
      usernames
    );

    const userMap = Object.fromEntries(
      userRes.rows.map((u) => [u.username, u.id])
    );
    console.log("userMap :", userMap);

    const now = new Date();
    const values = [];
    const insertPlaceholders = [];

    usernames.forEach((username, i) => {
      const userId = userMap[username];
      if (userId) {
        values.push(userId, jenis, now);
        const offset = i * 3;
        insertPlaceholders.push(
          `($${offset + 1}, $${offset + 2}, $${offset + 3})`
        );
      } else {
        console.warn(`User with username ${username} not found`);
      }
    });

    if (values.length > 0) {
      await client.query(
        `INSERT INTO "EvalSiakip" ("userId", jenis, tanggal)
         VALUES ${insertPlaceholders.join(", ")}
         ON CONFLICT ("userId", jenis, tanggal) DO NOTHING`,
        values
      );
    }
  } catch (error){
    logger.error(error.message);   
  }finally {
    client.release();
  }
};

// FUNGSI KIRIM PESAN K PRIBADI
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
          'Authorization': WABLAS_TOKEN + "." + WABLAS_SECRET,

        }
      });
    } catch (error) {
      logger.error(error.message);
    } finally {
      isProcessing = false; // Set isProcessing ke false setelah selesai
      console.log('Pesan berhasil dikirim ke:', phone, 'Isi pesan:', message);
      
    }
  };

// FUNGSI KIRIM PESAN K GRUP
const kirimPesanGroup = async (groupId, message) => {
    console.log('Kirim pesan ke grup:', groupId, message);
    
  try {
    isProcessing = true;
    await axios.post(WABLAS_GROUP_URL, {
        data: [{
            phone: groupId, // Gunakan phone untuk mengirim pesan ke grup
            group_id: groupId,
            message: message,
            secret: false,
            priority: true,
            isGroup: true, // Indikasi bahwa ini adalah pesan grup
        }]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': WABLAS_TOKEN + "." + WABLAS_SECRET,
      }
    });
  } catch (error) {
    logger.error(error.message);
  } finally {
    isProcessing = false; // Set isProcessing ke false setelah selesai
  }
};

// ANNOUNCE PAGI
const announcePagi = async (jenis, chat = true) => {
    
    const block = await checkTodayBlocked();

      if(block) {
        console.log("hari ini diblokir, tidak perlu announce sore");
        return;
      }
    
    const url = "https://sulbar.web.bps.go.id/siakip2/api/jurnal_harian/laporan/get_data_hari/daftar"

    const bulan = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDateshow = `${day} ${bulan[month-1]} ${year}`;
    const formattedDate = `${year}-${month}-${day} `;

    const params = {
        "satuan_kerja_tahun_id": "09ab3d70-e470-11f0-bb45-03d07264185d",
        "tanggal" : formattedDate,
    }; 

    axios.post(url, params)
        .then(response => {
            const user = response.data.user_peran;
            const item = response.data.item;
            // console.log(response.data.item);

            let user_problem = [];
            let username_user_problem = [];
            
            user.map(user => {
                // console.log(user.username);
                let tidak_aman = true;

                item.map(item => {
                    if (item.pelaksana_username == user.username){
                        
                        tidak_aman = false;
                    }
                });

                if (tidak_aman) {
                    user_problem.push(user.nama);
                    username_user_problem.push(user.username);
                }
            });
            

            let pesan = ``;

            if (user_problem.length != 0) {
                pesan = `
                    Selamat pagi, saya *Benji* (Bot Penjamin Kinerja)😄\nBerikut merupakan daftar pegawai yang belum mengisi SIAKIP pada pagi hari ini pada tanggal ${formattedDateshow} :
                `;

                for (let i = 0; i < user_problem.length; i++) {
                    if (i==0){
                        pesan += `\n- *${user_problem[i]}*\n`;
                    }else{
                        pesan += `- *${user_problem[i]}*\n`;
                    }
                }

            }else{
                pesan = `
                    Selamat pagi, *Benji* Mengucapkan Terimakasih semua pegawai sudah mengisi SIAKIP pada pagi hari ini, semangat dan tetap produktif 💪😄
                `;
            }
            
            console.log(username_user_problem);
            // databaseAddEvalSiakip(username_user_problem, jenis)
            if (jenis == 2){
                if (username_user_problem.length > 0) {
                    databaseAddEvalSiakip(username_user_problem, jenis);
                    if (chat) {
                        kirimPesanGroup(group_bocah_id, pesan);
                    }
                }
            }else{
                if (chat) {
                    kirimPesanGroup(group_bocah_id, pesan);
                }
                if (username_user_problem.length > 0) {
                    databaseAddEvalSiakip(username_user_problem, jenis);
                }
            }
            
        })
        .catch(error => {
            logger.error(error.message);
        });
}

// PERINGATAN SORE YANG HANYA BERUPA PESAN
const alertSore = async () => {
    
    const block = await checkTodayBlocked();

  if(block) {
    console.log("hari ini diblokir, tidak perlu announce sore");
    return;
  }
  
    const pesan = `Selamat sore, saya *Benji* (Bot Penjamin Kinerja) mau mengingatkan jangan lupa untuk menyelesaikan kegiatan yang dilaksanakan pada hari ini serta mengupload bukti dukungnya ya, terimakasih😁`
    kirimPesanGroup(group_bocah_id, pesan);
}

// PERINGATAN SORE YANG MEMUNCULKAN NAMA
const announceSore = async (chat = true) => {
    
    const block = await checkTodayBlocked();

  if(block) {
    console.log("hari ini diblokir, tidak perlu announce sore");
    return;
  }
    
    const url = "https://sulbar.web.bps.go.id/siakip2/api/jurnal_harian/laporan/get_data_hari/daftar"

    const bulan = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDateshow = `${day} ${bulan[month-1]} ${year}`;
    const formattedDate = `${year}-${month}-${day} `;


    const body = {
        "satuan_kerja_tahun_id": "09ab3d70-e470-11f0-bb45-03d07264185d",
        "tanggal" : formattedDate,
    };

    axios.post(url, body)
        .then(response => {

            const user = response.data.user_peran;
            const item = response.data.item;
            
            let user_problem = [];
            let pekerjaan_blm_selesai = [];
            let bukti_dukung_kosong = [];
            let username_pekerjaan_blm_selesai = [];
            let username_bukti_dukung_kosong = [];
            
            user.map(u => {
                // console.log(user.username);
                let tidak_aman = true;

                item.map(item => {
                    if (item.pelaksana_username == u.username){
                        tidak_aman = false;
                    }
                    if (item.status_pekerjaan == 0){
                        const foundUser = user.find(x => x.username === item.pelaksana_username);
                        pekerjaan_blm_selesai.push(foundUser.nama);
                        username_pekerjaan_blm_selesai.push(foundUser.username);
                    }
                    if (item.bukti_url == null){
                        const foundUser = user.find(x => x.username === item.pelaksana_username);
                        bukti_dukung_kosong.push(foundUser.nama);
                        username_bukti_dukung_kosong.push(foundUser.username);
                    }
                });

                if (tidak_aman) {
                    user_problem.push(u.nama);
                }
            });

            let pesan = ``;

            pekerjaan_blm_selesai = [...new Set(pekerjaan_blm_selesai)];
            bukti_dukung_kosong = [...new Set(bukti_dukung_kosong)];

            if (pekerjaan_blm_selesai.length != 0 && bukti_dukung_kosong.length != 0) {
                pesan = `
                    Selamat sore, saya *Benji* (Bot Penjamin Kinerja) 😄\nBerikut merupakan daftar pegawai yang belum menyelesaikan pekerjaan di SIAKIP pada sore hari ini pada tanggal ${formattedDateshow} :
                `;

                for (let i = 0; i < pekerjaan_blm_selesai.length; i++) {
                    if (i == 0){
                        pesan += `\n- *${pekerjaan_blm_selesai[i]}*\n`;

                    }else{
                        pesan += `- *${pekerjaan_blm_selesai[i]}*\n`;
                    }
                }

                if(bukti_dukung_kosong.length != 0){
                    pesan += `\nBerikut untuk yang belum mengupload bukti dukung :`

                    for (let i = 0; i < bukti_dukung_kosong.length; i++){
                        if (i==0){
                            pesan += `\n- *${bukti_dukung_kosong[i]}*`
                        }else{
                            pesan += `\n- *${bukti_dukung_kosong[i]}*`
                        }
                    }
                }

                pesan += `\n Benji sekarang cuman mau ngingatin kok, Jangan lupa pekerjaan di SIAKIPnya diselesaikan yaa😉`

            }else{
                pesan = `
                    Selamat Sore, *Benji* senang sekali semua pegawai sudah menyelesaikan pekerjaannya di SIAKIP, mancapppp😆
                `;
            }
             

            console.log(pesan);

            if(chat) {
                kirimPesanGroup(group_bocah_id, pesan);
            }
            // if(username_pekerjaan_blm_selesai.length > 0) {
            //     databaseAddEvalSiakip(username_pekerjaan_blm_selesai, 3);
            //     databaseAddEvalSiakip(username_bukti_dukung_kosong, 4);
            // }

        })
        .catch(error => {
            logger.error(error.message);
        });
}

// PENGUMUMAN SORE BAGI YANG BELUM MENYELESAIKAN PEKERJAAN DAN DISIMPAN K DB
const announceSoreInd = async (chat = true) => {
    
    const block = await checkTodayBlocked();

  if(block) {
    console.log("hari ini diblokir, tidak perlu announce sore");
    return;
  }
    
  const url =
    "https://sulbar.web.bps.go.id/siakip2/api/jurnal_harian/laporan/get_data_hari/daftar";

  const bulan = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const formattedDateshow = `${day} ${bulan[month - 1]} ${year}`;
  const formattedDate = `${year}-${month}-${day} `;

  const body = {
    satuan_kerja_tahun_id: "09ab3d70-e470-11f0-bb45-03d07264185d",
    tanggal: formattedDate,
    // tanggal: '2026-02-26',
  };

  axios
    .post(url, body)
    .then((response) => {
      
      const user = response.data.user_peran;
      const item = response.data.item;

      let user_problem = [];
      let username_problem = [];

      user.map((u) => {
        let tidak_aman = true;

        item.map((item) => {
          
          if (item.pelaksana_username == u.username) {
            tidak_aman = false;

          }

          if (item.status_pekerjaan == 0 || item.bukti_url == null) {
            const foundUser = user.find(
              (x) => x.username === item.pelaksana_username
            );

            user_problem.push(foundUser.nama);
            username_problem.push(foundUser.username);
          }
          
        });

        if (tidak_aman) {
          
          user_problem.push(u.nama);
          username_problem.push(u.username);
        }
      });
      user_problem = [...new Set(user_problem)];
      username_problem = [...new Set(username_problem)];

      let pesan = ``;


      if (
        user_problem.length != 0
      ) {
        pesan = `
                    Selamat sore, saya *Benji* (Bot Penjamin Kinerja) 😄\nBerikut merupakan daftar pegawai yang belum menyelesaikan pekerjaan di SIAKIP pada sore hari ini pada tanggal ${formattedDateshow} :
                `;

        for (let i = 0; i < user_problem.length; i++) {
          if (i == 0) {
            pesan += `\n- *${user_problem[i]}*\n`;
          } else {
            pesan += `- *${user_problem[i]}*\n`;
          }
        }

        pesan += `\n*Benji* sedih masih ada yang lupa menyelesaikan, padahal kan sudah *Benji* Ingatin tadi☹️, its okayy, semoga besok tidak lupa lagi, Jangan lupa absen yaa😉`;
      } else {
        pesan = `
                    Selamat Sore, *Benji* mengucpakan Terimakasih semua pegawai sudah menyelesaikan target SIAKIP Hari ini, semoga bernilai ibadah 🤲
                `;
      }

    console.log(pesan);

      if (chat) {
        kirimPesanGroup(group_bocah_id, pesan);
      }

      if(username_problem.length > 0){
        databaseAddEvalSiakip(username_problem, 5);
      }

    })
    .catch((error) => {
      logger.error(error.message);
    });
};

async function checkApiStatusAndNotify({
  url,
  nomor_hp,
  timeout = 5000,
  namaApi = "API",
}) {
  const startTime = Date.now();
  let pesan = "";

  try {
    const response = await axios.get(url, {
      timeout,
      validateStatus: () => true,
    });

    const responseTime = Date.now() - startTime;

    pesan = `
📡 *Monitoring API*
Nama API   : ${namaApi}
Status     : 🟢 ON
HTTP Code  : ${response.status}
Response   : ${responseTime} ms
Waktu Cek  : ${new Date().toLocaleString("id-ID")}
`.trim();

    kirimPesan(nomor_hp, pesan);

    return {
      status: "ON",
      httpStatus: response.status,
      responseTimeMs: responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;

    pesan = `
📡 *Monitoring API*
Nama API   : ${namaApi}
Status     : 🔴 OFF
Error      : ${
      error.code === "ECONNABORTED" ? "Request timeout" : error.message
    }
Response   : ${responseTime} ms
Waktu Cek  : ${new Date().toLocaleString("id-ID")}
`.trim();

    kirimPesan(nomor_hp, pesan);

    return {
      status: "OFF",
      responseTimeMs: responseTime,
      error: error.message,
    };
  }
}

const arg = process.argv[2]; // ambil argumen dari CLI
const day = new Date().getDay(); // 0 = Minggu, 1 = Senin, dst

switch (arg) {
  case "pagi1":
    announcePagi(1);
    break;
  case "pagi2":
    announcePagi(2);
    break;
  case "alertsore":
    if (day >= 1 && day <= 4) {
      announceSore(); // jam 15.30
    } else if (day === 5) {
      setTimeout(announceSore, 30 * 60 * 1000); // delay 30 menit (jam 16.00)
    }
    break;
  case "sore":
    if (day >= 1 && day <= 4) {
      announceSoreInd(); // jam 16.00
    } else if (day === 5) {
      setTimeout(announceSoreInd, 30 * 60 * 1000); // delay 30 menit (jam 16.30)
    }
    break;
  case "APIcheck":
    checkApiStatusAndNotify({
      url: "https://sulbar.web.bps.go.id/siakip2/api/jurnal_harian/laporan/get_data_hari/daftar",
      nomor_hp: "6282246657077",
      timeout: 5000,
      namaApi: "API SIAKIP",
    });

    break;
  case "test":
    announceSore(false);
    break;
  default:
    console.log("Argumen tidak dikenal:", arg);
}