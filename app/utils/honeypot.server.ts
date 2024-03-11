import { Honeypot, SpamError } from 'remix-utils/honeypot/server';

// Create a new Honeypot instance, the values here are the defaults, you can
// customize them
export const honeypot = new Honeypot({
	randomizeNameFieldName: false,
	nameFieldName: 'name__confirm',
	validFromFieldName: null, // null to disable it
	encryptionSeed: process.env.HONEY_POT_ENCRYPTION_SEED, // Ideally it should be unique even between processes
});

export function checkHoneypot(formData: FormData) {
	try {
		honeypot.check(formData);
	} catch (error) {
		if (error instanceof SpamError) {
			throw new Response('Form not submitted properly', { status: 400 });
		}
		throw error;
	}
}
