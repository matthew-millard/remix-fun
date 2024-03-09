import { useEffect } from 'react';

export default function useFocusInvalid(ref: HTMLElement | null, hasErrors: boolean) {
	useEffect(() => {
		if (!hasErrors) return;
		if (!ref) return;

		const element = ref;

		if (element.matches('[aria-invalid="true"]')) {
			element.focus();
		} else {
			const firstInvalidEl = element.querySelector('[aria-invalid="true"]') as HTMLElement;
			if (firstInvalidEl) {
				firstInvalidEl.focus();
			}
		}
	}, [ref, hasErrors]);
}
