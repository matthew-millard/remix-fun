import { type Password, type Username, type User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { getSession, sessionStorage } from './session.server';
import { prisma } from './db.server';
import { redirect } from '@remix-run/node';
import { safeRedirect } from 'remix-utils/safe-redirect';
import { combineResponseInits } from './misc';

export { bcrypt };

// Cookie Expiration Time
const SESSION_EXPIRATION_TIME = 1000 * 60 * 60 * 24 * 30; // 30 days

export function getSessionExpirationDate() {
	const expirationDate = new Date(Date.now() + SESSION_EXPIRATION_TIME);
	return expirationDate;
}

export const sessionKey = 'sessionId';

export async function getUserId(request: Request) {
	const cookieSession = await getSession(request);
	const sessionId = cookieSession.get(sessionKey);

	if (!sessionId) return null;

	const session = await prisma.session.findUnique({
		where: { id: sessionId },
		select: { userId: true },
	});
	if (!session) {
		throw await logout({ request });
	}
	return session.userId;
}

export async function requireUserId(request: Request, { redirectTo }: { redirectTo?: string | null } = {}) {
	const userId = await getUserId(request);
	if (!userId) {
		const requestUrl = new URL(request.url);
		redirectTo = redirectTo === null ? null : redirectTo ?? `${requestUrl.pathname}${requestUrl.search}`;
		const loginParams = redirectTo ? new URLSearchParams({ redirectTo }) : null;
		const loginRedirect = ['/login', loginParams?.toString()].filter(Boolean).join('?');
		throw redirect(loginRedirect);
	}
	return userId;
}

export async function requireAnonymous(request: Request) {
	const userId = await getUserId(request);
	if (userId) {
		throw redirect('/', { status: 303 });
	}
}

export async function requireUser(request: Request) {
	const userId = await requireUserId(request);

	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { id: true, username: true },
	});

	if (!user) {
		throw await logout({ request });
	}

	return user;
}

export async function verifyUserPassword(where: Pick<User, 'email'> | Pick<User, 'id'>, password: Password['hash']) {
	const userWithPassword = await prisma.user.findUnique({
		where,
		select: { id: true, password: { select: { hash: true } } },
	});

	if (!userWithPassword || !userWithPassword.password) {
		return null;
	}

	const isValid = await bcrypt.compare(password, userWithPassword.password.hash);

	if (!isValid) {
		return null;
	}

	return { id: userWithPassword.id };
}

export async function getPasswordHash(password: string) {
	const hash = await bcrypt.hash(password, 10);
	return hash;
}

export async function logout(
	{
		request,
		redirectTo = '/',
	}: {
		request: Request;
		redirectTo?: string;
	},
	responseInit?: ResponseInit,
) {
	const cookieSession = await sessionStorage.getSession(request.headers.get('cookie'));
	const sessionId = cookieSession.get(sessionKey);
	void prisma.session.delete({ where: { id: sessionId } }).catch(() => {});

	throw redirect(
		safeRedirect(redirectTo),
		combineResponseInits(responseInit, {
			headers: {
				'set-cookie': await sessionStorage.destroySession(cookieSession),
			},
		}),
	);
}

export async function signup({
	email,
	firstName,
	lastName,
	password,
	username,
}: {
	email: User['email'];
	firstName: User['firstName'];
	lastName: User['lastName'];
	password: string;
	username: Username['username'];
}) {
	const passwordHash = await getPasswordHash(password);

	const session = await prisma.session.create({
		data: {
			expirationDate: getSessionExpirationDate(),
			user: {
				create: {
					email,
					firstName,
					lastName,
					roles: { connect: { name: 'user' } },
					password: {
						create: {
							hash: passwordHash,
						},
					},
					username: {
						create: {
							username,
						},
					},
				},
			},
		},
		select: { id: true, expirationDate: true },
	});
	return session;
}

export async function login({ email, password }: { email: User['email']; password: string }) {
	const user = await verifyUserPassword({ email }, password);

	if (!user) return null;

	const session = await prisma.session.create({
		data: {
			userId: user.id,
			expirationDate: getSessionExpirationDate(),
		},
		select: { id: true, expirationDate: true, userId: true },
	});

	return session;
}
