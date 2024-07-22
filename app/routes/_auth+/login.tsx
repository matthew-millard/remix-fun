import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { Form, Link, useActionData, useNavigation, useSearchParams } from '@remix-run/react';
import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { ActionFunctionArgs, json, LoaderFunctionArgs, redirect } from '@remix-run/node';
import { InputField, LinkWithPrefetch, RememberMe, SubmitButton } from '~/components';
import { safeRedirect } from 'remix-utils/safe-redirect';
import { z } from 'zod';
import { checkHoneypot } from '~/utils/honeypot.server';
import { HoneypotInputs } from 'remix-utils/honeypot/react';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';
import { checkCSRF } from '~/utils/csrf.server';
import { login, requireAnonymous, sessionKey } from '~/utils/auth.server';
import { LoginEmailSchema, LoginPasswordSchema } from '~/utils/validation-schemas';
import { getSession, sessionStorage } from '~/utils/session.server';
import type { MetaFunction } from '@remix-run/node';
import { prisma } from '~/utils/db.server';
import { twoFAVerificationType } from '../$username_+/settings+/two-factor-authentication+/_layout';
import { verifySessionStorage } from '~/utils/verification.server';
import { getRedirectToUrl, invariant } from '~/utils/misc';
import { redirectWithToast } from '~/utils/toast.server';
import { InputErrors as FormErrors } from '~/components/InputField';

const unverifiedSessionIdKey = 'unverified-session-id';
const rememberMeKey = 'remember-me';

const LoginFormSchema = z.object({
	email: LoginEmailSchema,
	password: LoginPasswordSchema,
	rememberMe: z.boolean().optional(),
	redirectTo: z.string().optional(),
});

export async function handleVerification({ request, submission }: { request: Request; submission: any }) {
	invariant(submission.value, 'Submission.value should be defined by now');
	const cookieSession = await sessionStorage.getSession(request.headers.get('cookie'));
	const verifySession = await verifySessionStorage.getSession(request.headers.get('cookie'));
	const unverifiedSessionId = verifySession.get(unverifiedSessionIdKey);
	const remember = verifySession.get(rememberMeKey);

	const session = await prisma.session.findUnique({
		where: {
			id: unverifiedSessionId,
		},
		select: { expirationDate: true },
	});

	if (!session) {
		throw await redirectWithToast('/login', {
			type: 'error',
			title: 'Invalid session',
			description: 'Could not find session to verify. Please try again.',
		});
	}

	cookieSession.set(sessionKey, unverifiedSessionId);
	const { redirectTo } = submission.value;

	const headers = new Headers();
	headers.append(
		'set-cookie',
		await sessionStorage.commitSession(cookieSession, {
			expires: remember ? session.expirationDate : undefined,
		}),
	);

	headers.append('set-cookie', await verifySessionStorage.destroySession(verifySession));

	return redirect(safeRedirect(redirectTo), { headers });
}

export async function loader({ request }: LoaderFunctionArgs) {
	await requireAnonymous(request);
	return json({});
}

export async function action({ request }: ActionFunctionArgs) {
	await requireAnonymous(request);
	const formData = await request.formData();
	await checkCSRF(formData, request.headers);
	checkHoneypot(formData);

	const submission = await parseWithZod(formData, {
		schema: LoginFormSchema.transform(async (data, ctx) => {
			// @ts-expect-error - ignore zod issue
			const session = await login(data);

			if (!session) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Invalid username or password',
				});
				return z.NEVER;
			}

			return { ...data, session };
		}),
		async: true,
	});

	// delete submission.payload.password;
	if (submission.status !== 'success') {
		return json(submission.reply({ formErrors: ['Incorrect username or password'], hideFields: ['password'] }), {
			status: submission.status === 'error' ? 400 : 200,
		});
	}

	const { session, rememberMe, redirectTo } = submission.value;

	const verification = await prisma.verification.findUnique({
		where: {
			target_type: {
				target: session.userId,
				type: twoFAVerificationType,
			},
		},
		select: {
			id: true,
		},
	});

	const has2FAEnabled = Boolean(verification);

	if (has2FAEnabled) {
		const verifySession = await verifySessionStorage.getSession();
		verifySession.set('unverified-session-id', session.id);
		verifySession.set('remember-me', rememberMe);

		const redirectUrl = getRedirectToUrl({
			request,
			target: session.userId,
			type: twoFAVerificationType,
			redirectTo,
		});

		return redirect(redirectUrl.toString(), {
			headers: {
				'set-cookie': await verifySessionStorage.commitSession(verifySession),
			},
		});
	} else {
		const { username } = await prisma.user.findUniqueOrThrow({
			where: { id: session.userId },
			select: { username: { select: { username: true } } },
		});

		const redirectToLink = redirectTo ? safeRedirect(redirectTo) : `/${username.username}`;

		const cookieSession = await getSession(request);
		cookieSession.set(sessionKey, session.id);

		return redirect(redirectToLink, {
			headers: {
				'set-cookie': await sessionStorage.commitSession(cookieSession, {
					expires: rememberMe ? session.expirationDate : undefined,
				}),
			},
		});
	}
}

export default function LoginRoute() {
	const lastResult = useActionData();
	const [searchParams] = useSearchParams();
	const redirectTo = searchParams.get('redirectTo');
	const navigate = useNavigation();
	const isSubmitting = navigate.state === 'submitting';

	const [form, fields] = useForm({
		id: 'login-form',
		shouldRevalidate: 'onInput',
		constraint: getZodConstraint(LoginFormSchema),
		lastResult,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: LoginFormSchema });
		},
		defaultValue: {
			redirectTo: redirectTo,
		},
	});

	return (
		<main className="flex min-h-[calc(100vh-100px)] flex-1 flex-col  items-center px-6 py-20 lg:min-h-[calc(100vh-125px)] lg:justify-center">
			<div className="w-full max-w-sm lg:-mt-28">
				<h1 className="text-2xl font-bold leading-9 tracking-tight text-text-primary">Welcome back 👋</h1>
				<p className="text-sm leading-6 text-text-secondary">Log in to your account</p>

				<Form {...getFormProps(form)} className="space-y-6" method="POST">
					<HoneypotInputs />
					<AuthenticityTokenInput />
					{/* Hidden input for the redirectTo */}
					<input {...getInputProps(fields.redirectTo, { type: 'hidden' })} value={redirectTo || ''} />
					<InputField
						label="Email address"
						fieldAttributes={{ ...getInputProps(fields.email, { type: 'email' }) }}
						htmlFor={fields.email.id}
						autoFocus={true}
						errors={fields.email.errors}
						errorId={fields.email.errorId}
					/>

					<InputField
						label="Password"
						fieldAttributes={{ ...getInputProps(fields.password, { type: 'password' }) }}
						htmlFor={fields.password.id}
						errors={fields.password.errors}
						errorId={fields.password.errorId}
					/>

					<div className="flex justify-between">
						<RememberMe id={fields.rememberMe.id} name={fields.rememberMe.name} formId={form.id} />
						<LinkWithPrefetch text="Forgot password?" to="/forgot-password" />
					</div>

					<div className="relative">
						<SubmitButton text="Sign in" isSubmitting={isSubmitting} />
						<span className="absolute -bottom-5">
							<FormErrors errors={form.errors} errorId={form.errorId} />
						</span>
					</div>
				</Form>

				<p className="mt-10 text-center text-sm text-gray-500">
					Not a member?{' '}
					<Link
						to={redirectTo ? `/signup?redirectTo=${encodeURIComponent(redirectTo)}` : '/signup'}
						className="font-semibold leading-6 text-indigo-500 hover:text-indigo-400"
						prefetch="intent"
					>
						Sign up for an account
					</Link>
				</p>
			</div>
		</main>
	);
}

export const meta: MetaFunction = () => {
	return [
		{ title: 'Log in | Barfly' },
		{
			name: 'description',
			content:
				"Log in to your Barfly account. Don't have an account? Sign up for free to access exclusive features and content.",
		},
	];
};

export const handle = {
	breadcrumb: () => (
		<Link
			prefetch="intent"
			className="ml-1 text-xs text-gray-400 hover:text-gray-500  lg:ml-4 lg:text-sm"
			to={`/login`}
		>
			Log in
		</Link>
	),
};
