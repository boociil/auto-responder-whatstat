-- CreateTable
CREATE TABLE "Users" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "nama_lengkap" TEXT NOT NULL,
    "notelp" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "instansi" TEXT NOT NULL,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataLayanan" (
    "id" SERIAL NOT NULL,
    "layanan" INTEGER NOT NULL,
    "data" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "DataLayanan_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DataLayanan" ADD CONSTRAINT "DataLayanan_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
