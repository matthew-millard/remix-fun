import { Link } from '@remix-run/react';
import profileImageUrl from '~/assets/images/users/witek_wojaczek.jpg';

export default function PublishedBy() {
	const post = {
		author: {
			name: 'Witek Wojaczek',
			href: '/witekwojaczek',
			imageUrl: profileImageUrl,
			alt: 'Witek Wojaczek profile image',
		},
		date: 'Jun 26, 2024',
		datetime: '2024-06-26',
	};
	return (
		<div className="flex items-center">
			<div className="flex-shrink-0">
				<Link to={post.author.href}>
					<span className="sr-only">{post.author.name}</span>
					<img className="h-5 w-5 rounded-full lg:h-10 lg:w-10" src={post.author.imageUrl} alt={post.author.alt} />
				</Link>
			</div>
			<div className="ml-3 flex items-center gap-x-2 text-text-secondary">
				<p className=" text-xs font-medium text-text-primary lg:text-sm">
					<a href={post.author.href} className="hover:underline">
						{post.author.name}
					</a>
				</p>
				<span aria-hidden="true">&middot;</span>
				<div className="flex space-x-1 text-xs lg:text-sm">
					<time dateTime={post.datetime}>Published {post.date}</time>
				</div>
			</div>
		</div>
	);
}
