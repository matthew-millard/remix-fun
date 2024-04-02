import { z } from 'zod';

export const MAX_UPLOAD_SIZE = 1024 * 1024 * 3; // 3MB
export const ACCEPTED_FILE_TYPES = 'image/png, image/jpeg, image/gif';

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

export const LoginEmailSchema = z
	.string()
	.email({ message: 'Email is invalid' })
	// users can type the email in any case, but we convert it in lowercase
	.transform(value => value.toLowerCase());

export const profilePictureSchema = z
	.instanceof(File)
	.optional()
	.refine(file => {
		return !file || file.size <= MAX_UPLOAD_SIZE;
	}, 'File size must be less than 3MB')
	.refine(file => {
		return ACCEPTED_FILE_TYPES.includes(file.type);
	}, 'File must be either a jpg, png, or gif');
