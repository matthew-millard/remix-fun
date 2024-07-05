import { redirectToQueryParam, targetQueryParam, typeQueryParam, VerificationTypes } from '~/routes/_auth+/verify';

/**
 * Does its best to get a string error message from an unknown error.
 */
export function getErrorMessage(error: unknown) {
	if (typeof error === 'string') return error;
	if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
		return error.message;
	}
	console.error('Unable to get error message for error', error);
	return 'Unknown Error';
}

export function invariantResponse(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	condition: any,
	message?: string | (() => string),
	responseInit?: ResponseInit,
): asserts condition {
	if (!condition) {
		throw new Response(
			typeof message === 'function'
				? message()
				: message || 'An invariant failed, please provide a message to explain why.',
			{ status: 400, ...responseInit },
		);
	}
}

/**
 * Combine multiple header objects into one (uses append so headers are not overridden)
 */
export function combineHeaders(...headers: Array<ResponseInit['headers'] | null>) {
	const combined = new Headers();
	for (const header of headers) {
		if (!header) continue;
		for (const [key, value] of new Headers(header).entries()) {
			combined.append(key, value);
		}
	}
	return combined;
}

/**
 * Combine multiple response init objects into one (uses combineHeaders)
 */
export function combineResponseInits(...responseInits: Array<ResponseInit | undefined>) {
	let combined: ResponseInit = {};
	for (const responseInit of responseInits) {
		combined = {
			...responseInit,
			headers: combineHeaders(combined.headers, responseInit?.headers),
		};
	}
	return combined;
}

export function getDomainUrl(request: Request) {
	const host = request.headers.get('X-Forwarded-Host') ?? request.headers.get('host');
	if (!host) {
		throw new Error('Could not determine domain URL.');
	}
	const protocol = host.includes('localhost') ? 'http' : 'https';
	return `${protocol}://${host}`;
}

export function invariant(condition: any, message: string | (() => string)): asserts condition {
	if (!condition) {
		throw new Error(typeof message === 'function' ? message() : message);
	}
}

export function getRedirectToUrl({
	request,
	type,
	target,
	redirectTo,
}: {
	request: Request;
	type: VerificationTypes;
	target: string;
	redirectTo?: string;
}) {
	const redirectToUrl = new URL(`${getDomainUrl(request)}/verify`);
	redirectToUrl.searchParams.set(typeQueryParam, type);
	redirectToUrl.searchParams.set(targetQueryParam, target);
	if (redirectTo) {
		redirectToUrl.searchParams.set(redirectToQueryParam, redirectTo);
	}
	return redirectToUrl;
}

export function timeAgo(date: Date) {
	const publishedDate = date.getTime();
	const currentDate = new Date().getTime();

	const seconds = Math.floor((currentDate - publishedDate) / 1000);

	const interval = Math.floor(seconds / 31536000);

	if (interval > 1) {
		return interval + ' years ago';
	}
	if (interval === 1) {
		return interval + ' year ago';
	}

	const months = Math.floor(seconds / 2628000);
	if (months > 1) {
		return months + ' months ago';
	}
	if (months === 1) {
		return months + ' month ago';
	}

	const days = Math.floor(seconds / 86400);
	if (days > 1) {
		return days + ' days ago';
	}
	if (days === 1) {
		return days + ' day ago';
	}

	const hours = Math.floor(seconds / 3600);
	if (hours > 1) {
		return hours + ' hours ago';
	}
	if (hours === 1) {
		return hours + ' hour ago';
	}

	const minutes = Math.floor(seconds / 60);
	if (minutes > 1) {
		return minutes + ' minutes ago';
	}
	if (minutes === 1) {
		return minutes + ' minute ago';
	}

	return 'just now';
}
