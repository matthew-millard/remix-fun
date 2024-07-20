import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { generateTOTP } from '@epic-web/totp';
import { ActionFunctionArgs, json, MetaFunction, redirect } from '@remix-run/node';
import { Form, Link, useActionData } from '@remix-run/react';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';
import { HoneypotInputs } from 'remix-utils/honeypot/react';
import { z } from 'zod';
import { AlertToast, ErrorList } from '~/components';
import { checkCSRF } from '~/utils/csrf.server';
import { prisma } from '~/utils/db.server';
import { sendEmail } from '~/utils/email.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { ResetPasswordEmailSchema } from '~/utils/validation-schemas';
import { codeQueryParam, targetQueryParam, typeQueryParam } from './verify';
import { getDomainUrl } from '~/utils/misc';
import VerifyEmailAddress from 'packages/transactional/emails/VerifyEmailAddress';

const ResetPasswordSchema = z.object({
	email: ResetPasswordEmailSchema,
});

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData();
	checkCSRF(formData, request.headers);
	checkHoneypot(formData);

	const submission = await parseWithZod(formData, {
		schema: ResetPasswordSchema.transform(async (data, ctx) => {
			// // Check if the email exists in the database
			const user = await prisma.user.findUnique({
				where: { email: data.email },
				select: { id: true, firstName: true, username: true },
			});

			if (!user) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'There is no account associated with this email address.',
					path: ['email'],
				});
			}
			return { ...data, ...user };
		}),
		async: true,
	});

	if (submission.status !== 'success') {
		return json(
			submission.reply({
				fieldErrors: {
					email: ['There is no account associated with this email address.'],
				},
			}),
		);
	}

	const { email } = submission.value;

	const user = await prisma.user.findFirstOrThrow({
		where: { email },
		select: { id: true, firstName: true, username: { select: { username: true } } },
	});

	const { otp, secret, algorithm, charSet, digits, period } = generateTOTP({
		digits: 5,
		algorithm: 'SHA256',
		period: 15 * 60, // 15 minutes
		charSet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
	});

	const type = 'reset-password';
	const redirectToUrl = new URL('/verify', getDomainUrl(request));
	redirectToUrl.searchParams.set(typeQueryParam, type);
	redirectToUrl.searchParams.set(targetQueryParam, email);
	const verifyUrl = new URL(redirectToUrl);
	verifyUrl.searchParams.set(codeQueryParam, otp);

	const verificationData = {
		type,
		target: email,
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
				target: email,
				type,
			},
		},
		create: verificationData,
		update: verificationData,
	});

	const response = await sendEmail({
		to: [email],
		subject: 'Reset Password Notification',
		react: (
			<VerifyEmailAddress
				otp={otp}
				verifyUrl={verifyUrl.toString()}
				title={`${user.firstName}, you are receiving this email because we received a password reset request for your account.`}
				description="If you did not request a password reset, no further action is required."
			/>
		),
	});

	if (response.status !== 200) {
		return json({ status: 'error', message: 'An error occured' }, { status: 500 });
	}

	return redirect(redirectToUrl.toString());
}

export default function ForgotPasswordRoute() {
	const lastResult = useActionData();

	const [form, fields] = useForm({
		id: 'reset-password-form',
		lastResult,
		shouldRevalidate: 'onInput',
		constraint: getZodConstraint(ResetPasswordSchema),
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: ResetPasswordSchema });
		},
	});

	return (
		<>
			<div className=" flex flex-1 flex-col justify-center overflow-auto px-8 lg:py-32 ">
				<div className="sm:mx-auto sm:w-full sm:max-w-md">
					<h1 className="mt-3 text-center text-2xl font-bold leading-9 text-text-primary">Reset your password</h1>
					<p className="text-center text-text-secondary">
						Enter your email and we&apos;ll send you a link to reset your password.
					</p>
				</div>

				<div className="mx-auto mt-10 w-full sm:max-w-[480px]">
					<div className="">
						<Form {...getFormProps(form)} className="" method="POST">
							<HoneypotInputs />
							<AuthenticityTokenInput />
							<div className="relative pb-4">
								<label htmlFor={fields.email.id} className="block text-sm font-medium leading-6 text-text-primary">
									Email address
								</label>
								<div className="mt-2">
									<input
										{...getInputProps(fields.email, { type: 'email' })}
										className="block w-full rounded-md border-0 bg-white px-2 py-1.5 text-gray-900 shadow-sm ring-2 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-inset focus:ring-indigo-600  aria-[invalid]:ring-red-600 sm:text-sm sm:leading-6 "
										// eslint-disable-next-line jsx-a11y/no-autofocus
										autoFocus={true}
									/>
									<div
										className={`transition-height overflow-hidden px-2 py-1 duration-500 ease-in-out ${fields.email.errors ? 'max-h-56' : 'max-h-0'}`}
									>
										<ErrorList errors={fields.email.errors} id={fields.email.errorId} />
									</div>
								</div>
							</div>

							<div>
								<button
									type="submit"
									className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
								>
									Reset your password
								</button>
							</div>
							<div
								className={`transition-height overflow-hidden px-2 py-1 duration-500 ease-in-out ${form.errors ? 'max-h-56' : 'max-h-0'}`}
							>
								<AlertToast errors={form.errors} id={form.errorId} />
							</div>
						</Form>
						<div>
							<p className="mt-4 flex justify-end text-center text-sm text-text-secondary ">
								<Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
									Back to login
								</Link>
							</p>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}

export const meta: MetaFunction = () => {
	return [
		{ title: 'BarFly | Forgot Password' },
		{
			name: 'description',
			content: "Enter your email and we'll send you a link to reset your password.",
		},
	];
};

export const handle = {
	breadcrumb: () => (
		<Link
			prefetch="intent"
			className="ml-1 text-xs text-gray-400 hover:text-gray-500  lg:ml-4 lg:text-sm"
			to={`/forgot-password`}
		>
			Forgot Password
		</Link>
	),
};
