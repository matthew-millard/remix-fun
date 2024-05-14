import { ImagePlaceholder } from './skeletons';

export default function ImageChooser({ imageUrl }: { imageUrl?: string }) {
	return imageUrl ? (
		<img className="h-full w-full object-cover" src={imageUrl} alt={'profile'} />
	) : (
		<ImagePlaceholder />
	);
}
