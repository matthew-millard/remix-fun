export default function ImageChooser({ imageUrl }: { imageUrl?: string }) {
	return imageUrl ? (
		<span className="flex h-20 w-20 overflow-hidden rounded-full">
			<img className="h-full w-full object-cover" src={imageUrl} alt={'profile'} />
		</span>
	) : (
		<span className="flex h-20 w-20 overflow-hidden rounded-full ">
			<svg
				className="h-full w-full text-gray-300 transition-all duration-500 hover:text-text-primary"
				fill="currentColor"
				viewBox="0 0 24 24"
			>
				<path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
			</svg>
		</span>
	);
}
