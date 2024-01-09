-- CreateTable
CREATE TABLE "Server" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "logChannel" TEXT NOT NULL,
    "months" INTEGER NOT NULL,
    "role" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Server_id_key" ON "Server"("id");
