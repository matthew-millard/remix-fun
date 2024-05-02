import { createCookieSessionStorage, redirect } from '@remix-run/node';
import { z } from 'zod';
import { createId } from '@paralleldrive/cuid2';
import { combineHeaders } from './misc';

export const toastKey = 'toast';
const toastId = createId();

export type Toast = z.infer<typeof ToastSchema>;
export type ToastInput = z.infer<typeof ToastSchema>;

const toastSessionStorage = createCookieSessionStorage({
	cookie: {
		name: 'BARFLY_toast_notification',
		sameSite: 'lax',
		path: '/',
		httpOnly: true,
		secrets: process.env.SESSION_SECRET.split(','),
		secure: process.env.NODE_ENV === 'production',
	},
});

const ToastSchema = z.object({
	id: z.string().default(() => toastId),
	title: z.string().optional(),
	description: z.string(),
	type: z.enum(['success', 'error', 'info', 'warning']).default('info'),
});

export async function redirectWithToast(url: string, toast: ToastInput, init?: ResponseInit) {
	return redirect(url, {
		...init,
		headers: combineHeaders(init?.headers, await createToastHeaders(toast)),
	});
}

export async function createToastHeaders(toastInput: ToastInput) {
	const session = await toastSessionStorage.getSession();
	const toast = ToastSchema.parse(toastInput);
	session.set(toastKey, toast);
	const cookie = await toastSessionStorage.commitSession(session);
	return new Headers({ 'set-cookie': cookie });
}

export async function getToast(request: Request) {
	const session = await toastSessionStorage.getSession(request.headers.get('cookie'));
	const result = ToastSchema.safeParse(session.get(toastKey));
	const toast = result.success ? result.data : null;
	return {
		toast,
		headers: toast
			? new Headers({
					'set-cookie': await toastSessionStorage.destroySession(session),
				})
			: null,
	};
}
