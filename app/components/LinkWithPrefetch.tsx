import { Link, LinkProps } from '@remix-run/react';

type PrefetchableLinkProps = LinkProps & {
	text: string;
};

type LinkWithPrefetchProps = PrefetchableLinkProps & {
	className?: string;
};

export default function LinkWithPrefetch({ text, className, ...LinkProps }: LinkWithPrefetchProps) {
	return (
		<div className={className}>
			<PrefetchableLink {...LinkProps} text={text} />
		</div>
	);
}

function PrefetchableLink({ text, ...LinkProps }: PrefetchableLinkProps) {
	return (
		<Link {...LinkProps} className="text-sm font-semibold leading-6 text-indigo-500 hover:text-indigo-400">
			{text}
		</Link>
	);
}
