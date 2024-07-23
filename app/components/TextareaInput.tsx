import { InputErrors, InputErrorsProps } from './InputField';

type TextareaInputProps = {
	fieldAttributes: React.TextareaHTMLAttributes<HTMLTextAreaElement>;
	rows?: number;
} & InputErrorsProps;

export default function TextareaInput({ fieldAttributes, rows = 3, errors, errorId }: TextareaInputProps) {
	return (
		<>
			<textarea
				{...fieldAttributes}
				rows={rows}
				className="block w-full rounded-md border-0 bg-bg-secondary px-2 py-1.5 text-text-primary shadow-sm ring-1 ring-inset ring-border-tertiary focus:ring-2 focus:ring-inset focus:ring-indigo-500 aria-[invalid]:ring-red-600 sm:text-sm sm:leading-6"
			/>
			<div className="mt-1">
				<InputErrors errors={errors} errorId={errorId} />
			</div>
		</>
	);
}
