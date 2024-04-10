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
	const expirationDate = Date.now() + SESSION_EXPIRATION_TIME;
	return expirationDate;
}

export async function getUserId(request: Request) {
	const session = await getSession(request);
	const userId = session.get('userId');

	if (!userId) return null;
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { id: true },
	});
	if (!user) {
		throw await logout({ request });
	}
	return user.id;
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
	console.log('requireUser');
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
	throw redirect(
		safeRedirect(redirectTo),
		combineResponseInits(responseInit, {
			headers: {
				'set-cookie': await sessionStorage.destroySession(cookieSession),
			},
		}),
	);
}
