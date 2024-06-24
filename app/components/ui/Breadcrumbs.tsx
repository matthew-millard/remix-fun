import { ChevronRightIcon, HomeIcon } from '@heroicons/react/20/solid';
import { Link, useMatches } from '@remix-run/react';

export default function Breadcrumbs() {
	const matches = useMatches();

	return (
		<nav className="flex" aria-label="Breadcrumb">
			<ol className="flex items-center space-x-1 lg:space-x-4">
				<li>
					<div>
						<Link to="/" className="text-gray-400 hover:text-gray-500">
							<HomeIcon className="h-4 w-4 flex-shrink-0 lg:h-5 lg:w-5" aria-hidden="true" />
							<span className="sr-only">Home</span>
						</Link>
					</div>
				</li>
				{matches
					.filter(match => match.handle && match.handle.breadcrumb)
					.map((match, index) => (
						<li key={index}>
							<div className="flex items-center">
								<ChevronRightIcon className="h-4 w-4 flex-shrink-0 text-gray-400 lg:h-5 lg:w-5" aria-hidden="true" />
								{match.handle.breadcrumb(match)}
							</div>
						</li>
					))}
			</ol>
		</nav>
	);
}
