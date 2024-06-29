import { Link } from '@remix-run/react';
import { Cocktail } from '~/routes/cocktails+/$cocktail';

export default function PublishedBy({ cocktail }: { cocktail: Cocktail }) {
	const author = cocktail.publishedBy.author;
	const publishedBy = cocktail.publishedBy;
	return (
		<div className="flex items-center">
			<div className="flex-shrink-0">
				<Link to={author.href}>
					<span className="sr-only">{author.name}</span>
					<img className="h-5 w-5 rounded-full lg:h-10 lg:w-10" src={author.imageUrl} alt={author.alt} />
				</Link>
			</div>
			<div className="ml-3 flex items-center gap-x-2 text-text-secondary">
				<p className=" text-xs font-medium text-text-primary lg:text-sm">
					<Link to={author.href} className="hover:underline">
						{author.name}
					</Link>
				</p>
				<span aria-hidden="true">&middot;</span>
				<div className="flex space-x-1 text-xs lg:text-sm">
					<time dateTime={publishedBy.datetime}>Published {publishedBy.date}</time>
				</div>
			</div>
		</div>
	);
}
