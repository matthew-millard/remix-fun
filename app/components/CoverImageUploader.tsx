import React, { useState } from 'react';
import { ACCEPTED_FILE_TYPES, MAX_UPLOAD_SIZE } from '~/utils/validation-schemas';

type CoverImageUploaderProps = {
	coverImageUrl: string | null;
	fieldAttributes: React.InputHTMLAttributes<HTMLInputElement>;
};

type CoverImageInputProps = Pick<CoverImageUploaderProps, 'fieldAttributes'> & {
	setPreviewCoverImageUrl: (url: string | null) => void;
	// setShowPreview: (showPreview: boolean) => void;
};

export default function CoverImageUploader({ coverImageUrl, fieldAttributes }: CoverImageUploaderProps) {
	const [previewCoverImageUrl, setPreviewCoverImageUrl] = useState<string | null>(null);

	return (
		<div className="relative mt-8 flex h-48 flex-col justify-center gap-y-2 overflow-hidden rounded-lg border border-dashed border-gray-300 bg-transparent">
			{previewCoverImageUrl ? (
				<PreviewCoverImage previewCoverImageUrl={previewCoverImageUrl} />
			) : (
				<CurrentCoverImage coverImageUrl={coverImageUrl} />
			)}
			<CoverImageInput fieldAttributes={fieldAttributes} setPreviewCoverImageUrl={setPreviewCoverImageUrl} />
		</div>
	);
}

function CoverImageInput({ fieldAttributes, setPreviewCoverImageUrl }: CoverImageInputProps) {
	function handleFileSelection(event: React.ChangeEvent<HTMLInputElement>) {
		const file = event.currentTarget.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = event => {
				setPreviewCoverImageUrl(event.target?.result?.toString() ?? null);
			};
			reader.readAsDataURL(file);
		}
	}
	return (
		<div className="flex items-center justify-center">
			<label
				htmlFor={fieldAttributes.id}
				className="flex cursor-pointer rounded-md bg-gray-600/75 px-3 py-2 font-medium text-white hover:bg-gray-500/75"
			>
				<span>Choose a file</span>
			</label>
			<input
				{...fieldAttributes}
				size={MAX_UPLOAD_SIZE}
				accept={ACCEPTED_FILE_TYPES}
				className="sr-only"
				onChange={handleFileSelection}
				id={fieldAttributes.id}
			/>
		</div>
	);
}

function CurrentCoverImage({ coverImageUrl }: { coverImageUrl: string }) {
	return (
		<>
			{coverImageUrl ? (
				<img
					src={coverImageUrl}
					alt={'Current cover preview'}
					className="absolute top-0 -z-10 h-full w-full object-cover"
				/>
			) : (
				<FallBackCoverImage />
			)}
		</>
	);
}

function FallBackCoverImage() {
	return (
		<span className="flex items-center justify-center">
			<svg
				className="h-10 w-10 text-gray-400 dark:text-gray-600"
				aria-hidden="true"
				xmlns="http://www.w3.org/2000/svg"
				fill="currentColor"
				viewBox="0 0 16 20"
			>
				<path d="M14.066 0H7v5a2 2 0 0 1-2 2H0v11a1.97 1.97 0 0 0 1.934 2h12.132A1.97 1.97 0 0 0 16 18V2a1.97 1.97 0 0 0-1.934-2ZM10.5 6a1.5 1.5 0 1 1 0 2.999A1.5 1.5 0 0 1 10.5 6Zm2.221 10.515a1 1 0 0 1-.858.485h-8a1 1 0 0 1-.9-1.43L5.6 10.039a.978.978 0 0 1 .936-.57 1 1 0 0 1 .9.632l1.181 2.981.541-1a.945.945 0 0 1 .883-.522 1 1 0 0 1 .879.529l1.832 3.438a1 1 0 0 1-.031.988Z" />
				<path d="M5 5V.13a2.96 2.96 0 0 0-1.293.749L.879 3.707A2.98 2.98 0 0 0 .13 5H5Z" />
			</svg>
		</span>
	);
}

function PreviewCoverImage({ previewCoverImageUrl }: { previewCoverImageUrl: string }) {
	return (
		<img src={previewCoverImageUrl} alt={'Cover preview'} className="absolute top-0 -z-10 h-full w-full object-cover" />
	);
}
