import { getInputProps } from '@conform-to/react';
import { PhotoIcon } from '@heroicons/react/24/solid';
import { useState } from 'react';

interface CoverPhotoProps {
	inputType: 'file';
	accept: 'image/png, image/jpeg, image/gif';
	size: number;
	url: string;
	inputProps: any;
}

export default function CoverPhoto({ inputType, accept, size, url, inputProps }: CoverPhotoProps) {
	const [newImageSrc, setNewImageSrc] = useState<string | null>(null);

	// Image can either be the existing image, nothing, or the new image preview
	const existingImageSrc = url;

	return (
		<div className="col-span-full">
			<label htmlFor="cover-photo" className="block  text-sm font-medium leading-6 text-text-primary">
				Cover photo
			</label>
			<div className="relative mt-2 flex justify-center overflow-hidden rounded-lg border border-dashed border-border-tertiary bg-transparent px-6 py-10">
				{newImageSrc ? (
					<img src={newImageSrc} alt={'Cover preview'} className="absolute top-0 -z-10 h-full w-full object-cover " />
				) : existingImageSrc ? (
					<img
						src={existingImageSrc}
						alt={'Cover preview'}
						className="absolute top-0 -z-10 h-full w-full object-cover "
					/>
				) : null}

				<div className="text-center ">
					<PhotoIcon className="mx-auto h-12 w-12 text-text-secondary" aria-hidden="true" />
					<div className="mt-4 flex text-sm leading-6 text-gray-600">
						<label
							htmlFor={inputProps.fields.id}
							className="relative cursor-pointer rounded-md px-1 font-semibold text-indigo-600 focus-within:outline-1 focus-within:ring-1 focus-within:ring-indigo-600 focus-within:ring-offset-1 hover:text-indigo-500"
						>
							<span>Upload a file</span>
							<input
								{...getInputProps(inputProps.fields, { type: inputType })}
								type="file"
								accept={accept}
								size={size}
								onChange={e => {
									const file = e.currentTarget.files?.[0];
									if (file) {
										const reader = new FileReader();
										reader.onload = event => {
											setNewImageSrc(event.target?.result?.toString() ?? null);
										};
										reader.readAsDataURL(file);
									}
								}}
								className="sr-only"
							/>
						</label>
						<p className="pl-1">or drag and drop</p>
					</div>
					<p className="text-xs leading-5 text-text-secondary">PNG, JPG, GIF up to 3MB</p>
				</div>
			</div>
		</div>
	);
}
