import { LoaderFunctionArgs } from 'react-router';
import { prisma } from '~/utils/db.server';
import { invariantResponse } from '~/utils/misc';

export async function loader({ params }: LoaderFunctionArgs) {
	const { imageId } = params;
	const image = await prisma.userProfileImage.findUnique({
		where: {
			id: imageId,
		},
	});

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
