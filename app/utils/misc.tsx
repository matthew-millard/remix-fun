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
