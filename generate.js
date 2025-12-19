const XLSX = require("xlsx");
const axios = require('axios');

const WABLAS_TOKEN = "A0jiIVpmnhoNp0mHaxUCt3YIE0tXgbJ59zzPEsZP5ZWex1dVA5bwAEu";
const WABLAS_SECRET = "7UXqhtqp";
const WABLAS_URL = 'https://texas.wablas.com/api/v2/send-message';

const tautan = [
  {
    kecamatan: "Banggae",
    link: "https://chat.whatsapp.com/BjaN47Eysw68AwGYevyvn6",
    file: "Banggae.xlsx",
  },
  {
    kecamatan: "Banggae Timur",
    link: "https://chat.whatsapp.com/BSvKUr1NgXK0C7nzu6Nguw",
    file: "Banggae Timur.xlsx",
  },
  {
    kecamatan: "Pamboang",
    link: "https://chat.whatsapp.com/KycnfXrFFOjBEupJIvk6YE",
    file: "Pamboang.xlsx",
  },
  {
    kecamatan: "Sendana",
    link: "https://chat.whatsapp.com/GnVt4NHT2BNC55ScalCvIh",
    file: "Sendana.xlsx",
  },
  {
    kecamatan: "Tammerodo",
    link: "https://chat.whatsapp.com/Ga99hzXfNBI0wIFFT3DWBn",
    file: "Tammerodo.xlsx",
  },
  {
    kecamatan: "Tubo Sendana",
    link: "https://chat.whatsapp.com/BnHd7vBU6Qy2FxBWsD00z0",
    file: "Tubo Sendana.xlsx",
  },
  {
    kecamatan: "Ulumanda",
    link: "https://chat.whatsapp.com/HS6VvkIsDxUFZZPMH6oFC5",
    file: "Ulumanda.xlsx",
  },
  {
    kecamatan: "Malunda",
    link: "https://chat.whatsapp.com/H3YkLaiy07W0NvKoivNhtP",
    file: "Malunda.xlsx",
  },
];

const generatePesan = (nama, email, kecamatan, link) => {
  return (
    "Kepada *" + nama + "*\n" +
    "Email : " + email + "\n" +
    "Kecamatan : " + kecamatan + "\n\n" + 
    "Terima kasih atas partisipasi Bapak/Ibu dalam pendaftaran Rekrutmen Mitra Statistik 2026.\n\n" +
    "Melalui pesan ini, kami mengundang Bapak/Ibu untuk bergabung dalam WAG Rekrutmen Mitra Statistik 2026 Kecamatan " + kecamatan + " guna memudahkan penyampaian seluruh informasi terkait proses rekrutmen.\n\n" +
    "Silakan bergabung melalui link berikut\n" +
    "📲 " + link + "\n\n" +
    "⛔ Mohon untuk tidak menyebarluaskan pesan/link grup\n\n" +
    "Terima kasih atas kerjasamanya!\n\n" +
    "Regards,\n" +
    "*BPS Kabupaten Majene*"
  );
};


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

const generate = async (kecamatan, real = false) => {
  const item = tautan.find((t) => t.kecamatan === kecamatan);

  if (!item) {
    console.log("Kecamatan tidak valid:", kecamatan);
    return;
  }

  const file = item.file;
  const link = item.link;
  // console.log("Kirimkan ke kecamatan:", kecamatan);
  // console.log("file:", file);

  const workbook = XLSX.readFile(real ? file : "Tes.xlsx");
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const data = XLSX.utils.sheet_to_json(sheet);

  const total = data.length; 

  const filterKolom = data.map((row) => ({
    nama: row["Nama Lengkap"],
    email: row["Email"],
    phone: row["telpon"],
  }));

  // console.log(filterKolom);

  let n = 1;

  for (const row of filterKolom) {
    const pesan = generatePesan(row.nama, row.email, kecamatan, link);
    // const pesan = `Halo ${row.nama}, ini pesan tes dari BPS Majene.`;

    await kirimPesan(row.phone, pesan);
    console.log("Mengirim ke:", row.phone, " atas nama : ", row.nama);
    console.log("\x1b[36mPROGRES : ", n, "/", total)

    n = n + 1;
  }

  console.log("\n\x1b[32mKIRIM PESAN SUKSES :D");

};

const generateRemedialPagi = async () => {

  // const infoRemedial = "*[INFO AWAL REMEDIAL TES KOMPETENSI - REKRUTMEN CALON MITRA STATISTIK BPS 2026]*\n\nKami menginformasikan kepada para calon mitra dengan nilai tes kompetensi yang masih di bawah batas minimal kelulusan, agar bersiap mengerjakan remedial. Dengan ketentuan sebagai berikut:\n\n1. Soal sebanyak 30 soal yang dibagi menjadi 3 tipe, yaitu: matematika dasar, logika-analogi, dan pengetahuan umum mengenai BPS.\n2. Pelaksanaan remedial hanya dilaksanakan di satu hari, yaitu *Senin 24 November 2025*.\n3. Waktu pengerjaan dimulai *pukul 14.00-18.00 WITA*.\n4. Setelah pukul 18.00, *form soal akan ditutup*, sehingga calon mitra diharapkan mengerjakan pada rentang waktu yang telah ditentukan.\n5. *Link soal menyusul*\n\nCatatan: *calon mitra yang mendapatkan pesan ini* adalah calon mitra yang *perlu melakukan remedial*\n\nTerima kasih atas perhatiannya.\n\nRegards,\n*Panitia Rekrutmen Mitra Statistik 2026*\n*BPS Kabupaten Majene*";
  const infoRemedial = "*[REMEDIAL TES KOMPETENSI - REKRUTMEN CALON MITRA STATISTIK BPS 2026]*\n\nKami menginformasikan kepada para calon mitra dengan nilai tes kompetensi yang masih di bawah batas minimal kelulusan, agar bersiap mengerjakan remedial. Dengan ketentuan sebagai berikut:\n\n1. Soal sebanyak 30 soal yang dibagi menjadi 3 tipe, yaitu: matematika dasar, logika-analogi, dan pengetahuan umum mengenai BPS.\n2. Pelaksanaan remedial hanya dilaksanakan di satu hari, yaitu *Senin 24 November 2025*.\n3. Waktu pengerjaan dimulai *pukul 14.00-18.00 WITA*.\n4. Setelah pukul 18.00, *form soal akan ditutup*, sehingga calon mitra diharapkan mengerjakan pada rentang waktu yang telah ditentukan.\n5. *Link soal:*https://s.bps.go.id/teskompetensi7601\n\nCatatan: *calon mitra yang mendapatkan pesan ini* adalah calon mitra yang *perlu melakukan remedial*\n\nTerima kasih atas perhatiannya.\n\nRegards,\n*Panitia Rekrutmen Mitra Statistik 2026*\n*BPS Kabupaten Majene*";


  const workbook = XLSX.readFile("Remedial.xlsx");
  // const workbook = XLSX.readFile("Tes.xlsx");
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const data = XLSX.utils.sheet_to_json(sheet);

  const total = data.length; 

  const filterKolom = data.map((row) => ({
    nama: row["Nama Lengkap"],
    email: row["Email"],
    phone: row["telpon"],
  }));

  // console.log(filterKolom);

  let n = 1;

  for (const row of filterKolom) {

    await kirimPesan(row.phone, infoRemedial);
    console.log("Mengirim ke:", row.phone, " atas nama : ", row.nama);
    console.log("\x1b[36mPROGRES : ", n, "/", total)

    n = n + 1;
  }

  console.log("\n\x1b[32mKIRIM PESAN SUKSES :D");

};

const args = process.argv.slice(2); // hasil: ["Tes", "Pamboang"]

const command = args[0]; // "Tes"
const kecamatan = args.slice(1).join(" "); // "Pamboang"

switch (command) {
  case "Tes":
    // console.log("Kirim pesan Tes untuk kecamatan:", kecamatan);
    generate(kecamatan);
    break;
  case "Send":
    // console.log("Kirim pesan Tes untuk kecamatan:", kecamatan);
    generate(kecamatan, true);
    break;
  case "RemedialPagi":
    // console.log("Ini adalah pesan remedial pagi");
    generateRemedialPagi();
    break;


  default:
    console.log("Command tidak dikenal:", command);
}
