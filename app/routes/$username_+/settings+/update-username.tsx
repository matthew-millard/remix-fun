import { parseWithZod } from '@conform-to/zod';
import {
	ActionFunctionArgs,
	json,
	unstable_createMemoryUploadHandler,
	unstable_parseMultipartFormData,
} from '@remix-run/node';

import { z } from 'zod';
import { requireUser } from '~/utils/auth.server';
import { checkCSRF } from '~/utils/csrf.server';
import { prisma } from '~/utils/db.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { invariantResponse } from '~/utils/misc';
import { updateUserProfile } from '~/utils/prisma-user-helpers';
import { redirectWithToast } from '~/utils/toast.server';
import { MAX_UPLOAD_SIZE, UsernameSchema } from '~/utils/validation-schemas';

export async function action({ request, params }: ActionFunctionArgs) {
	const user = await requireUser(request);

	const uploadHandler = unstable_createMemoryUploadHandler({ maxPartSize: MAX_UPLOAD_SIZE });
	const formData = await unstable_parseMultipartFormData(request, uploadHandler);

	const userId = user.id;
	invariantResponse(user.username.username === params.username, 'Not authorized', {
		status: 403,
	});
	await checkCSRF(formData, request.headers);
	checkHoneypot(formData);

	const submission = await parseWithZod(formData, {
		async: true,
		schema: z.object({ username: UsernameSchema }).superRefine(async (data, ctx) => {
			const { username } = data;

			// Check if the username is already taken
			if (username) {
				const user = await prisma.user.findFirst({
					where: {
						username: {
							username,
						},
					},
					select: {
						id: true,
						username: true,
					},
				});

				if (user?.id !== userId && user) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: 'Username is already taken',
						path: ['username'],
					});
					return;
				}
			}

			return data;
		}),
	});

	console.log('submission', submission);

	if (submission.status !== 'success') {
		const error = submission.error;
		return redirectWithToast(`/${params.username}/settings`, {
			title: 'Invalid input',
			type: 'error',
			description: `${error.username}`,
		});
	}

	const { username } = submission.value;

	const newUsername = await updateUserProfile(userId, {
		username: {
			update: {
				username,
			},
		},
	});

	if (!newUsername) {
		return json(
			submission.reply({
				formErrors: ['Submission failed'],
				resetForm: true,
			}),
		);
	}

	return redirectWithToast(`/${newUsername.username.username}/settings`, {
		title: 'Username updated',
		type: 'success',
		description: `Your username has been updated successfully to ${newUsername.username.username}.`,
	});
}
