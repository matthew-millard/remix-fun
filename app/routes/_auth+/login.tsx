import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { Form, Link, useActionData, useSearchParams } from '@remix-run/react';
import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { ActionFunctionArgs, json, LoaderFunctionArgs, redirect } from '@remix-run/node';
import { AlertToast, ErrorList } from '~/components';
import { safeRedirect } from 'remix-utils/safe-redirect';
import { z } from 'zod';
import { checkHoneypot } from '~/utils/honeypot.server';
import { HoneypotInputs } from 'remix-utils/honeypot/react';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';
import { checkCSRF } from '~/utils/csrf.server';
import { login, requireAnonymous, sessionKey } from '~/utils/auth.server';
import { LoginEmailSchema, PasswordSchema } from '~/utils/validation-schemas';
import { getSession, sessionStorage } from '~/utils/session.server';
import type { MetaFunction } from '@remix-run/node';
import { prisma } from '~/utils/db.server';
import { twoFAVerificationType } from '../$username_+/settings+/two-factor-authentication+/_layout';
import { verifySessionStorage } from '~/utils/verification.server';
import { getRedirectToUrl, invariant } from '~/utils/misc';
import { redirectWithToast } from '~/utils/toast.server';

const unverifiedSessionIdKey = 'unverified-session-id';
const rememberMeKey = 'remember-me';

const LoginFormSchema = z.object({
	email: LoginEmailSchema,
	password: PasswordSchema,
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
		<>
			<div className="flex flex-1 flex-col justify-center overflow-auto sm:px-6 lg:px-8 lg:py-12 ">
				<div className="sm:mx-auto sm:w-full sm:max-w-md">
					<h2 className="mt-3 text-center text-2xl font-bold leading-9 text-text-primary">Sign in to your account</h2>
				</div>

				<div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
					<div className="bg-bg-alt px-6 py-12  shadow-lg sm:rounded-lg sm:px-12">
						<Form {...getFormProps(form)} className="space-y-6" method="POST">
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
							<div className="relative pb-4">
								<label htmlFor={fields.password.id} className="block text-sm font-medium leading-6 text-text-primary">
									Password
								</label>
								<div className="mt-2">
									<input
										{...getInputProps(fields.password, { type: 'password' })}
										className="block w-full rounded-md border-0 bg-white px-2 py-1.5 text-gray-900 shadow-sm ring-2 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 aria-[invalid]:ring-red-600 sm:text-sm  sm:leading-6 "
									/>
									<div
										className={`transition-height overflow-hidden px-2 py-1 duration-500 ease-in-out ${fields.password.errors ? 'max-h-56' : 'max-h-0'}`}
									>
										<ErrorList errors={fields.password.errors} id={fields.password.errorId} />
									</div>
								</div>
							</div>
							<HoneypotInputs />
							<AuthenticityTokenInput />
							<div className="flex items-center justify-between">
								<div className="flex items-center">
									<input
										{...getInputProps(fields.rememberMe, { type: 'checkbox' })}
										className="h-4 w-4 rounded border-white text-indigo-600 focus:ring-indigo-600"
										defaultChecked={false}
									/>
									<label htmlFor={fields.rememberMe.id} className="ml-3 block text-sm leading-6 text-text-primary">
										Remember me
									</label>
									<div
										className={`transition-height overflow-hidden px-2 py-1 duration-500 ease-in-out ${fields.password.errors ? 'max-h-56' : 'max-h-0'}`}
									>
										<ErrorList errors={fields.rememberMe.errors} id={fields.rememberMe.errorId} />
									</div>
								</div>

								{/* Hidden input for the redirectTo */}
								<input {...getInputProps(fields.redirectTo, { type: 'hidden' })} value={redirectTo || ''} />
								<div className="text-sm leading-6">
									<Link to="/forgot-password" className="font-semibold text-indigo-600 hover:text-indigo-500">
										Forgot password?
									</Link>
								</div>
							</div>
							<div>
								<button
									form={form.id}
									type="submit"
									className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
								>
									Sign in
								</button>
							</div>
							<div
								className={`transition-height overflow-hidden px-2 py-1 duration-500 ease-in-out ${form.errors ? 'max-h-56' : 'max-h-0'}`}
							>
								<AlertToast errors={form.errors} id={form.errorId} />
							</div>
						</Form>

						<div>
							<div className="relative mt-10">
								<div className="absolute inset-0 flex items-center" aria-hidden="true">
									<div className="w-full border-t border-gray-300" />
								</div>
								<div className="relative flex justify-center text-sm font-medium leading-6">
									<span className="bg-white px-6 text-gray-900">Or continue with</span>
								</div>
							</div>

							<div className="mt-6 grid grid-cols-2 gap-4">
								<a
									href="/google"
									className="flex w-full items-center justify-center gap-3 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:ring-transparent"
								>
									<svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
										<path
											d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
											fill="#EA4335"
										/>
										<path
											d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
											fill="#4285F4"
										/>
										<path
											d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
											fill="#FBBC05"
										/>
										<path
											d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.2654 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z"
											fill="#34A853"
										/>
									</svg>
									<span className="text-sm font-semibold leading-6">Google</span>
								</a>

								<a
									href="/github"
									className="flex w-full items-center justify-center gap-3 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:ring-transparent"
								>
									<svg className="h-5 w-5 fill-[#24292F]" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
										<path
											fillRule="evenodd"
											d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
											clipRule="evenodd"
										/>
									</svg>
									<span className="text-sm font-semibold leading-6">GitHub</span>
								</a>
							</div>
						</div>
					</div>

					<p className="mt-10 text-center text-sm text-gray-500">
						Not a member?{' '}
						<Link
							to={redirectTo ? `/signup?redirectTo=${encodeURIComponent(redirectTo)}` : '/signup'}
							className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500"
							prefetch="intent"
						>
							Sign up for an account
						</Link>
					</p>
				</div>
			</div>
		</>
	);
}

export const meta: MetaFunction = () => {
	return [
		{ title: 'Barfly | Log In' },
		{
			name: 'description',
			content:
				"Log In to your Barfly account. Don't have an account? Sign up for free to access exclusive features and content.",
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
			Login
		</Link>
	),
};
