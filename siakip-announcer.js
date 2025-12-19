
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
  } finally {
    client.release();
  }
};

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
      console.error('Gagal kirim pesan:', error.response?.data || error.message);
    } finally {
      isProcessing = false; // Set isProcessing ke false setelah selesai
      console.log('Pesan berhasil dikirim ke:', phone, 'Isi pesan:', message);
      
    }
  };

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
    console.error('Gagal kirim pesan grup:', error.response?.data || error.message);
  } finally {
    isProcessing = false; // Set isProcessing ke false setelah selesai
  }
};

// ANNOUNCE PAGI
const announcePagi = async (jenis, chat = true) => {
    const url = "https://sulbar.web.bps.go.id/siakip2/api/jurnal_harian/laporan/get_data_hari/daftar"

    const bulan = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDateshow = `${day} ${bulan[month-1]} ${year}`;
    const formattedDate = `${year}-${month}-${day} `;

    const params = {
        "satuan_kerja_tahun_id" : "52ec8800-c0d8-11ef-83fe-29d37685f42e",
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
            console.error('Error req data:', error);
        });
}

const alertSore = () => {
    const pesan = `Selamat sore, saya *Benji* (Bot Penjamin Kinerja) mau mengingatkan jangan lupa untuk menyelesaikan kegiatan yang dilaksanakan pada hari ini serta mengupload bukti dukungnya ya, terimakasih😁`
    kirimPesanGroup(group_bocah_id, pesan);
}

const announceSore = (chat = true) => {
    const url = "https://sulbar.web.bps.go.id/siakip2/api/jurnal_harian/laporan/get_data_hari/daftar"

    const bulan = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDateshow = `${day} ${bulan[month-1]} ${year}`;
    const formattedDate = `${year}-${month}-${day} `;


    const body = {
        "satuan_kerja_tahun_id" : "52ec8800-c0d8-11ef-83fe-29d37685f42e",
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

                pesan += `\nJangan lupa absen yaa😉`

            }else{
                pesan = `
                    Selamat Sore, *Benji* mengucapakan Terimakasih semua pegawai sudah menyelesaikan target SIAKIP Hari ini, semoga bernilai ibadah 🤲
                `;
            }
             
            console.log(bukti_dukung_kosong);
            console.log(pekerjaan_blm_selesai);
            
            
            console.log(user_problem);
            if(chat) {
                kirimPesanGroup(group_bocah_id, pesan);
            }
            if(username_pekerjaan_blm_selesai.length > 0) {
                databaseAddEvalSiakip(username_pekerjaan_blm_selesai, 3);
                databaseAddEvalSiakip(username_bukti_dukung_kosong, 4);
            }

        })
        .catch(error => {
            console.error('Error req data:', error);
        });
}

const test = () => {
    kirimPesan("6282246657077", "test pesan");
    console.log("test dikirim");
}

// announcePagi(1);
// announcePagi(2);
// announceSore();
// alertSore();

// const arg = process.argv[2]; // ambil argumen dari CLI
// const day = new Date().getDay(); // 0 = Minggu, 1 = Senin, dst

// switch (arg) {
//   case "pagi1":
//     announcePagi(1);
//     break;
//   case "pagi2":
//     announcePagi(2);
//     break;
//   case "alertsore":
//     if (day >= 1 && day <= 4) {
//       alertSore(); // jam 15.30
//     } else if (day === 5) {
//       setTimeout(alertSore, 30 * 60 * 1000); // delay 30 menit (jam 16.00)
//     }
//     break;
//   case "sore":
//     if (day >= 1 && day <= 4) {
//       announceSore(); // jam 16.00
//     } else if (day === 5) {
//       setTimeout(announceSore, 30 * 60 * 1000); // delay 30 menit (jam 16.30)
//     }
//     break;
//   case "test":
//     test();
//     break;
//   default:
//     console.log("Argumen tidak dikenal:", arg);
// }
