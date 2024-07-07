import Spinner from './Spinner';

interface ButtonProps {
	type: 'button' | 'submit' | 'reset';
	label: string;
	name: string;
	value: string;
	status?: 'pending' | 'success' | 'error' | 'idle';
	isPending?: boolean;
	disabled?: boolean;
}

export default function Button({ type = 'button', label, name, value, disabled, isPending }: ButtonProps) {
	return (
		<button
			value={value}
			name={name}
			type={type}
			disabled={disabled || isPending}
			className="rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed  disabled:opacity-50"
			// className="shadow-lsm items-end rounded-md bg-indigo-500 px-2.5 py-1.5 text-sm  font-semibold text-white ring-1 ring-inset ring-bg-primary  hover:bg-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white dark:bg-white dark:text-indigo-600 dark:hover:bg-gray-300"
		>
			{isPending ? (
				<div className="flex h-full items-center gap-2">
					<p>{label}</p>
					<Spinner />
				</div>
			) : (
				label
			)}
		</button>
	);
}
