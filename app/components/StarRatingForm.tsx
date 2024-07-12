import { StarIcon } from '@heroicons/react/24/solid';
import { Form, useLoaderData } from '@remix-run/react';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';
import { loader, submitRatingActionIntent } from '~/routes/cocktails+/$cocktail';
import { Ratings } from './ui/Reviews';

function classNames(...classes: string[]) {
	return classes.filter(Boolean).join(' ');
}

export default function StarRatingForm({ cocktailId, ratings }: { cocktailId: string; ratings: Ratings }) {
	const { user } = useLoaderData<typeof loader>();
	const currentUserRating = ratings.find(rating => rating.userId === user.id) || { rating: 0 };

	console.log('currentUserRating', currentUserRating);
	return (
		<Form method="POST">
			<AuthenticityTokenInput />
			<h3 className="text-lg font-bold tracking-tight text-text-primary">
				{currentUserRating.rating
					? `You rated this recipe ${currentUserRating.rating} stars.`
					: 'How would you rate this recipe?'}
			</h3>
			<input type="hidden" name="intent" value={submitRatingActionIntent} />
			<input type="hidden" name="cocktailId" value={cocktailId} />
			<div className="mt-2 flex items-center">
				{[0, 1, 2, 3, 4].map(rating => (
					<button type="submit" name="rating" key={rating} value={rating + 1}>
						<StarIcon
							className={classNames(
								'h-10 w-10 flex-shrink-0 transition-colors duration-200 ease-in-out hover:text-yellow-400 focus:text-yellow-400',
								currentUserRating?.rating > rating ? 'text-yellow-400' : 'text-gray-300',
							)}
							aria-hidden="true"
						/>
					</button>
				))}
			</div>
			<p className="sr-only">{currentUserRating.rating} out of 5 stars</p>
		</Form>
	);
}
