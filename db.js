const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const databaseAddUser = async (nama, notelp, nama_lengkap, email, instansi) => {
  console.log("db add user : ", nama, notelp, nama_lengkap, email, instansi);

  const getuser = await prisma.users.findFirst({
    where: {
      notelp: notelp,
    },
  });

  if (!getuser) {
    const addNewUser = await prisma.users.create({
      data: {
        nama: nama,
        nama_lengkap: nama_lengkap || "",
        notelp: notelp,
        email: email || "",
        instansi: instansi || "",
      },
    });
    return 0;
  } else {
    const updateUser = await prisma.users.update({
      where: {
        id: getuser.id,
      },
      data: {
        nama_lengkap: nama_lengkap,
        email: email,
        instansi: instansi,
      },
    });
    return 1;
  }
};

const databaseAddDataLayanan = async (layanan, data, notelp, time) => {
  console.log("db add data layanan : ", layanan, data, notelp, time);

  const getuser = await prisma.users.findFirst({
    where: {
      notelp: notelp,
    },
  });

  if (!getuser) {
    throw new Error("User tidak ditemukan");
  }

  const addDataLayanan = await prisma.dataLayanan.create({
    data: {
      user_id: getuser.id,
      layanan: layanan,
      data: data,
      time: time,
    },
  });

  return addDataLayanan.id;
};

const databasePushChat = async (id, chat) => {
  console.log("db push chat", chat);

  const pushChat = await prisma.dataLayanan.update({
    where: {
      id: id,
    },
    data: {
      chat: chat,
    },
  });
};

const databaseAddEvalSiakip = async (usernames, jenis) => {
  console.log("db add eval siakip", usernames, jenis);

  const users = await prisma.pegawai.findMany({
    where: {
      username: { in: usernames },
    },
    select: {
      id: true,
      username: true,
    },
  });

 // Filter out any null entries

  const userMap = Object.fromEntries(users.map((u) => [u.username, u.id]));
  console.log("userMap :",userMap);
  
  const data = usernames.map((username) => {
    const user = users.find((u) => u.username === username);
    if (!user) {
      console.warn(`User with username ${username} not found`);
      return null; // Skip this entry if user not found
    }
    return {
      userId: user.id,
      jenis: jenis,
      tanggal: new Date(),
    };
  }).filter(Boolean);

  console.log(data);
  

  await prisma.evalSiakip.createMany({
    data,
    skipDuplicates: true,
  });

};

function getAwalDanAkhirBulanString(bulanString) {
  const [tahun, bulan] = bulanString.split('-').map(Number);
  const awal = new Date(tahun, bulan - 1, 1);
  const akhir = new Date(tahun, bulan, 1); // Awal bulan berikutnya
  return { awal, akhir };
}

async function databaseGetRekapEvalSiakip(bulanString) {
  const { awal, akhir } = getAwalDanAkhirBulanString(bulanString);

  const pegawaiList = await prisma.pegawai.findMany();

  const evalList = await prisma.evalSiakip.findMany({
    where: {
      tanggal: {
        gte: awal,
        lt: akhir,
      },
    },
    select: {
      userId: true,
      jenis: true,
    },
  });

  const grouped = new Map();

  for (const { userId, jenis } of evalList) {
    if (!grouped.has(userId)) {
      grouped.set(userId, { 1: 0, 2: 0, 3: 0, 4: 0 });
    }
    grouped.get(userId)[jenis] += 1;
  }

  const result = pegawaiList.map((pegawai) => {
    const counts = grouped.get(pegawai.id) || { 1: 0, 2: 0, 3: 0, 4: 0 };
    return {
      nama: pegawai.nama,
      jenis1: counts[1],
      jenis2: counts[2],
      jenis3: counts[3],
      jenis4: counts[4],
    };
  });

  return result;
}

module.exports = {
  databaseAddUser,
  databaseAddDataLayanan,
  databasePushChat,
  databaseAddEvalSiakip,
  databaseGetRekapEvalSiakip,
};
