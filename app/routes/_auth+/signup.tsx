import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import { ActionFunctionArgs, json, LoaderFunctionArgs, redirect, type MetaFunction } from '@remix-run/node';
import { Form, Link, useActionData, useNavigation } from '@remix-run/react';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';
import { HoneypotInputs } from 'remix-utils/honeypot/react';
import { z } from 'zod';
import { InputField, LinkWithPrefetch, SubmitButton } from '~/components';
import { checkCSRF } from '~/utils/csrf.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { requireAnonymous } from '~/utils/auth.server';
import { EmailSchema } from '~/utils/validation-schemas';
import { prisma } from '~/utils/db.server';
import { sendEmail } from '~/utils/email.server';
import { generateTOTP } from '@epic-web/totp';
import { getDomainUrl } from '~/utils/misc';
import { codeQueryParam, targetQueryParam, typeQueryParam } from './verify';
import VerifyEmailAddress from 'packages/transactional/emails/VerifyEmailAddress';

const SignUpSchema = z.object({
	email: EmailSchema,
});

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
		schema: SignUpSchema.transform(async (data, ctx) => {
			// Check if email is already in use
			const emailExists = await prisma.user.findFirst({ where: { email: data.email } });
			if (emailExists) {
				ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['email'], message: 'Email is already in use' });
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

	const { email } = submission.value;

	const { otp, secret, algorithm, charSet, digits, period } = generateTOTP({
		digits: 5,
		algorithm: 'SHA256',
		period: 15 * 60, // 15 minutes
		charSet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
	});

	const type = 'signup';
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
		subject: `Confirm your Email Address`,
		react: (
			<VerifyEmailAddress
				otp={otp}
				verifyUrl={verifyUrl.toString()}
				title="Verify Email"
				description="We need to verify your email address before allowing you to create an account with us. This quick step ensures the security of your account and a smooth experience for you."
			/>
		),
	});

	if (response.status !== 200) {
		return json({ status: 'error', message: 'An error occured' }, { status: 500 });
	}

	return redirect(redirectToUrl.toString());
}

export default function SignupRoute() {
	const lastResult = useActionData();
	const navigate = useNavigation();
	const isSubmitting = navigate.state === 'submitting';

	const [form, fields] = useForm({
		id: 'signup-form',
		shouldValidate: 'onSubmit',
		lastResult,
		shouldRevalidate: 'onSubmit',
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: SignUpSchema });
		},
	});

	return (
		<main className="flex min-h-[calc(100vh-100px)] flex-1 flex-col  items-center px-6 py-20 lg:min-h-[calc(100vh-125px)] lg:justify-center">
			<div className="w-full max-w-sm lg:-mt-28">
				<div>
					<h1 className="text-2xl font-bold leading-9 tracking-tight text-text-primary">Sign up for an account</h1>
					<p className="mt-2 text-sm leading-6 text-text-secondary">Join the Barfly community</p>
				</div>

				<Form {...getFormProps(form)} method="POST" className="mt-10 space-y-6">
					<HoneypotInputs />
					<AuthenticityTokenInput />
					<InputField
						htmlFor={fields.email.id}
						fieldAttributes={{ ...getInputProps(fields.email, { type: 'email' }) }}
						label="Email address"
						autoFocus={true}
						errors={fields.email.errors}
						errorId={fields.email.errorId}
					/>

					<LinkWithPrefetch
						to="/login"
						prefetch="intent"
						text="Already have an account?"
						className="flex justify-end"
					/>

					<SubmitButton text="Sign up" isSubmitting={isSubmitting} />
				</Form>
			</div>
		</main>
	);
}

export const meta: MetaFunction = () => {
	return [
		{ title: 'Sign up | Barfly' },
		{
			name: 'description',
			content:
				'Join Barfly to discover the best drinking spots in Canada, learn classic cocktail recipes, and connect with bar enthusiasts and bartenders. Sign up now.',
		},
	];
};

export const handle = {
	breadcrumb: () => (
		<Link
			prefetch="intent"
			className="ml-1 text-xs text-gray-400 hover:text-gray-500  lg:ml-4 lg:text-sm"
			to={`/signup`}
		>
			Sign Up
		</Link>
	),
};
