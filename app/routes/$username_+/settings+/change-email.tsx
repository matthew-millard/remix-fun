import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import { generateTOTP } from '@epic-web/totp';
import { ActionFunctionArgs, json, LoaderFunctionArgs, redirect } from '@remix-run/node';
import { Form, Link, useActionData } from '@remix-run/react';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';
import { HoneypotInputs } from 'remix-utils/honeypot/react';
import { z, ZodIssueCode } from 'zod';
import { ErrorList } from '~/components';
import { requireUserId } from '~/utils/auth.server';
import { checkCSRF } from '~/utils/csrf.server';
import { prisma } from '~/utils/db.server';
import { sendEmail } from '~/utils/email.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { getDomainUrl } from '~/utils/misc';
import { ChangeEmailSchema } from '~/utils/validation-schemas';
import { codeQueryParam, targetQueryParam, typeQueryParam } from '../../_auth+/verify';
import { verifySessionStorage } from '~/utils/verification.server';
import VerifyEmailAddress from 'packages/transactional/emails/VerifyEmailAddress';

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
	checkHoneypot(formData);

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
		digits: 6,
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
	const lastResult = useActionData();
	const [form, fields] = useForm({
		id: 'change-email-form',
		shouldRevalidate: 'onInput',
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: Schema });
		},
		lastResult,
	});

	return (
		<Form {...getFormProps(form)} method="POST" className="mx-auto  max-w-3xl px-6 py-6">
			<HoneypotInputs />
			<AuthenticityTokenInput />
			<div className="space-y-12">
				<div className=" pb-6">
					<h2 className="text-base font-semibold leading-7 text-text-primary">Change Email</h2>
					<p className="mt-1 text-sm leading-6 text-text-secondary">
						Update your email address associated with your account.
					</p>

					<div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6">
						<div className="sm:col-span-4">
							<label htmlFor={fields.email.id} className="block text-sm font-medium leading-6 text-text-primary">
								New Email Address
							</label>
							<div className="mt-2">
								<div className="flex w-full rounded-md bg-bg-secondary ring-1 ring-inset ring-border-tertiary focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500">
									<input
										{...getInputProps(fields.email, { type: 'email' })}
										className="flex-1 border-0 bg-transparent  px-2 py-1.5 text-text-primary focus:ring-0 aria-[invalid]:ring-red-600 sm:text-sm sm:leading-6"
									/>
								</div>
								<div
									className={`transition-height overflow-hidden  py-1 duration-500 ease-in-out ${fields.email.errors ? 'max-h-56' : 'max-h-0'}`}
								>
									<ErrorList errors={fields.email.errors} id={fields.email.errorId} />
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="border-b border-border-tertiary  pb-8">
				<div className="flex ">
					<button
						type="submit"
						className="rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
					>
						Change Email
					</button>
				</div>
			</div>
		</Form>
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
