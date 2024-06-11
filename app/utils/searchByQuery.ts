import { z } from 'zod';
import { prisma } from '~/utils/db.server';

const UserSchema = z.object({
	id: z.string(),
	email: z.string(),
	firstName: z.string(),
	lastName: z.string(),
	username: z.string(),
	profileImageId: z.string().nullable(),
	userLocation: z.string(),
	createdAt: z.date(),
});

export const UsersSchema = z.array(UserSchema);

export async function searchUsersByQuery(query: string): Promise<{ filteredUsers: z.infer<typeof UsersSchema> }> {
	const like = `%${query}%`;

	const rawUsers = await prisma.$queryRaw`
	SELECT 
		U.id	AS id, 
		U.email	AS email,
		U.firstName AS firstName,
		U.lastName AS lastName,
		UN.username AS username,
		UPI.id AS profileImageId,
		UL.city || ', ' || UL.country AS userLocation,
		U.createdAt
	FROM User U
	LEFT JOIN UserProfileImage UPI ON U.id = UPI.userId
	LEFT JOIN UserLocation UL ON U.id = UL.userId
	LEFT JOIN Username UN ON U.id = UN.userId
	WHERE 
		U.email LIKE ${like} OR 
		U.firstName LIKE ${like} OR 
		U.lastName LIKE ${like} OR
		UN.username LIKE ${like} OR
		UL.city LIKE ${like} OR
		UL.province LIKE ${like} OR
		UL.country LIKE ${like}
	LIMIT 50
		`;

	const result = UsersSchema.safeParse(rawUsers);

	if (result.success) {
		return { filteredUsers: result.data };
	} else {
		return { filteredUsers: [] };
	}
}
