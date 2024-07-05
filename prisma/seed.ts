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
					roles: { connectOrCreate: { where: { name: 'user' }, create: { name: 'user' } } },
				},
			})
			.catch(e => {
				console.error('Error creating a user:', e);
				return null;
			});
	}
	console.timeEnd(`👤 Created ${totalUsers} users...`);

	console.time(`Created photographer "Matt Millard"`);
	const photographerMattMillard = await prisma.photographer.create({
		data: {
			name: 'Matt Millard',
			href: '/mattmillard',
		},
	});

	console.timeEnd(`Created photographer "Matt Millard"`);

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
			roles: {
				connectOrCreate: [
					{ where: { name: 'admin' }, create: { name: 'admin' } },
					{ where: { name: 'user' }, create: { name: 'user' } },
				],
			},
			cocktails: {
				create: {
					type: 'Cocktail',
					name: 'Old Fashioned',
					history: `The term "cocktail" first appeared in print in 1806, defined as a mix of spirits, sugar, water, and bitters. This simple mixture is essentially what the Old Fashioned embodies.`,
					description: `The Old Fashioned is a well-balanced cocktail with a strong whiskey base. The bitters add a subtle complexity, complementing the sweetness of the sugar. The citrus garnish, if used, adds a refreshing aroma and a hint of brightness. The overall flavor is rich, slightly sweet, and deeply satisfying, making it a favorite for whiskey enthusiasts and cocktail purists alike.`,
					garnish: 'Orange twist',
					glass: 'Rocks glass',
					ice: 'Block ice',
					tip: 'Use 2 parts raw demerara sugar or organic cane sugar to 1 part filtered water (by weight) when making your sugar syrup.',
					preparation:
						'Add all the ingredients into a mixing glass, add ice and stir until well-chilled and diluted. Strain into a rocks glass filled with a large ice cube. Garnish with an orange twist.',
					ingredients: {
						create: [
							{ measurement: '2 oz', name: 'Bourbon or rye whiskey' },
							{ measurement: '1/4 oz', name: '2:1 Demerara syrup' },
							{ measurement: '2 dashes', name: 'Angostura bitters' },
							{ measurement: '1 dash', name: "Gaz Regan's Orange bitters" },
						],
					},
					image: {
						create: {
							altText: 'Old Fashioned cocktail',
							blob: await fs.promises.readFile('tests/fixtures/images/cocktails/old_fashioned.jpg'),
							contentType: 'image/jpeg',
							photographerId: photographerMattMillard.id,
						},
					},
					tags: { create: [{ name: 'Whiskey' }, { name: 'Bourbon' }, { name: 'Rye' }] },
				},
			},
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
