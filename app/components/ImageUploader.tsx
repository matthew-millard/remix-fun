// Give the user the ability to select and preview an image file that they want to upload.

import { useEffect, useState } from 'react';
import { ACCEPTED_FILE_TYPES, MAX_UPLOAD_SIZE } from '~/utils/validation-schemas';
import SubmitButton from './SubmitButton';
import { CameraIcon } from '@heroicons/react/24/outline';

type ImageInputProps = {
	fieldAttributes: React.InputHTMLAttributes<HTMLInputElement>;
	setProfileImagePreview: (url: string | null) => void;
	setShowPreview: (showPreview: boolean) => void;
	isSubmitting: boolean;
	htmlFor: string;
};

type ImagePickerProps = { htmlFor: string };

type ImageUploaderProps = Pick<ImageInputProps, 'fieldAttributes' | 'isSubmitting'> &
	Pick<ImagePickerProps, 'htmlFor'> & {
		profileImageId: string | null;
		showPreview: boolean;
		setShowPreview: (showPreview: boolean) => void;
		profileImageUrl: string | null;
	};

export const DeleteButton = SubmitButton;

export default function ImageUploader({
	fieldAttributes,
	htmlFor,
	isSubmitting,
	showPreview,
	setShowPreview,
	profileImageUrl,
}: ImageUploaderProps) {
	const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
	return (
		<div>
			<div className="relative h-48 w-48">
				{showPreview ? (
					<PreviewProfileImage profileImagePreview={profileImagePreview} />
				) : (
					<CurrentProfileImage profileImageUrl={profileImageUrl} />
				)}

				<ImageInput
					fieldAttributes={fieldAttributes}
					isSubmitting={isSubmitting}
					htmlFor={htmlFor}
					setProfileImagePreview={setProfileImagePreview}
					setShowPreview={setShowPreview}
				/>
			</div>
		</div>
	);
}

function ImageInput({
	fieldAttributes,
	setProfileImagePreview,
	setShowPreview,
	isSubmitting,
	htmlFor,
}: ImageInputProps) {
	function handleFileSelection(event: React.ChangeEvent<HTMLInputElement>) {
		const file = event.currentTarget.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = event => {
				setShowPreview(true);
				setProfileImagePreview(event.target?.result?.toString() ?? null);
			};
			reader.readAsDataURL(file);
		}
	}

	return (
		<div>
			<ImagePicker htmlFor={htmlFor} />
			<input
				{...fieldAttributes}
				accept={ACCEPTED_FILE_TYPES}
				size={MAX_UPLOAD_SIZE}
				disabled={isSubmitting}
				onChange={e => handleFileSelection(e)}
				id={htmlFor}
				className="sr-only"
			/>
		</div>
	);
}

export function CurrentProfileImage({ profileImageUrl }: { profileImageUrl: string | null }) {
	return (
		<div className="h-full w-full overflow-hidden rounded-full">
			{profileImageUrl ? (
				<img alt="Current profile" src={profileImageUrl} className="h-full w-full object-cover" />
			) : (
				<FallbackAvatar />
			)}
		</div>
	);
}
export function PreviewProfileImage({ profileImagePreview }: { profileImagePreview: string }) {
	return (
		<div className="h-full w-full overflow-hidden rounded-full">
			<img alt="Profile preview" src={profileImagePreview} className="h-full w-full object-cover" />
		</div>
	);
}

function FallbackAvatar() {
	return (
		<svg className="bg-gray-200 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
			<path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
		</svg>
	);
}

function ImagePicker({ htmlFor }: ImagePickerProps) {
	return (
		// eslint-disable-next-line jsx-a11y/label-has-associated-control
		<label
			htmlFor={htmlFor}
			className="absolute bottom-3 right-1 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border-2 bg-gray-600 hover:bg-gray-500"
		>
			<CameraIcon className=" h-7 w-7 text-white" />
		</label>
	);
}
