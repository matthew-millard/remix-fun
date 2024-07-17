type MeasurementToggleProps = {
	handleMeasurementToggle: () => void;
	preferredMeasurement: string;
};

function classNames(...classes: string[]) {
	return classes.filter(Boolean).join(' ');
}

export default function MeasurementToggle({ handleMeasurementToggle, preferredMeasurement }: MeasurementToggleProps) {
	return (
		<span className="isolate inline-flex rounded-md shadow-sm">
			<button
				type="button"
				className={classNames(
					preferredMeasurement === 'oz' ? 'bg-indigo-500' : 'bg-bg-primary',
					'relative -ml-px inline-flex items-center rounded-l-md px-3 py-2 text-sm font-semibold text-text-primary ring-1 ring-inset ring-gray-300  focus:z-10',
				)}
				onClick={handleMeasurementToggle}
			>
				oz
			</button>
			<button
				type="button"
				className={classNames(
					preferredMeasurement === 'ml' ? 'bg-indigo-500' : 'bg-bg-primary',
					'relative -ml-px inline-flex items-center rounded-r-md px-3 py-2 text-sm font-semibold text-text-primary ring-1 ring-inset ring-gray-300  focus:z-10',
				)}
				onClick={handleMeasurementToggle}
			>
				ml
			</button>
		</span>
	);
}
