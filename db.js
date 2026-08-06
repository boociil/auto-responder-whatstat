// const { PrismaClient } = require("@prisma/client");
// const prisma = new PrismaClient();

// DB Connection pake PG
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool
  .connect()
  .then(() => {
    console.log("Connected to the database");
  })
  .catch((err) => {
    console.error("Database connection error", err.stack);
  });

const databaseAddUser = async (nama, notelp, nama_lengkap, email, instansi) => {
  console.log("db add user : ", nama, notelp, nama_lengkap, email, instansi);

  const client = await pool.connect();
  try {
    const res = await client.query(
      'SELECT * FROM "Users" WHERE notelp = $1 LIMIT 1',
      [notelp],
    );
    const time = new Date();
    if (res.rowCount === 0) {
      await client.query(
        `INSERT INTO "Users" (nama, notelp, nama_lengkap, email, instansi, newest_time)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [nama, notelp, nama_lengkap ?? "", email ?? "", instansi ?? "", time],
      );
      return 0;
    } else {
      await client.query(
        `UPDATE "Users"
         SET nama_lengkap = $1, email = $2, instansi = $3, newest_time = $4
         WHERE id = $5`,
        [nama_lengkap ?? "", email ?? "", instansi ?? "", time, res.rows[0].id],
      );
      return 1;
    }
  } finally {
    client.release();
  }
};

const databaseAddDataLayanan = async (layanan, data, notelp, time) => {
  console.log("db add data layanan : ", layanan, data, notelp, time);

  const client = await pool.connect();
  try {
    const userRes = await client.query(
      'SELECT id FROM "Users" WHERE notelp = $1 LIMIT 1',
      [notelp],
    );
    if (userRes.rowCount === 0) {
      throw new Error("User tidak ditemukan");
    }

    const insertRes = await client.query(
      `INSERT INTO "DataLayanan" (user_id, layanan, data, time)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [userRes.rows[0].id, layanan, data, time],
    );

    return insertRes.rows[0].id;
  } finally {
    client.release();
  }
};

const databasePushChat = async (id, chat) => {
  console.log("db push chat", chat);

  const client = await pool.connect();
  try {
    await client.query(
      `UPDATE "DataLayanan"
       SET chat = $1
       WHERE id = $2`,
      [chat, id],
    );
  } finally {
    client.release();
  }
};

const databaseAddEvalSiakip = async (usernames, jenis) => {
  console.log("db add eval siakip", usernames, jenis);

  const client = await pool.connect();
  try {
    const placeholders = usernames.map((_, i) => `$${i + 1}`).join(", ");
    console.log("placeholders :", placeholders);

    console.log("Query SQL:");
    console.log(
      `SELECT id, username FROM Pegawai WHERE username IN (${placeholders})`,
    );
    console.log("Params:", usernames);

    const userRes = await client.query(
      `SELECT id, username FROM "Pegawai"
       WHERE username IN (${placeholders})`,
      usernames,
    );

    const userMap = Object.fromEntries(
      userRes.rows.map((u) => [u.username, u.id]),
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
          `($${offset + 1}, $${offset + 2}, $${offset + 3})`,
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
        values,
      );
    }
  } finally {
    client.release();
  }
};

function getAwalDanAkhirBulanString(bulanString) {
  const [tahun, bulan] = bulanString.split("-").map(Number);
  const awal = new Date(tahun, bulan - 1, 1);
  const akhir = new Date(tahun, bulan, 1);
  return { awal, akhir };
}

async function databaseGetRekapEvalSiakip(bulanString) {
  const { awal, akhir } = getAwalDanAkhirBulanString(bulanString);

  const client = await pool.connect();
  try {
    const pegawaiRes = await client.query('SELECT id, nama FROM "Pegawai"');
    const evalRes = await client.query(
      `SELECT "userId", jenis
       FROM "EvalSiakip"
       WHERE tanggal >= $1 AND tanggal < $2`,
      [awal, akhir],
    );

    const grouped = new Map();
    for (const { userId, jenis } of evalRes.rows) {
      if (!grouped.has(userId)) {
        grouped.set(userId, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
      }
      grouped.get(userId)[jenis] += 1;
    }

    let result;

    const [tahun, bulan] = bulanString.split("-").map(Number);

    if (tahun >= 2026 && bulan >= 5) {
      console.log("tahun >= 2026 && bulan >= 5");
      result = pegawaiRes.rows.map((pegawai) => {
        const counts = grouped.get(pegawai.id) || {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
        };
        return {
          nama: pegawai.nama,
          jenis1: counts[1],
          jenis2: counts[2],
          jenis3: counts[3],
          jenis4: counts[5],
        };
      });
    } else {
      console.log("tahun < 2026 && bulan < 6");
      result = pegawaiRes.rows.map((pegawai) => {
        const counts = grouped.get(pegawai.id) || {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
        };
        return {
          nama: pegawai.nama,
          jenis1: counts[1],
          jenis2: counts[2],
          jenis3: counts[3],
          jenis4: counts[4],
        };
      });
    }

    return result;
  } finally {
    client.release();
  }
}

async function databaseGetIndikatorBenji(bulanString) {
  const { awal, akhir } = getAwalDanAkhirBulanString(bulanString);

  let query = "";

  if (bulanString >= "2026-05") {
    query = `SELECT 
    p.id,
    p.nama,
    COUNT(e.*) AS jumlah
FROM "Pegawai" p
LEFT JOIN "EvalSiakip" e 
    ON p.id = e."userId"
    AND e.tanggal >= $1
    AND e.tanggal < $2
    AND e.jenis = 5
GROUP BY 
    p.id, p.nama
ORDER BY 
    p.nama;`;
  } else {
    query = `SELECT 
    p.id,
    p.nama,
    COUNT(e.*) AS jumlah
FROM "Pegawai" p
LEFT JOIN "EvalSiakip" e 
    ON p.id = e."userId"
    AND e.tanggal >= $1
    AND e.tanggal < $2
    AND e.jenis = 4
GROUP BY 
    p.id, p.nama
ORDER BY 
    p.nama;`;
  }

  const client = await pool.connect();
  try {
    const evalRes = await client.query(
      query,
      [awal, akhir],
    );

    // console.log(evalRes.rows);

    const result = evalRes.rows.map((row) => ({
      id: row.id,
      nama: row.nama,
      jumlah: parseInt(row.jumlah, 10),
      indikator: 100 - Math.floor(parseInt(row.jumlah, 10) / 7),
    }));

    return result;
  } finally {
    client.release();
  }
}

async function databaseGetForExcel(bulanString) {
  const { awal, akhir } = getAwalDanAkhirBulanString(bulanString);

  const client = await pool.connect();
  try {
    const evalRes = await client.query(
      `SELECT 
p.nama,
    e.jenis,
e.tanggal
FROM "Pegawai" p
JOIN "EvalSiakip" e 
    ON p.id = e."userId"
    AND e.tanggal >= $1
    AND e.tanggal < $2
    AND e.jenis IN (1,2,4)
ORDER BY 
    p.nama;`,
      [awal, akhir],
    );

    return evalRes;
  } finally {
    client.release();
  }
}

async function databaseIsTodayBlocked(tanggal) {
  const query = `SELECT * 
  FROM "public"."Block"
  WHERE tanggal = $1;`;
  const client = await pool.connect();
  const result = await client.query(query, [tanggal]);
  return result.rows.length > 0;
}

async function databaseGetBlockedDates() {
  const query = `SELECT tanggal 
  FROM "public"."Block";`;
  const client = await pool.connect();
  const result = await client.query(query);
  return result.rows.map((row) => row.tanggal);
}

async function databaseGetDataWhatStat(bulanString) {
  const { awal, akhir } = getAwalDanAkhirBulanString(bulanString);

  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT 
        "DataLayanan".id AS data_id,
        "DataLayanan".layanan,
        "DataLayanan".time,
        "DataLayanan".data,
        "DataLayanan".chat,
        "Users".id AS user_id,
        "Users".nama,
        "Users".nama_lengkap,
        "Users".email,
        "Users".instansi
      FROM "DataLayanan"
      JOIN "Users" ON "DataLayanan"."user_id" = "Users".id
      WHERE "DataLayanan".time >= $1 AND "DataLayanan".time < $2`,
      [awal, akhir],
    );

    // mapping hasil query ke array data yang bersih
    const data = result.rows.map((row) => ({
      id: row.data_id,
      layanan: row.layanan,
      time: row.time,
      data: row.data,
      chat: row.chat,
      user: {
        id: row.user_id,
        nama: row.nama,
        namaLengkap: row.nama_lengkap,
        email: row.email,
        instansi: row.instansi,
      },
    }));

    return data;
  } finally {
    client.release();
  }
}

module.exports = {
  databaseAddUser,
  databaseAddDataLayanan,
  databasePushChat,
  databaseAddEvalSiakip,
  databaseGetRekapEvalSiakip,
  databaseGetDataWhatStat,
  databaseGetIndikatorBenji,
  databaseGetForExcel,
  databaseGetBlockedDates,
  databaseIsTodayBlocked,
};
