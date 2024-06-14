import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import { faker } from '@faker-js/faker';
import { createPassword } from '~/tests/db-utils';

const prisma = new PrismaClient();

async function img({ altText, filepath }: { altText?: string; filepath: string }) {
	return {
		altText,
		contentType: filepath.endsWith('.png') ? 'image/png' : 'image/jpeg',
		blob: await fs.promises.readFile(filepath),
	};
}

async function seed() {
	console.log('🌱 Seeding...');
	console.time(`🌱 Database has been seeded`);

	console.time('🧹 Cleaned up the database...');
	await prisma.user.deleteMany();
	await prisma.verification.deleteMany();
	console.timeEnd('🧹 Cleaned up the database...');

	const totalUsers = 10;
	console.time(`👤 Created ${totalUsers} users...`);

	for (let i = 0; i < totalUsers; i++) {
		const firstName = faker.person.firstName();
		const lastName = faker.person.lastName();
		const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}`;
		const provider = 'gmail.com';

		await prisma.user
			.create({
				data: {
					firstName,
					lastName,
					email: faker.internet.email({
						firstName,
						lastName,
						provider,
						allowSpecialCharacters: false,
					}),
					password: { create: createPassword(username) },
					username: { create: { username } },
					userLocation: { create: { city: faker.location.city(), province: 'Ontario', country: 'Canada' } },
					roles: { connect: { name: 'user' } },
				},
			})
			.catch(e => {
				console.error('Error creating a user:', e);
				return null;
			});
	}
	console.timeEnd(`👤 Created ${totalUsers} users...`);

	console.time(`🐨 Created admin user "Matt Millard"`);

	await prisma.user.create({
		data: {
			firstName: 'Matt',
			lastName: 'Millard',
			email: 'matthew.richie.millard@gmail.com',
			password: { create: createPassword('Password123!') },
			username: { create: { username: 'mattmillard' } },
			userLocation: { create: { city: 'Ottawa', province: 'Ontario', country: 'Canada' } },
			about: { create: { about: 'Hi my name is Matthew' } },
			profileImage: { create: await img({ filepath: 'tests/fixtures/images/users/matt_millard_headshot.jpg' }) },
			roles: { connect: [{ name: 'admin' }, { name: 'user' }] },
		},
	});

	console.timeEnd(`👤 Created admin user "Matt Millard"`);

	console.timeEnd(`🌱 Database has been seeded`);
}

seed()
	.catch(e => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
