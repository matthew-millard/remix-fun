import { z } from 'zod';
import { prisma } from '~/utils/db.server';

const UserSchema = z.object({
	id: z.string(),
	email: z.string(),
	firstName: z.string(),
	lastName: z.string(),
	username: z.string(),
	profileImageId: z.string().nullable(),
	userLocation: z.string().nullable(),
	createdAt: z.date(),
});

const CocktailSchema = z.object({
	id: z.string(),
	name: z.string(),
	imageId: z.string().nullable(),
	createdAt: z.date(),
	averageRating: z.number().nullable(),
});

export const UsersSchema = z.array(UserSchema);
export const CocktailsSchema = z.array(CocktailSchema);

export async function searchByQuery(
	query: string,
): Promise<{ filteredUsers: z.infer<typeof UsersSchema>; filteredCocktails: z.infer<typeof CocktailsSchema> }> {
	const like = `%${query}%`;

	const rawUsers = await prisma.$queryRaw`
	SELECT DISTINCT
		U.id	AS id, 
		U.email	AS email,
		U.firstName AS firstName,
		U.lastName AS lastName,
		UN.username AS username,
		UPI.id AS profileImageId,
		UL.city || ', ' || UL.country AS userLocation,
		U.createdAt,
	CASE
		WHEN U.firstName LIKE ${like} THEN 1
		WHEN U.lastName LIKE ${like} THEN 2
		WHEN U.email LIKE ${like} THEN 3
		WHEN UN.username LIKE ${like} THEN 4
		ELSE 5
	END AS relevance
	FROM User U
	LEFT JOIN UserProfileImage UPI ON U.id = UPI.userId
	LEFT JOIN UserLocation UL ON U.id = UL.userId
	LEFT JOIN Username UN ON U.id = UN.userId
	WHERE 
		U.email LIKE ${like} OR 
		U.firstName LIKE ${like} OR 
		U.lastName LIKE ${like} OR
		UN.username LIKE ${like} 
	ORDER BY relevance, U.firstName, U.lastName
	LIMIT 20`;

	const resultUsers = UsersSchema.safeParse(rawUsers);
	const filteredUsers = resultUsers.success ? resultUsers.data : [];

	// Query the database getting the cocktails information
	const rawCocktails = await prisma.$queryRaw`
	SELECT DISTINCT
		C.id AS id,
		C.name AS name,
		CI.id AS imageId,
		C.createdAt,
		AVG(CR.rating) AS averageRating,
	CASE
		WHEN C.name LIKE ${like} THEN 1
		WHEN T.name LIKE ${like} THEN 2
		ELSE 3
	END AS relevance
	FROM Cocktail C
	LEFT JOIN CocktailImage CI ON C.id = CI.cocktailId
	LEFT JOIN _CocktailToTag CT ON C.id = CT.A
	LEFT JOIN Tag T ON CT.B = T.id
	LEFT JOIN Rating CR ON C.id = CR.cocktailId
	WHERE 
		C.name LIKE ${like} OR
		T.name LIKE ${like}
	GROUP BY C.id, C.name, CI.id, C.createdAt
	ORDER BY relevance, C.name
	LIMIT 20`;

	const resultCocktails = CocktailsSchema.safeParse(rawCocktails);

	const filteredCocktails = resultCocktails.success ? resultCocktails.data : [];

	return {
		filteredUsers,
		filteredCocktails,
	};
}
