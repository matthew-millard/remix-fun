import { AuthenticityTokenInput } from 'remix-utils/csrf/react';
import SubmitButton from '../SubmitButton';
import { Form, useActionData } from '@remix-run/react';
import InputField from '../InputField';
import InputSelectField from '../InputSelectField';
import { getFormProps, getInputProps, getSelectProps, useForm } from '@conform-to/react';
import { z } from 'zod';
import { parseWithZod } from '@conform-to/zod';
import DatePicker from '../DatePicker';
import { updateCurrentPlaceOfWorkActionIntent } from '~/routes/$username+';

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
});

export default function UserEditProfileView() {
	const [currentPlaceOfWorkForm, currentPlaceOfWorkFields] = useForm({
		id: 'current-place-of-work',
		lastResult: useActionData(),
		shouldValidate: 'onSubmit',
		shouldRevalidate: 'onSubmit',
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: CurrentPlaceOfWorkSchema });
		},
	});

	return (
		<section className="mt-6 text-text-primary">
			<div>
				<div className="flex items-center text-lg font-semibold leading-7 text-text-primary">
					<h2>Industry Experience</h2>
				</div>
				<p className="mt-3 text-sm leading-6 text-text-secondary">Share you hospitality journey with the community.</p>
			</div>

			<h3 className="mt-8 text-base font-semibold leading-7 text-text-primary">Current place of work</h3>
			<Form {...getFormProps(currentPlaceOfWorkForm)} method="POST" preventScrollReset={true}>
				<AuthenticityTokenInput />
				<div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
					<div className="sm:col-span-2">
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

					<div className="sm:col-span-2">
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
					<div className="sm:col-span-2">
						<DatePicker
							label="Start date"
							inputId={currentPlaceOfWorkFields.startDate.id}
							inputName={currentPlaceOfWorkFields.startDate.name}
							isSubmitting={false}
							errors={currentPlaceOfWorkFields.startDate.errors}
							errorId={currentPlaceOfWorkFields.startDate.errorId}
							primaryColor="indigo"
						/>
					</div>
				</div>
				<div className="relative mt-6 sm:flex sm:items-center sm:space-x-4 sm:space-x-reverse">
					<SubmitButton
						text={'Update'}
						name="intent"
						value={updateCurrentPlaceOfWorkActionIntent}
						width="w-auto"
						stateText="Updating..."
					/>
				</div>
			</Form>
		</section>
	);
}
