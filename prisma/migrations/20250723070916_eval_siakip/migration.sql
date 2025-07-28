-- CreateTable
CREATE TABLE "Pegawai" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "username" TEXT NOT NULL,

    CONSTRAINT "Pegawai_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvalSiakip" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jenis" INTEGER NOT NULL,

    CONSTRAINT "EvalSiakip_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Pegawai_phone_key" ON "Pegawai"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Pegawai_username_key" ON "Pegawai"("username");

-- AddForeignKey
ALTER TABLE "EvalSiakip" ADD CONSTRAINT "EvalSiakip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Pegawai"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
