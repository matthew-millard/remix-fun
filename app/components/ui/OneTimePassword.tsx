import { ArrowLeftIcon, ClipboardDocumentCheckIcon, ClipboardIcon } from '@heroicons/react/24/outline';
import { useFetcher } from '@remix-run/react';
import { useId, useRef, useState } from 'react';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';
import ErrorList from '../ErrorList';
import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { VerifySchema } from '~/routes/$username_+/settings+/two-factor-authentication+/verify';

export default function OneTimePassword({ otpUri }: { otpUri: string }) {
	const fetcher = useFetcher();

	const [form, fields] = useForm({
		id: 'verify-form',
		constraint: getZodConstraint(VerifySchema),
		lastResult: fetcher.data,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: VerifySchema });
		},
	});
	const [showOTPUri, setShowOTPUri] = useState(false);
	const [copiedToClipboard, setCopiedToClipboard] = useState(false);
	const inputsRef = useRef<HTMLInputElement[]>([]);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
		const { value } = e.target;
		if (value && index < inputsRef.current.length - 1) {
			inputsRef.current[index + 1].focus();
		}
	};

	function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
		const paste = e.clipboardData.getData('text');
		const values = paste.split('').slice(0, inputsRef.current.length);
		values.forEach((value, i) => {
			inputsRef.current[i].value = value;
			if (i < inputsRef.current.length - 1) {
				inputsRef.current[i + 1].focus();
			}
		});
	}

	function handleCopyToClipboard(text: string, setCopiedToClipboard: (copied: boolean) => void) {
		navigator.clipboard.writeText(text).then(() => {
			setCopiedToClipboard(true);
			setTimeout(() => {
				setCopiedToClipboard(false);
			}, 2000);
		});
	}

	function handleSubmit() {
		const otpCode = inputsRef.current.map(input => input.value).join('');
		if (otpCode.length === 5) {
			const formData = new FormData();
			formData.append('code', otpCode);
			// Add csrf token
			const csrfToken = document.getElementsByName('csrf')[0].getAttribute('value');
			formData.append('csrf', csrfToken);
			fetcher.submit(formData, { method: 'POST' });
		}
	}

	return (
		<div>
			{!showOTPUri ? (
				<fetcher.Form {...getFormProps(form)} id={form.id} action="" method="post" onChange={() => handleSubmit()}>
					<AuthenticityTokenInput />
					<div className="flex flex-col items-center gap-y-8 px-8 py-12">
						<div className="flex w-full max-w-sm flex-row items-center justify-center gap-2">
							{Array.from({ length: 5 }).map((_, index) => (
								<OneTimePasswordInput
									key={index}
									autoFocus={index === 0}
									inputRef={el => (inputsRef.current[index] = el!)}
									onChange={e => handleInputChange(e, index)}
									onPaste={handlePaste}
									inputProps={{ ...getInputProps(fields.code, { type: 'text' }) }}
									errors={fields.code.errors}
								/>
							))}
						</div>

						<div className="flex flex-col space-y-2">
							<button
								type="button"
								className="flex flex-row items-center justify-center space-x-1 text-center text-sm font-medium text-text-notify"
								onClick={() => setShowOTPUri(true)}
							>
								Can&apos;t scan it?
							</button>
							<div className="flex justify-center">
								<ErrorList id={form.id} errors={form.errors} />
							</div>
						</div>
					</div>
				</fetcher.Form>
			) : (
				<div className="flex flex-col gap-y-4 p-8 text-center">
					<p className="text-text-primary">
						If you cannot scan the QR code, you can manually add this account to your authenticator app using this code:
					</p>
					<div className="relative">
						<button
							onClick={() => handleCopyToClipboard(otpUri, setCopiedToClipboard)}
							type="button"
							className="absolute -right-3 -top-3 rounded-md bg-bg-primary p-1 text-text-notify"
						>
							{copiedToClipboard ? <ClipboardDocumentCheckIcon height={'24'} /> : <ClipboardIcon height={'24'} />}
						</button>
						<pre
							className="whitespace-pre-wrap break-all rounded-lg bg-bg-alt p-6 text-sm text-pink-500"
							aria-label="One-time Password URI"
						>
							{otpUri}
						</pre>
					</div>
					<button
						onClick={() => setShowOTPUri(false)}
						className="flex flex-row items-center justify-center gap-x-1 text-sm font-semibold leading-6 text-text-notify"
						type="button"
					>
						<span aria-hidden="true">
							<ArrowLeftIcon height={'14'} />
						</span>
						Back{' '}
					</button>
				</div>
			)}
		</div>
	);
}

export function OneTimePasswordInput({
	autoFocus = false,
	inputRef,
	onChange,
	onPaste,
	inputProps,
	errors,
}: {
	autoFocus?: boolean;
	inputRef: React.Ref<HTMLInputElement>;
	onChange: React.ChangeEventHandler<HTMLInputElement>;
	onPaste: React.ClipboardEventHandler<HTMLInputElement>;
	inputProps: React.InputHTMLAttributes<HTMLInputElement>;
	errors?: Array<string | null | undefined> | null | undefined;
}) {
	const fallbackId = useId();
	const id = inputProps.id ?? fallbackId;
	return (
		<div className="h-12 w-12 lg:h-14 lg:w-14">
			<input
				id={id}
				className={classes(
					'flex h-full w-full flex-col items-center justify-center rounded-lg border bg-gray-50 text-center text-xl font-bold text-indigo-700 outline-none focus:bg-white focus:ring-2 lg:text-2xl',
					errors?.length ? 'border-2 border-red-700' : '',
				)}
				maxLength={1}
				autoFocus={autoFocus}
				ref={inputRef}
				onChange={onChange}
				onPaste={onPaste}
				{...inputProps}
			/>
		</div>
	);
}

function classes(...classNames: string[]) {
	return classNames.filter(Boolean).join(' ');
}
