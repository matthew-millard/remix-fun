import { forwardRef } from 'react';
import classNames from '~/utils/classNames';

type SubmitButtonProps = {
	text: string;
	isSubmitting?: boolean;
	errors?: string[] | null;
	name?: string;
	value?: string;
	width?: string;
	backgroundColor?: string;
	disabled?: boolean;
	ref?: React.Ref<HTMLButtonElement>;
} & Pick<SubmittingStateProps, 'stateText'>;

type SubmittingStateProps = {
	stateText?:
		| 'Processing...'
		| 'Submitting...'
		| 'Saving...'
		| 'Loading...'
		| 'Creating...'
		| 'Updating...'
		| 'Deleting...'
		| 'Uploading...'
		| 'Downloading...'
		| 'Authenticating...'
		| 'Logging in...'
		| 'Logging out...'
		| 'Signing in...'
		| 'Changing email...'
		| 'Logging out other sessions...';
};

const SubmitButton = forwardRef<HTMLButtonElement, SubmitButtonProps>(function SubmitButton(
	{ text, isSubmitting, name, value, width, backgroundColor, errors, stateText, disabled },
	ref,
) {
	return (
		<button
			type="submit"
			className={classNames(
				width ? width : 'w-full',
				backgroundColor ? backgroundColor : 'bg-indigo-500 hover:bg-indigo-400',
				'flex justify-center rounded-md  px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm  focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-50',
			)}
			disabled={isSubmitting || errors?.length > 0 || disabled}
			name={name}
			value={value}
			ref={ref}
		>
			{isSubmitting ? <SubmittingState stateText={stateText} /> : text}
		</button>
	);
});

function SubmittingState({ stateText = 'Processing...' }: SubmittingStateProps) {
	return (
		<span className="flex items-center">
			<svg
				className="-ml-1 mr-3 h-5 w-5 animate-spin text-white"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				aria-hidden="true"
				role="status"
			>
				<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
				<path
					className="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
				></path>
			</svg>
			{stateText}
		</span>
	);
}

SubmitButton.displayName = 'SubmitButton';

export default SubmitButton;
