import { useState } from 'react';
import { InputErrors, InputErrorsProps, InputProps, Label, LabelProps } from './InputField';

type InputDomainFieldProps = InputErrorsProps & LabelProps & InputProps;

export default function InputDomainField({ htmlFor, fieldAttributes, label, errors, errorId }: InputDomainFieldProps) {
	return (
		<>
			<Label htmlFor={htmlFor} label={label} />
			<div className="mt-1">
				<InputDomain fieldAttributes={fieldAttributes} />
			</div>
			<div className="mt-1">
				<InputErrors errors={errors} errorId={errorId} />
			</div>
		</>
	);
}

function InputDomain({ fieldAttributes }: InputProps) {
	const [domain, setDomain] = useState(() => {
		return fieldAttributes.defaultValue ?? '';
	});
	return (
		<div className="flex min-w-56 rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid]:ring-red-500 sm:text-sm sm:leading-6">
			<span className="flex select-none items-center pl-2 text-gray-500 sm:text-sm">http://</span>
			<input
				placeholder="www.example.com"
				className="block flex-1 border-0 bg-transparent py-1.5 pl-1 pr-4 text-text-primary placeholder:text-gray-400 focus:ring-0"
				pattern="www.*"
				value={domain}
				onChange={e => setDomain(e.target.value)}
			/>
			<input
				type="hidden"
				className="hidden"
				name={fieldAttributes.name}
				id={fieldAttributes.id}
				form={fieldAttributes.form}
				value={`http://${domain}`}
				readOnly
			/>
		</div>
	);
}
