import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { InputErrors, InputErrorsProps, Label } from './InputField';

type LabelProps = {
	label: string;
	htmlFor: string;
};

type InputSelectProps = {
	fieldAttributes: React.SelectHTMLAttributes<HTMLSelectElement>;
	value?: string;
	defaultValue?: string;
	defaultOption: React.ReactNode;
	options?: Array<{ value: string; label: string }>;
	onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
};

type InputSelectFieldProps = LabelProps & InputSelectProps & InputErrorsProps;

export default function InputSelectField({
	fieldAttributes,
	value,
	defaultValue,
	htmlFor,
	label,
	defaultOption,
	options,
	errors,
	errorId,
	onChange,
}: InputSelectFieldProps) {
	return (
		<div>
			<Label htmlFor={htmlFor} label={label} />
			<div className="mt-1">
				<InputSelect
					fieldAttributes={fieldAttributes}
					value={value}
					defaultValue={defaultValue}
					onChange={onChange}
					defaultOption={defaultOption}
					options={options}
				/>
			</div>
			<div className="mt-1">
				<InputErrors errors={errors} errorId={errorId} />
			</div>
		</div>
	);
}

function InputSelect({ fieldAttributes, value, defaultValue, defaultOption, options, onChange }: InputSelectProps) {
	return (
		<div className="relative">
			<select
				{...fieldAttributes}
				onChange={onChange}
				value={value}
				defaultValue={defaultValue}
				className="block w-full appearance-none rounded-md border-0 bg-bg-secondary px-2 py-1.5 pr-10 text-text-primary shadow-sm ring-1 ring-inset ring-border-tertiary focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 [&_*]:text-black"
			>
				{defaultOption}
				{options?.map(option => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</select>
			<ChevronDownIcon className="pointer-events-none absolute right-2 top-1/2 h-5 w-5 -translate-y-1/2 transform text-text-primary" />
		</div>
	);
}
