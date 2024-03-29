import { createCookieSessionStorage, redirect } from '@remix-run/node';

const USER_SESSION_KEY = 'userId';

export async function createUserSession({ request, userId }: { request: Request; userId: string }) {
	const session = await getSession(request);
	session.set(USER_SESSION_KEY, userId);
	return redirect('/', {
		headers: {
			'Set-Cookie': await sessionStorage.commitSession(session, {
				maxAge: 60 * 60 * 24 * 7, // 7 days,
			}),
		},
	});
}

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
	throw new Error('SESSION_SECRET must be set');
}

export const sessionStorage = createCookieSessionStorage({
	cookie: {
		name: 'BARFLY_user_session_id',
		httpOnly: true,
		path: '/',
		sameSite: 'lax',
		secrets: [sessionSecret],
		secure: process.env.NODE_ENV === 'production',
	},
});

export async function getSession(request: Request) {
	const cookie = request.headers.get('Cookie');
	return sessionStorage.getSession(cookie);
}

export async function logout(request: Request) {
	const session = await getSession(request);
	return redirect('/', {
		headers: {
			'Set-Cookie': await sessionStorage.destroySession(session),
		},
	});
}
