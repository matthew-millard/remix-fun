import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Link, useNavigate } from '@remix-run/react';

export default function TwoFactorAuthRoute() {
	const navigate = useNavigate();
	return (
		<div>
			<div className="px-6 py-10 pb-32 sm:px-6 sm:py-32 lg:px-8">
				<div className="mx-auto max-w-2xl text-center">
					<h1 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
						Enable two-factor authentication
					</h1>
					<p className="mx-auto mt-6 max-w-xl text-base leading-8 text-text-secondary sm:text-lg">
						Two factor authentication adds an extra layer of security to your account. You will need to enter a code
						from an authenticator app like{' '}
						<a href="https://1password.com/" target="blank" className="text-text-notify underline">
							1Password
						</a>{' '}
						to log in.
					</p>
					<div className="mt-10 flex items-center justify-center gap-x-6">
						<Link
							to="/"
							className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-indigo-600 shadow-sm hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
						>
							Enable 2FA
						</Link>
						<button
							onClick={() => navigate('../')}
							className="flex flex-row items-center gap-x-1 text-sm font-semibold leading-6 text-text-notify"
							type="button"
						>
							<span aria-hidden="true">
								<ArrowLeftIcon height={'14'} />
							</span>
							Back{' '}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
