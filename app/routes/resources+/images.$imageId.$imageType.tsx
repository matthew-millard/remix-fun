import { LoaderFunctionArgs } from 'react-router';
import { prisma } from '~/utils/db.server';
import { invariantResponse } from '~/utils/misc';

export async function loader({ params }: LoaderFunctionArgs) {
	const { imageId, imageType } = params;

	let image;

	switch (imageType) {
		case 'profile': {
			image = await prisma.userProfileImage.findUnique({
				where: {
					id: imageId,
				},
			});
			break;
		}
		case 'cover': {
			image = await prisma.userCoverImage.findUnique({
				where: {
					id: imageId,
				},
			});
			break;
		}
		case 'cocktail': {
			image = await prisma.cocktailImage.findUnique({
				where: {
					id: imageId,
				},
			});
			break;
		}
		default: {
			invariantResponse(null, 'Invalid image type', { status: 400 });
		}
	}
	if (!image || !image.blob) {
		invariantResponse(image, 'Image not found', { status: 404 });
	}

	const { blob, contentType } = image;

	return new Response(blob, {
		status: 200,
		headers: {
			'content-type': contentType,
			'cache-control': 'public, max-age=31536000, immutable',
		},
	});
}
