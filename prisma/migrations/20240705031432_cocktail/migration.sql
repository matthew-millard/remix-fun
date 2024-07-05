-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Username" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Username_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Password" (
    "hash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Password_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserProfileImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "blob" BLOB NOT NULL,
    "contentType" TEXT NOT NULL,
    "altText" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserProfileImage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserCoverImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "blob" BLOB NOT NULL,
    "contentType" TEXT NOT NULL,
    "altText" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserCoverImage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "About" (
    "about" TEXT,
    "userId" TEXT NOT NULL,
    CONSTRAINT "About_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserLocation" (
    "city" TEXT,
    "province" TEXT,
    "country" TEXT,
    "userId" TEXT NOT NULL,
    CONSTRAINT "UserLocation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "expirationDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "algorithm" TEXT NOT NULL,
    "digits" INTEGER NOT NULL,
    "period" INTEGER NOT NULL,
    "charSet" TEXT NOT NULL,
    "expiresAt" DATETIME
);

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
CREATE TABLE "Cocktail" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "history" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "garnish" TEXT NOT NULL,
    "glass" TEXT NOT NULL,
    "ice" TEXT NOT NULL,
    "tip" TEXT NOT NULL,
    "preparation" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Cocktail_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CocktailImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "blob" BLOB NOT NULL,
    "contentType" TEXT NOT NULL,
    "altText" TEXT,
    "cocktailId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CocktailImage_cocktailId_fkey" FOREIGN KEY ("cocktailId") REFERENCES "Cocktail" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CocktailIngredient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "measurement" TEXT NOT NULL,
    "cocktailId" TEXT NOT NULL,
    CONSTRAINT "CocktailIngredient_cocktailId_fkey" FOREIGN KEY ("cocktailId") REFERENCES "Cocktail" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
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

-- CreateTable
CREATE TABLE "_CocktailToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_CocktailToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Cocktail" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_CocktailToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Username_username_key" ON "Username"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Username_userId_key" ON "Username"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Password_userId_key" ON "Password"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfileImage_userId_key" ON "UserProfileImage"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserCoverImage_userId_key" ON "UserCoverImage"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "About_userId_key" ON "About"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserLocation_userId_key" ON "UserLocation"("userId");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Verification_target_type_key" ON "Verification"("target", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_action_entity_access_key" ON "Permission"("action", "entity", "access");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Cocktail_name_key" ON "Cocktail"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_PermissionToRole_AB_unique" ON "_PermissionToRole"("A", "B");

-- CreateIndex
CREATE INDEX "_PermissionToRole_B_index" ON "_PermissionToRole"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_RoleToUser_AB_unique" ON "_RoleToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_RoleToUser_B_index" ON "_RoleToUser"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CocktailToTag_AB_unique" ON "_CocktailToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_CocktailToTag_B_index" ON "_CocktailToTag"("B");

-- Manually added

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

