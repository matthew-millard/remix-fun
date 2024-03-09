import { Link } from '@remix-run/react';

export default function Logo() {
	return (
		<Link to="/" className="py-3">
			<span className="underlined block whitespace-nowrap text-2xl font-bold text-text-primary transition  focus:outline-none lg:text-3xl">
				Barfly
			</span>
		</Link>
	);
}
