import { PhotoIcon, UserCircleIcon } from '@heroicons/react/24/solid';
import { Form, useLoaderData } from '@remix-run/react';
import {
	ActionFunctionArgs,
	json,
	LoaderFunctionArgs,
	unstable_parseMultipartFormData as parseMultipartFormData,
	unstable_createMemoryUploadHandler as createMemoryUploadHandler,
} from '@remix-run/node';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';
import { HoneypotInputs } from 'remix-utils/honeypot/react';
import { checkCSRF } from '~/utils/csrf.server';
import { prisma } from '~/utils/db.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { getSession } from '~/utils/session.server';
import { canadaData } from '~/utils/canada-data';
import { useState } from 'react';

// Useful variables
const maxUploadFileSize = 3 * 1024 * 1024; // 3MB

type loader = {
	username: string;
};

export async function loader({ request }: LoaderFunctionArgs) {
	const session = await getSession(request);
	const userId = session.get('userId');

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

	const data = {
		user,
	};

	return json(data);
}

export async function action({ request }: ActionFunctionArgs) {
	const uploadHandler = createMemoryUploadHandler({ maxPartSize: maxUploadFileSize });
	const formData = await parseMultipartFormData(request, uploadHandler);
	await checkCSRF(formData, request.headers);
	checkHoneypot(formData);

	console.log('form data', formData);

	// Save the form data to the database
	const session = await getSession(request);
	const userId = session.get('userId');
	await prisma.user.update({
		where: {
			id: userId,
		},
		data: {
			firstName: formData.get('firstName') as string,
			lastName: formData.get('lastName') as string,
			username: {
				update: {
					username: formData.get('username') as string,
				},
			},
			about: {
				upsert: {
					create: {
						about: formData.get('about') as string,
					},
					update: {
						about: formData.get('about') as string,
					},
				},
			},
			userLocation: {
				upsert: {
					create: {
						country: formData.get('country') as string,
						province: formData.get('province') as string,
						city: formData.get('city') as string,
					},
					update: {
						country: formData.get('country') as string,
						province: formData.get('province') as string,
						city: formData.get('city') as string,
					},
				},
			},
		},
	});

	// refresh the page
	return json({ message: 'Profile updated successfully' }, { status: 200 });
}

export default function MyAccount() {
	const { user } = useLoaderData<typeof loader>();
	const [selectedProvince, setSelectedProvince] = useState<string>(() => {
		const province = user?.userLocation?.province;
		return province ? province : '';
	});
	const [selectedCity, setSelectedCity] = useState<string>(() => {
		const city = user?.userLocation?.city;
		return city ? city : '';
	});
	// const [isCitySelectActive, setIsCitySelectActive] = useState<boolean>(() => {
	// 	const city = user?.userLocation?.city;
	// 	return city ? true : false;
	// });
	const username = user?.username.username;
	const about = user?.about?.about;
	const country = user?.userLocation?.country;

	console.log(selectedCity);

	function handleProvinceChange(province: string) {
		console.log(province);
		setSelectedProvince(province);
		setSelectedCity('');
	}

	function handleCityChange(city: string) {
		console.log(city);
		setSelectedCity(city);
	}

	return (
		<Form method="POST" encType="multipart/form-data" className="mx-auto max-w-3xl px-6">
			<div className="space-y-12">
				<div className="border-b border-border-tertiary pb-12">
					<h2 className="text-base font-semibold leading-7 text-text-primary">Profile</h2>
					<p className="mt-1 text-sm leading-6 text-text-secondary">
						This information will be displayed publicly so be careful what you share.
					</p>

					<div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
						<div className="sm:col-span-4">
							<label htmlFor="username" className="block text-sm font-medium leading-6 text-text-primary">
								Username
							</label>
							<div className="mt-2">
								<div className="flex rounded-md bg-bg-secondary ring-1 ring-inset ring-border-tertiary focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500">
									<span className="flex select-none items-center pl-3 text-gray-500 sm:text-sm">barfly.com/</span>
									<input
										type="text"
										name="username"
										id="username"
										autoComplete="username"
										className="flex-1 border-0 bg-transparent py-1.5 pl-1 text-text-primary focus:ring-0 sm:text-sm sm:leading-6"
										defaultValue={username || 'johnsmith'}
									/>
								</div>
							</div>
						</div>

						<div className="col-span-full">
							<label htmlFor="about" className="block text-sm font-medium leading-6 text-text-primary">
								About
							</label>
							<div className="mt-2">
								<textarea
									id="about"
									name="about"
									rows={3}
									className="block w-full rounded-md border-0 bg-bg-secondary px-2 py-1.5 text-text-primary shadow-sm ring-1 ring-inset ring-border-tertiary focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
									defaultValue={about || ''}
								/>
							</div>
							<p className="mt-3 text-sm leading-6 text-text-secondary">Write a few sentences about yourself.</p>
						</div>

						<div className="col-span-full">
							<label htmlFor="photo" className="block text-sm font-medium leading-6 text-text-primary">
								Photo
							</label>
							<div className="mt-2 flex items-center gap-x-3">
								<UserCircleIcon className="h-12 w-12 text-bg-alt" aria-hidden="true" />
								<label
									htmlFor="photo-file-upload"
									className="rounded-md bg-bg-alt px-3 py-2 text-sm font-semibold text-text-primary shadow-sm hover:bg-bg-secondary"
								>
									Change
								</label>
								<input
									type="file"
									id="photo-file-upload"
									name="profile-photo"
									className="sr-only hidden"
									accept="image/png, image/jpeg, image/gif"
									size={maxUploadFileSize}
								></input>
								<p className="text-xs leading-5 text-text-secondary">PNG, JPG, GIF up to 3MB</p>
							</div>
						</div>

						<div className="col-span-full">
							<label htmlFor="cover-photo" className="block text-sm font-medium leading-6 text-text-primary">
								Cover photo
							</label>
							<div className="mt-2 flex justify-center rounded-lg border border-dashed border-border-dash px-6 py-10">
								<div className="text-center">
									<PhotoIcon className="mx-auto h-12 w-12 text-bg-alt" aria-hidden="true" />
									<div className="mt-4 flex text-sm leading-6 text-text-secondary">
										<label
											htmlFor="cover-photo-file-upload"
											className="relative cursor-pointer rounded-md bg-none font-semibold text-text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 focus-within:ring-offset-gray-900 hover:text-indigo-500"
										>
											<span>Upload a file</span>
											<input id="cover-photo-file-upload" name="cover-photo" type="file" className="sr-only" />
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
							<label htmlFor="first-name" className="block text-sm font-medium leading-6 text-text-primary">
								First name
							</label>
							<div className="mt-2">
								<input
									type="text"
									name="firstName"
									id="first-name"
									autoComplete="given-name"
									className="block w-full rounded-md border-0 bg-bg-secondary px-2 py-1.5 text-text-primary shadow-sm ring-1 ring-inset ring-border-tertiary focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
									defaultValue={user?.firstName || ''}
								/>
							</div>
						</div>

						<div className="sm:col-span-3">
							<label htmlFor="last-name" className="block text-sm font-medium leading-6 text-text-primary">
								Last name
							</label>
							<div className="mt-2">
								<input
									type="text"
									name="lastName"
									id="last-name"
									autoComplete="family-name"
									className="block w-full rounded-md border-0 bg-bg-secondary px-2 py-1.5 text-text-primary shadow-sm ring-1 ring-inset ring-border-tertiary focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
									defaultValue={user?.lastName || ''}
								/>
							</div>
						</div>

						<div className="sm:col-span-4">
							<label htmlFor="email" className="block text-sm font-medium leading-6 text-text-primary">
								Email address
							</label>
							<div className="mt-2">
								<input
									id="email"
									name="email"
									type="email"
									autoComplete="email"
									className="block w-full rounded-md border-0 bg-bg-secondary px-2 py-1.5 text-text-primary shadow-sm ring-1 ring-inset ring-border-tertiary focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
									defaultValue={user?.email || ''}
								/>
							</div>
						</div>

						<div className="sm:col-span-2 sm:col-start-1">
							<label htmlFor="country-select" className="block text-sm font-medium leading-6 text-text-primary">
								Country
							</label>
							<div className="mt-2">
								<select
									id="country-select"
									name="country"
									autoComplete="country-name"
									className="block w-full rounded-md border-0 bg-bg-secondary px-2 py-1.5 text-text-primary shadow-sm ring-1 ring-inset ring-border-tertiary focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 [&_*]:text-black"
									defaultValue={country || 'Canada'}
									// disabled={true}
								>
									<option value={'Canada'}>Canada</option>
								</select>
							</div>
						</div>

						<div className="sm:col-span-2">
							<label htmlFor="province-select" className="block text-sm font-medium leading-6 text-text-primary">
								Province
							</label>
							<div className="mt-2">
								<select
									id="province-select"
									name="province"
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
							</div>
						</div>

						<div className="sm:col-span-2 sm:col-start-1">
							<label htmlFor="city-select" className="block text-sm font-medium leading-6 text-text-primary">
								City
							</label>
							<div className="mt-2">
								<select
									id="city-select"
									name="city"
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
							</div>
						</div>
					</div>
				</div>

				<div className="border-b border-border-tertiary pb-12">
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
				</div>
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
