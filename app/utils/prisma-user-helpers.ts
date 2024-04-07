import { prisma } from './db.server';

interface UserFields {
	id?: boolean;
	email?: boolean;
	firstName?: boolean;
	lastName?: boolean;
	username?: boolean;
	about?: boolean;
	userLocation?: boolean;
	createdAt?: boolean;
	updatedAt?: boolean;
	profileImage?: boolean;
}

interface UserData {
	firstName?: string;
	lastName?: string;
	username?: {
		update: {
			username: string;
		};
	};
	about?: {
		upsert: {
			update: {
				about: string;
			};
			create: {
				about: string;
			};
		};
	};
	profileImage?: {
		upsert: {
			update: {
				contentType: string;
				blob: Buffer;
			};
			create: {
				contentType: string;
				blob: Buffer;
			};
		};
	};
	userLocation?: {
		upsert: {
			update: {
				country: string;
				province: string;
				city: string;
			};
			create: {
				country: string;
				province: string;
				city: string;
			};
		};
	};
}

export async function findUniqueUser(id: string, fieldsToSelect: UserFields = {}) {
	try {
		const user = await prisma.user.findUnique({
			where: {
				id: id,
			},
			select: fieldsToSelect,
		});
		return user;
	} catch (error) {
		console.error('Failed to find unique user', error);
		throw new Error('Failed to find unique user');
	}
}

export async function updateUserProfile(id: string, data: UserData) {
	try {
		const updatedUser = await prisma.user.update({
			where: {
				id,
			},
			data,
		});
		return updatedUser;
	} catch (error) {
		console.error('Failed to update user', error);
		throw new Error('Failed to update user');
	}
}

export async function deleteUserProfileImage(imageId: string) {
	try {
		await prisma.userProfileImage.delete({
			where: {
				id: imageId,
			},
		});
	} catch (error) {
		console.error('Failed to delete user profile image', error);
		throw new Error('Failed to delete user profile image');
	}
}

export async function deleteUser(userId: string) {
	try {
		const deletedUser = await prisma.user.delete({
			where: {
				id: userId,
			},
			select: {
				id: true,
				email: true,
				firstName: true,
				lastName: true,
			},
		});
		return deletedUser;
	} catch (error) {
		console.error('Failed to delete user', error);
		throw new Error('Failed to delete user');
	}
}
