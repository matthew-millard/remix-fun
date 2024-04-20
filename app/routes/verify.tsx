import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { verifyTOTP } from '@epic-web/totp';
import { ActionFunctionArgs, json, LoaderFunctionArgs, redirect } from '@remix-run/node';
import { Form, useActionData, useSearchParams } from '@remix-run/react';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';
import { z } from 'zod';
import { AlertToast, ErrorList } from '~/components';
import { checkCSRF } from '~/utils/csrf.server';
import { prisma } from '~/utils/db.server';
import { verifySessionStorage } from '~/utils/verification.server';

export const codeQueryParam = 'code';
export const typeQueryParam = 'type';
export const targetQueryParam = 'target';
export const redirectToQueryParam = 'redirectTo';

const types = ['signup'] as const;
const verificationTypeSchema = z.enum(types);

const VerifySchema = z.object({
	[codeQueryParam]: z.string().min(6).max(6),
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

async function validateRequest(request: Request, body: URLSearchParams | FormData) {
	const submission = await parseWithZod(body, {
		schema: VerifySchema.transform(async (data, ctx) => {
			const verification = await prisma.verification.findUnique({
				where: {
					target_type: {
						target: data[targetQueryParam],
						type: data[typeQueryParam],
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

			if (!verification) {
				ctx.addIssue({
					path: [codeQueryParam],
					code: z.ZodIssueCode.custom,
					message: `Invalid code`,
				});
				return z.NEVER;
			}

			const codeIsValid = verifyTOTP({
				otp: data[codeQueryParam],
				...verification,
			});
			if (!codeIsValid) {
				ctx.addIssue({
					path: [codeQueryParam],
					code: z.ZodIssueCode.custom,
					message: `Invalid code`,
				});
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

	await prisma.verification.delete({
		where: {
			target_type: { target, type },
		},
	});

	const verifySession = await verifySessionStorage.getSession(request.headers.get('cookie'));
	verifySession.set(targetQueryParam, target);

	return redirect('/onboarding', {
		headers: {
			'set-cookie': await verifySessionStorage.commitSession(verifySession),
		},
	});
}

export default function VerifyRoute() {
	const lastResult = useActionData();
	const [searchParams] = useSearchParams();

	const [form, fields] = useForm({
		id: 'verify-form',
		constraint: getZodConstraint(VerifySchema),
		shouldValidate: 'onBlur',
		lastResult,
		shouldRevalidate: 'onInput',
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
	return (
		<div className=" flex h-full flex-col justify-center p-6">
			<div className="mx-auto max-w-2xl rounded-lg bg-bg-alt shadow-lg">
				<div className="p-6">
					<h3 className="text-base font-semibold leading-6 text-text-primary">Please verify your account</h3>
					<div className="mt-2 max-w-xl text-sm text-text-secondary">
						<p>We&apos;ve sent you a code to verify your email address</p>
					</div>
					<Form {...getFormProps(form)} method="POST" className="mt-5 sm:flex sm:items-center">
						<AuthenticityTokenInput />
						<div className=" flex w-full flex-col sm:max-w-xs">
							<div className="flex flex-col sm:flex-row ">
								<label htmlFor={fields[codeQueryParam].id} className="sr-only">
									One-Time Password
								</label>
								<input
									{...getInputProps(fields[codeQueryParam], { type: 'text' })}
									className="block w-full rounded-md border-0 px-2 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
									placeholder="Please enter your 6 digit code"
									// eslint-disable-next-line jsx-a11y/no-autofocus
									autoFocus
								/>
								<input {...getInputProps(fields[typeQueryParam], { type: 'hidden' })} />
								<input {...getInputProps(fields[targetQueryParam], { type: 'hidden' })} />
								<input {...getInputProps(fields[redirectToQueryParam], { type: 'hidden' })} />

								<button
									type="submit"
									className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:ml-3 sm:mt-0 sm:w-auto"
								>
									Submit
								</button>
							</div>
							<div
								className={`transition-height overflow-hidden  py-1 duration-500 ease-in-out ${fields[codeQueryParam].errors ? 'max-h-56' : 'max-h-0'}`}
							>
								<ErrorList errors={fields[codeQueryParam].errors} id={fields[codeQueryParam].errorId} />
							</div>
						</div>
					</Form>
					<div
						className={`transition-height overflow-hidden  py-1 duration-500 ease-in-out ${form.errors ? 'max-h-56' : 'max-h-0'}`}
					>
						<AlertToast errors={form.errors} id={form.errorId} />
					</div>
				</div>
			</div>
		</div>
	);
}
