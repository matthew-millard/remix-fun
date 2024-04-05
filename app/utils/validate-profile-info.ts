import { parseWithZod } from '@conform-to/zod';
import { profileInfoSchema } from './validation-schemas';
import { prisma } from './db.server';
import { z } from 'zod';

export const validateProfileInfo = async (formData: FormData, userId: string) => {
	return await parseWithZod(formData, {
		schema: profileInfoSchema.transform(async (data, ctx) => {
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
				}
			}

			return data;
		}),

		async: true,
	});
};
