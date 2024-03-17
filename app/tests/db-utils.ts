import bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker';

const saltRounds = 10;
export function createPassword(password: string = faker.internet.password({ length: 20 })) {
	const salt = bcrypt.genSaltSync(saltRounds);
	const hash = bcrypt.hashSync(password, salt);
	return {
		hash,
	};
}
