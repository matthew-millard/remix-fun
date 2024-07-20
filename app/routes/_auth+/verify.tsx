import { getFormProps, getInputProps, type Submission, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { verifyTOTP } from '@epic-web/totp';
import { ActionFunctionArgs, json, LoaderFunctionArgs, MetaFunction, redirect } from '@remix-run/node';
import { Form, useActionData, useNavigation, useSearchParams, useSubmit } from '@remix-run/react';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';
import { z } from 'zod';
import { OTP, SrOnlyLabel, SubmitButton } from '~/components';
import { checkCSRF } from '~/utils/csrf.server';
import { prisma } from '~/utils/db.server';
import { verifySessionStorage } from '~/utils/verification.server';
import { newEmailAddressSessionKey } from '../$username_+/settings+/change-email';
import { sendEmail } from '~/utils/email.server';
import { invariant } from '~/utils/misc';
import EmailChangedNotification from 'packages/transactional/emails/EmailChangedNotification';
import { redirectWithToast } from '~/utils/toast.server';
import { twoFAVerifyVerificationType } from '../$username_+/settings+/two-factor-authentication+/verify';
import React, { useRef } from 'react';
import { handleVerification as handle2FAVerification } from './login';
import { InputErrors } from '~/components/InputField';
export const codeQueryParam = 'code';
export const typeQueryParam = 'type';
export const targetQueryParam = 'target';
export const redirectToQueryParam = 'redirectTo';

const types = ['signup', 'reset-password', 'change-email', '2fa'] as const;
const verificationTypeSchema = z.enum(types);
export type VerificationTypes = z.infer<typeof verificationTypeSchema>;

export const resetPasswordUserSessionKey = 'user';

const VerifySchema = z.object({
	[codeQueryParam]: z.string().min(5).max(5),
	[typeQueryParam]: verificationTypeSchema,
	[targetQueryParam]: z.string(),
	[redirectToQueryParam]: z.string().optional(),
});

export async function loader({ request }: LoaderFunctionArgs) {
	const params = new URL(request.url).searchParams;

	if (!params.has(codeQueryParam)) {
		return json({
			status: 'idle',
			submission: {
				intent: '',
				payload: Object.fromEntries(params) as Record<string, unknown>,
				error: {} as Record<string, Array<string>>,
			},
		} as const);
	}

	return validateRequest(request, params);
}

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData();
	checkCSRF(formData, request.headers);

	return validateRequest(request, formData);
}

export async function isCodeValid({
	code,
	type,
	target,
}: {
	code: string;
	type: VerificationTypes | typeof twoFAVerifyVerificationType;
	target: string;
}) {
	const verification = await prisma.verification.findUnique({
		where: {
			target_type: {
				target,
				type,
			},
			OR: [{ expiresAt: { gt: new Date() } }, { expiresAt: null }],
		},
		select: {
			secret: true,
			period: true,
			digits: true,
			charSet: true,
			algorithm: true,
		},
	});

	if (!verification) return false;

	const result = verifyTOTP({
		otp: code,
		secret: verification.secret,
		period: verification.period,
		digits: verification.digits,
		charSet: verification.charSet,
		algorithm: verification.algorithm,
	});

	if (!result) return false;

	return true;
}

async function validateRequest(request: Request, body: URLSearchParams | FormData) {
	const submission = await parseWithZod(body, {
		schema: VerifySchema.transform(async (data, ctx) => {
			const codeIsValid = await isCodeValid({
				code: data[codeQueryParam],
				type: data[typeQueryParam],
				target: data[targetQueryParam],
			});

			if (!codeIsValid) {
				ctx.addIssue({ code: z.ZodIssueCode.custom, path: [codeQueryParam], message: 'Invalid code' });
				return z.NEVER;
			}

			return data;
		}),

		async: true,
	});

	if (submission.status !== 'success') {
		return json(submission.reply({ formErrors: ['Submission failed'] }), {
			status: submission.status === 'error' ? 400 : 200,
		});
	}

	const { target, type } = submission.value;

	async function deleteVerification() {
		await prisma.verification.delete({
			where: {
				target_type: { target, type },
			},
		});
	}

	switch (type) {
		case 'signup': {
			await deleteVerification();
			return handleOnboardingVerification({ request, target });
		}
		case 'reset-password': {
			await deleteVerification();
			return handleResetPasswordVerification({ request, target });
		}

		case 'change-email': {
			await deleteVerification();
			return handleChangeEmailVerification({ request, submission });
		}
		case '2fa': {
			return handle2FAVerification({ request, submission });
		}
	}
}

export type VerifyFunctionArgs = {
	request: Request;
	target: string;
	submission?: Submission<z.infer<typeof VerifySchema>>;
};

export async function handleResetPasswordVerification({ request, target }: VerifyFunctionArgs) {
	const user = await prisma.user.findFirst({
		where: { email: target },
		select: { email: true, username: true, id: true, firstName: true },
	});
	// we don't want to say the user is not found if the email is not found
	// because that would allow an attacker to check if an email is registered

	if (!user) {
		return json({ status: 'error' } as const, { status: 400 });
	}

	const verifySession = await verifySessionStorage.getSession(request.headers.get('cookie'));
	verifySession.set(resetPasswordUserSessionKey, user);
	return redirect('/reset-password', {
		headers: {
			'set-cookie': await verifySessionStorage.commitSession(verifySession),
		},
	});
}

export async function handleChangeEmailVerification({
	request,
	submission,
}: {
	request: Request;
	submission: Submission;
}) {
	const verifySession = await verifySessionStorage.getSession(request.headers.get('cookie'));
	const newEmail = verifySession.get(newEmailAddressSessionKey);

	if (!newEmail) {
		submission.reply({ formErrors: ['You must submit the code on the same device that requested the email change.'] });
		return json({ status: 'error', submission } as const, { status: 500 });
	}

	invariant(submission.value, 'submission.value should be defined by now');

	const userId = submission.value.target;

	const user = await prisma.user.findFirst({
		where: {
			id: userId,
		},
		select: {
			email: true,
			username: true,
		},
	});

	if (!user) {
		submission.reply({ fieldErrors: { [codeQueryParam]: ['Invalid code'] } });
		return json({ status: 'error', submission } as const, { status: 400 });
	}

	const prevEmail = user.email;
	const username = user.username.username;

	await prisma.user.update({
		where: {
			id: userId,
		},
		data: {
			email: newEmail,
		},
	});

	void sendEmail({
		to: [prevEmail],
		subject: 'Email has been changed notification',
		react: <EmailChangedNotification userId={userId} title="Your Barfly email has been changed" />,
	});

	return redirectWithToast(
		`/${username}/settings`,
		{
			title: 'Email changed successfully',
			description: `Email has been changed to ${newEmail}`,
			type: 'success',
		},
		{
			headers: {
				'set-cookie': await verifySessionStorage.destroySession(verifySession),
			},
		},
	);
}

export async function handleOnboardingVerification({ request, target }: { request: Request; target: string }) {
	const verifySession = await verifySessionStorage.getSession(request.headers.get('cookie'));
	verifySession.set(targetQueryParam, target);

	return redirect('/complete-your-signup', {
		headers: {
			'set-cookie': await verifySessionStorage.commitSession(verifySession),
		},
	});
}

export default function VerifyRoute() {
	const lastResult = useActionData();
	const [searchParams] = useSearchParams();
	const type = verificationTypeSchema.parse(searchParams.get(typeQueryParam));
	const navigate = useNavigation();
	const isSubmitting = navigate.state === 'submitting';
	const submit = useSubmit();
	const submitButtonRef = useRef<HTMLButtonElement | null>(null);

	const [form, fields] = useForm({
		id: 'verify-form',
		constraint: getZodConstraint(VerifySchema),
		shouldValidate: 'onSubmit',
		lastResult,
		shouldRevalidate: 'onSubmit',
		defaultValue: {
			[codeQueryParam]: searchParams.get(codeQueryParam) ?? '',
			[typeQueryParam]: searchParams.get(typeQueryParam) ?? '',
			[targetQueryParam]: searchParams.get(targetQueryParam) ?? '',
			[redirectToQueryParam]: searchParams.get(redirectToQueryParam) ?? '',
		},
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: VerifySchema });
		},
	});

	const checkEmail = (
		<>
			<h3 className="text-base font-semibold leading-6 text-text-primary">Please verify your account</h3>
			<div className="mt-2 max-w-xl text-sm text-text-secondary">
				<p>We&apos;ve sent you a code to verify your email address</p>
			</div>
		</>
	);

	const headings: Record<VerificationTypes, React.ReactNode> = {
		signup: checkEmail,
		'reset-password': checkEmail,
		'change-email': checkEmail,
		'2fa': (
			<>
				<h3 className="text-base font-semibold leading-6 text-text-primary">Please verify your account</h3>
				<div className="mt-2 max-w-xl text-sm text-text-secondary">
					<p>Please enter your 2FA code to verify your identity.</p>
				</div>
			</>
		),
	};

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = event.currentTarget;
		const otpInputs = form.querySelectorAll<HTMLInputElement>('[data-otp-input]');
		const combinedCode = Array.from(otpInputs)
			.map(input => input.value)
			.join('');

		const formData = new FormData();
		formData.set(codeQueryParam, combinedCode);

		const csrfToken = form.querySelector<HTMLInputElement>('input[name="csrf"]').value;
		formData.set('csrf', csrfToken);

		const type = form.querySelector<HTMLInputElement>('input[name="type"]').value;
		formData.set(typeQueryParam, type);

		const target = form.querySelector<HTMLInputElement>('input[name="target"]').value;
		formData.set(targetQueryParam, target);

		submit(formData, { method: 'POST' });
	}
	return (
		<main className="flex min-h-[calc(100vh-100px)] flex-1 flex-col items-center px-6 py-20 lg:min-h-[calc(100vh-125px)] lg:justify-center">
			<div className="w-full max-w-sm lg:-mt-28">
				<div>{headings[type]}</div>
				<Form {...getFormProps(form)} method="POST" onSubmit={handleSubmit} className="mt-6 flex justify-center">
					<AuthenticityTokenInput />
					<div className=" flex w-full flex-col">
						<div className="flex flex-col">
							<SrOnlyLabel htmlFor={fields[codeQueryParam].id}>One-Time Password</SrOnlyLabel>

							<OTP
								length={5}
								fieldAttributes={{ ...getInputProps(fields[codeQueryParam], { type: 'text' }) }}
								submitButtonRef={submitButtonRef}
							/>

							<input {...getInputProps(fields[typeQueryParam], { type: 'hidden' })} />
							<input {...getInputProps(fields[targetQueryParam], { type: 'hidden' })} />
							<input {...getInputProps(fields[redirectToQueryParam], { type: 'hidden' })} />

							<div className="relative mt-6">
								<SubmitButton text="Submit" isSubmitting={isSubmitting} ref={submitButtonRef} />
								<div className="absolute -bottom-5">
									<InputErrors errors={fields[codeQueryParam].errors} errorId={fields[codeQueryParam].errorId} />
								</div>
							</div>
						</div>
					</div>
				</Form>
			</div>
		</main>
	);
}

export const meta: MetaFunction = () => {
	return [
		{ title: 'BarFly | Verify' },
		{
			name: 'description',
			content: 'Verify your account with a one-time password sent to your email.',
		},
	];
};
