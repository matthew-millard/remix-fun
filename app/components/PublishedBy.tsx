import { Link, useLoaderData } from '@remix-run/react';
import { loader } from '~/routes/cocktails+/$cocktail';
import { timeAgo } from '~/utils/misc';

export default function PublishedBy() {
	const { cocktail } = useLoaderData<typeof loader>();

	const authorName = cocktail.author.firstName + ' ' + cocktail.author.lastName;
	const profileImageURL = `/resources/images/${cocktail.author.profileImage.id}/profile`;

	return (
		<div className="flex items-center">
			<div className="flex-shrink-0">
				<Link to={`/${cocktail.author.username.username}`}>
					<span className="sr-only">{authorName}</span>
					<img
						className="h-5 w-5 rounded-full object-cover lg:h-10 lg:w-10"
						src={profileImageURL}
						alt={`${authorName}`}
					/>
				</Link>
			</div>
			<div className="ml-3 flex items-center gap-x-2 text-text-secondary">
				<p className=" text-xs font-medium text-text-primary lg:text-sm">
					<Link to={`/${cocktail.author.username.username}`} className="hover:underline">
						{authorName}
					</Link>
				</p>
				<span aria-hidden="true">&middot;</span>
				<div className="flex space-x-1 text-xs lg:text-sm">
					<time dateTime={cocktail.createdAt}>Published {timeAgo(new Date(cocktail.createdAt))}</time>
				</div>
			</div>
		</div>
	);
}
