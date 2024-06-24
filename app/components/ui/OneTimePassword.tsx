import { ArrowLeftIcon, ClipboardDocumentCheckIcon, ClipboardIcon } from '@heroicons/react/24/outline';
import { Form } from '@remix-run/react';
import { useState } from 'react';

export default function OneTimePassword({ otpUri }: { otpUri: string }) {
	const [showOTPUri, setShowOTPUri] = useState(false);
	const [copiedToClipboard, setCopiedToClipboard] = useState(false);

	function handleCopyToClipboard(text: string, setCopiedToClipboard: (copied: boolean) => void) {
		navigator.clipboard.writeText(text).then(() => {
			setCopiedToClipboard(true);
			setTimeout(() => {
				setCopiedToClipboard(false);
			}, 2000);
		});
	}
	return (
		<div>
			{!showOTPUri ? (
				<Form action="" method="post">
					<div className="flex flex-col items-center gap-y-8 px-8 py-12">
						<div className="flex w-full max-w-sm flex-row items-center justify-center gap-2">
							<OneTimePasswordInput autoFocus={true} />
							<OneTimePasswordInput />
							<OneTimePasswordInput />
							<OneTimePasswordInput />
							<OneTimePasswordInput />
						</div>

						<div className="flex flex-col space-y-5">
							<button
								type="button"
								className="flex flex-row items-center justify-center space-x-1 text-center text-sm font-medium text-text-notify"
								onClick={() => setShowOTPUri(true)}
							>
								Can&apos;t scan it?
							</button>
						</div>
					</div>
				</Form>
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

export function OneTimePasswordInput({ autoFocus = false }: { autoFocus?: boolean }) {
	return (
		<div className="h-12 w-12 lg:h-14 lg:w-14">
			<input
				className="flex h-full w-full flex-col items-center justify-center rounded-lg border border-bg-secondary bg-gray-50  text-center text-xl font-bold text-indigo-700 outline-none ring-indigo-700 focus:bg-white focus:ring-2 lg:text-2xl"
				type="text"
				name=""
				id=""
				maxLength={1}
				// eslint-disable-next-line jsx-a11y/no-autofocus
				autoFocus={autoFocus}
			/>
		</div>
	);
}
