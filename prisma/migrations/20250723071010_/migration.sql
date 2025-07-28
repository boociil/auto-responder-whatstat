/*
  Warnings:

  - A unique constraint covering the columns `[nip]` on the table `Pegawai` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `nip` to the `Pegawai` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Pegawai" ADD COLUMN     "nip" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Pegawai_nip_key" ON "Pegawai"("nip");
