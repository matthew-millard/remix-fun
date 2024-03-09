import { Link } from '@remix-run/react';

export default function Avatar() {
	return (
		<Link to="/dashboard">
			<span className="flex h-10 w-10 overflow-hidden rounded-full bg-gray-100 outline outline-2 outline-bg-primary transition-all duration-500 hover:outline-text-primary">
				<svg
					className="h-full w-full text-gray-300 transition-all duration-500 hover:text-text-primary"
					fill="currentColor"
					viewBox="0 0 24 24"
				>
					<path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
				</svg>
			</span>
		</Link>
	);
}
