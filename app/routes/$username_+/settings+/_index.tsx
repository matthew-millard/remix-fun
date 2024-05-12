import { PhotoIcon } from '@heroicons/react/24/solid';
import { Form, Link, useActionData, useFetcher, useLoaderData } from '@remix-run/react';
import {
	ActionFunctionArgs,
	json,
	LoaderFunctionArgs,
	unstable_parseMultipartFormData as parseMultipartFormData,
	unstable_createMemoryUploadHandler as createMemoryUploadHandler,
	redirect,
	MetaFunction,
} from '@remix-run/node';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';
import { HoneypotInputs } from 'remix-utils/honeypot/react';
import { checkCSRF } from '~/utils/csrf.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { canadaData } from '~/utils/canada-data';
import { useEffect, useState } from 'react';
import { AlertToast, Button, DialogBox, ErrorList, ImageChooser } from '~/components';
import {
	profileInfoSchema,
	ACCEPTED_FILE_TYPES,
	MAX_UPLOAD_SIZE,
	UploadImageSchema,
	UsernameSchema,
	AboutSchema,
} from '~/utils/validation-schemas';
import { parseWithZod } from '@conform-to/zod';
import { getFormProps, getInputProps, getSelectProps, getTextareaProps, useForm } from '@conform-to/react';

import { convertFileToBuffer } from '~/utils/file-utils';
import { findUniqueUser, updateUserProfile } from '~/utils/prisma-user-helpers';
import { requireUser, requireUserId } from '~/utils/auth.server';
import { invariantResponse } from '~/utils/misc';
import { getSession } from '~/utils/session.server';
import { prisma } from '~/utils/db.server';
import { redirectWithToast } from '~/utils/toast.server';
import { z } from 'zod';
import { useIsPending } from '~/hooks/useIsPending';

type ProfileActionArgs = {
	request: Request;
	userId?: string;
	formData: FormData;
};

const signOutOfOtherDevicesActionIntent = 'sign-out-other-devices';
const profileUpdateActionIntent = 'update-profile';
export const coverImageUpdateActionIntent = 'update-cover-image';
const usernameUpdateActionIntent = 'update-username';
const aboutUpdateActionIntent = 'update-about';

export async function action({ request, params }: ActionFunctionArgs) {
	const user = await requireUser(request);

	const uploadHandler = createMemoryUploadHandler({ maxPartSize: MAX_UPLOAD_SIZE });
	const formData = await parseMultipartFormData(request, uploadHandler);

	const userId = user.id;
	invariantResponse(user.username.username === params.username, 'Not authorized', {
		status: 403,
	});
	await checkCSRF(formData, request.headers);
	checkHoneypot(formData);
	const intent = formData.get('intent');

	switch (intent) {
		case usernameUpdateActionIntent: {
			return usernameUpdateAction({ request, userId, formData });
		}

		case aboutUpdateActionIntent: {
			return aboutUpdateAction({ request, userId, formData });
		}

		case profileUpdateActionIntent: {
			return profileUpdateAction({ request, userId, formData });
		}
		case signOutOfOtherDevicesActionIntent: {
			return signOutOfOtherDevicesAction({ request, userId, formData });
		}
		case coverImageUpdateActionIntent: {
			return coverImageUpdateAction({ request, userId, formData });
		}
		default: {
			throw new Response(`Invalid intent "${intent}"`, { status: 400 });
		}
	}
}

async function usernameUpdateAction({ userId, formData }: ProfileActionArgs) {
	const submission = await parseWithZod(formData, {
		async: true,
		schema: z.object({ username: UsernameSchema }).superRefine(async (data, ctx) => {
			const { username } = data;

			// Check if the username is already taken
			if (username) {
				const user = await prisma.user.findFirst({
					where: {
						username: {
							username,
						},
					},
					select: {
						id: true,
						username: true,
					},
				});

				if (user?.id !== userId && user) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: 'Username is already taken',
						path: ['username'],
					});
					return;
				}
			}

			return data;
		}),
	});

	if (submission.status !== 'success') {
		return json(submission.reply(), {
			status: submission.status === 'error' ? 400 : 200,
		});
	}

	const { username } = submission.value;

	const newUsername = await updateUserProfile(userId, {
		username: {
			update: {
				username,
			},
		},
	});

	if (!newUsername) {
		return json(
			submission.reply({
				formErrors: ['Submission failed'],
				resetForm: true,
			}),
		);
	}

	return redirectWithToast(`/${newUsername.username.username}/settings`, {
		title: 'Username updated',
		type: 'success',
		description: `Your username has been updated successfully to ${newUsername.username.username}.`,
	});
}

async function aboutUpdateAction({ userId, formData }: ProfileActionArgs) {
	const submission = await parseWithZod(formData, {
		async: true,
		schema: z.object({ about: AboutSchema }),
	});

	if (submission.status !== 'success') {
		return json(
			submission.reply({
				formErrors: ['Submission failed'],
				fieldErrors: {
					about: ['Invalid'],
				},
			}),
			{
				status: submission.status === 'error' ? 400 : 200,
			},
		);
	}

	// Convert an empty string to null so that it can be stored in the database
	let aboutValue = submission?.value?.about;

	if (aboutValue === undefined || aboutValue.trim() === '') {
		aboutValue = null;
	}

	const { username } = await updateUserProfile(userId, {
		about: {
			upsert: {
				update: {
					about: aboutValue,
				},
				create: {
					about: aboutValue,
				},
			},
		},
	});

	return redirectWithToast(`/${username.username}/settings`, {
		title: 'About updated',
		type: 'success',
		description: 'Your about section has been updated successfully.',
	});
}

async function profileUpdateAction({ userId, formData }: ProfileActionArgs) {
	const submission = await parseWithZod(formData, {
		async: true,
		schema: z.object({ profile: UploadImageSchema }),
	});

	if (submission.status !== 'success') {
		return json(submission.reply({ formErrors: ['Submission failed'] }), {
			status: submission.status === 'error' ? 400 : 200,
		});
	}

	const { profile } = submission.value;
	const profileImage = await convertFileToBuffer(profile as File);

	// Delete the user's current cover image
	const user = await findUniqueUser(userId, { profileImage: true, username: true });

	if (!user) {
		return json(submission.reply({ formErrors: ['User not found'] }), {
			status: 404,
		});
	}

	if (user.profileImage?.id) {
		await prisma.userProfileImage.delete({
			where: {
				id: user.profileImage.id,
			},
		});
	}

	// Update user's cover image
	await updateUserProfile(userId, {
		profileImage: {
			upsert: {
				update: {
					contentType: profile.type,
					blob: profileImage,
				},
				create: {
					contentType: profile.type,
					blob: profileImage,
				},
			},
		},
	});
	return redirectWithToast(`/${user.username.username}/settings`, {
		title: 'Profile image updated',
		type: 'success',
		description: 'Your profile image has been updated successfully.',
	});
}

export async function coverImageUpdateAction({ userId, formData }: ProfileActionArgs) {
	const submission = await parseWithZod(formData, {
		async: true,
		schema: z.object({
			cover: UploadImageSchema,
		}),
	});

	if (submission.status !== 'success') {
		return json(submission.reply({ formErrors: ['Submission failed'] }), {
			status: submission.status === 'error' ? 400 : 200,
		});
	}

	const { cover } = submission.value;
	const coverImage = await convertFileToBuffer(cover as File);

	// Delete the user's current cover image
	const user = await findUniqueUser(userId, { coverImage: true, username: true });

	if (user.coverImage?.id) {
		await prisma.userCoverImage.delete({
			where: {
				id: user.coverImage.id,
			},
		});
	}

	// Update user's cover image
	await updateUserProfile(userId, {
		coverImage: {
			upsert: {
				update: {
					contentType: cover.type,
					blob: coverImage,
				},
				create: {
					contentType: cover.type,
					blob: coverImage,
				},
			},
		},
	});
	return redirectWithToast(`/${user.username.username}/settings`, {
		title: 'Cover image updated',
		type: 'success',
		description: 'Your cover image has been updated successfully.',
	});
}

async function signOutOfOtherDevicesAction({ request, userId }: ProfileActionArgs) {
	const cookieSession = await getSession(request);
	const sessionId = cookieSession.get('sessionId');

	await prisma.session.deleteMany({
		where: {
			userId: userId,
			id: {
				not: sessionId,
			},
		},
	});

	return json({ status: 'success' } as const);
}

export async function loader({ request }: LoaderFunctionArgs) {
	const userId = await requireUserId(request);

	if (!userId) {
		return redirect('/login');
	}

	const user = await findUniqueUser(userId, {
		id: true,
		email: true,
		firstName: true,
		lastName: true,
		profileImage: true,
		coverImage: true,
		createdAt: true,
		updatedAt: true,
		username: true,
		about: true,
		userLocation: true,
		_count: {
			select: {
				sessions: {
					where: {
						expirationDate: {
							gt: new Date(),
						},
					},
				},
			},
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

export default function SettingsRoute() {
	const data = useLoaderData<typeof loader>();

	const aboutFetcher = useFetcher();
	const profileFetcher = useFetcher();
	const coverFetcher = useFetcher();
	const logOutOtherSessionsFetcher = useFetcher();

	const sessionCount = data.user._count.sessions - 1;
	const { user } = data;

	const isUsernamePending = useIsPending({
		formIntent: usernameUpdateActionIntent,
	});

	const [usernameForm, usernameFields] = useForm({
		id: 'username-form',
		lastResult: useActionData(),
		shouldValidate: 'onInput',
		shouldRevalidate: 'onInput',
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: z.object({ username: UsernameSchema }) });
		},
		defaultValue: {
			username: data.user.username.username,
		},
	});

	const [aboutForm, aboutFields] = useForm({
		id: 'about-form',
		defaultValue: {
			about: data.user.about?.about || '',
		},
		lastResult: useActionData(),
		shouldValidate: 'onInput',
		shouldRevalidate: 'onInput',
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: z.object({ about: AboutSchema }) });
		},
	});

	const [profileForm, profileFields] = useForm({
		id: 'profile-form',
		shouldValidate: 'onInput',
		shouldRevalidate: 'onInput',
		lastResult: useActionData(),
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: z.object({ profile: UploadImageSchema }) });
		},
	});

	const [coverForm, coverFields] = useForm({
		id: 'cover-form',
		shouldValidate: 'onInput',
		lastResult: useActionData(),
		shouldRevalidate: 'onInput',
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: z.object({ cover: UploadImageSchema }) });
		},
	});

	const [form, fields] = useForm({
		id: 'personal-info-form',
		shouldValidate: 'onInput',
		lastResult: useActionData(),
		shouldRevalidate: 'onInput',
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: profileInfoSchema });
		},
		defaultValue: {
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

	const [isDialogOpen, setIsDialogOpen] = useState(false);

	const [profileImagePreviewUrl, setProfileImagePreviewUrl] = useState<string | null>(null);
	const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
	const [coverImagePreviewUrl, setCoverImagePreviewUrl] = useState<string | null>(null);

	useEffect(() => {
		if (data.user?.profileImage?.id) {
			setProfileImagePreviewUrl(`/resources/images/${data.user.profileImage.id}/profile`);
		} else {
			setProfileImagePreviewUrl(null); // reset to null if no profile image is availble
		}
	}, [data.user?.profileImage?.id]);

	useEffect(() => {
		if (coverFetcher.state === 'loading') {
			setCoverImagePreviewUrl(null);
		}
	}, [coverFetcher.state]);

	useEffect(() => {
		if (data.user?.coverImage?.id) {
			setCoverImageUrl(`/resources/images/${data.user.coverImage.id}/cover`);
		} else {
			setCoverImageUrl(null); // reset to null if no profile image is availble
		}
	}, [data.user?.coverImage?.id]);

	function handleProvinceChange(province: string) {
		setSelectedProvince(province);
		setSelectedCity('');
	}

	function handleCityChange(city: string) {
		setSelectedCity(city);
	}

	function showDialog(bool: boolean) {
		setIsDialogOpen(bool);
	}

	return (
		<div className="mx-auto max-w-3xl px-6">
			<div>
				<div className="space-y-12">
					<div className="border-b border-border-tertiary pb-4">
						<h2 className="text-base font-semibold leading-7 text-text-primary">Profile</h2>
						<p className="mt-1 text-sm leading-6 text-text-secondary">
							This information will be displayed publicly so be careful what you share.
						</p>

						<div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
							<Form
								{...getFormProps(usernameForm)}
								method="POST"
								encType="multipart/form-data"
								className="sm:col-span-4"
								preventScrollReset={true}
							>
								<AuthenticityTokenInput />
								<HoneypotInputs />
								<label
									htmlFor={usernameFields.username.id}
									className="block text-sm font-medium leading-6 text-text-primary"
								>
									Username
								</label>
								<div className="mt-2 flex  gap-4">
									<div className="flex w-full rounded-md bg-bg-secondary ring-1 ring-inset ring-border-tertiary focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500">
										<span className="flex select-none items-center pl-3 text-gray-500 sm:text-sm">barfly.ca/</span>
										<input
											{...getInputProps(usernameFields.username, { type: 'text' })}
											className="flex-1 border-0 bg-transparent py-1.5 pl-1 text-text-primary focus:ring-0 aria-[invalid]:ring-red-600 sm:text-sm sm:leading-6"
										/>
									</div>
									<Button
										label="Update"
										type="submit"
										name="intent"
										value={usernameUpdateActionIntent}
										isPending={isUsernamePending}
									/>
								</div>
								<div
									className={`transition-height overflow-hidden  py-1 duration-500 ease-in-out ${usernameFields.username.errors ? 'max-h-56' : 'max-h-0'}`}
								>
									<ErrorList errors={usernameFields.username.errors} id={usernameFields.username.errorId} />
								</div>
							</Form>

							<aboutFetcher.Form
								{...getFormProps(aboutForm)}
								method="POST"
								encType="multipart/form-data"
								className="col-span-full"
								preventScrollReset={true}
							>
								<AuthenticityTokenInput />
								<HoneypotInputs />
								<label htmlFor={aboutFields.about.id} className="block text-sm font-medium leading-6 text-text-primary">
									About
								</label>
								<div className="mt-2">
									<textarea
										{...getTextareaProps(aboutFields.about)}
										rows={3}
										className="block w-full rounded-md border-0 bg-bg-secondary px-2 py-1.5 text-text-primary shadow-sm ring-1 ring-inset ring-border-tertiary focus:ring-2 focus:ring-inset focus:ring-indigo-500 aria-[invalid]:ring-red-600 sm:text-sm sm:leading-6"
									/>
									<div
										className={`transition-height overflow-hidden  py-1 duration-500 ease-in-out ${aboutFields.about.errors ? 'max-h-56' : 'max-h-0'}`}
									>
										<ErrorList errors={aboutFields.about.errors} id={aboutFields.about.errorId} />
									</div>
								</div>
								<p className="mt-2 text-sm leading-6 text-text-secondary">Write a few sentences about yourself.</p>
								<div className="flex w-full justify-end">
									<Button
										label="Update"
										type="submit"
										name="intent"
										value={aboutUpdateActionIntent}
										isPending={aboutFetcher.state !== 'idle'}
									/>
								</div>
							</aboutFetcher.Form>
						</div>
					</div>

					<profileFetcher.Form
						{...getFormProps(profileForm)}
						method="POST"
						encType="multipart/form-data"
						className="col-span-full "
					>
						<AuthenticityTokenInput />
						<HoneypotInputs />
						<p className="block text-sm font-medium leading-6 text-text-primary">Photo</p>
						<div className="mt-2 flex items-center gap-x-3">
							{profileImagePreviewUrl ? (
								<img
									src={profileImagePreviewUrl}
									alt="Profile preview"
									className="h-20 w-20 overflow-hidden rounded-full object-cover"
								/>
							) : (
								<ImageChooser imageId={user?.profileImage?.id} />
							)}
							<label
								htmlFor={profileFields.profile.id}
								className="rounded-md bg-bg-alt px-3 py-2 text-sm font-semibold text-text-primary shadow-sm hover:bg-bg-secondary"
							>
								Change
							</label>
							<input
								{...getInputProps(profileFields.profile, { type: 'file' })}
								className="sr-only hidden"
								accept={ACCEPTED_FILE_TYPES}
								size={MAX_UPLOAD_SIZE}
								onChange={e => {
									const file = e.currentTarget.files?.[0];
									if (file) {
										const reader = new FileReader();
										reader.onload = event => {
											setProfileImagePreviewUrl(event.target?.result?.toString() ?? null);
										};
										reader.readAsDataURL(file);
									}
								}}
							/>
							<p className="text-xs leading-5 text-text-secondary">PNG, JPG, GIF up to 3MB</p>
							<div
								className={`transition-height overflow-hidden px-2 py-1 duration-500 ease-in-out ${profileFields.profile.errors ? 'max-h-56' : 'max-h-0'}`}
							>
								<ErrorList errors={profileFields.profile.errors} id={profileFields.profile.errorId} />
							</div>
						</div>
						<div className="mt-2 flex w-full justify-end">
							<Button
								label="Update"
								type="submit"
								name="intent"
								value={profileUpdateActionIntent}
								isPending={profileFetcher.state !== 'idle'}
							/>
						</div>
					</profileFetcher.Form>

					<coverFetcher.Form
						{...getFormProps(coverForm)}
						className="col-span-full"
						method="POST"
						encType="multipart/form-data"
						preventScrollReset={true}
					>
						<AuthenticityTokenInput />
						<HoneypotInputs />

						<label htmlFor="cover-photo" className="block  text-sm font-medium leading-6 text-text-primary">
							Cover photo
						</label>
						<div className="relative mt-2 flex justify-center overflow-hidden rounded-lg border border-dashed border-border-tertiary bg-transparent px-6 py-10">
							{coverImagePreviewUrl ? (
								<img
									src={coverImagePreviewUrl}
									alt={'Cover preview'}
									className="absolute top-0 -z-10 h-full w-full object-cover "
								/>
							) : coverImageUrl ? (
								<img
									src={coverImageUrl}
									alt={'Cover preview'}
									className="absolute top-0 -z-10 h-full w-full object-cover "
								/>
							) : null}

							<div className="text-center ">
								<PhotoIcon className="mx-auto h-12 w-12 text-text-secondary" aria-hidden="true" />
								<div className="mt-4 flex text-sm leading-6 text-gray-600">
									<label
										htmlFor={coverFields.cover.id}
										className="relative cursor-pointer rounded-md px-1 font-semibold text-indigo-600 focus-within:outline-1 focus-within:ring-1 focus-within:ring-indigo-600 focus-within:ring-offset-1 hover:text-indigo-500"
									>
										<span>Upload a file</span>
										<input
											{...getInputProps(coverFields.cover, { type: 'file' })}
											accept={ACCEPTED_FILE_TYPES}
											size={MAX_UPLOAD_SIZE}
											onChange={e => {
												const file = e.currentTarget.files?.[0];
												if (file) {
													const reader = new FileReader();
													reader.onload = event => {
														setCoverImagePreviewUrl(event.target?.result?.toString() ?? null);
													};
													reader.readAsDataURL(file);
												}
											}}
											className="sr-only"
										/>
									</label>
									<p className="pl-1">or drag and drop</p>
								</div>
								<p className="text-xs leading-5 text-text-secondary">PNG, JPG, GIF up to 3MB</p>
							</div>
						</div>
						<div
							className={`transition-height overflow-hidden py-1 duration-500 ease-in-out ${coverFields.cover.errors ? 'max-h-56' : 'max-h-0'}`}
						>
							<ErrorList errors={coverFields.cover.errors} id={coverFields.cover.errorId} />
						</div>
						<div className="mt-2 flex w-full justify-start">
							<Button
								label="Save"
								type="submit"
								name="intent"
								value={coverImageUpdateActionIntent}
								isPending={coverFetcher.state !== 'idle'}
								disabled={!coverImagePreviewUrl || Boolean(coverFields.cover.errors) || coverFetcher.state !== 'idle'}
							/>
						</div>
					</coverFetcher.Form>

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

							<div className="sm:col-span-3">
								<label htmlFor={fields.email.id} className="block text-sm font-medium leading-6 text-text-primary">
									Email address
								</label>

								<div className="mt-2 self-end">
									<input
										{...getInputProps(fields.email, { type: 'email' })}
										disabled
										className=" block w-full cursor-not-allowed rounded-md border-0 bg-bg-secondary px-2 py-1.5 text-gray-500 shadow-sm ring-1 ring-inset ring-border-tertiary focus:ring-2 sm:text-sm sm:leading-6"
									></input>
								</div>
							</div>
							<div className="flex sm:col-span-3">
								<Link
									to={`/${data.user.username.username}/settings/change-email`}
									className="self-end text-text-notify"
								>
									<button
										type="button"
										className="rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
									>
										Change Email
									</button>
								</Link>
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

				<div
					className={`transition-height overflow-hidden px-2 py-1 duration-500 ease-in-out ${form.errors ? 'max-h-56' : 'max-h-0'}`}
				>
					<AlertToast errors={form.errors} id={form.errorId} />
				</div>

				<div className="mt-6 flex items-center justify-end gap-x-6 border-b border-border-tertiary pb-8">
					<button type="button" className="text-sm font-semibold leading-6 text-text-primary">
						Cancel
					</button>
					<button
						type="submit"
						className="rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
						name="intent"
						value={profileUpdateActionIntent}
					>
						Save Changes
					</button>
				</div>
				<HoneypotInputs />
				<AuthenticityTokenInput />
			</div>
			<div className=" flex flex-col justify-around border-b border-border-tertiary  py-8">
				<logOutOtherSessionsFetcher.Form
					method="POST"
					encType="multipart/form-data"
					className=" flex  flex-row  justify-between  gap-x-6 gap-y-6 pb-8"
					preventScrollReset={true}
				>
					<AuthenticityTokenInput />
					<div>
						<h2 className="text-base font-semibold leading-7 text-text-primary">Log Out Other Sessions</h2>
						{sessionCount ? (
							<p className="mt-1 text-sm leading-6 text-text-secondary">
								You are currently logged in on {sessionCount} other {sessionCount === 1 ? 'session' : 'sessions'} across
								all of your devices
							</p>
						) : (
							<p className="mt-1 text-sm leading-6 text-text-secondary">
								You are not logged in on any other sessions across all of your devices.
							</p>
						)}
					</div>
					<button
						type="submit"
						className="flex items-center justify-center self-end rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-red-600"
						disabled={sessionCount === 0}
						name="intent"
						value={signOutOfOtherDevicesActionIntent}
					>
						Log Out Other Sessions
					</button>
				</logOutOtherSessionsFetcher.Form>
				<div className=" flex  flex-row  justify-between  gap-x-6 gap-y-6 pb-8">
					<div>
						<h2 className="text-base font-semibold leading-7 text-text-primary">Password</h2>
						<p className="mt-1 text-sm leading-6 text-text-secondary">
							Update your password associated with your Barfly account
						</p>
					</div>
					<Link to={`/${data.user.username.username}/settings/change-password`} className="self-end text-text-notify">
						<button
							type="button"
							className="rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
						>
							Change Password
						</button>
					</Link>
				</div>
				<div className=" flex  flex-col gap-x-6 gap-y-6   sm:flex-row sm:justify-between">
					<div>
						<h2 className="text-base font-semibold leading-7 text-text-primary">Delete Account</h2>
						<p className="mt-1 text-sm leading-6 text-text-secondary">Permanently delete your Barfly account</p>
					</div>
					<button
						type="button"
						className=" flex max-w-36 items-center  justify-center self-end rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 "
						onClick={() => showDialog(true)}
					>
						Delete Account
					</button>
				</div>
			</div>
			<DialogBox showDialog={showDialog} open={isDialogOpen} />
		</div>
	);
}

export const meta: MetaFunction = () => {
	return [
		{ title: 'Barfly | Settings' },
		{
			name: 'description',
			content: 'Update your account settings, profile information, and more.',
		},
	];
};
