const axios = require('axios');
const {kirimPesan, kirimPesanGroup} = require('./message.js');

const group_bocah_id = process.env.GROUP_ID

const announcePagi = async () => {
    const url = process.env.SIAKIP_API_URL;

    const bulan = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth()).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${day} ${bulan[month]} ${year}`;

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
                }
            });

            let pesan = ``;

            if (user_problem.length != 0) {
                pesan = `
                    *EVALUASI SIAKIP*\nSelamat pagi😄\nBerikut merupakan daftar pegawai yang belum mengisi SIAKIP pada pagi hari ini pada tanggal ${formattedDate} :
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
                    Selamat pagi, Terimakasih semua pegawai sudah mengisi SIAKIP pada pagi hari ini, semangat dan tetap produktif 💪😄
                `;
            }
            
            console.log(user_problem);
            kirimPesanGroup(group_bocah_id, pesan);
            // kirimPesan("6282246657077", pesan);
            
        })
        .catch(error => {
            console.error('Error req data:', error);
        });
}

const alertSore = () => {
    const pesan = `*PENGINGAT SIAKIP*\nSelamat sore bapak ibu sekalian, jangan lupa untuk menyelesaikan kegiatan yang dilaksanakan pada hari ini serta mengupload bukti dukungnya ya, terimakasih😁`
    kirimPesanGroup(group_bocah_id, pesan);
}

const announceSore = () => {
    const url = process.env.SIAKIP_API_URL;

    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

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
            
            user.map(u => {
                // console.log(user.username);
                let tidak_aman = true;

                item.map(item => {
                    if (item.pelaksana_username == u.username){
                        tidak_aman = false;
                    }
                    if (item.status_pekerjaan == 0){
                        const foundUser = user.find(x => x.username === item.pelaksana_username);
                        pekerjaan_blm_selesai.push(foundUser.nama)
                    }
                    if (item.bukti_url == null){
                        const foundUser = user.find(x => x.username === item.pelaksana_username);
                        bukti_dukung_kosong.push(foundUser.nama);
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
                    *EVALUASI SIAKIP*\nSelamat sore 😄\nBerikut merupakan daftar pegawai yang belum menyelesaikan pekerjaan di SIAKIP pada sore hari ini pada tanggal ${formattedDate} :
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

            }else{
                pesan = `
                    Selamat Sore, Terimakasih semua pegawai sudah menyelesaikan target SIAKIP Hari ini, semoga bernilai ibadah 🤲
                `;
            }
            
            console.log(user_problem);
            kirimPesanGroup(group_bocah_id, pesan);
            
        })
        .catch(error => {
            console.error('Error req data:', error);
        });
}

const test = () => {
    kirimPesan("6282246657077", "test pesan");
    console.log("test dikirim");
    
}

module.exports = {
    announcePagi, announceSore, test, alertSore
};