import { FlagIcon, StarIcon } from '@heroicons/react/20/solid';
import NewComment from '../NewComment';
import { useEffect, useState } from 'react';
import { timeAgo } from '~/utils/misc';

const reviewsStatic = {
	average: 3,
	totalCount: 5,
	counts: [
		{ rating: 5, count: 1 },
		{ rating: 4, count: 1 },
		{ rating: 3, count: 1 },
		{ rating: 2, count: 1 },
		{ rating: 1, count: 1 },
	],
	featured: [
		{
			id: 1,
			rating: 3,
			content: `
        <p>Great recipe! I love to make my old fashioneds with Eagle Rare 12yo bourbon.</p>
      `,
			reviewDate: '2 days ago',
			author: 'Hamish Millard',
			avatarSrc:
				'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?ixlib=rb-=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=8&w=256&h=256&q=80',
		},
		{
			id: 2,
			rating: 1,
			content: `
        <p>Great recipe! I love to make my old fashioneds with Eagle Rare 12yo bourbon.</p>
      `,
			reviewDate: '2 days ago',
			author: 'Hamish Millard',
			avatarSrc:
				'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?ixlib=rb-=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=8&w=256&h=256&q=80',
		},
		{
			id: 3,
			rating: 2,
			content: `
        <p>Great recipe! I love to make my old fashioneds with Eagle Rare 12yo bourbon.</p>
      `,
			reviewDate: '2 days ago',
			author: 'Hamish Millard',
			avatarSrc:
				'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?ixlib=rb-=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=8&w=256&h=256&q=80',
		},
		{
			id: 4,
			rating: 5,
			content: `
        <p>Great recipe! I love to make my old fashioneds with Eagle Rare 12yo bourbon.</p>
      `,
			reviewDate: '2 days ago',
			author: 'Hamish Millard',
			avatarSrc:
				'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?ixlib=rb-=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=8&w=256&h=256&q=80',
		},
		{
			id: 5,
			rating: 3,
			content: `
        <p>Great recipe! I love to make my old fashioneds with Eagle Rare 12yo bourbon.</p>
      `,
			reviewDate: '2 days ago',
			author: 'Hamish Millard',
			avatarSrc:
				'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?ixlib=rb-=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=8&w=256&h=256&q=80',
		},
	],
};

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
	const [ratingsCount, setRatingsCount] = useState(initialRatingsCount);

	useEffect(() => {
		const calculatedRatingsCount = reviews.reduce(
			(acc, review) => {
				acc[review.rating] += 1;
				return acc;
			},
			{ ...initialRatingsCount },
		);

		setRatingsCount(calculatedRatingsCount);
	}, [reviews]);

	const totalCount = reviews.length;
	const averageRating = reviews.reduce((acc, review) => acc + review.rating, 0) / totalCount;

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
										{Math.round((count / totalCount) * 100)}%
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

				<NewComment />

				<div className="mt-12 lg:col-span-7 lg:col-start-6 lg:mt-12">
					<h3 className="sr-only">Recent reviews</h3>

					<div className="flow-root">
						<div className="-my-12 divide-y divide-border-secondary">
							{reviews.map(review => (
								<div key={review.id} className="py-12">
									<div className="flex items-center justify-between">
										<div className="flex">
											<img
												src={`/resources/images/${review.user.profileImage.id}/profile`}
												alt={`${review.user.firstName} ${review.user.lastName}`}
												className="h-12 w-12 rounded-full object-cover"
											/>
											<div className="ml-4">
												<h4 className="text-sm font-bold text-text-primary">
													{review.user.firstName} {review.user.lastName}
												</h4>
												<div className="mt-1 flex items-center">
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
												<p className="sr-only">{review.rating} out of 5 stars</p>
											</div>
										</div>
										<div className="flex flex-col justify-between gap-y-3 self-end">
											<div className="self-end">
												<FlagIcon className="h-4 w-4 text-white" aria-hidden="true" />
											</div>
											<p className="text-xs text-text-secondary lg:text-sm">{timeAgo(new Date(review.createdAt))}</p>
										</div>
									</div>

									<div
										className="mt-4 space-y-6 text-sm text-text-primary lg:text-base"
										dangerouslySetInnerHTML={{ __html: review.comment }}
									/>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
