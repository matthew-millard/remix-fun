export default function NewComment() {
	return (
		<div className="mt-16 flex flex-col gap-y-2">
			<div className="flex gap-x-2">
				<img
					src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
					alt=""
					className="h-6 w-6 flex-none rounded-full bg-gray-50"
				/>
				<form action="#" className="flex-auto" id="comment-form">
					<div className="overflow-hidden rounded-lg pb-12 shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-indigo-600">
						<label htmlFor="comment" className="sr-only">
							Add your comment
						</label>
						<textarea
							rows={1}
							name="comment"
							id="comment"
							className="block w-full resize-none border-0 bg-transparent px-2 py-1.5 text-text-primary placeholder:text-text-secondary focus:ring-0 sm:text-sm sm:leading-6"
							placeholder="Add your comment..."
							defaultValue={''}
						/>
					</div>
				</form>
			</div>
			<button
				form="comment-form"
				type="submit"
				className="max-w-24 self-end rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white dark:bg-white dark:text-indigo-600 dark:hover:bg-indigo-50"
			>
				Comment
			</button>
		</div>
	);
}
