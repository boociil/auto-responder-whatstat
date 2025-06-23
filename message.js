const WABLAS_TOKEN = process.env.WABLAS_TOKEN;
const WABLAS_URL = 'https://texas.wablas.com/api/v2/send-message'; // endpoint v2 untuk support listMessage
const WABLAS_LIST_URL = 'https://texas.wablas.com/api/v2/send-list'; // endpoint v2 untuk support listMessage
// const WABLAS_GROUP_URL = 'https://texas.wablas.com/api/v2/group/text'; // endpoint v2 untuk support groupMessage
const WABLAS_GROUP_URL = 'https://texas.wablas.com/api/v2/send-message'; // endpoint v2 untuk support groupMessage
const axios = require('axios');



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
        'Authorization': WABLAS_TOKEN
      }
    });
  } catch (error) {
    console.error('Gagal kirim pesan grup:', error.response?.data || error.message);
  } finally {
    isProcessing = false; // Set isProcessing ke false setelah selesai
  }
};

module.exports = {
  kirimPesan, kirimPesanGroup
};

