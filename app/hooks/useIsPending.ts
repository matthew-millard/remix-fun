import { useFormAction, useNavigation } from '@remix-run/react';
import { useSpinDelay } from 'spin-delay';

export function useIsPending({
	formAction,
	formIntent,
	formMethod = 'POST',
	state = 'non-idle',
}: {
	formAction?: string;
	formIntent: string;
	formMethod?: 'POST' | 'GET' | 'PUT' | 'PATCH' | 'DELETE';
	state?: 'submitting' | 'loading' | 'non-idle';
}) {
	const contextualFormAction = useFormAction();
	const navigation = useNavigation();

	const isPendingState = state === 'non-idle' ? navigation.state !== 'idle' : navigation.state === state;

	const currentIntent = formIntent;

	const navigationMatchesIntent = navigation.formData?.get('intent') === currentIntent;

	return (
		isPendingState &&
		navigation.formAction === (formAction ?? contextualFormAction) &&
		navigation.formMethod === formMethod &&
		navigationMatchesIntent
	);
}

export function useIsPendingWithoutIntent({
	formAction,
	formMethod = 'POST',
	state = 'non-idle',
}: {
	formAction?: string;
	formMethod?: 'POST' | 'GET' | 'PUT' | 'PATCH' | 'DELETE';
	state?: 'submitting' | 'loading' | 'non-idle';
} = {}) {
	const contextualFormAction = useFormAction();
	const navigation = useNavigation();
	const isPendingState = state === 'non-idle' ? navigation.state !== 'idle' : navigation.state === state;
	return (
		isPendingState &&
		navigation.formAction === (formAction ?? contextualFormAction) &&
		navigation.formMethod === formMethod
	);
}

/**
 * This combines useSpinDelay (from https://npm.im/spin-delay) and useIsPending
 * from our own utilities to give you a nice way to show a loading spinner for
 * a minimum amount of time, even if the request finishes right after the delay.
 *
 * This avoids a flash of loading state regardless of how fast or slow the
 * request is.
 */
export function useDelayedIsPending({
	formAction,
	formMethod,
	delay = 400,
	minDuration = 300,
}: Parameters<typeof useIsPendingWithoutIntent>[0] & Parameters<typeof useSpinDelay>[1] = {}) {
	const isPending = useIsPendingWithoutIntent({ formAction, formMethod });
	console.log('isPendingInsideHook', isPending);
	const delayedIsPending = useSpinDelay(isPending, {
		delay,
		minDuration,
	});
	console.log('delayedIsPending', delayedIsPending);
	return delayedIsPending;
}
