import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import { PrismaClient } from '@prisma/client';
import { ActionFunctionArgs, json, redirect, type MetaFunction } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { useId } from 'react';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';
import { HoneypotInputs } from 'remix-utils/honeypot/react';
import { z } from 'zod';
import imageUrl from '~/assets/images/20220518_Stolen_Goods_25.jpg';
import { ErrorList } from '~/components';
import { checkCSRF } from '~/utils/csrf.server';
import { checkHoneypot } from '~/utils/honeypot.server';

type LoaderData = {
	image: string;
};

export const loader = () => {
	const data = {
		image: imageUrl,
	};
	return json(data);
};

const SignUpSchema = z
	.object({
		email: z.string().email(),
		firstName: z
			.string()
			.trim()
			.min(1, { message: 'First name cannot be empty.' })
			.max(30, { message: 'First name must be 30 characters or less.' }),
		lastName: z
			.string()
			.trim()
			.min(1, { message: 'Last name cannot be empty.' })
			.max(30, { message: 'Last name must be 30 characters or less.' }),
		password: z
			.string()
			.trim()
			.min(8, { message: 'Password must be at least 8 characters long' })
			.max(124, { message: 'Password must be at most 124 characters long' })
			.regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
			.regex(/[\W_]/, { message: 'Password must contain at least one special character' })
			.regex(/[0-9]/, { message: 'Password must contain at least one number' }),
		passwordConfirm: z.string(),
	})
	.refine(data => data.password === data.passwordConfirm, {
		message: "Passwords don't match",
		path: ['passwordConfirm'], // This will attach the error to the passwordConfirm field
	});

export async function action({ request }: ActionFunctionArgs) {
	const prisma = new PrismaClient();
	const formData = await request.formData();
	checkHoneypot(formData);
	await checkCSRF(formData, request.headers);

	const submission = parseWithZod(formData, { schema: SignUpSchema });

	if (submission.status !== 'success') {
		return submission.reply();
	}

	const { email, firstName, lastName, password } = submission.value;

	// Upload users data to db
	const user = await prisma.user.create({
		data: {
			email,
			firstName,
			lastName,
			password: {
				create: {
					hash: password,
				},
			},
		},
	});

	return redirect('/dashboard');
}

export default function Signup() {
	const { image } = useLoaderData<LoaderData>();
	const lastResult = useActionData<typeof action>();
	const [form, fields] = useForm({
		id: useId(),
		lastResult,
		shouldValidate: 'onBlur',
		shouldRevalidate: 'onInput',
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: SignUpSchema });
		},
	});

	return (
		<>
			<div className="flex flex-1 overflow-auto">
				<div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:w-6/12 lg:flex-none lg:px-20 xl:px-24">
					<div className="mx-auto w-full max-w-sm lg:w-96">
						<div>
							<h2 className="mt-8 text-2xl font-bold leading-9 tracking-tight text-text-primary">
								Sign up for an account
							</h2>
							<p className="mt-2 text-sm leading-6 text-text-secondary">Become part of our community</p>
						</div>

						<div className="mt-10">
							<div>
								<Form {...getFormProps(form)} action="#" method="POST" className="space-y-6">
									<div>
										<label htmlFor={fields.email.id} className="block text-sm font-medium leading-6 text-text-primary">
											Email address
										</label>
										<div className="mt-2">
											<input
												{...getInputProps(fields.email, { type: 'email' })}
												className="block w-full rounded-md border-0 px-2 py-1.5  shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 aria-[invalid]:ring-red-600 sm:text-sm sm:leading-6"
												autoFocus
											/>
											<div
												className={`transition-height overflow-hidden px-2 py-1 duration-500 ease-in-out ${fields.email.errors ? 'max-h-56' : 'max-h-0'}`}
											>
												<ErrorList errors={fields.email.errors} id={fields.email.errorId} />
											</div>
										</div>
									</div>

									<div>
										<label
											htmlFor={fields.firstName.id}
											className="block text-sm font-medium leading-6 text-text-primary"
										>
											First name
										</label>
										<div className="mt-2">
											<input
												{...getInputProps(fields.firstName, { type: 'text' })}
												className="block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
											/>
											<div
												className={`transition-height overflow-hidden px-2 py-1 duration-500 ease-in-out ${fields.firstName.errors ? 'max-h-56' : 'max-h-0'}`}
											>
												<ErrorList errors={fields.firstName.errors} id={fields.firstName.errorId} />
											</div>
										</div>
									</div>

									<div>
										<label
											htmlFor={fields.lastName.id}
											className="block text-sm font-medium leading-6 text-text-primary"
										>
											Last name
										</label>
										<div className="mt-2">
											<input
												{...getInputProps(fields.lastName, { type: 'text' })}
												className="block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
											/>
											<div
												className={`transition-height overflow-hidden px-2 py-1 duration-500 ease-in-out ${fields.lastName.errors ? 'max-h-56' : 'max-h-0'}`}
											>
												<ErrorList errors={fields.lastName.errors} id={fields.lastName.errorId} />
											</div>
										</div>
									</div>

									<div>
										<label htmlFor={fields.password.id} className="block text-sm font-medium leading-6 text-gray-900">
											Password
										</label>
										<div className="mt-2">
											<input
												{...getInputProps(fields.password, { type: 'password' })}
												className="block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
											/>
											<div
												className={`transition-height overflow-hidden px-2 py-1 duration-500 ease-in-out ${fields.password.errors ? 'max-h-56' : 'max-h-0'}`}
											>
												<ErrorList errors={fields.password.errors} id={fields.password.errorId} />
											</div>
										</div>
									</div>

									<div>
										<label
											htmlFor={fields.passwordConfirm.id}
											className="block text-sm font-medium leading-6 text-gray-900"
										>
											Password Confirm
										</label>
										<div className="mt-2">
											<input
												{...getInputProps(fields.passwordConfirm, { type: 'password' })}
												className="block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
											/>
											<div
												className={`transition-height overflow-hidden px-2 py-1 duration-500 ease-in-out ${fields.passwordConfirm.errors ? 'max-h-56' : 'max-h-0'}`}
											>
												<ErrorList errors={fields.passwordConfirm.errors} id={fields.passwordConfirm.errorId} />
											</div>
										</div>
									</div>
									<div>
										<HoneypotInputs />
										<AuthenticityTokenInput />
									</div>
									<div className="flex items-center justify-between">
										<div className="flex items-center">
											<input
												id="remember-me"
												name="remember-me"
												type="checkbox"
												className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
											/>
											<label htmlFor="remember-me" className="ml-3 block text-sm leading-6 text-gray-700">
												Remember me
											</label>
										</div>

										<div className="text-sm leading-6">
											<a href="/" className="font-semibold text-indigo-600 hover:text-indigo-500">
												Already have an account?
											</a>
										</div>
									</div>

									<div>
										<button
											type="submit"
											className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
										>
											Sign up
										</button>
									</div>
								</Form>
							</div>

							<div className="mt-10">
								<div className="relative">
									<div className="absolute inset-0 flex items-center" aria-hidden="true">
										<div className="w-full border-t border-gray-200" />
									</div>
									<div className="relative flex justify-center text-sm font-medium leading-6">
										<span className="bg-bg-primary px-6 text-text-primary">Or continue with</span>
									</div>
								</div>

								<div className="mt-6 grid grid-cols-2 gap-4">
									<a
										href="/"
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
										href="/"
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
					</div>
				</div>
				<div className="hidden w-0 flex-1 lg:block">
					<img className="h-full w-full  object-cover" src={image} alt="A bartender standing behind the bar top." />
				</div>
			</div>
		</>
	);
}

export const meta: MetaFunction = () => {
	return [{ title: 'BarFly | Sign up' }, { name: 'description', content: 'Insert page description here!' }];
};
