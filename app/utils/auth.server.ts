import bcrypt from 'bcryptjs';

export { bcrypt };

// Cookie Expiration Time
const SESSION_EXPIRATION_TIME = 1000 * 60 * 60 * 24 * 30; // 30 days

export function getSessionExpirationDate() {
	const expirationDate = Date.now() + SESSION_EXPIRATION_TIME;
	return expirationDate;
}
