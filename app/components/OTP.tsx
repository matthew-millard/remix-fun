import classNames from '~/utils/classNames';
import { useRef } from 'react';

type OneTimePasswordProps = OneTimePasswordFieldProps;

type OneTimePasswordFieldProps = {
	length: number;
	fieldAttributes: React.InputHTMLAttributes<HTMLInputElement>;
	submitButtonRef: React.RefObject<HTMLButtonElement>;
};

type OneTimePasswordInputProps = {
	autoFocus: boolean;
	inputRef: React.Ref<HTMLInputElement>;
	onChange: React.ChangeEventHandler<HTMLInputElement>;
	onPaste: React.ClipboardEventHandler<HTMLInputElement>;
} & Pick<OneTimePasswordFieldProps, 'fieldAttributes'>;

export default function OneTimePassword({ length, fieldAttributes, submitButtonRef }: OneTimePasswordProps) {
	return (
		<div>
			<OneTimePasswordFields length={length} fieldAttributes={fieldAttributes} submitButtonRef={submitButtonRef} />
		</div>
	);
}

function OneTimePasswordFields({ length, fieldAttributes, submitButtonRef }: OneTimePasswordFieldProps) {
	const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

	function handleInputChange(e: React.ChangeEvent<HTMLInputElement>, index: number) {
		const { value } = e.target;
		if (value && index < inputsRef.current.length - 1) {
			inputsRef.current[index + 1].focus();
		} else if (value && index === inputsRef.current.length - 1) {
			submitButtonRef.current?.focus();
		}
	}

	function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
		const paste = e.clipboardData.getData('text');
		const values = paste.split('').slice(0, inputsRef.current.length);
		values.forEach((value, i) => {
			inputsRef.current[i].value = value;
			if (i < inputsRef.current.length - 1) {
				inputsRef.current[i + 1].focus();
			} else if (i === inputsRef.current.length - 1) {
				submitButtonRef.current?.focus();
			}
		});
	}
	return (
		<div className="flex justify-between">
			{Array.from({ length }).map((_, index) => (
				<OneTimePasswordInput
					key={index}
					fieldAttributes={fieldAttributes}
					autoFocus={index === 0}
					inputRef={el => (inputsRef.current[index] = el!)}
					onChange={e => handleInputChange(e, index)}
					onPaste={handlePaste}
				/>
			))}
		</div>
	);
}

function OneTimePasswordInput({ fieldAttributes, autoFocus, inputRef, onChange, onPaste }: OneTimePasswordInputProps) {
	return (
		<input
			{...fieldAttributes}
			className={classNames(
				'h-14  w-14 rounded-md bg-gray-200 text-center text-xl font-bold text-black outline-none  focus:bg-white focus:ring-2 focus:ring-indigo-500',
			)}
			maxLength={1}
			autoFocus={autoFocus}
			ref={inputRef}
			onChange={onChange}
			onPaste={onPaste}
			data-otp-input
		/>
	);
}
