import { generateTOTP } from '@epic-web/totp';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { ActionFunctionArgs, json, LoaderFunctionArgs, redirect } from '@remix-run/node';
import { Form, useLoaderData, useNavigate } from '@remix-run/react';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';
import { requireUserId } from '~/utils/auth.server';
import { checkCSRF } from '~/utils/csrf.server';
import { prisma } from '~/utils/db.server';
import { twoFAVerifyVerificationType } from './verify';
import { twoFAVerificationType } from './_layout';
import { DialogBox } from '~/components';
import { useState } from 'react';

export async function loader({ request }: LoaderFunctionArgs) {
	const userId = await requireUserId(request);
	const verification = await prisma.verification.findUnique({
		where: {
			target_type: {
				target: userId,
				type: twoFAVerificationType,
			},
		},
		select: {
			id: true,
		},
	});

	return json({ is2FAEnabled: Boolean(verification) });
}

export async function action({ request }: ActionFunctionArgs) {
	const userId = await requireUserId(request);
	const formData = await request.formData();
	await checkCSRF(formData, request.headers);
	const { username } = await prisma.user.findUnique({
		where: {
			id: userId,
		},
		select: {
			username: {
				select: {
					username: true,
				},
			},
		},
	});

	const { secret, period, algorithm, charSet, digits } = generateTOTP({ period: 10, digits: 5 });

	const verificationData = {
		type: twoFAVerifyVerificationType,
		target: userId,
		secret,
		period,
		algorithm,
		charSet,
		digits,
		expiresAt: new Date(Date.now() + period * 60 * 1000),
	};

	await prisma.verification.upsert({
		where: {
			target_type: {
				target: verificationData.target,
				type: verificationData.type,
			},
		},
		update: verificationData,
		create: verificationData,
	});

	return redirect(`/${username.username}/settings/two-factor-authentication/verify`);
}

export default function TwoFactorAuthRoute() {
	const { is2FAEnabled } = useLoaderData<typeof loader>();
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const navigate = useNavigate();

	function showDialog(bool: boolean) {
		setIsDialogOpen(bool);
	}

	const handleBackClick = () => {
		navigate('../', { preventScrollReset: true });
	};

	const dialogProps = {
		actionUrl: `/disable-two-factor-authentication`,
		showDialog,
		open: isDialogOpen,
		title: 'Disable 2FA',
		description: 'Are you sure you want to disable two-factor authentication? You can enable it again at any time.',
	};

	return (
		<div>
			{is2FAEnabled ? (
				<div className="px-6 py-10 pb-32 sm:px-6 sm:py-32 lg:px-8">
					<div className="mx-auto max-w-2xl text-center">
						<h1 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
							Disable two-factor authentication
						</h1>
						<p className="mx-auto mt-6 max-w-xl text-base leading-8 text-text-secondary sm:text-lg">
							Disabling two-factor authentication will make your account less secure. You will only need your password
							to log in.
						</p>
						<div className="mt-10 flex items-center justify-center gap-x-6">
							<button
								type="button"
								onClick={() => showDialog(true)}
								className="rounded-md bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white dark:bg-white dark:text-indigo-600 dark:hover:bg-indigo-50"
							>
								Disable 2FA
							</button>

							<button
								onClick={handleBackClick}
								className="flex flex-row items-center gap-x-1 text-sm font-semibold leading-6 text-text-notify"
								type="button"
							>
								<span aria-hidden="true">
									<ArrowLeftIcon height={'14'} />
								</span>
								Back{' '}
							</button>
						</div>
						<DialogBox {...dialogProps} />
					</div>
				</div>
			) : (
				<div className="px-6 py-10 pb-32 sm:px-6 sm:py-32 lg:px-8">
					<div className="mx-auto max-w-2xl text-center">
						<h1 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
							Enable two-factor authentication
						</h1>
						<p className="mx-auto mt-6 max-w-xl text-base leading-8 text-text-secondary sm:text-lg">
							Two factor authentication adds an extra layer of security to your account. You will need to enter a code
							from an authenticator app like{' '}
							<a href="https://1password.com/" target="blank" className="text-text-notify underline underline-offset-2">
								1Password
							</a>{' '}
							to log in.
						</p>
						<div className="mt-10 flex items-center justify-center gap-x-6">
							<Form method="POST">
								<AuthenticityTokenInput />
								<button
									type="submit"
									className="rounded-md bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white dark:bg-white dark:text-indigo-600 dark:hover:bg-indigo-50"
								>
									Enable 2FA
								</button>
							</Form>
							<button
								onClick={handleBackClick}
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
			)}
		</div>
	);
}
