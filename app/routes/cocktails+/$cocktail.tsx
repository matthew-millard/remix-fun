import { parseWithZod } from '@conform-to/zod';
import { CameraIcon } from '@heroicons/react/24/outline';
import { BoltIcon } from '@heroicons/react/24/solid';
import { ActionFunctionArgs, json, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { PublishedBy, StarRatingForm, MeasurementToggle } from '~/components';
import Reviews from '~/components/ui/Reviews';
import { requireUserId } from '~/utils/auth.server';
import { checkCSRF } from '~/utils/csrf.server';
import { prisma } from '~/utils/db.server';
import { CONTENT_MAX_LENTGH } from '~/utils/validation-schemas';

export const postReviewActionIntent = 'post-review';
export const likeReviewActionIntent = 'like-review';
export const dislikeReviewActionIntent = 'dislike-review';
export const updateReviewActionIntent = 'update-review';
export const flagReviewActionIntent = 'flag-review';
export const deleteReviewActionIntent = 'delete-review';
export const reviewIdInput = 'review-id-input';
export const updateReviewInput = 'update-review-input';
export const submitRatingActionIntent = 'submit-rating';

// localstorage variables
export const BARFLY_PREFERRED_MEASUREMENT = 'barfly-preferred-measurement';

type ReviewActionArgs = {
	userId: string;
	formData: FormData;
};

export type UserData = {
	id: string;
	profileImage: { id: string };
	username: { username: string };
};

export const ReviewSchema = z.object({
	review: z
		.string({ required_error: 'Review must not be empty.' })
		.trim()
		.min(3, { message: 'Must be 3 or more characters long' })
		.max(CONTENT_MAX_LENTGH, { message: 'Must be 250 or fewer characters long' }),
});
export const UpdateReviewSchema = z.object({
	['update-review-input']: z
		.string({ required_error: 'Review must not be empty.' })
		.trim()
		.min(3, { message: 'Must be 3 or more characters long' })
		.max(CONTENT_MAX_LENTGH, { message: 'Must be 250 or fewer characters long' }),
});

export async function action({ request }: ActionFunctionArgs) {
	const userId = await requireUserId(request);
	const formData = await request.formData();
	await checkCSRF(formData, request.headers);

	const intent = formData.get('intent');

	switch (intent) {
		case postReviewActionIntent: {
			return postReviewAction({ userId, formData });
		}
		case likeReviewActionIntent: {
			return likeReviewAction({ userId, formData });
		}
		case dislikeReviewActionIntent: {
			return dislikeReviewAction({ userId, formData });
		}
		case updateReviewActionIntent: {
			return updateReviewAction({ userId, formData });
		}
		case flagReviewActionIntent: {
			return flagReviewAction({ userId, formData });
		}
		case deleteReviewActionIntent: {
			return deleteReviewAction({ userId, formData });
		}
		case submitRatingActionIntent: {
			return submitRatingAction({ userId, formData });
		}
		default: {
			throw new Response(`Invalid intent "${intent}"`, { status: 400 });
		}
	}

	async function dislikeReviewAction({ userId, formData }: ReviewActionArgs) {
		const reviewId = formData.get(reviewIdInput) as string;

		await prisma.$transaction(async prisma => {
			const existingDislike = await prisma.dislike.findUnique({
				where: {
					userId_reviewId: {
						userId,
						reviewId,
					},
				},
			});

			const existingLike = await prisma.like.findUnique({
				where: {
					userId_reviewId: {
						userId,
						reviewId,
					},
				},
			});

			if (existingDislike) {
				// Remove the dislike
				await prisma.dislike.delete({
					where: {
						userId_reviewId: {
							userId,
							reviewId,
						},
					},
				});
			} else {
				// Remove existing like if it exists
				if (existingLike) {
					await prisma.like.delete({
						where: {
							userId_reviewId: {
								userId,
								reviewId,
							},
						},
					});
				}
				// Add a new dislike
				await prisma.dislike.create({
					data: {
						userId,
						reviewId,
					},
				});
			}
		});

		return {};
	}

	async function likeReviewAction({ userId, formData }: ReviewActionArgs) {
		const reviewId = formData.get(reviewIdInput) as string;

		await prisma.$transaction(async prisma => {
			const existingLike = await prisma.like.findUnique({
				where: {
					userId_reviewId: {
						userId,
						reviewId,
					},
				},
			});

			const existingDislike = await prisma.dislike.findUnique({
				where: {
					userId_reviewId: {
						userId,
						reviewId,
					},
				},
			});

			if (existingLike) {
				// Remove the like
				await prisma.like.delete({
					where: {
						userId_reviewId: {
							userId,
							reviewId,
						},
					},
				});
			} else {
				// Remove existing dislike if it exists
				if (existingDislike) {
					await prisma.dislike.delete({
						where: {
							userId_reviewId: {
								userId,
								reviewId,
							},
						},
					});
				}
				// Add a new like
				await prisma.like.create({
					data: {
						userId,
						reviewId,
					},
				});
			}
		});

		return {};
	}

	async function updateReviewAction({ formData }: ReviewActionArgs) {
		console.log('formData: ', formData);
		const reviewId = formData.get(reviewIdInput) as string;
		const submission = parseWithZod(formData, {
			schema: UpdateReviewSchema,
		});

		if (submission.status !== 'success') {
			return json(submission.reply(), {
				status: submission.status === 'error' ? 400 : 200,
			});
		}

		const { 'update-review-input': updatedReview } = submission.value;

		await prisma.review.update({
			where: {
				id: reviewId,
			},
			data: {
				review: updatedReview,
			},
		});

		// On update, remove any existing likes or dislikes
		await prisma.like.deleteMany({
			where: {
				reviewId,
			},
		});

		await prisma.dislike.deleteMany({
			where: {
				reviewId,
			},
		});

		return {};
	}

	async function deleteReviewAction({ userId, formData }: ReviewActionArgs) {
		const reviewId = formData.get(reviewIdInput) as string;

		await prisma.$transaction(async prisma => {
			const reviewToDelete = await prisma.review.findFirst({
				where: {
					id: reviewId,
					userId,
				},
			});

			if (reviewToDelete) {
				await prisma.review.delete({
					where: {
						id: reviewToDelete.id,
					},
				});
			}
		});

		return {};
	}

	async function postReviewAction({ userId, formData }: ReviewActionArgs) {
		const submission = await parseWithZod(formData, {
			async: true,
			schema: ReviewSchema.transform(async (data, ctx) => {
				const hasReviewed = await prisma.review.findFirst({
					where: {
						userId,
					},
				});

				if (hasReviewed) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						path: ['review'],
						message: 'You have already reviewed this cocktail. Please either update or delete your existing review.',
					});
				}

				return data;
			}),
		});

		if (submission.status !== 'success') {
			return json(submission.reply(), {
				status: submission.status === 'error' ? 400 : 200,
			});
		}

		const { review } = submission.value;
		await prisma.review.create({
			data: {
				userId,
				review,
				cocktailId: '1',
			},
		});

		// Return with a toast notification
		return { status: 200 };
	}

	async function flagReviewAction({ userId, formData }: ReviewActionArgs) {
		const reviewId = formData.get(reviewIdInput) as string;
		// Check if the review has already been flagged by a user

		await prisma.$transaction(async prisma => {
			const hasBeenFlagged = await prisma.flagReview.findUnique({
				where: {
					reviewId,
				},
			});

			if (hasBeenFlagged && hasBeenFlagged.userId === userId) {
				// Allows the user to remove their flag
				await prisma.flagReview.delete({
					where: {
						reviewId,
					},
				});
			} else if (!hasBeenFlagged) {
				await prisma.flagReview.create({
					data: {
						reviewId,
						userId,
					},
				});
			}
		});

		return {};
	}

	async function submitRatingAction({ userId, formData }: ReviewActionArgs) {
		const rating = formData.get('rating') as string;
		const cocktailId = formData.get('cocktailId') as string;

		await prisma.$transaction(async prisma => {
			const existingRating = await prisma.rating.findUnique({
				where: {
					userId_cocktailId: {
						userId,
						cocktailId,
					},
				},
			});

			if (existingRating) {
				await prisma.rating.delete({
					where: {
						userId_cocktailId: {
							userId,
							cocktailId,
						},
					},
				});
			} else {
				await prisma.rating.create({
					data: {
						userId,
						cocktailId,
						rating: Number(rating),
					},
				});
			}
		});
		return {};
	}
}

export async function loader({ request, params }: LoaderFunctionArgs) {
	const userId = await requireUserId(request);
	const cocktailName = new URLSearchParams(params)
		.get('cocktail')
		.split('-')
		.map(word => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');

	const cocktail = await prisma.cocktail.findUnique({
		where: { name: cocktailName },
		include: {
			ingredients: true,
			image: { include: { photographer: true } },
			author: { include: { profileImage: true, username: true } },
			reviews: {
				include: {
					user: { include: { profileImage: true, username: true } },
					likes: true,
					dislikes: true,
					flaggedAsInappropriate: true,
				},
			},
			ratings: true,
		},
	});

	const user = await prisma.user.findUniqueOrThrow({
		where: { id: userId },
		select: {
			id: true,
			profileImage: { select: { id: true } },
			username: { select: { username: true } },
		},
	});

	const data = { cocktail, user };

	return json(data);
}

export default function CocktailRoute() {
	const { cocktail, user } = useLoaderData<typeof loader>();
	const reviews = cocktail.reviews;
	const ratings = cocktail.ratings;
	const cocktailId = cocktail.id;

	const cocktailImageUrl = `/resources/images/${cocktail.image[0].id}/cocktail`;

	return (
		<div className="">
			<div className="mx-auto grid max-w-7xl  auto-rows-auto lg:grid-cols-2 lg:gap-x-8">
				{/* Heading */}
				<div className="p-6 lg:col-span-2 lg:p-8">
					<div className="flex flex-col">
						<div className="mb-4">
							<PublishedBy />
						</div>
						<p className="text-base font-semibold leading-7 text-text-notify">{cocktail.type}</p>
						<h1 className="mt-2 text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">{cocktail.name}</h1>
						<p className="mt-4 text-xl leading-8 text-text-secondary">{cocktail.history}</p>
					</div>
				</div>

				{/* Image */}
				<figure className="mx-auto p-6 lg:col-start-2 lg:row-span-2 lg:px-8 lg:pt-0">
					<div className="">
						<img
							className="aspect-square rounded-lg object-cover shadow-xl"
							src={cocktailImageUrl}
							alt={cocktail.image[0].altText}
						/>
						<figcaption className="mt-3 flex text-xs text-text-secondary lg:text-sm">
							<CameraIcon className="h-4 w-4 flex-none text-text-secondary lg:h-5 lg:w-5" aria-hidden="true" />
							<span className="ml-2">
								Photograph by{' '}
								<Link to={cocktail.image[0].photographer.href} prefetch="intent">
									<strong className="text-xs font-medium text-text-primary hover:underline lg:text-sm">
										{cocktail.image[0].photographer.name}
									</strong>
								</Link>
							</span>
						</figcaption>
					</div>
					<div className="mt-12">
						<StarRatingForm cocktailId={cocktailId} ratings={ratings} userId={user.id} />
					</div>
					<div className="hidden lg:block">
						<Reviews reviews={reviews} ratings={ratings} user={user} />
					</div>
				</figure>

				{/* Information & Recipe */}
				<div className="p-6 lg:col-span-1 lg:col-start-1 lg:row-start-2 lg:px-8 lg:pb-8 lg:pt-0">
					<div className="w-fulltext-base text-text-secondary lg:col-start-1 lg:row-start-1 lg:w-full">
						<p>{cocktail.description}</p>
						<CocktailRecipe />
						<div className="lg:hidden">
							<Reviews reviews={reviews} ratings={ratings} user={user} />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export function CocktailRecipe() {
	const { cocktail } = useLoaderData<typeof loader>();

	const [preferredMeasurement, setPreferredMeasurement] = useState('oz');

	useEffect(() => {
		const preferredMeasurement = localStorage.getItem(BARFLY_PREFERRED_MEASUREMENT);
		if (preferredMeasurement) {
			setPreferredMeasurement(preferredMeasurement);
		}
	}, [preferredMeasurement]);

	function convertMeasurementToMilliliters(measurement: string) {
		switch (measurement) {
			case '1/4 oz':
				return '7.5 ml';
			case '1/2 oz':
				return '15 ml';
			case '3/4 oz':
				return '22.5 ml';

			case '1 oz':
				return '30 ml';

			case '1 1/2 oz':
				return '45 ml';

			case '2 oz':
				return '60 ml';

			case '2 1/2 oz':
				return '75 ml';

			case '3 oz':
				return '90 ml';

			case '4 oz':
				return '120 ml';

			case '5 oz':
				return '150 ml';

			default:
				return measurement;
		}
	}

	function handleMeasurementToggle() {
		if (preferredMeasurement === 'oz') {
			localStorage.setItem(BARFLY_PREFERRED_MEASUREMENT, 'ml');
			setPreferredMeasurement('ml');
		} else {
			localStorage.setItem(BARFLY_PREFERRED_MEASUREMENT, 'oz');
			setPreferredMeasurement('oz');
		}
	}

	return (
		<div>
			<div className="flex items-end justify-between">
				<h2 className="mt-12 pb-1 text-2xl font-bold tracking-tight text-text-primary">Recipe</h2>
				<MeasurementToggle
					handleMeasurementToggle={handleMeasurementToggle}
					preferredMeasurement={preferredMeasurement}
				/>
			</div>
			<ul className="mt-3 space-y-6 text-text-primary">
				{cocktail.ingredients.map(ingredient => (
					<li key={ingredient.id} className="flex">
						<span className="flex gap-x-2">
							<strong>&#8226;</strong>
							<strong>
								{preferredMeasurement === 'oz'
									? ingredient.measurement
									: convertMeasurementToMilliliters(ingredient.measurement)}
							</strong>
							<strong className="font-light">{ingredient.name}</strong>
						</span>
					</li>
				))}
				<div className="flex flex-col gap-y-3 lg:flex-row lg:justify-between">
					<li className="flex gap-x-2">
						<strong>Garnish</strong>
						<strong className="font-light">{cocktail.garnish}</strong>
					</li>
					<li className="flex gap-x-2">
						<strong>Glass</strong>
						<strong className="font-light">{cocktail.glass}</strong>
					</li>
					<li className="flex gap-x-2">
						<strong>Ice</strong>
						<strong className="font-light">{cocktail.ice}</strong>
					</li>
				</div>
			</ul>
			<h3 className="mt-12 text-2xl font-bold tracking-tight text-text-primary">Method</h3>
			<p className="mt-3">{cocktail.preparation}</p>
			<div className="mt-12">
				<ProTip />
			</div>
		</div>
	);
}

export function ProTip() {
	const { cocktail } = useLoaderData<typeof loader>();

	return (
		<fieldset className="flex flex-col rounded-md  border border-border-secondary p-4 shadow-sm">
			<legend className="flex items-center gap-x-2 pl-1 pr-2">
				<BoltIcon className="h-4 w-4 text-yellow-400 lg:h-5 lg:w-5" />
				<h3 className="text-sm font-semibold text-text-primary lg:text-base">Pro Tip</h3>
			</legend>
			<p className="-mt-2">{cocktail.tip}</p>
		</fieldset>
	);
}

// Meta Function
export const meta: MetaFunction<typeof loader> = ({ data }) => {
	return [
		{ title: `Barfly | ${data.cocktail.name}` },
		{
			name: 'description',
			content:
				'Add a description here to help with SEO and click-through rates. This will be visible in search engine results.',
		},
	];
};

// Handle Function
export const handle = {
	breadcrumb: ({ params }: LoaderFunctionArgs) => {
		const cocktailName = new URLSearchParams(params)
			.get('cocktail')
			.split('-')
			.map(word => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
		return (
			<>
				<Link
					prefetch="intent"
					className="ml-1 text-xs text-gray-400 hover:text-gray-500  lg:ml-4 lg:text-sm"
					to={`/cocktails/${cocktailName}`}
				>
					{cocktailName}
				</Link>
			</>
		);
	},
};
