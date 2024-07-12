import { getFormProps, getTextareaProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { Form, useActionData } from '@remix-run/react';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';
import { ReviewSchema, UserData, postReviewActionIntent } from '~/routes/cocktails+/$cocktail';
import Button from './Button';
import ErrorList from './ErrorList';
import { useId, useRef } from 'react';
import { useIsPending } from '~/hooks/useIsPending';

export default function ReviewForm({ user }: { user: UserData }) {
	const lastResult = useActionData();
	const reviewRef = useRef<HTMLTextAreaElement>(null);

	const isPending = useIsPending({ formIntent: postReviewActionIntent, formMethod: 'POST' });

	const [reviewForm, reviewFields] = useForm({
		id: useId(),
		lastResult,
		constraint: getZodConstraint(ReviewSchema),
		shouldValidate: 'onSubmit',
		shouldRevalidate: 'onSubmit',
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: ReviewSchema });
		},
	});

	return (
		<div className="mt-6 flex flex-col">
			<div className="flex gap-x-3">
				<img
					src={`/resources/images/${user.profileImage.id}/profile`}
					alt=""
					className="hidden h-5 w-5 flex-none rounded-full  object-cover lg:block lg:h-7 lg:w-7"
				/>
				<Form {...getFormProps(reviewForm)} method="POST" className="relative flex-auto">
					<AuthenticityTokenInput />
					<div className="overflow-hidden rounded-lg pb-12 shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-indigo-600">
						<label htmlFor={reviewFields.review.id} className="sr-only">
							Add your review
						</label>
						<textarea
							{...getTextareaProps(reviewFields.review)}
							rows={3}
							className="block w-full resize-none border-0 bg-transparent py-3 pl-3 pr-3 text-sm text-text-primary placeholder:text-sm placeholder:text-gray-400 focus:outline-none sm:leading-6 lg:text-base lg:placeholder:text-base"
							placeholder="Add your review..."
							ref={reviewRef}
						/>
					</div>
					<div className="absolute  bottom-0 right-0 flex py-2 pl-3 pr-2">
						<Button label="Comment" type="submit" name="intent" value={postReviewActionIntent} isPending={isPending} />
					</div>
				</Form>
			</div>
			<div
				className={`transition-height overflow-hidden pt-1 duration-500  ease-in-out lg:ml-10 ${reviewFields.review.errors ? 'max-h-56' : 'max-h-0'}`}
			>
				<ErrorList errors={reviewFields.review.errors} id={reviewFields.review.errorId} />
			</div>
		</div>
	);
}
