import { useRouteLoaderData } from '@remix-run/react';
import { type loader as rootLoader } from '../root';

// useOptionalUser function which get's the root loader data and
// returns the user if it exists, otherwise return null.
export function useOptionalUser() {
	const data = useRouteLoaderData<typeof rootLoader>('root');
	const user = data?.user;
	return user || null;
}

// useUser function which calls useOptionalUser and if the user
// does not exist, throws an error with an informative error message. Otherwise
// return the user
export function useUser() {
	const maybeUser = useOptionalUser();

	if (!maybeUser) {
		throw new Error('User does not exist');
	}

	return maybeUser;
}
