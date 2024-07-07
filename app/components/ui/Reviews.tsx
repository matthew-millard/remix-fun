import { StarIcon } from '@heroicons/react/20/solid';
import { HandThumbDownIcon, HandThumbUpIcon, FlagIcon } from '@heroicons/react/24/outline';
import Comment from '../Comment';
import { useMemo } from 'react';
import { timeAgo } from '~/utils/misc';

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

type Review = {
	id: string;
	cocktailId: string;
	comment: string;
	rating: number;
	createdAt: string;
	updatedAt: string;
	user: User;
};

type Reviews = Review[];

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

export default function Reviews({ reviews }: { reviews: Reviews }) {
	const ratingsCount = useMemo(() => {
		return reviews.reduce(
			(acc, review) => {
				acc[review.rating] += 1;
				return acc;
			},
			{ ...initialRatingsCount },
		);
	}, [reviews]);

	const totalCount = reviews.length;
	const averageRating = useMemo(() => {
		return reviews.reduce((acc, review) => acc + review.rating, 0) / totalCount;
	}, [reviews, totalCount]);

	return (
		<div className="">
			<div className="max-w-2xl py-12 sm:py-20">
				<div className="lg:col-span-4">
					<h2 className="text-2xl font-bold tracking-tight text-text-primary">Recipe Reviews</h2>

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
						<h3 className="text-lg font-medium text-text-primary">Comments</h3>
						<p className="mt-1 text-sm text-text-secondary">
							If you’ve made this cocktail, share your thoughts with other barflies.
						</p>
					</div>
				</div>

				<Comment />

				<div className="mt-12 lg:col-span-7 lg:col-start-6 lg:mt-12">
					<h3 className="sr-only">Recent reviews</h3>

					<div className="flow-root">
						<div className="flex flex-col gap-y-4 ">
							{reviews.map(review => (
								<div key={review.id} className="rounded-lg border border-gray-700 p-4 shadow-sm">
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

										<div className="flex flex-col justify-between  gap-y-2">
											<button type="submit" className="self-end">
												<FlagIcon className="h-4 w-4 text-text-secondary" aria-hidden="true" />
											</button>
											<p className="text-xs font-medium text-text-secondary lg:text-sm">
												{timeAgo(new Date(review.createdAt))}
											</p>
										</div>
									</div>

									<div
										className="mt-4 space-y-6 break-words text-sm text-text-primary lg:text-base"
										dangerouslySetInnerHTML={{ __html: review.comment }}
									/>

									<div className="flex">
										<div className="mt-4 flex items-center">
											<HandThumbUpIcon className="h-4 w-4  text-text-secondary" aria-hidden="true" />
											<p className="ml-1 text-xs font-medium text-text-secondary lg:text-sm">0</p>
										</div>
										<div className="ml-4 mt-4 flex items-center">
											<HandThumbDownIcon className="h-4 w-4  text-text-secondary" aria-hidden="true" />
											<p className="ml-1 text-xs font-medium text-text-secondary lg:text-sm">0</p>
										</div>
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
