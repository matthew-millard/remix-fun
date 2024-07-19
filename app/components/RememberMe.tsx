import { useState } from 'react';
import { Label } from './InputField';

type RememberMeProps = {
	id: string;
	name: string;
	formId?: string;
};

export default function RememberMe({ id, name, formId }: RememberMeProps) {
	return (
		<div className="flex items-center gap-2">
			<RememberMeInput id={id} name={name} formId={formId} />
			<Label htmlFor="remember-me" label="Remember me" />
		</div>
	);
}

function RememberMeInput({ id, name, formId }: RememberMeProps) {
	const [isChecked, setIsChecked] = useState(false);

	return (
		<div className="relative flex h-4 w-4 items-center justify-center">
			<input
				type="checkbox"
				id={id}
				form={formId}
				name={name}
				checked={isChecked}
				className="peer absolute h-full w-full appearance-none rounded border border-gray-300 ring-transparent checked:border-indigo-600 checked:bg-indigo-600 dark:border-slate-600 dark:checked:border-indigo-600 forced-colors:appearance-auto"
				onChange={() => setIsChecked(!isChecked)}
			/>
			<svg
				viewBox="0 0 14 14"
				fill="none"
				className="invisible absolute h-3.5 w-3.5 stroke-white peer-checked:visible dark:text-indigo-300 forced-colors:hidden"
				style={{ pointerEvents: 'none' }} // remove pointer events so the svg doesn't block the checkbox onChange from triggering
			>
				<path d="M3 8L6 11L11 3.5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
			</svg>
		</div>
	);
}
