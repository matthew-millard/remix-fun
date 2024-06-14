import { PrismaClient } from '@prisma/client';
import { execaCommand } from 'execa';

const datasourceUrl = 'file:./tmp.ignored.db';
console.time('🗄️ Created database...');
await execaCommand('npx prisma migrate deploy', {
	stdio: 'inherit',
	env: { DATABASE_URL: datasourceUrl },
});
console.timeEnd('🗄️ Created database...');

const prisma = new PrismaClient({ datasourceUrl });

console.time('🔑 Created permissions...');
const entities = ['user'];
const actions = ['create', 'read', 'update', 'delete'];
const accesses = ['own', 'any'];
for (const entity of entities) {
	for (const action of actions) {
		for (const access of accesses) {
			await prisma.permission.create({ data: { entity, action, access } });
		}
	}
}
console.timeEnd('🔑 Created permissions...');

console.time('👑 Created roles...');
await prisma.role.create({
	data: {
		name: 'admin',
		permissions: {
			connect: await prisma.permission.findMany({
				select: { id: true },
				where: { access: 'any' },
			}),
		},
	},
});
await prisma.role.create({
	data: {
		name: 'user',
		permissions: {
			connect: await prisma.permission.findMany({
				select: { id: true },
				where: { access: 'own' },
			}),
		},
	},
});
console.timeEnd('👑 Created roles...');

console.log('✅ all done');
