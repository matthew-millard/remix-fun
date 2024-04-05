import { PhotoIcon } from '@heroicons/react/24/solid';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import {
	ActionFunctionArgs,
	json,
	LoaderFunctionArgs,
	unstable_parseMultipartFormData as parseMultipartFormData,
	unstable_createMemoryUploadHandler as createMemoryUploadHandler,
	redirect,
} from '@remix-run/node';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';
import { HoneypotInputs } from 'remix-utils/honeypot/react';
import { checkCSRF } from '~/utils/csrf.server';
import { prisma } from '~/utils/db.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { getSession } from '~/utils/session.server';
import { canadaData } from '~/utils/canada-data';
import { useEffect, useState } from 'react';
import { AlertToast, Avatar, ErrorList } from '~/components';
import { z } from 'zod';
import { profileInfoSchema, ACCEPTED_FILE_TYPES, MAX_UPLOAD_SIZE } from '~/utils/validation-schemas';
import { parseWithZod } from '@conform-to/zod';
import { getFormProps, getInputProps, getSelectProps, getTextareaProps, useForm } from '@conform-to/react';
import { validateProfileInfo } from '~/utils/validate-profile-info';
import { convertFileToBuffer } from '~/utils/file-utils';
import { deleteUserProfileImage, findUniqueUser, updateUserProfile } from '~/utils/prisma-user-helpers';

export async function action({ request }: ActionFunctionArgs) {
	const uploadHandler = createMemoryUploadHandler({ maxPartSize: MAX_UPLOAD_SIZE });
	const formData = await parseMultipartFormData(request, uploadHandler);
	await checkCSRF(formData, request.headers);
	checkHoneypot(formData);

	// Get the user's ID from the session
	const session = await getSession(request);
	const userId = session.get('userId');

	// Validate the form data
	const submission = await validateProfileInfo(formData, userId);
	if (submission.status !== 'success') {
		return json(submission.reply({ formErrors: ['Submission failded'] }), {
			status: submission.status === 'error' ? 400 : 200,
		});
	}

	const { firstName, lastName, username, about, profilePicture, province, country, city } = submission.value;

	const file = profilePicture;

	// if a file was uploaded, convert it to a buffer and update the user's profile image
	if (file) {
		const profileImage = await convertFileToBuffer(file);

		// Delete the user's current profile image
		const user = await findUniqueUser(userId, { profileImage: true });
		if (user.profileImage?.id) {
			deleteUserProfileImage(user.profileImage.id);
		}

		// Update user's profile image
		await updateUserProfile(userId, {
			profileImage: {
				upsert: {
					update: {
						contentType: file.type,
						blob: profileImage,
					},
					create: {
						contentType: file.type,
						blob: profileImage,
					},
				},
			},
		});
	}
	// Update the user's profile
	await updateUserProfile(userId, {
		firstName,
		lastName,
		username: {
			update: {
				username,
			},
		},
		about: {
			upsert: {
				update: {
					about,
				},
				create: {
					about,
				},
			},
		},

		userLocation: {
			upsert: {
				update: {
					country,
					province,
					city,
				},
				create: {
					country,
					province,
					city,
				},
			},
		},
	});

	// refresh the page
	return redirect(`/${username}`);
}

export async function loader({ request }: LoaderFunctionArgs) {
	const session = await getSession(request);
	const userId = session.get('userId');

	if (!userId) {
		return redirect('/login');
	}

	const user = await prisma.user.findUnique({
		where: {
			id: userId,
		},
		select: {
			id: true,
			email: true,
			firstName: true,
			lastName: true,
			profileImage: true,
			createdAt: true,
			updatedAt: true,
			username: true,
			about: true,
			userLocation: true,
		},
	});

	if (!user) {
		return redirect('/login');
	}

	const data = {
		user,
	};

	return json(data);
}

export default function MyAccount() {
	const data = useLoaderData<typeof loader>();

	const { user } = data;
	const lastResult = useActionData();
	const [form, fields] = useForm({
		id: 'profile-form',
		shouldValidate: 'onInput',
		lastResult,
		shouldRevalidate: 'onInput',
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: profileInfoSchema });
		},
		defaultValue: {
			username: data.user.username.username,
			about: data.user.about?.about || '',
			firstName: data.user.firstName,
			lastName: data.user.lastName,
			email: data.user.email,
		},
	});

	const [selectedProvince, setSelectedProvince] = useState<string>(() => {
		const province = user?.userLocation?.province;
		return province ? province : '';
	});
	const [selectedCity, setSelectedCity] = useState<string>(() => {
		const city = user?.userLocation?.city;
		return city ? city : '';
	});

	// Update the effect to reset the preview when the user's profile image changes
	const [profileImagePreviewUrl, setProfileImagePreviewUrl] = useState<string | null>(null);
	useEffect(() => {
		if (data.user?.profileImage?.id) {
			setProfileImagePreviewUrl(`/resources/images/${data.user.profileImage.id}`);
		} else {
			setProfileImagePreviewUrl(null); // reset to null if no profile image is availble
		}
	}, [data.user?.profileImage?.id]);

	function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onloadend = () => {
				setProfileImagePreviewUrl(reader.result as string);
			};
			reader.readAsDataURL(file);
		}
	}

	function handleProvinceChange(province: string) {
		setSelectedProvince(province);
		setSelectedCity('');
	}

	function handleCityChange(city: string) {
		setSelectedCity(city);
	}

	return (
		<Form {...getFormProps(form)} method="POST" encType="multipart/form-data" className="mx-auto max-w-3xl px-6">
			<div className="space-y-12">
				<div className="border-b border-border-tertiary pb-12">
					<h2 className="text-base font-semibold leading-7 text-text-primary">Profile</h2>
					<p className="mt-1 text-sm leading-6 text-text-secondary">
						This information will be displayed publicly so be careful what you share.
					</p>

					<div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
						<div className="sm:col-span-4">
							<label htmlFor={fields.username.id} className="block text-sm font-medium leading-6 text-text-primary">
								Username
							</label>
							<div className="mt-2">
								<div className="flex rounded-md bg-bg-secondary ring-1 ring-inset ring-border-tertiary focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500">
									<span className="flex select-none items-center pl-3 text-gray-500 sm:text-sm">barfly.com/</span>
									<input
										{...getInputProps(fields.username, { type: 'text' })}
										className="flex-1 border-0 bg-transparent py-1.5 pl-1 text-text-primary focus:ring-0 aria-[invalid]:ring-red-600 sm:text-sm sm:leading-6"
									/>
								</div>
							</div>
							<div
								className={`transition-height overflow-hidden px-2 py-1 duration-500 ease-in-out ${fields.username.errors ? 'max-h-56' : 'max-h-0'}`}
							>
								<ErrorList errors={fields.username.errors} id={fields.username.errorId} />
							</div>
						</div>

						<div className="col-span-full">
							<label htmlFor={fields.about.id} className="block text-sm font-medium leading-6 text-text-primary">
								About
							</label>
							<div className="mt-2">
								<textarea
									{...getTextareaProps(fields.about)}
									rows={3}
									className="block w-full rounded-md border-0 bg-bg-secondary px-2 py-1.5 text-text-primary shadow-sm ring-1 ring-inset ring-border-tertiary focus:ring-2 focus:ring-inset focus:ring-indigo-500 aria-[invalid]:ring-red-600 sm:text-sm sm:leading-6"
								/>
								<div
									className={`transition-height overflow-hidden px-2 py-1 duration-500 ease-in-out ${fields.about.errors ? 'max-h-56' : 'max-h-0'}`}
								>
									<ErrorList errors={fields.about.errors} id={fields.firstName.errorId} />
								</div>
							</div>
							<p className="mt-3 text-sm leading-6 text-text-secondary">Write a few sentences about yourself.</p>
						</div>

						<div className="col-span-full">
							<p className="block text-sm font-medium leading-6 text-text-primary">Photo</p>
							<div className="mt-2 flex items-center gap-x-3">
								{profileImagePreviewUrl ? (
									<img
										src={profileImagePreviewUrl}
										alt="Profile preview"
										className="h-20 w-20 overflow-hidden rounded-full object-cover"
									/>
								) : (
									<Avatar imageId={user?.profileImage?.id} />
								)}
								<label
									htmlFor={fields.profilePicture.id}
									className="rounded-md bg-bg-alt px-3 py-2 text-sm font-semibold text-text-primary shadow-sm hover:bg-bg-secondary"
								>
									Change
								</label>
								<input
									{...getInputProps(fields.profilePicture, { type: 'file' })}
									className="sr-only hidden"
									accept={ACCEPTED_FILE_TYPES}
									size={MAX_UPLOAD_SIZE}
									onChange={handleFileChange}
								/>
								<p className="text-xs leading-5 text-text-secondary">PNG, JPG, GIF up to 3MB</p>
								<div
									className={`transition-height overflow-hidden px-2 py-1 duration-500 ease-in-out ${fields.profilePicture.errors ? 'max-h-56' : 'max-h-0'}`}
								>
									<ErrorList errors={fields.profilePicture.errors} id={fields.profilePicture.errorId} />
								</div>
							</div>
						</div>

						<div className="col-span-full">
							<p className="block text-sm font-medium leading-6 text-text-primary">Cover photo</p>
							<div className="mt-2 flex justify-center rounded-lg border border-dashed border-border-dash px-6 py-10">
								<div className="text-center">
									<PhotoIcon className="mx-auto h-12 w-12 text-bg-alt" aria-hidden="true" />
									<div className="mt-4 flex text-sm leading-6 text-text-secondary">
										<label
											htmlFor="cover-photo-file-upload"
											className="relative cursor-pointer rounded-md bg-none font-semibold text-text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 focus-within:ring-offset-gray-900 hover:text-indigo-500"
										>
											<span>Upload a file</span>
											<input id="cover-photo-file-upload" name="coverPhoto" type="file" className="sr-only" />
										</label>
										<p className="pl-1">or drag and drop</p>
									</div>
									<p className="text-xs leading-5 text-text-secondary">PNG, JPG, GIF up to 3MB</p>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className="border-b border-border-tertiary pb-12">
					<h2 className="text-base font-semibold leading-7 text-text-primary">Personal Information</h2>
					<p className="mt-1 text-sm leading-6 text-text-secondary">
						Use a permanent address where you can receive mail.
					</p>

					<div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
						<div className="sm:col-span-3">
							<label htmlFor={fields.firstName.id} className="block text-sm font-medium leading-6 text-text-primary">
								First name
							</label>
							<div className="mt-2">
								<input
									{...getInputProps(fields.firstName, { type: 'text' })}
									className="block w-full rounded-md border-0 bg-bg-secondary px-2 py-1.5 text-text-primary shadow-sm ring-1 ring-inset ring-border-tertiary focus:ring-2 focus:ring-inset focus:ring-indigo-500 aria-[invalid]:ring-red-600 sm:text-sm sm:leading-6"
								/>
								<div
									className={`transition-height overflow-hidden px-2 py-1 duration-500 ease-in-out ${fields.firstName.errors ? 'max-h-56' : 'max-h-0'}`}
								>
									<ErrorList errors={fields.firstName.errors} id={fields.firstName.errorId} />
								</div>
							</div>
						</div>

						<div className="sm:col-span-3">
							<label htmlFor={fields.lastName.id} className="block text-sm font-medium leading-6 text-text-primary">
								Last name
							</label>
							<div className="mt-2">
								<input
									{...getInputProps(fields.lastName, { type: 'text' })}
									className="block w-full rounded-md border-0 bg-bg-secondary px-2 py-1.5 text-text-primary shadow-sm ring-1 ring-inset ring-border-tertiary focus:ring-2 focus:ring-inset focus:ring-indigo-500 aria-[invalid]:ring-red-600 sm:text-sm sm:leading-6"
								/>
								<div
									className={`transition-height overflow-hidden px-2 py-1 duration-500 ease-in-out ${fields.lastName.errors ? 'max-h-56' : 'max-h-0'}`}
								>
									<ErrorList errors={fields.lastName.errors} id={fields.lastName.errorId} />
								</div>
							</div>
						</div>

						<div className="sm:col-span-4">
							<label htmlFor={fields.email.id} className="block text-sm font-medium leading-6 text-text-primary">
								Email address
							</label>
							<div className="mt-2">
								{/* UPDATE ME...Do not want to allow user to easily change their email address attached to their account without 2FA */}
								<input
									{...getInputProps(fields.email, { type: 'email' })}
									className="block w-full rounded-md border-0 bg-bg-secondary px-2 py-1.5 text-text-primary shadow-sm ring-1 ring-inset ring-border-tertiary focus:ring-2 focus:ring-inset focus:ring-indigo-500 aria-[invalid]:ring-red-600 sm:text-sm sm:leading-6"
								/>
								<div
									className={`transition-height overflow-hidden px-2 py-1 duration-500 ease-in-out ${fields.email.errors ? 'max-h-56' : 'max-h-0'}`}
								>
									<ErrorList errors={fields.email.errors} id={fields.email.errorId} />
								</div>
							</div>
						</div>

						<div className="sm:col-span-2 sm:col-start-1">
							<label htmlFor={fields.country.id} className="block text-sm font-medium leading-6 text-text-primary">
								Country
							</label>
							<div className="mt-2">
								<select
									{...getSelectProps(fields.country)}
									className="block w-full rounded-md border-0 bg-bg-secondary px-2 py-1.5 text-text-primary shadow-sm ring-1 ring-inset ring-border-tertiary focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 [&_*]:text-black"
								>
									<option value={'Canada'}>Canada</option>
								</select>
								<div
									className={`transition-height overflow-hidden px-2 py-1 duration-500 ease-in-out ${fields.firstName.errors ? 'max-h-56' : 'max-h-0'}`}
								>
									<ErrorList errors={fields.country.errors} id={fields.country.errorId} />
								</div>
							</div>
						</div>

						<div className="sm:col-span-2">
							<label htmlFor={fields.province.id} className="block text-sm font-medium leading-6 text-text-primary">
								Province
							</label>
							<div className="mt-2">
								<select
									{...getSelectProps(fields.province)}
									className="block w-full rounded-md border-0 bg-bg-secondary px-2 py-1.5 text-text-primary shadow-sm ring-1 ring-inset ring-border-tertiary focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 [&_*]:text-black"
									value={selectedProvince}
									onChange={e => handleProvinceChange(e.target.value)}
								>
									<option value="">-- Select Province --</option>
									{Object.keys(canadaData).map(province => (
										<option key={province} value={province}>
											{province.replace(/([A-Z])/g, ' $1').trim()}
										</option>
									))}
								</select>
								<div
									className={`transition-height overflow-hidden px-2 py-1 duration-500 ease-in-out ${fields.firstName.errors ? 'max-h-56' : 'max-h-0'}`}
								>
									<ErrorList errors={fields.province.errors} id={fields.province.errorId} />
								</div>
							</div>
						</div>

						<div className="sm:col-span-2 sm:col-start-1">
							<label htmlFor={fields.city.id} className="block text-sm font-medium leading-6 text-text-primary">
								City
							</label>
							<div className="mt-2">
								<select
									{...getSelectProps(fields.city)}
									className="block w-full rounded-md border-0 bg-bg-secondary px-2 py-1.5 text-text-primary shadow-sm ring-1 ring-inset ring-border-tertiary focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 [&_*]:text-black"
									value={selectedCity}
									onChange={e => handleCityChange(e.target.value)}
								>
									<option value="">-- Select City --</option>
									{selectedProvince &&
										(canadaData[selectedProvince as keyof typeof canadaData] as string[]).map(city => (
											<option key={city} value={city}>
												{city}
											</option>
										))}
								</select>
								<div
									className={`transition-height overflow-hidden px-2 py-1 duration-500 ease-in-out ${fields.firstName.errors ? 'max-h-56' : 'max-h-0'}`}
								>
									<ErrorList errors={fields.city.errors} id={fields.city.errorId} />
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* <div className="border-b border-border-tertiary pb-12">
					<h2 className="text-base font-semibold leading-7 text-text-primary">Notifications</h2>
					<p className="mt-1 text-sm leading-6 text-text-secondary">
						We&apos;ll always let you know about important changes, but you pick what else you want to hear about.
					</p>

					<div className="mt-10 space-y-10">
						<fieldset>
							<legend className="text-sm font-semibold leading-6 text-text-primary">By Email</legend>
							<div className="mt-6 space-y-6">
								<div className="relative flex gap-x-3">
									<div className="flex h-6 items-center">
										<input
											id="comments"
											name="comments"
											type="checkbox"
											className="h-4 w-4 rounded border-border-tertiary bg-bg-secondary text-indigo-600 focus:ring-indigo-600 focus:ring-offset-gray-900"
										/>
									</div>
									<div className="text-sm leading-6">
										<label htmlFor="comments" className="font-medium text-text-primary">
											Comments
										</label>
										<p className="text-text-secondary">Get notified when someones posts a comment on a posting.</p>
									</div>
								</div>
								<div className="relative flex gap-x-3">
									<div className="flex h-6 items-center">
										<input
											id="candidates"
											name="candidates"
											type="checkbox"
											className="h-4 w-4 rounded border-border-tertiary bg-bg-secondary text-indigo-600 focus:ring-indigo-600 focus:ring-offset-gray-900"
										/>
									</div>
									<div className="text-sm leading-6">
										<label htmlFor="candidates" className="font-medium text-text-primary">
											Candidates
										</label>
										<p className="text-text-secondary">Get notified when a candidate applies for a job.</p>
									</div>
								</div>
								<div className="relative flex gap-x-3">
									<div className="flex h-6 items-center">
										<input
											id="offers"
											name="offers"
											type="checkbox"
											className="h-4 w-4 rounded border-border-tertiary bg-bg-secondary text-indigo-600 focus:ring-indigo-600 focus:ring-offset-gray-900"
										/>
									</div>
									<div className="text-sm leading-6">
										<label htmlFor="offers" className="font-medium text-text-primary">
											Offers
										</label>
										<p className="text-text-secondary">Get notified when a candidate accepts or rejects an offer.</p>
									</div>
								</div>
							</div>
						</fieldset>
						<fieldset>
							<legend className="text-sm font-semibold leading-6 text-text-primary">Push Notifications</legend>
							<p className="mt-1 text-sm leading-6 text-text-secondary">
								These are delivered via SMS to your mobile phone.
							</p>
							<div className="mt-6 space-y-6">
								<div className="flex items-center gap-x-3">
									<input
										id="push-everything"
										name="push-notifications"
										type="radio"
										className="h-4 w-4 border-border-tertiary bg-bg-secondary text-indigo-600 focus:ring-indigo-600 focus:ring-offset-gray-900"
									/>
									<label htmlFor="push-everything" className="block text-sm font-medium leading-6 text-text-primary">
										Everything
									</label>
								</div>
								<div className="flex items-center gap-x-3">
									<input
										id="push-email"
										name="push-notifications"
										type="radio"
										className="h-4 w-4 border-border-tertiary bg-bg-secondary text-indigo-600 focus:ring-indigo-600 focus:ring-offset-gray-900"
									/>
									<label htmlFor="push-email" className="block text-sm font-medium leading-6 text-text-primary">
										Same as email
									</label>
								</div>
								<div className="flex items-center gap-x-3">
									<input
										id="push-nothing"
										name="push-notifications"
										type="radio"
										className="h-4 w-4 border-border-tertiary bg-bg-secondary text-indigo-600 focus:ring-indigo-600 focus:ring-offset-gray-900"
									/>
									<label htmlFor="push-nothing" className="block text-sm font-medium leading-6 text-text-primary">
										No push notifications
									</label>
								</div>
							</div>
						</fieldset>
					</div>
				</div> */}
			</div>

			<div
				className={`transition-height overflow-hidden px-2 py-1 duration-500 ease-in-out ${form.errors ? 'max-h-56' : 'max-h-0'}`}
			>
				<AlertToast errors={form.errors} id={form.errorId} />
			</div>

			<div className="mt-6 flex items-center justify-end gap-x-6">
				<button type="button" className="text-sm font-semibold leading-6 text-text-primary">
					Cancel
				</button>
				<button
					type="submit"
					className="rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
				>
					Save
				</button>
			</div>
			<HoneypotInputs />
			<AuthenticityTokenInput />
		</Form>
	);
}
