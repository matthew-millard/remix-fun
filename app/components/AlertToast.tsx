import { XCircleIcon } from '@heroicons/react/20/solid';

export default function AlertToast({
	errors,
	id,
	fontSize = '14px',
}: {
	errors?: Array<string> | null;
	id: string;
	fontSize?: string;
}) {
	return errors?.length ? (
		<div className="rounded-md bg-red-50 p-4">
			<div className="flex">
				<div className="flex-shrink-0">
					<XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
				</div>
				<div className="ml-3">
					<h3 className="text-sm font-medium text-red-800">
						{errors.length > 1
							? `There were ${errors.length} errors with your submission`
							: `There was ${errors.length} error with your submission`}
					</h3>
					<div className="mt-2 text-sm text-red-700">
						<ul className="list-disc space-y-1 pl-5" id={id}>
							{errors.map((error, i) => (
								<li key={i} style={{ fontSize }} className="text-foreground-destructive  text-red-500">
									{error}
								</li>
							))}
						</ul>
					</div>
				</div>
			</div>
		</div>
	) : null;
}
