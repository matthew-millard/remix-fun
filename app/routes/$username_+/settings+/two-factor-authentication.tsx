import { LoaderFunctionArgs } from '@remix-run/node';
import { Link } from '@remix-run/react';

export default function TwoFactorAuthenticationRoute() {
	return (
		<div>
			<h1>Two-Factor Authentication</h1>
			<p>Enable two-factor authentication to add an extra layer of security to your account.</p>
		</div>
	);
}

export const handle = {
	breadcrumb: ({ params: { username } }: LoaderFunctionArgs) => (
		<Link
			prefetch="intent"
			className="ml-4 text-sm  text-gray-400 hover:text-gray-500"
			to={`/${username}/settings/two-factor-authentication`}
		>
			Two-Factor Authentication
		</Link>
	),
};
