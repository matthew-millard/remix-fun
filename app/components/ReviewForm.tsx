import { getFormProps, getTextareaProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import { useActionData, useFetcher, useLoaderData } from '@remix-run/react';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';
import { ReviewSchema, loader } from '~/routes/cocktails+/$cocktail';
import Button from './Button';
import ErrorList from './ErrorList';
import { useEffect, useId, useRef } from 'react';

export default function ReviewForm() {
	const { user } = useLoaderData<typeof loader>();
	const reviewRef = useRef<HTMLTextAreaElement>(null);
	const fetcher = useFetcher();

	const isSubmitting = fetcher.state === 'submitting';

	const [reviewForm, reviewFields] = useForm({
		id: useId(),
		lastResult: useActionData(),
		shouldValidate: 'onSubmit',
		defaultValue: {
			comment: '',
		},
		shouldRevalidate: 'onSubmit',
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: ReviewSchema });
		},
	});

	useEffect(() => {
		if (isSubmitting) {
			reviewRef.current.value = '';
		}
	}, [isSubmitting]);

	return (
		<div className="mt-6 flex flex-col">
			<div className="flex gap-x-3">
				<img
					src={`/resources/images/${user.profileImage.id}/profile`}
					alt=""
					className="hidden h-5 w-5 flex-none rounded-full  object-cover lg:block lg:h-7 lg:w-7"
				/>
				<fetcher.Form {...getFormProps(reviewForm)} method="POST" className="relative flex-auto">
					<AuthenticityTokenInput />
					<div className="overflow-hidden rounded-lg pb-12 shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-indigo-600">
						<label htmlFor={reviewFields.comment.id} className="sr-only">
							Add your review
						</label>
						<textarea
							{...getTextareaProps(reviewFields.comment)}
							rows={3}
							className="block w-full resize-none border-0 bg-transparent py-3 pl-3 pr-3 text-sm text-text-primary placeholder:text-sm placeholder:text-gray-400 focus:outline-none sm:leading-6 lg:text-base lg:placeholder:text-base"
							placeholder="Add your comment..."
							ref={reviewRef}
							defaultValue={reviewFields.comment.value}
						/>
					</div>
					<div className="absolute  bottom-0 right-0 flex py-2 pl-3 pr-2">
						<Button label="Comment" type="submit" name="intent" value="comment" isPending={fetcher.state !== 'idle'} />
					</div>
				</fetcher.Form>
			</div>
			<div
				className={`transition-height overflow-hidden pt-1 duration-500  ease-in-out lg:ml-10 ${reviewFields.comment.errors ? 'max-h-56' : 'max-h-0'}`}
			>
				<ErrorList errors={reviewFields.comment.errors} id={reviewFields.comment.errorId} />
			</div>
		</div>
	);
}
