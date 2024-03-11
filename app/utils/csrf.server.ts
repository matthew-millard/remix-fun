import { createCookie } from '@remix-run/node';
import { CSRF, CSRFError } from 'remix-utils/csrf/server';

const csrfSecret = process.env.CSRF_SECRET;
if (!csrfSecret) {
	throw new Error('CSRF_SECRET must be set');
}

export const cookie = createCookie('BARFLY_csrf', {
	path: '/',
	httpOnly: true,
	sameSite: 'lax',
	secrets: [csrfSecret],
	secure: process.env.NODE_ENV === 'production',
});

export const csrf = new CSRF({
	cookie,
	// what key in FormData objects will be used for the token, defaults to `csrf`
	formDataKey: 'csrf',
	// an optional secret used to sign the token, recommended for extra safety
	secret: csrfSecret,
});

export async function checkCSRF(formData: FormData, headers: Headers) {
	try {
		await csrf.validate(formData, headers);
	} catch (error) {
		if (error instanceof CSRFError) {
			throw new Response('Invalid CSRF token', { status: 403 });
		}
		throw error;
	}
}
