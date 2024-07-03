export default function NewComment() {
	return (
		<div className="mt-6 flex gap-x-3">
			<img
				src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
				alt=""
				className="hidden h-5 w-5 flex-none rounded-full bg-gray-50 lg:block lg:h-6 lg:w-6"
			/>
			<form action="#" className="relative flex-auto">
				<div className="overflow-hidden rounded-lg pb-12 shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-indigo-600">
					<label htmlFor="comment" className="sr-only">
						Add your comment
					</label>
					<textarea
						rows={2}
						name="comment"
						id="comment"
						className="block w-full resize-none border-0 bg-transparent py-2 pl-3 pr-2 text-sm text-text-primary placeholder:text-sm placeholder:text-gray-400 focus:outline-none sm:leading-6 lg:text-base lg:placeholder:text-base"
						placeholder="Add your comment..."
						defaultValue={''}
					/>
				</div>

				<div className="absolute  bottom-0 right-0 flex py-2 pl-3 pr-2">
					<button
						type="submit"
						className="shadow-lsm items-end rounded-md bg-indigo-500 px-2.5 py-1.5 text-sm  font-semibold text-white ring-1 ring-inset ring-bg-primary  hover:bg-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white dark:bg-white dark:text-indigo-600 dark:hover:bg-gray-300"
					>
						Comment
					</button>
				</div>
			</form>
		</div>
	);
}
