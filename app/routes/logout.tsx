import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from '@remix-run/node';
import { getSession, sessionStorage } from '~/utils/session.server';

export async function loader({ request }: LoaderFunctionArgs) {
	return redirect('/');
}

export async function action({ request }: ActionFunctionArgs) {
	const session = await getSession(request);
	return redirect('/', {
		headers: {
			'Set-Cookie': await sessionStorage.destroySession(session),
		},
	});
}
