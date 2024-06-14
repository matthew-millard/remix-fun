
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

