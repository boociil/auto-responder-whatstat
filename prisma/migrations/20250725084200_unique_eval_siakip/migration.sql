/*
  Warnings:

  - A unique constraint covering the columns `[userId,jenis,tanggal]` on the table `EvalSiakip` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "EvalSiakip_userId_jenis_tanggal_key" ON "EvalSiakip"("userId", "jenis", "tanggal");
