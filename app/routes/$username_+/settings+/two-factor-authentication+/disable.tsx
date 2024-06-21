import { LoaderFunctionArgs } from '@remix-run/node';
import { Link } from '@remix-run/react';

export default function TwoFactorAuthDisableRoute() {
	return (
		<div>
			<h2>Two-Factor Authentication</h2>
			<p>Two-Factor Authentication is currently enabled for your account.</p>
			<p>To disable Two-Factor Authentication, you will need to enter the code from your authenticator app.</p>
		</div>
	);
}

export const handle = {
	breadcrumb: ({ params: { username } }: LoaderFunctionArgs) => (
		<Link
			prefetch="intent"
			className="ml-4 text-sm  text-gray-400 hover:text-gray-500"
			to={`/${username}/settings/two-factor-authentication/disable`}
		>
			Disable
		</Link>
	),
};
