import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import { generateTOTP } from '@epic-web/totp';
import { ActionFunctionArgs, json, LoaderFunctionArgs, redirect } from '@remix-run/node';
import { Form, Link, useActionData, useNavigation } from '@remix-run/react';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';
import { z, ZodIssueCode } from 'zod';
import { InputField, SubmitButton } from '~/components';
import { requireUserId } from '~/utils/auth.server';
import { checkCSRF } from '~/utils/csrf.server';
import { prisma } from '~/utils/db.server';
import { sendEmail } from '~/utils/email.server';
import { getDomainUrl } from '~/utils/misc';
import { ChangeEmailSchema } from '~/utils/validation-schemas';
import { codeQueryParam, targetQueryParam, typeQueryParam } from '../../_auth+/verify';
import { verifySessionStorage } from '~/utils/verification.server';
import VerifyEmailAddress from 'packages/transactional/emails/VerifyEmailAddress';
import { EnvelopeIcon } from '@heroicons/react/24/outline';

export const newEmailAddressSessionKey = 'new-email-address';

const Schema = z.object({
	email: ChangeEmailSchema,
});

export async function loader({ request }: LoaderFunctionArgs) {
	await requireUserId(request);
	return {};
}

export async function action({ request }: ActionFunctionArgs) {
	const userId = await requireUserId(request);
	const formData = await request.formData();
	await checkCSRF(formData, request.headers);

	const submission = await parseWithZod(formData, {
		async: true,
		schema: Schema.transform(async (data, ctx) => {
			// Check if this email doesn't alreadt exist in the db

			const emailExists = await prisma.user.findUnique({
				where: {
					email: data.email,
				},
				select: {
					firstName: true,
				},
			});

			if (emailExists) {
				ctx.addIssue({
					code: ZodIssueCode.custom,
					message: 'Email already exists',
					path: ['email'],
				});

				return z.NEVER;
			}

			return { ...data };
		}),
	});

	if (submission.status !== 'success') {
		return json(submission.reply());
	}

	const { email } = submission.value;

	// Send Verification code to new email address
	const { otp, secret, algorithm, digits, period, charSet } = generateTOTP({
		digits: 5,
		algorithm: 'SHA256',
		period: 15 * 60, // 15 minutes
		charSet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
	});

	const type = 'change-email';
	const redirectToUrl = new URL('/verify', getDomainUrl(request));
	redirectToUrl.searchParams.set(typeQueryParam, type);
	redirectToUrl.searchParams.set(targetQueryParam, userId);
	const verifyUrl = new URL(redirectToUrl);
	verifyUrl.searchParams.set(codeQueryParam, otp);

	const verificationData = {
		type,
		target: userId,
		secret,
		algorithm,
		digits,
		period,
		charSet,
		expiresAt: new Date(Date.now() + period * 1000),
	};

	await prisma.verification.upsert({
		where: {
			target_type: {
				target: userId,
				type,
			},
		},
		create: verificationData,
		update: verificationData,
	});

	const response = await sendEmail({
		to: [email],
		subject: 'Change Email Verification',
		react: (
			<VerifyEmailAddress
				otp={otp}
				verifyUrl={verifyUrl.toString()}
				title="Change Email"
				description="If you did not request a change to your email address associated with your Barfly account, you can safely
		ignore this email."
			/>
		),
	});

	if (response.status === 200) {
		const verifySession = await verifySessionStorage.getSession(request.headers.get('cookie'));
		verifySession.set(newEmailAddressSessionKey, submission.value.email);
		return redirect(redirectToUrl.toString(), {
			headers: {
				'set-cookie': await verifySessionStorage.commitSession(verifySession),
			},
		});
	} else {
		return json(
			submission.reply({
				formErrors: ['Something went wrong. Unable to change email.'],
			}),
			{ status: 500 },
		);
	}
}

export default function ChangeEmailRoute() {
	const navigation = useNavigation();

	const isChangeEmailSubmitting = navigation.state === 'submitting';
	const [form, fields] = useForm({
		id: 'change-email-form',
		shouldValidate: 'onSubmit',
		shouldRevalidate: 'onInput',
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: Schema });
		},
		lastResult: useActionData(),
	});

	return (
		<main className="flex min-h-[calc(100vh-100px)]  justify-center py-20 lg:min-h-[calc(100vh-125px)] lg:items-center">
			<Form {...getFormProps(form)} method="POST" className="w-full max-w-[40rem] lg:-mt-28">
				<AuthenticityTokenInput />
				<div>
					<div className="flex items-center text-base font-semibold leading-7 text-text-primary">
						<EnvelopeIcon height={32} strokeWidth={1} color="#a9adc1" />
						<h2 className="ml-4">Change email address</h2>
					</div>
					<p className="mt-3 text-sm leading-6 text-text-secondary">Provide the new email address for your account.</p>
				</div>
				<div className="mt-8">
					<InputField
						fieldAttributes={{ ...getInputProps(fields.email, { type: 'email' }) }}
						label="New email address"
						htmlFor={fields.email.id}
						errors={fields.email.errors}
						errorId={fields.email.errorId}
						additionalClasses={{
							backgroundColor: 'bg-bg-secondary',
							textColor: 'text-text-primary',
						}}
					/>
				</div>
				<div className="mt-4 sm:flex sm:items-center sm:space-x-4 sm:space-x-reverse">
					<SubmitButton
						text="Change email"
						isSubmitting={isChangeEmailSubmitting}
						width="w-auto"
						stateText="Changing email..."
					/>
				</div>
			</Form>
		</main>
	);
}

export const handle = {
	breadcrumb: ({ params: { username } }: LoaderFunctionArgs) => (
		<Link
			prefetch="intent"
			className="ml-1 text-xs text-gray-400 hover:text-gray-500  lg:ml-4 lg:text-sm"
			to={`/${username}/settings/change-email`}
		>
			Change Email
		</Link>
	),
};
