import { AuthenticityTokenInput } from 'remix-utils/csrf/react';
import SubmitButton from '../SubmitButton';
import { Form, useActionData } from '@remix-run/react';
import InputField from '../InputField';
import InputSelectField from '../InputSelectField';
import { getFormProps, getInputProps, getSelectProps, useForm } from '@conform-to/react';
import { z } from 'zod';
import { parseWithZod } from '@conform-to/zod';
import DatePicker from '../DatePicker';
import {
	deleteCurrentPlaceOfWorkActionIntent,
	updateCurrentPlaceOfWorkActionIntent,
	UserProfileProps,
} from '~/routes/$username+';
import dayjs from 'dayjs';
import InputDomainField from '../InputDomainField';
import { canadaMajorCities } from '~/utils/canada-data';
import { useIsPending } from '~/hooks/useIsPending';

const positions = [
	'Assistant Manager',
	'Bar Manager',
	'Bar Supervisor',
	'Barback',
	'Barista',
	'Bartender',
	'Beverage Director',
	'Co-Owner',
	'Floor Manager',
	'General Manager',
	'Head Bartender',
	'Host',
	'Owner',
	'Server',
	'Sommelier',
	'Support',
] as const;

export const CurrentPlaceOfWorkSchema = z.object({
	name: z.string().trim().min(2).max(50),
	positions: z.enum(positions),
	startDate: z.string().date(),
	city: z.enum(canadaMajorCities),
	websiteUrl: z.string().url().or(z.literal('http://')), // An empty input will still contain 'http://' in the value
});

export default function UserEditProfileView({ currentPlaceOfWork }: UserProfileProps) {
	const isCurrentPlaceOfWorkSubmitting = useIsPending({ formIntent: updateCurrentPlaceOfWorkActionIntent });
	const isCurrentPlaceOfWorkDeleting = useIsPending({ formIntent: deleteCurrentPlaceOfWorkActionIntent });

	const [currentPlaceOfWorkForm, currentPlaceOfWorkFields] = useForm({
		id: 'current-place-of-work',
		lastResult: useActionData(),
		shouldValidate: 'onSubmit',
		shouldRevalidate: 'onSubmit',
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: CurrentPlaceOfWorkSchema });
		},
		defaultValue: {
			name: currentPlaceOfWork?.name,
			positions: currentPlaceOfWork?.position,
			city: currentPlaceOfWork?.city,
			websiteUrl: currentPlaceOfWork?.websiteUrl,
		},
	});

	return (
		<section className="mt-8 text-text-primary">
			<div>
				<div className="flex items-center text-lg font-semibold leading-7 text-text-primary lg:text-xl">
					<h1>Industry Experience</h1>
				</div>
				<p className="mt-3 text-sm leading-6 text-text-secondary">Share you hospitality journey with the community.</p>
			</div>

			<h3 className="mt-8 text-base font-semibold leading-7 text-text-primary">Current place of work</h3>
			<Form {...getFormProps(currentPlaceOfWorkForm)} method="POST" preventScrollReset={true}>
				<AuthenticityTokenInput />
				<div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-12">
					<div className="sm:col-span-3">
						<InputField
							label="Name"
							fieldAttributes={{ ...getInputProps(currentPlaceOfWorkFields.name, { type: 'text' }) }}
							htmlFor={currentPlaceOfWorkFields.name.id}
							errors={currentPlaceOfWorkFields.name.errors}
							errorId={currentPlaceOfWorkFields.name.errorId}
							additionalClasses={{
								backgroundColor: 'bg-bg-secondary',
								textColor: 'text-text-primary',
							}}
						/>
					</div>

					<div className="sm:col-span-3">
						<InputSelectField
							label="Position"
							fieldAttributes={{ ...getSelectProps(currentPlaceOfWorkFields.positions) }}
							htmlFor={currentPlaceOfWorkFields.positions.id}
							errors={currentPlaceOfWorkFields.positions.errors}
							errorId={currentPlaceOfWorkFields.positions.errorId}
							defaultOption={<option value="">-- Select Position --</option>}
							options={positions.map(position => ({
								value: position,
								label: position,
							}))}
						/>
					</div>
					<div className="sm:col-span-3">
						<DatePicker
							label="Start date"
							inputId={currentPlaceOfWorkFields.startDate.id}
							inputName={currentPlaceOfWorkFields.startDate.name}
							errors={currentPlaceOfWorkFields.startDate.errors}
							errorId={currentPlaceOfWorkFields.startDate.errorId}
							primaryColor="indigo"
							startDate={{
								startDate: dayjs(currentPlaceOfWork?.startDate).format('YYYY-MM-DD'),
								endDate: dayjs(currentPlaceOfWork?.startDate).format('YYYY-MM-DD'),
							}}
						/>
					</div>
					<div className="sm:col-span-3">
						<InputSelectField
							fieldAttributes={{ ...getSelectProps(currentPlaceOfWorkFields.city) }}
							defaultOption={<option value="">-- Select City --</option>}
							options={canadaMajorCities.map(city => ({
								value: city,
								label: city,
							}))}
							label="City"
							htmlFor={currentPlaceOfWorkFields.city.id}
							errors={currentPlaceOfWorkFields.city.errors}
							errorId={currentPlaceOfWorkFields.city.errorId}
						/>
					</div>
					<div className="sm:col-span-3">
						<InputDomainField
							fieldAttributes={{ ...getInputProps(currentPlaceOfWorkFields.websiteUrl, { type: 'url' }) }}
							htmlFor={currentPlaceOfWorkFields.websiteUrl.id}
							label="Website URL"
							errors={currentPlaceOfWorkFields.websiteUrl.errors}
							errorId={currentPlaceOfWorkFields.websiteUrl.errorId}
						/>
					</div>
				</div>
				<div className="mt-6 flex gap-x-2">
					<SubmitButton
						text="Update"
						name="intent"
						value={updateCurrentPlaceOfWorkActionIntent}
						width="min-w-20"
						stateText="Updating..."
						isSubmitting={isCurrentPlaceOfWorkSubmitting}
					/>
					<SubmitButton
						text="Delete"
						name="intent"
						value={deleteCurrentPlaceOfWorkActionIntent}
						width="min-w-20"
						stateText="Deleting..."
						isSubmitting={isCurrentPlaceOfWorkDeleting}
						backgroundColor="bg-red-600 hover:bg-red-500"
					/>
				</div>
			</Form>
		</section>
	);
}
