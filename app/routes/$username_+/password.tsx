import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { ActionFunctionArgs, json, LoaderFunctionArgs, redirect } from '@remix-run/node';
import { Form, useActionData, useSearchParams } from '@remix-run/react';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';
import { HoneypotInputs } from 'remix-utils/honeypot/react';
import { z } from 'zod';
import { ErrorList } from '~/components';
import { getPasswordHash, requireUser, requireUserId, verifyUserPassword } from '~/utils/auth.server';
import { checkCSRF } from '~/utils/csrf.server';
import { prisma } from '~/utils/db.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { redirectWithToast } from '~/utils/toast.server';
import { PasswordSchema } from '~/utils/validation-schemas';

// Zod validation schema
const changePasswordSchema = z
	.object({
		currentPassword: PasswordSchema,
		newPassword: PasswordSchema,
		confirmNewPassword: PasswordSchema,
		redirectTo: z.string().optional(),
	})
	.superRefine(({ confirmNewPassword, newPassword }, ctx) => {
		if (confirmNewPassword !== newPassword) {
			ctx.addIssue({
				path: ['confirmNewPassword'],
				code: 'custom',
				message: 'The passwords must match',
			});
		}
	});

export async function action({ request }: ActionFunctionArgs) {
	const id = await requireUserId(request);
	const formData = await request.formData();
	await checkCSRF(formData, request.headers);
	checkHoneypot(formData);

	const submission = await parseWithZod(formData, {
		async: true,
		schema: changePasswordSchema.superRefine(async ({ currentPassword, newPassword }, ctx) => {
			if (currentPassword && newPassword) {
				const user = await verifyUserPassword({ id }, currentPassword);
				if (!user) {
					ctx.addIssue({
						path: ['currentPassword'],
						code: 'custom',
						message: 'Incorrect password.',
					});
				}
			}
		}),
	});

	// clear the payload so we don't send the password back to the client
	submission.payload = {};

	if (submission.status !== 'success') {
		return json(submission.reply({ formErrors: ['Submission failded'] }), {
			status: submission.status === 'error' ? 400 : 200,
		});
	}

	const { newPassword } = submission.value;

	const user = await prisma.user.update({
		select: { username: true },
		where: { id },
		data: {
			password: {
				update: {
					hash: await getPasswordHash(newPassword),
				},
			},
		},
	});

	return redirectWithToast(`/${user.username.username}/account`, {
		title: 'Password Changed',
		type: 'success',
		description: 'Your password has been successfully changed.',
	});
}

export async function loader({ request }: LoaderFunctionArgs) {
	await requireUser(request);
	return {};
}

export default function Password() {
	const lastResult = useActionData<typeof action>();
	const [searchParams] = useSearchParams();
	const redirectTo = searchParams.get('redirectTo');

	const [form, fields] = useForm({
		id: 'change-password-form',
		shouldRevalidate: 'onInput',
		constraint: getZodConstraint(changePasswordSchema),
		// @ts-expect-error - ignore lastResult ts error
		lastResult,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: changePasswordSchema });
		},
		defaultValues: {
			redirectTo: redirectTo,
		},
	});
	return (
		<Form {...getFormProps(form)} method="POST" className="mx-auto max-w-3xl px-6 py-6">
			<div className="space-y-12">
				<div className=" pb-6">
					<h2 className="text-base font-semibold leading-7 text-text-primary">Change Password</h2>
					<p className="mt-1 text-sm leading-6 text-text-secondary">
						Please enter your current password and then your new password.
					</p>

					<div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6">
						<div className="sm:col-span-4">
							<label
								htmlFor={fields.currentPassword.id}
								className="block text-sm font-medium leading-6 text-text-primary"
							>
								Current Password
							</label>
							<div className="mt-2">
								<div className=" flex w-full rounded-md bg-bg-secondary ring-1 ring-inset ring-border-tertiary focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500">
									<input
										{...getInputProps(fields.currentPassword, { type: 'password' })}
										className="flex-1 border-0 bg-transparent  px-2 py-1.5 text-text-primary focus:ring-0 aria-[invalid]:ring-red-600 sm:text-sm sm:leading-6"
									/>
								</div>
								<div
									className={`transition-height overflow-hidden px-2 py-1 duration-500 ease-in-out ${fields.currentPassword.errors ? 'max-h-56' : 'max-h-0'}`}
								>
									<ErrorList errors={fields.currentPassword.errors} id={fields.currentPassword.errorId} />
								</div>
							</div>
						</div>
						<div className="sm:col-span-4">
							<label htmlFor={fields.newPassword.id} className="block text-sm font-medium leading-6 text-text-primary">
								New Password
							</label>
							<div className="mt-2">
								<div className="flex rounded-md bg-bg-secondary ring-1 ring-inset ring-border-tertiary focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500">
									<input
										{...getInputProps(fields.newPassword, { type: 'password' })}
										className="flex-1 border-0 bg-transparent  px-2 py-1.5 text-text-primary focus:ring-0 aria-[invalid]:ring-red-600 sm:text-sm sm:leading-6"
									/>
								</div>
								<div
									className={`transition-height overflow-hidden px-2 py-1 duration-500 ease-in-out ${fields.newPassword.errors ? 'max-h-56' : 'max-h-0'}`}
								>
									<ErrorList errors={fields.newPassword.errors} id={fields.newPassword.errorId} />
								</div>
							</div>
						</div>
						<div className="sm:col-span-4">
							<label
								htmlFor={fields.confirmNewPassword.id}
								className="block text-sm font-medium leading-6 text-text-primary"
							>
								Confirm Password
							</label>
							<div className="mt-2">
								<div className="flex  rounded-md bg-bg-secondary ring-1 ring-inset ring-border-tertiary focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500">
									<input
										{...getInputProps(fields.confirmNewPassword, { type: 'password' })}
										className="flex-1 border-0 bg-transparent px-2 py-1.5 text-text-primary focus:ring-0 aria-[invalid]:ring-red-600 sm:text-sm sm:leading-6"
									/>
								</div>
								<div
									className={`transition-height overflow-hidden px-2 py-1 duration-500 ease-in-out ${fields.confirmNewPassword.errors ? 'max-h-56' : 'max-h-0'}`}
								>
									<ErrorList errors={fields.confirmNewPassword.errors} id={fields.confirmNewPassword.errorId} />
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<input {...getInputProps(fields.redirectTo, { type: 'hidden' })} />

			<div className="mt-6 flex flex-col   gap-3 border-b border-border-tertiary pb-8">
				<div className="flex justify-end gap-x-6 ">
					<button type="button" className="text-sm font-semibold leading-6 text-text-primary">
						Cancel
					</button>
					<button
						type="submit"
						className="rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
					>
						Change Password
					</button>
				</div>
				<div className="flex justify-end text-sm leading-6">
					<a href="/forgot-password" className="font-semibold text-indigo-600 hover:text-indigo-500">
						Forgot password?
					</a>
				</div>
			</div>

			<HoneypotInputs />
			<AuthenticityTokenInput />
		</Form>
	);
}
