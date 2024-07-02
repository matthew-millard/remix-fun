import { StarIcon } from '@heroicons/react/20/solid';
import NewComment from '../NewComment';
import { useState } from 'react';

const reviews = {
	average: 4,
	totalCount: 1,
	counts: [
		{ rating: 5, count: 0 },
		{ rating: 4, count: 1 },
		{ rating: 3, count: 0 },
		{ rating: 2, count: 0 },
		{ rating: 1, count: 0 },
	],
	featured: [
		{
			id: 1,
			rating: 4,
			content: `
        <p>Great recipe! I love to make my old fashioneds with Eagle Rare 12yo bourbon.</p>
      `,
			author: 'Hamish Millard',
			avatarSrc:
				'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?ixlib=rb-=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=8&w=256&h=256&q=80',
		},
		// More reviews...
	],
};

function classNames(...classes: string[]) {
	return classes.filter(Boolean).join(' ');
}
// lg:grid lg:max-w-7xl lg:grid-cols-12 lg:gap-x-8 lg:px-8
export default function Reviews() {
	const [showComments, setShowComments] = useState(false);
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
											reviews.average > rating ? 'text-yellow-400' : 'text-gray-300',
											'h-5 w-5 flex-shrink-0',
										)}
										aria-hidden="true"
									/>
								))}
							</div>
							<p className="sr-only">{reviews.average} out of 5 stars</p>
						</div>
						<p className="ml-2 text-sm text-text-primary">Based on {reviews.totalCount} reviews</p>
					</div>

					<div className="mt-6">
						<h3 className="sr-only">Review data</h3>

						<dl className="space-y-3">
							{reviews.counts.map(count => (
								<div key={count.rating} className="flex items-center text-sm">
									<dt className="flex flex-1 items-center">
										<p className="w-3 font-medium text-text-primary">
											{count.rating}
											<span className="sr-only"> star reviews</span>
										</p>
										<div aria-hidden="true" className="ml-1 flex flex-1 items-center">
											<StarIcon
												className={classNames(
													count.count > 0 ? 'text-yellow-400' : 'text-gray-300',
													'h-5 w-5 flex-shrink-0',
												)}
												aria-hidden="true"
											/>

											<div className="relative ml-3 flex-1">
												<div className="h-3 rounded-full border border-gray-200 bg-gray-100" />
												{count.count > 0 ? (
													<div
														className="absolute inset-y-0 rounded-full border border-yellow-400 bg-yellow-400"
														style={{ width: `calc(${count.count} / ${reviews.totalCount} * 100%)` }}
													/>
												) : null}
											</div>
										</div>
									</dt>
									<dd className="ml-3 w-10 text-right text-sm tabular-nums text-text-primary">
										{Math.round((count.count / reviews.totalCount) * 100)}%
									</dd>
								</div>
							))}
						</dl>
					</div>

					<div className="mt-12">
						<h3 className="text-lg font-medium text-text-primary">Share your thoughts</h3>
						<p className="mt-1 text-sm text-text-secondary">
							If you’ve made this cocktail, share your thoughts with other barflies.
						</p>

						<button
							type="button"
							onClick={() => setShowComments(!showComments)}
							className="mt-6 inline-flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-8 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 sm:w-auto lg:w-full"
						>
							Write a review
						</button>
					</div>
				</div>

				{showComments ? <NewComment /> : null}

				<div className="mt-12 lg:col-span-7 lg:col-start-6 lg:mt-12">
					<h3 className="sr-only">Recent reviews</h3>

					<div className="flow-root">
						<div>
							{reviews.featured.map(review => (
								<div key={review.id} className="rounded-lg border border-border-secondary p-4 shadow-md">
									<div className="flex items-center">
										<img src={review.avatarSrc} alt={`${review.author}.`} className="h-12 w-12 rounded-full" />
										<div className="ml-4">
											<h4 className="text-sm font-bold text-text-primary">{review.author}</h4>
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

									<div
										className="mt-4 space-y-6 text-sm text-text-primary lg:text-base"
										dangerouslySetInnerHTML={{ __html: review.content }}
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
