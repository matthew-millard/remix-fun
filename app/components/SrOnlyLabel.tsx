type SrOnlyLabelProps = {
	htmlFor: string;
	children: React.ReactNode;
};

export default function SrOnlyLabel({ htmlFor, children }: SrOnlyLabelProps) {
	return (
		<label htmlFor={htmlFor} className="sr-only">
			{children}
		</label>
	);
}
