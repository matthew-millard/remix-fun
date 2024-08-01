import classNames from '~/utils/classNames';

type LabelProps = {
	label: string;
	htmlFor: string;
};

type InputProps = {
	autoFocus?: boolean;
	fieldAttributes: React.InputHTMLAttributes<HTMLInputElement>;
	additionalClasses?: AdditionalClasses;
	disabled?: boolean;
};

export type InputErrorsProps = {
	errors?: string[] | null;
	errorId?: string;
};

type InputErrorProps = {
	error: string;
};

type AdditionalClasses = {
	backgroundColor?: string;
	textColor?: string;
};

type InputFieldProps = LabelProps & InputProps & InputErrorsProps;

export default function InputField({
	htmlFor,
	label,
	fieldAttributes,
	autoFocus,
	errors,
	errorId,
	additionalClasses = {},
	disabled,
}: InputFieldProps) {
	return (
		<div>
			<Label htmlFor={htmlFor} label={label} />
			<div className="mt-1">
				<Input
					fieldAttributes={fieldAttributes}
					autoFocus={autoFocus}
					additionalClasses={additionalClasses}
					disabled={disabled}
				/>
			</div>
			<div className="mt-1">
				<InputErrors errors={errors} errorId={errorId} />
			</div>
		</div>
	);
}

export function Label({ label, htmlFor }: LabelProps) {
	return (
		<label htmlFor={htmlFor} className="block text-sm font-medium leading-6 text-text-primary">
			{label}
		</label>
	);
}

function Input({ fieldAttributes, autoFocus = false, additionalClasses, disabled }: InputProps) {
	const combinedClasses = classNames(
		additionalClasses.backgroundColor,
		additionalClasses.textColor,
		'block w-full rounded-md  px-2 py-1.5  shadow-sm ring-1 ring-inset ring-border-tertiary  placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 aria-[invalid]:ring-red-500 sm:text-sm sm:leading-6 disabled:opacity-50 disabled:cursor-not-allowed',
	);

	return <input {...fieldAttributes} className={combinedClasses} autoFocus={autoFocus} disabled={disabled} />;
}

export function InputErrors({ errors, errorId }: InputErrorsProps) {
	return errors?.length ? (
		<ul className="flex flex-col gap-1" id={errorId}>
			{errors.map((error, i) => (
				<InputError key={i} error={error} />
			))}
		</ul>
	) : null;
}

export function InputError({ error }: InputErrorProps) {
	return (
		<li style={{ fontSize: '10px' }} className="text-foreground-destructive  text-red-500">
			{error}
		</li>
	);
}
