import { z } from 'zod';

export const MAX_UPLOAD_SIZE = 1024 * 1024 * 3; // 3MB
export const ACCEPTED_FILE_TYPES = 'image/png, image/jpeg, image/gif';
export const CONTENT_MAX_LENTGH = 250;

export const UsernameSchema = z
	.string()
	.min(3, { message: 'Username is too short' })
	.max(20, { message: 'Username is too long' })
	.regex(/^[a-zA-Z0-9_]+$/, {
		message: 'Username can only include letters, numbers, and underscores',
	})
	// users can type the username in any case, but we store it in lowercase
	.transform(value => value.toLowerCase());

export const PasswordSchema = z
	.string()
	.min(8, { message: 'Password must be at least 8 characters long' })
	.max(124, { message: 'Password must be at most 124 characters long' })
	.regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
	.regex(/[\W_]/, { message: 'Password must contain at least one special character' })
	.regex(/[0-9]/, { message: 'Password must contain at least one number' });

export const FirstNameSchema = z
	.string()
	.trim()
	.min(1, { message: 'First name cannot be empty.' })
	.max(30, { message: 'First name must be 30 characters or less.' });

export const LastNameSchema = z
	.string()
	.trim()
	.min(1, { message: 'Last name cannot be empty.' })
	.max(30, { message: 'Last name must be 30 characters or less.' });

export const EmailSchema = z
	.string()
	.email({ message: 'Email is invalid' })
	.min(3, { message: 'Email is too short' })
	.max(100, { message: 'Email is too long' })
	// users can type the email in any case, but we store it in lowercase
	.transform(value => value.toLowerCase());

export const ChangeEmailSchema = z
	.string()
	.email({ message: 'Email is invalid' })
	// users can type the email in any case, but we convert it in lowercase
	.transform(value => value.toLowerCase());

export const LoginEmailSchema = z
	.string()
	.email({ message: 'Email is invalid' })
	// users can type the email in any case, but we convert it in lowercase
	.transform(value => value.toLowerCase());

export const ResetPasswordEmailSchema = z
	.string()
	.email({ message: 'Email is invalid' })
	// users can type the email in any case, but we convert it in lowercase
	.transform(value => value.toLowerCase());

export const UploadImageSchema = z
	.instanceof(File, { message: 'No file uploaded' })
	.refine(file => file !== undefined, {
		message: 'No file uploaded',
	})
	.refine(file => file.size <= MAX_UPLOAD_SIZE, {
		message: 'File size must be less than 3MB',
	})
	.refine(file => ACCEPTED_FILE_TYPES.includes(file.type), {
		message: 'File must be either a jpg, png, or gif',
	});

// ************* Update schema to allow the user to update their about me to an empty string *************
export const AboutSchema = z
	.string()
	.trim()
	.max(CONTENT_MAX_LENTGH, { message: 'Must be 250 characters or less' })
	.optional();

export const profileInfoSchema = z.object({
	firstName: FirstNameSchema.optional(),
	lastName: LastNameSchema.optional(),
	email: EmailSchema.optional(),
	country: z.literal('Canada').optional(),
	province: z.string().optional(),
	city: z.string().optional(),
});
