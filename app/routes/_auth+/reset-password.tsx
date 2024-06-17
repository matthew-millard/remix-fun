import { ActionFunctionArgs, json, LoaderFunctionArgs, redirect } from '@remix-run/node';
import { Form, Link, useLoaderData } from '@remix-run/react';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';
import { HoneypotInputs } from 'remix-utils/honeypot/react';
import { getPasswordHash, requireAnonymous } from '~/utils/auth.server';
import { checkCSRF } from '~/utils/csrf.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { verifySessionStorage } from '~/utils/verification.server';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { PasswordSchema } from '~/utils/validation-schemas';
import { z } from 'zod';
import { prisma } from '~/utils/db.server';
import { User } from '@prisma/client';
import { resetPasswordUserSessionKey } from './verify';
import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { ErrorList } from '~/components';

const ResetPasswordSchema = z
	.object({
		password: PasswordSchema,
		passwordConfirm: z.string(),
	})
	.refine(data => data.password === data.passwordConfirm, {
		message: "Passwords don't match",
		path: ['passwordConfirm'], // This will attach the error to the passwordConfirm field
	});

export async function getResetPasswordUser(request: Request) {
	const verifySession = await verifySessionStorage.getSession(request.headers.get('Cookie'));
	const user = verifySession.get(resetPasswordUserSessionKey);

	if (!user) {
		throw redirect('/login');
	}

	return user;
}

export async function resetUserPassword({ user, password }: { user: User; password: string }) {
	const hashedPassword = await getPasswordHash(password);
	const updatedUser = await prisma.user.update({
		where: { id: user.id },
		data: {
			password: {
				update: {
					hash: hashedPassword,
				},
			},
		},
		select: { id: true },
	});
	return updatedUser;
}

export async function action({ request }: ActionFunctionArgs) {
	await requireAnonymous(request);
	const user = await getResetPasswordUser(request);
	const formData = await request.formData();
	await checkCSRF(formData, request.headers);
	checkHoneypot(formData);

	// Validate formdata here
	const submission = await parseWithZod(formData, { schema: ResetPasswordSchema, async: true });

	if (submission.status !== 'success') {
		return json(submission.reply({ formErrors: ['Invalid Password'] }), {
			status: submission.status === 'error' ? 400 : 200,
		});
	}

	// Update the user's password in the database
	const { password } = submission.value;

	await resetUserPassword({ user, password });

	// Redirect to the login page
	return redirect('/login');
}

export async function loader({ request }: LoaderFunctionArgs) {
	await requireAnonymous(request);
	const user = await getResetPasswordUser(request);

	return json(user);
}

export default function ResetPasswordRoute() {
	const { firstName } = useLoaderData<typeof loader>();
	const lastResult = useLoaderData();
	const [form, fields] = useForm({
		id: 'reset-password-form',
		shouldRevalidate: 'onInput',
		constraint: getZodConstraint(ResetPasswordSchema),
		lastResult,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: ResetPasswordSchema });
		},
	});

	return (
		<Form {...getFormProps(form)} method="POST" className="mx-auto max-w-3xl px-6 py-6">
			<HoneypotInputs />
			<AuthenticityTokenInput />
			<div className="space-y-12">
				<div className=" pb-6">
					<h2 className="text-base font-semibold leading-7 text-text-primary">Reset Password</h2>
					<p className="mt-1 text-sm leading-6 text-text-secondary">
						Hi {firstName}, please enter your new password and then your new password.
					</p>

					<div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6">
						<div className="sm:col-span-4">
							<label htmlFor={fields.password.id} className="block text-sm font-medium leading-6 text-text-primary">
								New Password
							</label>
							<div className="mt-2">
								<div className="flex rounded-md bg-bg-secondary ring-1 ring-inset ring-border-tertiary focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500">
									<input
										{...getInputProps(fields.password, { type: 'password' })}
										className="flex-1 border-0 bg-transparent  px-2 py-1.5 text-text-primary focus:ring-0 aria-[invalid]:ring-red-600 sm:text-sm sm:leading-6"
									/>
								</div>
								<div
									className={`transition-height overflow-hidden px-2 py-1 duration-500 ease-in-out ${fields.password.errors ? 'max-h-56' : 'max-h-0'}`}
								>
									<ErrorList errors={fields.password.errors} id={fields.password.errorId} />
								</div>
							</div>
						</div>
						<div className="sm:col-span-4">
							<label
								htmlFor={fields.passwordConfirm.id}
								className="block text-sm font-medium leading-6 text-text-primary"
							>
								Confirm Password
							</label>
							<div className="mt-2">
								<div className="flex  rounded-md bg-bg-secondary ring-1 ring-inset ring-border-tertiary focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500">
									<input
										{...getInputProps(fields.passwordConfirm, { type: 'password' })}
										className="flex-1 border-0 bg-transparent px-2 py-1.5 text-text-primary focus:ring-0 aria-[invalid]:ring-red-600 sm:text-sm sm:leading-6"
									/>
								</div>
								<div
									className={`transition-height overflow-hidden  py-1 duration-500 ease-in-out ${fields.passwordConfirm.errors ? 'max-h-56' : 'max-h-0'}`}
								>
									<ErrorList errors={fields.passwordConfirm.errors} id={fields.passwordConfirm.errorId} />
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="mt-6 flex flex-col   gap-3 border-b border-border-tertiary pb-8">
				<div className="flex justify-end gap-x-6 ">
					<button
						type="submit"
						className="rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
					>
						Reset your password
					</button>
				</div>
			</div>
		</Form>
	);
}

export const handle = {
	breadcrumb: () => (
		<Link prefetch="intent" className="ml-4 text-sm  text-gray-400 hover:text-gray-500" to={`/reset-password`}>
			Reset Password
		</Link>
	),
};
