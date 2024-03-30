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
