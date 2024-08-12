import Datepicker from 'react-tailwindcss-datepicker';
import type { DatepickerType } from 'react-tailwindcss-datepicker';
import { InputErrors, Label } from './InputField';
import { useState } from 'react';

const ReactDatePicker = Datepicker;

type ReactDatePickerProps = {
	label: string;
	inputId: string;
	inputName: string;
	errors: string[] | null;
	errorId: string;
	primaryColor?: DatepickerType['primaryColor'];
	isSubmitting: boolean;
};

export default function DatePicker({
	label,
	inputId,
	inputName,
	errors,
	errorId,
	primaryColor,
	isSubmitting,
}: ReactDatePickerProps) {
	const [dateRange, setDateRange] = useState({
		startDate: null,
		endDate: null,
	});

	return (
		<>
			<Label htmlFor={inputId} label={label} />
			<div className="mt-1">
				<ReactDatePicker
					primaryColor={primaryColor}
					inputClassName={
						'text-text-primary bg-bg-secondary w-full rounded-md  px-2 py-1.5  shadow-sm ring-1 ring-inset ring-border-tertiary  placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 aria-[invalid]:ring-red-500 sm:text-sm sm:leading-6 disabled:opacity-50 disabled:cursor-not-allowed'
					}
					placeholder={'Select start date'}
					asSingle
					useRange={false}
					value={dateRange}
					onChange={value => setDateRange(value)}
					disabled={isSubmitting}
					inputName={inputName}
					inputId={inputId}
				/>
				<div className="mt-1">
					<InputErrors errors={errors} errorId={errorId} />
				</div>
			</div>
		</>
	);
}
