import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { createPassword } from '~/tests/db-utils';

const prisma = new PrismaClient();

async function seed() {
	console.log('🌱 Seeding...');
	console.time(`🌱 Database has been seeded`);

	console.time('🧹 Cleaned up the database...');
	await prisma.user.deleteMany();
	console.timeEnd('🧹 Cleaned up the database...');

	const totalUsers = 10;
	console.time(`👤 Created ${totalUsers} users...`);

	for (let i = 0; i < totalUsers; i++) {
		const firstName = faker.person.firstName();
		const lastName = faker.person.lastName();
		const userName = `${firstName.toLowerCase()}${lastName.toLowerCase()}`;
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
					password: { create: createPassword(userName) },
				},
			})
			.catch(e => {
				console.error('Error creating a user:', e);
				return null;
			});
	}
}

seed()
	.catch(e => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
