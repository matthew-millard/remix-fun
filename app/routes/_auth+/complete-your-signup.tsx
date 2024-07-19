import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import { ActionFunctionArgs, json, LoaderFunctionArgs, redirect, type MetaFunction } from '@remix-run/node';
import { Form, Link, useActionData, useLoaderData, useNavigation } from '@remix-run/react';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';
import { HoneypotInputs } from 'remix-utils/honeypot/react';
import { z } from 'zod';
import { InputField, LinkWithPrefetch, SubmitButton } from '~/components';
import { checkCSRF } from '~/utils/csrf.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { requireAnonymous, sessionKey, signup } from '~/utils/auth.server';
import {
	EmailSchema,
	FirstNameSchema,
	LastNameSchema,
	PasswordSchema,
	UsernameSchema,
} from '~/utils/validation-schemas';
import { prisma } from '~/utils/db.server';
import { getSession, sessionStorage } from '~/utils/session.server';
import { targetQueryParam } from './verify';
import { verifySessionStorage } from '~/utils/verification.server';
import RememberMe from '~/components/RememberMe';

const SignUpSchema = z
	.object({
		email: EmailSchema,
		firstName: FirstNameSchema,
		lastName: LastNameSchema,
		username: UsernameSchema,
		password: PasswordSchema,
		passwordConfirm: z.string(),
		rememberMe: z.boolean().optional(),
	})
	.refine(data => data.password === data.passwordConfirm, {
		message: "Passwords don't match",
		path: ['passwordConfirm'], // This will attach the error to the passwordConfirm field
	});

export async function loader({ request }: LoaderFunctionArgs) {
	await requireAnonymous(request);

	const verifySession = await verifySessionStorage.getSession(request.headers.get('Cookie'));
	const email = verifySession.get(targetQueryParam);

	// This will redirect to the signup page if the email is not verified
	if (typeof email !== 'string' || !email) {
		throw redirect('/signup');
	}
	const data = {
		email,
	};

	return json(data);
}

export async function action({ request }: ActionFunctionArgs) {
	await requireAnonymous(request);
	const formData = await request.formData();
	await checkCSRF(formData, request.headers);
	checkHoneypot(formData);

	const submission = await parseWithZod(formData, {
		schema: SignUpSchema.transform(async (data, ctx) => {
			// Check if username is already in use
			const usernameExists = await prisma.username.findFirst({ where: { username: data.username } });
			if (usernameExists) {
				ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['username'], message: 'Username is already in use' });
			}

			return data;
		}),
		async: true,
	});

	if (submission.status !== 'success') {
		return json(submission.reply(), {
			status: submission.status === 'error' ? 400 : 200,
		});
	}

	const { email, firstName, lastName, password, username, rememberMe } = submission.value;

	// // Upload users data to db and hash password before storing
	const session = await signup({ email, firstName, lastName, password, username });

	// Check if user was created
	if (!session) {
		return json({ message: 'User could not be created' }, { status: 500 });
	}

	// Set session cookie
	const cookieSession = await getSession(request);
	cookieSession.set(sessionKey, session.id);

	//Redirect to users profile page
	return redirect(`/${username}/settings`, {
		headers: {
			'set-cookie': await sessionStorage.commitSession(cookieSession, {
				expires: rememberMe ? session.expirationDate : undefined,
			}),
		},
	});
}

export default function CompleteYourSignupRoute() {
	const { email } = useLoaderData<typeof loader>();
	const lastResult = useActionData();
	const navigate = useNavigation();

	const isSubmitting = navigate.state === 'submitting';

	const [form, fields] = useForm({
		id: 'signup-form',
		shouldValidate: 'onBlur',
		lastResult,
		shouldRevalidate: 'onInput',
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: SignUpSchema });
		},
		defaultValue: {
			email,
		},
	});

	return (
		<main className="flex min-h-[calc(100vh-100px)] flex-1 flex-col  items-center px-6 py-20 lg:min-h-[calc(100vh-125px)] lg:justify-center">
			<div className="w-full max-w-sm lg:-mt-28">
				<div>
					<h2 className=" text-2xl font-bold leading-9 tracking-tight text-text-primary">Complete Your Sign up</h2>
					<p className="mt-2 text-sm leading-6 text-text-secondary">Become part of our community</p>
				</div>

				<div className="mt-4">
					<Form {...getFormProps(form)} method="POST" className="space-y-6">
						{/* Hidden email input that is prefilled with verified email from cookie */}
						<input {...getInputProps(fields.email, { type: 'hidden' })} />
						<HoneypotInputs />
						<AuthenticityTokenInput />

						<InputField
							fieldAttributes={{ ...getInputProps(fields.username, { type: 'text' }) }}
							htmlFor={fields.username.id}
							autoFocus={true}
							label="Username"
							errors={fields.username.errors}
							errorId={fields.username.errorId}
						/>

						<InputField
							fieldAttributes={{ ...getInputProps(fields.firstName, { type: 'text' }) }}
							htmlFor={fields.firstName.id}
							label="First name"
							errors={fields.firstName.errors}
							errorId={fields.firstName.errorId}
						/>

						<InputField
							fieldAttributes={{ ...getInputProps(fields.lastName, { type: 'text' }) }}
							htmlFor={fields.lastName.id}
							label="Last name"
							errors={fields.lastName.errors}
							errorId={fields.lastName.errorId}
						/>

						<InputField
							fieldAttributes={{ ...getInputProps(fields.password, { type: 'password' }) }}
							htmlFor={fields.password.id}
							label="Password"
							errors={fields.password.errors}
							errorId={fields.password.errorId}
						/>

						<InputField
							fieldAttributes={{ ...getInputProps(fields.passwordConfirm, { type: 'password' }) }}
							htmlFor={fields.passwordConfirm.id}
							label="Confirm password"
							errors={fields.passwordConfirm.errors}
							errorId={fields.passwordConfirm.errorId}
						/>

						<div className="flex justify-between">
							<RememberMe id={fields.rememberMe.id} name={fields.rememberMe.name} formId={form.id} />
							<LinkWithPrefetch text="← Back to home" to="/" />
						</div>

						<SubmitButton text="Complete sign up" isSubmitting={isSubmitting} />
					</Form>
				</div>
			</div>
		</main>
	);
}

export const meta: MetaFunction = () => {
	return [
		{ title: 'Complete Your Sign up | Barfly' },
		{
			name: 'description',
			content: 'Complete your sign up to become part of our community.',
		},
	];
};

export const handle = {
	breadcrumb: () => (
		<Link
			prefetch="intent"
			className="ml-1 text-xs text-gray-400 hover:text-gray-500  lg:ml-4 lg:text-sm"
			to={`/complete-your-signup`}
		>
			Complete Your Sign up
		</Link>
	),
};
