import { ShieldCheckIcon } from '@heroicons/react/16/solid';
import { LoaderFunctionArgs } from '@remix-run/node';
import { Link, Outlet } from '@remix-run/react';

export default function TwoFactorAuthLayoutRoute() {
	return <Outlet />;
}

export const handle = {
	breadcrumb: ({ params: { username } }: LoaderFunctionArgs) => (
		<Link
			prefetch="intent"
			className="ml-4 text-sm  text-gray-400 hover:text-gray-500"
			to={`/${username}/settings/two-factor-authentication`}
		>
			<ShieldCheckIcon className="-mt-1 mr-1 inline-block h-5 w-5" />
			2FA
		</Link>
	),
};
