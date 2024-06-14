/*
  Warnings:

  - You are about to drop the column `isAdmin` on the `User` table. All the data in the column will be lost.
  - The required column `id` was added to the `Username` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "access" TEXT NOT NULL,
    "description" TEXT DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "_PermissionToRole" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_PermissionToRole_A_fkey" FOREIGN KEY ("A") REFERENCES "Permission" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_PermissionToRole_B_fkey" FOREIGN KEY ("B") REFERENCES "Role" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_RoleToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_RoleToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Role" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_RoleToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "firstName", "id", "lastName", "updatedAt") SELECT "createdAt", "email", "firstName", "id", "lastName", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE TABLE "new_Username" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Username_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Username" ("userId", "username") SELECT "userId", "username" FROM "Username";
DROP TABLE "Username";
ALTER TABLE "new_Username" RENAME TO "Username";
CREATE UNIQUE INDEX "Username_username_key" ON "Username"("username");
CREATE UNIQUE INDEX "Username_userId_key" ON "Username"("userId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "Permission_action_entity_access_key" ON "Permission"("action", "entity", "access");

-- CreateIndex
CREATE UNIQUE INDEX "_PermissionToRole_AB_unique" ON "_PermissionToRole"("A", "B");

-- CreateIndex
CREATE INDEX "_PermissionToRole_B_index" ON "_PermissionToRole"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_RoleToUser_AB_unique" ON "_RoleToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_RoleToUser_B_index" ON "_RoleToUser"("B");

-- Manual Migration
INSERT INTO _prisma_migrations VALUES('841f1219-e6a6-486e-b3f0-cc5c1316c7a7','d6615f20917754537fd621d8658ef72e9c1f417a606a1fee5b19ae800aefefe6',1718304339676,'20240411171533_sessions',NULL,NULL,1718304339671,1);
INSERT INTO _prisma_migrations VALUES('2f7e43cd-3eca-4b45-b279-b66949c98cb6','a935e07c6bd0cc4afd8801ad02bfa6a9f84776473199872fb6207b7fc293e4a5',1718304339682,'20240417142412_verification',NULL,NULL,1718304339676,1);
INSERT INTO _prisma_migrations VALUES('0244c2b9-4a9e-4b45-8263-f660cd0fe82e','9c6384fac88b01fe7a238edce76dac4b6954d46690add25c5d262bda584f8f86',1718304339685,'20240505171329_cover_image',NULL,NULL,1718304339683,1);
INSERT INTO _prisma_migrations VALUES('fb435895-ba24-486f-9258-d0e728624eef','ba0e74e8f7803b7e13abed41c2ecbdb09335c7cfcdccac63a17164abbfc85c9d',1718304339696,'20240613160455_roles',NULL,NULL,1718304339686,1);

INSERT INTO Permission VALUES('clxdm1e1u0000x3n1pl3idh6u','create','user','own','',1718304339809,1718304339809);
INSERT INTO Permission VALUES('clxdm1e220001x3n1mdtjlnot','create','user','any','',1718304339819,1718304339819);
INSERT INTO Permission VALUES('clxdm1e230002x3n1qukquer6','read','user','own','',1718304339820,1718304339820);
INSERT INTO Permission VALUES('clxdm1e240003x3n17rj25thr','read','user','any','',1718304339820,1718304339820);
INSERT INTO Permission VALUES('clxdm1e250004x3n1gnhmoia4','update','user','own','',1718304339821,1718304339821);
INSERT INTO Permission VALUES('clxdm1e260005x3n1acaq1y0i','update','user','any','',1718304339822,1718304339822);
INSERT INTO Permission VALUES('clxdm1e270006x3n1qmizbumw','delete','user','own','',1718304339823,1718304339823);
INSERT INTO Permission VALUES('clxdm1e280007x3n1wumao106','delete','user','any','',1718304339824,1718304339824);

INSERT INTO Role VALUES('clxdm1e2b0008x3n1z11k7viu','admin','',1718304339827,1718304339827);
INSERT INTO Role VALUES('clxdm1e2e0009x3n17ln3sqg9','user','',1718304339830,1718304339830);

INSERT INTO _PermissionToRole VALUES('clxdm1e220001x3n1mdtjlnot','clxdm1e2b0008x3n1z11k7viu');
INSERT INTO _PermissionToRole VALUES('clxdm1e240003x3n17rj25thr','clxdm1e2b0008x3n1z11k7viu');
INSERT INTO _PermissionToRole VALUES('clxdm1e260005x3n1acaq1y0i','clxdm1e2b0008x3n1z11k7viu');
INSERT INTO _PermissionToRole VALUES('clxdm1e280007x3n1wumao106','clxdm1e2b0008x3n1z11k7viu');
INSERT INTO _PermissionToRole VALUES('clxdm1e1u0000x3n1pl3idh6u','clxdm1e2e0009x3n17ln3sqg9');
INSERT INTO _PermissionToRole VALUES('clxdm1e230002x3n1qukquer6','clxdm1e2e0009x3n17ln3sqg9');
INSERT INTO _PermissionToRole VALUES('clxdm1e250004x3n1gnhmoia4','clxdm1e2e0009x3n17ln3sqg9');
INSERT INTO _PermissionToRole VALUES('clxdm1e270006x3n1qmizbumw','clxdm1e2e0009x3n17ln3sqg9');

