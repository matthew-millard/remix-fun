type LabelProps = {
	label: 'Email address' | 'Username' | 'First name' | 'Last name' | 'Password' | 'Confirm password' | 'Remember me';
	htmlFor: string;
};

type InputProps = {
	autoFocus?: boolean;
	fieldAttributes: React.InputHTMLAttributes<HTMLInputElement>;
};

type InputErrorsProps = {
	errors?: string[] | null;
	errorId: string;
};

type InputErrorProps = {
	error: string;
	key: number;
};

type InputFieldProps = LabelProps & InputProps & InputErrorsProps;

export default function InputField({ htmlFor, label, fieldAttributes, autoFocus, errors, errorId }: InputFieldProps) {
	return (
		<div>
			<Label htmlFor={htmlFor} label={label} />
			<div className="mt-1">
				<Input fieldAttributes={fieldAttributes} autoFocus={autoFocus} />
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

function Input({ fieldAttributes, autoFocus = false }: InputProps) {
	return (
		<input
			{...fieldAttributes}
			className="block w-full rounded-md border-0 px-2 py-1.5  shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 aria-[invalid]:ring-red-500 sm:text-sm sm:leading-6"
			autoFocus={autoFocus}
		/>
	);
}

function InputErrors({ errors, errorId }: InputErrorsProps) {
	return errors?.length ? (
		<ul className="flex flex-col gap-1" id={errorId}>
			{errors.map((error, i) => (
				<InputError key={i} error={error} />
			))}
		</ul>
	) : null;
}

function InputError({ error, key }: InputErrorProps) {
	return (
		<li key={key} style={{ fontSize: '10px' }} className="text-foreground-destructive  text-red-500">
			{error}
		</li>
	);
}
