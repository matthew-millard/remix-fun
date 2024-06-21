import { getFormProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { getTOTPAuthUri } from '@epic-web/totp';
import * as QRCode from 'qrcode';
import { ActionFunctionArgs, json, LoaderFunctionArgs, redirect } from '@remix-run/node';
import { Form, Link, useActionData, useLoaderData, useNavigation } from '@remix-run/react';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';
import { z } from 'zod';
import { useIsPendingWithoutIntent } from '~/hooks/useIsPending';
import { requireUserId } from '~/utils/auth.server';
import { checkCSRF } from '~/utils/csrf.server';
import { prisma } from '~/utils/db.server';
import { getDomainUrl } from '~/utils/misc';
import { redirectWithToast } from '~/utils/toast.server';
import OneTimePassword from '~/components/ui/OneTimePassword';

export const twoFAVerifyVerificationType = '2fa-verify';

const VerifySchema = z.object({
	code: z.string().min(6).max(6),
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
		schema: () =>
			VerifySchema.transform(async (data, ctx) => {
				const codeIsValid = false;
				if (!codeIsValid) {
					ctx.addIssue({
						path: ['code'],
						code: z.ZodIssueCode.custom,
						message: `Invalid code`,
					});
					return z.NEVER;
				}
			}),

		async: true,
	});

	if (submission.status !== 'success') {
		return json(submission.reply({ formErrors: ['Submission failed'] }), {
			status: submission.status === 'error' ? 400 : 200,
		});
	}
	if (!submission.value) {
		return json({ status: 'error', submission } as const, { status: 400 });
	}

	// we'll need to update the verification type here...

	throw await redirectWithToast(`/${username}/settings/two-factor-authentication`, {
		type: 'success',
		title: 'Enabled',
		description: 'Two-factor authentication has been enabled.',
	});
}

export default function TwoFactorAuthVerifyRoute() {
	const data = useLoaderData<typeof loader>();
	const actionData = useActionData();
	const navigation = useNavigation();

	const isPending = useIsPendingWithoutIntent();
	const pendingIntent = isPending ? navigation.formData?.get('intent') : null;

	const [form, fields] = useForm({
		id: 'verify-form',
		constraint: getZodConstraint(VerifySchema),
		lastResult: actionData,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: VerifySchema });
		},
	});

	return (
		<div className="flex justify-center pb-12 pt-4">
			<div className="w-full max-w-lg overflow-hidden rounded-xl bg-bg-secondary shadow-xl">
				<div className="flex flex-col items-center justify-center   px-8 pt-12">
					<div className="flex flex-col items-center justify-center gap-y-12 text-3xl font-semibold">
						<h2 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
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
			className="ml-4 text-sm  text-gray-400 hover:text-gray-500"
			to={`/${username}/settings/two-factor-authentication/verify`}
		>
			Verify
		</Link>
	),
};
