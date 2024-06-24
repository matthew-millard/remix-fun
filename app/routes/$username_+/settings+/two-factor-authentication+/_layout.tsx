import { ShieldCheckIcon } from '@heroicons/react/16/solid';
import { LoaderFunctionArgs } from '@remix-run/node';
import { Link, Outlet } from '@remix-run/react';
import { VerificationTypes } from '~/routes/_auth+/verify';

export const twoFAVerificationType = '2fa' satisfies VerificationTypes;

export default function TwoFactorAuthLayoutRoute() {
	return <Outlet />;
}

export const handle = {
	breadcrumb: ({ params: { username } }: LoaderFunctionArgs) => (
		<Link
			prefetch="intent"
			className="ml-1 text-xs text-gray-400 hover:text-gray-500  lg:ml-4 lg:text-sm"
			to={`/${username}/settings/two-factor-authentication`}
		>
			<ShieldCheckIcon className="-mt-1 mr-1 inline-block h-4 w-4 lg:h-5 lg:w-5" />
			2FA
		</Link>
	),
};
