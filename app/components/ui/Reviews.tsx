import { StarIcon } from '@heroicons/react/20/solid';
import { HandThumbDownIcon, HandThumbUpIcon, FlagIcon, TrashIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import {
	HandThumbDownIcon as HandThumbDownIconSolid,
	HandThumbUpIcon as HandThumbUpIconSolid,
	FlagIcon as FlagIconSolid,
} from '@heroicons/react/24/solid';

import { useId, useMemo, useState } from 'react';
import { timeAgo } from '~/utils/misc';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import {
	deleteReviewActionIntent,
	dislikeReviewActionIntent,
	flagReviewActionIntent,
	likeReviewActionIntent,
	loader,
	reviewIdInput,
	updateReviewActionIntent,
	updateReviewInput,
	UpdateReviewSchema,
} from '~/routes/cocktails+/$cocktail';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';
import { ReviewForm, Button, ErrorList } from '~/components';
import { useIsPending } from '~/hooks/useIsPending';
import { getFormProps, getTextareaProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';

type UserProfileImage = {
	id: string;
	blob: {
		data: number[];
		type: 'Buffer';
	};
	contentType: string;
	altText: string | null;
	createdAt: string;
	updatedAt: string;
	userId: string;
};

type Username = {
	id: string;
	userId: string;
	username: string;
};

type User = {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	profileImage: UserProfileImage;
	createdAt: string;
	updatedAt: string;
	username: Username;
};

type Likes = {
	id: string;
	userId: string;
	reviewId: string;
};

type Dislikes = {
	id: string;
	userId: string;
	reviewId: string;
};

type Review = {
	id: string;
	cocktailId: string;
	review: string;
	createdAt: string;
	updatedAt: string;
	user: User;
	likes: Likes[];
	dislikes: Dislikes[];
	flaggedAsInappropriate: FlagReview | null;
};

type FlagReview = {
	id: string;
	userId: string;
	reviewId: string;
	createdAt: string;
};

type Reviews = Review[];

type Rating = {
	id: string;
	rating: number;
	userId: string;
	cocktailId: string;
	createdAt: string;
	updatedAt: string;
};

export type Ratings = Rating[];

function classNames(...classes: string[]) {
	return classes.filter(Boolean).join(' ');
}

const initialRatingsCount: Record<number, number> = {
	1: 0,
	2: 0,
	3: 0,
	4: 0,
	5: 0,
};

export default function Reviews({ reviews, ratings }: { reviews: Reviews; ratings: Ratings }) {
	const [updateReview, setUpdateReview] = useState(null);
	const { user: currentUser } = useLoaderData<typeof loader>();

	const [updateReviewForm, updateReviewFields] = useForm({
		id: useId(),
		lastResult: useActionData(),
		constraint: getZodConstraint(UpdateReviewSchema),
		shouldValidate: 'onSubmit',
		shouldRevalidate: 'onSubmit',
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: UpdateReviewSchema });
		},
	});

	const isPending = useIsPending({ formIntent: updateReviewActionIntent, formMethod: 'POST' });

	const ratingsCount = useMemo(() => {
		return ratings.reduce(
			(acc, ratings) => {
				acc[ratings.rating] += 1;
				return acc;
			},
			{ ...initialRatingsCount },
		);
	}, [ratings]);

	const totalCount = ratings.length;
	const averageRating = useMemo(() => {
		return ratings.reduce((acc, ratings) => acc + ratings.rating, 0) / totalCount;
	}, [ratings, totalCount]);

	return (
		<div className="">
			<div className="max-w-2xl py-6 sm:py-12">
				<div className="lg:col-span-4">
					<h2 className="text-2xl font-bold tracking-tight text-text-primary">Recipe Ratings</h2>

					<div className="mt-3 flex items-center">
						<div>
							<div className="flex items-center">
								{[0, 1, 2, 3, 4].map(rating => (
									<StarIcon
										key={rating}
										className={classNames(
											averageRating > rating ? 'text-yellow-400' : 'text-gray-300',
											'h-5 w-5 flex-shrink-0',
										)}
										aria-hidden="true"
									/>
								))}
							</div>
							<p className="sr-only">{averageRating.toFixed(1)} out of 5 stars</p>
						</div>
						<p className="ml-2 text-sm text-text-primary">Based on {totalCount} reviews</p>
					</div>

					<div className="mt-6">
						<h3 className="sr-only">Review data</h3>

						<dl className="space-y-3">
							{Object.entries(ratingsCount).map(([rating, count]) => (
								<div key={rating} className="flex items-center text-sm">
									<dt className="flex flex-1 items-center">
										<p className="w-3 font-medium text-text-primary">
											{rating}
											<span className="sr-only"> star reviews</span>
										</p>
										<div aria-hidden="true" className="ml-1 flex flex-1 items-center">
											<StarIcon
												className={classNames(count > 0 ? 'text-yellow-400' : 'text-gray-300', 'h-5 w-5 flex-shrink-0')}
												aria-hidden="true"
											/>

											<div className="relative ml-3 flex-1">
												<div className="h-3 rounded-full border border-gray-200 bg-gray-100" />
												{count > 0 ? (
													<div
														className="absolute inset-y-0 rounded-full border border-yellow-400 bg-yellow-400"
														style={{ width: `calc(${count} / ${totalCount} * 100%)` }}
													/>
												) : null}
											</div>
										</div>
									</dt>
									<dd className="ml-3 w-10 text-right text-sm tabular-nums text-text-primary">
										{count > 0 ? Math.round((count / totalCount) * 100) : 0}%
									</dd>
								</div>
							))}
						</dl>
					</div>

					<div className="mt-12">
						<h3 className="text-lg font-medium text-text-primary">Reviews</h3>
						<p className="mt-1 text-sm text-text-secondary">If you’ve made this cocktail recipe, leave a review.</p>
					</div>
				</div>

				<ReviewForm />

				<div className="mt-12 lg:col-span-7 lg:col-start-6 lg:mt-12">
					<h3 className="sr-only">Recent reviews</h3>

					<div className="flow-root">
						<div className="flex flex-col gap-y-4 ">
							{reviews.map(review => (
								<div key={review.id} className="rounded-lg border border-border-secondary p-4 shadow-md">
									<div className="flex justify-between">
										<div className="flex items-center gap-x-4">
											<img
												src={`/resources/images/${review.user.profileImage.id}/profile`}
												alt={`${review.user.firstName} ${review.user.lastName}`}
												className="h-10 w-10 rounded-full object-cover"
											/>
											<h4 className="text-sm font-bold text-text-primary">
												{review.user.firstName} {review.user.lastName}
											</h4>
										</div>
										{/* <div className="mt-1 flex items-center">
											{[0, 1, 2, 3, 4].map(rating => (
												<StarIcon
													key={rating}
													className={classNames(
														review.rating > rating ? 'text-yellow-400' : 'text-gray-300',
														'h-5 w-5 flex-shrink-0',
													)}
													aria-hidden="true"
												/>
											))}
										</div>
										<p className="sr-only">{review.rating} out of 5 stars</p> */}

										<Form method="POST" className="flex flex-col justify-between  gap-y-2">
											<AuthenticityTokenInput />
											<input readOnly type="hidden" defaultValue={review.id} name={reviewIdInput} />
											<button type="submit" name="intent" value={flagReviewActionIntent} className="self-end">
												{review.flaggedAsInappropriate ? (
													<FlagIconSolid className="h-4 w-4 text-red-500" aria-hidden="true" />
												) : (
													<FlagIcon className="h-4 w-4 text-text-secondary" aria-hidden="true" />
												)}
											</button>
											<p className="text-xs font-medium text-text-secondary lg:text-sm">
												{timeAgo(new Date(review.createdAt))}
											</p>
										</Form>
									</div>

									<Form
										{...getFormProps(updateReviewForm)}
										method="POST"
										onSubmit={() => setUpdateReview(null)}
										className="flex flex-col"
									>
										<AuthenticityTokenInput />
										<input readOnly type="hidden" defaultValue={review.id} name={reviewIdInput} />
										{updateReview === review.id ? (
											<textarea
												{...getTextareaProps(updateReviewFields['update-review-input'])}
												className="mt-4 w-full resize-none space-y-6 break-words border-none bg-transparent text-sm text-text-primary lg:text-base"
												defaultValue={review.review}
												name={updateReviewInput}
											/>
										) : (
											<div className="mt-4 w-full space-y-6 break-words text-sm text-text-primary lg:text-base">
												{review.review}
											</div>
										)}

										<div className="flex">
											<button
												type="submit"
												name="intent"
												value={likeReviewActionIntent}
												className="mt-4 flex items-center"
											>
												{review.likes.some(like => like.userId === currentUser.id) ? (
													<HandThumbUpIconSolid className="h-4 w-4 text-yellow-400" aria-hidden="true" />
												) : (
													<HandThumbUpIcon className="h-4 w-4  text-text-secondary" aria-hidden="true" />
												)}
												<p className="ml-1 font-mono text-xs text-text-secondary lg:text-sm">{review.likes.length}</p>
											</button>
											<button
												type="submit"
												name="intent"
												value={dislikeReviewActionIntent}
												className="ml-4 mt-4 flex items-center"
											>
												{review.dislikes.some(dislike => dislike.userId === currentUser.id) ? (
													<HandThumbDownIconSolid className="h-4 w-4 text-yellow-400" aria-hidden="true" />
												) : (
													<HandThumbDownIcon className="h-4 w-4  text-text-secondary" aria-hidden="true" />
												)}

												<p className="ml-1 font-mono text-xs text-text-secondary lg:text-sm">
													{review.dislikes.length}
												</p>
											</button>
											<div className="ml-auto mt-4 flex items-center gap-x-4">
												{review.user.id === currentUser.id ? (
													updateReview === review.id ? (
														<div className="mt-2 flex justify-end gap-4">
															<Button
																type="submit"
																label="Update"
																isPending={isPending}
																name="intent"
																value={updateReviewActionIntent}
															/>
															<button
																type="button"
																onClick={() => setUpdateReview(false)}
																className="text-sm font-semibold leading-6 text-text-primary"
															>
																Cancel
															</button>
														</div>
													) : (
														<div className="flex gap-x-4">
															<button type="submit" name="intent" value={deleteReviewActionIntent} className="">
																<TrashIcon className="h-4 w-4 text-text-secondary" aria-hidden="true" />
															</button>
															<button type="button" onClick={() => setUpdateReview(review.id)}>
																<PencilSquareIcon className="h-4 w-4 text-text-secondary" aria-hidden="true" />
															</button>
														</div>
													)
												) : null}
											</div>
										</div>
									</Form>
									<div
										className={`transition-height overflow-hidden pt-1 duration-500  ease-in-out  ${updateReviewFields['update-review-input'].errors ? 'max-h-56' : 'max-h-0'}`}
									>
										<ErrorList
											errors={updateReviewFields['update-review-input'].errors}
											id={updateReviewFields['update-review-input'].errorId}
										/>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
