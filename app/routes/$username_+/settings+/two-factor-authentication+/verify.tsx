import { getFormProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { getTOTPAuthUri } from '@epic-web/totp';
import * as QRCode from 'qrcode';
import { ActionFunctionArgs, json, LoaderFunctionArgs, redirect } from '@remix-run/node';
import { Link, useActionData, useLoaderData, useNavigation } from '@remix-run/react';
import { z } from 'zod';
import { useIsPendingWithoutIntent } from '~/hooks/useIsPending';
import { requireUserId } from '~/utils/auth.server';
import { checkCSRF } from '~/utils/csrf.server';
import { prisma } from '~/utils/db.server';
import { getDomainUrl } from '~/utils/misc';
import { redirectWithToast } from '~/utils/toast.server';
import OneTimePassword from '~/components/ui/OneTimePassword';
import { isCodeValid } from '~/routes/_auth+/verify';
import { twoFAVerificationType } from './_layout';

export const twoFAVerifyVerificationType = '2fa-verify';

export const VerifySchema = z.object({
	code: z.string().min(5).max(5),
});

export async function loader({ request, params }: LoaderFunctionArgs) {
	const userId = await requireUserId(request);
	const username = params.username;
	const verification = await prisma.verification.findUnique({
		where: {
			target_type: { type: twoFAVerifyVerificationType, target: userId },
			expiresAt: { gt: new Date() },
		},
		select: {
			id: true,
			algorithm: true,
			secret: true,
			period: true,
			digits: true,
		},
	});

	if (!verification) {
		return redirect(`/${username}/settings/two-factor-authentication`);
	}

	const user = await prisma.user.findUniqueOrThrow({
		where: { id: userId },
		select: { email: true },
	});

	const issuer = new URL(getDomainUrl(request)).host;
	const otpUri = getTOTPAuthUri({
		...verification,
		accountName: user.email,
		issuer,
	});

	const qrCode = await QRCode.toDataURL(otpUri);
	return json({ otpUri, qrCode });
}

export async function action({ request, params }: ActionFunctionArgs) {
	const userId = await requireUserId(request);
	const username = params.username;
	const formData = await request.formData();
	await checkCSRF(formData, request.headers);

	if (formData.get('intent') === 'cancel') {
		await prisma.verification.deleteMany({
			where: { type: twoFAVerifyVerificationType, target: userId },
		});
		return redirect(`/${username}/settings/two-factor-authentication`);
	}

	const submission = await parseWithZod(formData, {
		schema: VerifySchema.transform(async (data, ctx) => {
			// Check if the code is valid
			const codeIsValid = await isCodeValid({
				code: data.code,
				target: userId,
				type: twoFAVerifyVerificationType,
			});

			if (!codeIsValid) {
				ctx.addIssue({
					path: ['code'],
					code: z.ZodIssueCode.custom,
					message: `Invalid code`,
				});
				return z.NEVER;
			}
			return data;
		}),

		async: true,
	});

	if (submission.status !== 'success') {
		return json(submission.reply({ formErrors: ['Invalid code'] }), {
			status: submission.status === 'error' ? 400 : 200,
		});
	}
	if (!submission.value) {
		return json({ status: 'error', submission } as const, { status: 400 });
	}

	// we'll need to update the verification type here...

	await prisma.verification.update({
		where: {
			target_type: { type: twoFAVerifyVerificationType, target: userId },
		},
		data: {
			expiresAt: null,
			type: twoFAVerificationType,
		},
	});

	throw await redirectWithToast(`/${username}/settings/two-factor-authentication`, {
		type: 'success',
		title: 'Enabled',
		description: 'Two-factor authentication has been enabled.',
	});
}

export default function TwoFactorAuthVerifyRoute() {
	const data = useLoaderData<typeof loader>();

	return (
		<div className="flex justify-center lg:pb-12 lg:pt-4">
			<div className="w-full max-w-lg overflow-hidden rounded-xl bg-bg-secondary shadow-xl">
				<div className="flex flex-col items-center justify-center   px-8 pt-12">
					<div className="flex flex-col items-center justify-center gap-y-12 text-3xl font-semibold">
						<h2 className="text-2xl font-bold tracking-tight text-text-primary lg:text-3xl">
							Set up authenticator app
						</h2>
						<img alt="qr code" src={data.qrCode} className="h-56 w-56 rounded-xl" />
						<p className="max-w-xl text-center text-base leading-8 text-text-primary">
							Scan this QR code with your authenticator app, and enter the code it generates below.
						</p>
					</div>
				</div>
				<OneTimePassword otpUri={data.otpUri} />
			</div>
		</div>
	);
}

export const handle = {
	breadcrumb: ({ params: { username } }: LoaderFunctionArgs) => (
		<Link
			prefetch="intent"
			className="ml-1 text-xs text-gray-400 hover:text-gray-500  lg:ml-4 lg:text-sm"
			to={`/${username}/settings/two-factor-authentication/verify`}
		>
			Verify
		</Link>
	),
};
