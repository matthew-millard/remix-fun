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
import {
	Button,
	CoverImageUploader,
	DialogBox,
	ErrorList,
	ImageUploader,
	InputField,
	LinkWithPrefetch,
	SrOnlyLabel,
	SubmitButton,
	TextareaInput,
} from '~/components';
import {
	PersonalInfoSchema,
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
import { twoFAVerificationType } from './two-factor-authentication+/_layout';
import { CameraIcon, EnvelopeIcon, IdentificationIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { InputErrors } from '~/components/InputField';
import { DeleteButton } from '~/components/ImageUploader';

type ProfileActionArgs = {
	request: Request;
	userId?: string;
	formData: FormData;
};

const signOutOfOtherDevicesActionIntent = 'sign-out-other-devices';
export const profileUpdateActionIntent = 'update-profile';
export const deleteProfileActionIntent = 'delete-profile';
export const coverImageUpdateActionIntent = 'update-cover-image';
const deleteCoverImageActionIntent = 'delete-cover-image';
const usernameUpdateActionIntent = 'update-username';
const aboutUpdateActionIntent = 'update-about';
const perosnalInfoUpdateActionIntent = 'update-personal-info';

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
		case deleteProfileActionIntent: {
			return deleteProfileUpdateAction({ request, userId, formData });
		}
		case signOutOfOtherDevicesActionIntent: {
			return signOutOfOtherDevicesAction({ request, userId, formData });
		}
		case coverImageUpdateActionIntent: {
			return coverImageUpdateAction({ request, userId, formData });
		}
		case deleteCoverImageActionIntent: {
			return deleteCoverImageUpdateAction({ request, userId, formData });
		}
		case perosnalInfoUpdateActionIntent: {
			return personalInfoUpdateAction({ request, userId, formData });
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

async function deleteProfileUpdateAction({ userId }: ProfileActionArgs) {
	const user = await prisma.$transaction(async prisma => {
		// Delete the user's profile image
		await prisma.userProfileImage.delete({
			where: { userId },
		});

		// Retrieve the user's username
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: { username: true },
		});

		if (!user) {
			throw new Error('User not found');
		}

		return user;
	});

	return redirectWithToast(`/${user.username.username}/settings`, {
		title: 'Profile image deleted',
		type: 'success',
		description: 'Your profile image has been deleted.',
	});
}

export async function deleteCoverImageUpdateAction({ userId }: ProfileActionArgs) {
	const user = await prisma.$transaction(async prisma => {
		// Delete the user's profile image
		await prisma.userCoverImage.delete({
			where: { userId },
		});

		// Retrieve the user's username
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: { username: true },
		});

		if (!user) {
			throw new Error('User not found');
		}

		return user;
	});

	return redirectWithToast(`/${user.username.username}/settings`, {
		title: 'Cover image deleted',
		type: 'success',
		description: 'Your Cover image has been deleted.',
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

async function personalInfoUpdateAction({ userId, formData }: ProfileActionArgs) {
	const submission = parseWithZod(formData, {
		schema: PersonalInfoSchema.transform((data, ctx) => {
			// Check if the province is valid
			const province = data.province;
			const city = data.city;

			if (province && !Object.keys(canadaData).includes(province)) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Invalid province',
					path: ['province'],
				});
			}

			// Check if the city is valid within the given province
			if (province && city && !canadaData[province].includes(city)) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Invalid city for the specified province',
					path: ['city'],
				});
			}

			// Check if the city is valid in any province if no province is specified
			if (!province && city) {
				let cityFound = false;
				for (const prov in canadaData) {
					if (canadaData[prov].includes(city)) {
						cityFound = true;
						break;
					}
				}

				if (!cityFound) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: 'Invalid city',
						path: ['city'],
					});
				}
			}

			return data;
		}),
	});

	if (submission.status !== 'success') {
		return json(submission.reply({ formErrors: ['Submission failed'] }), {
			status: submission.status === 'error' ? 400 : 200,
		});
	}

	const { firstName, lastName, province, city } = submission.value;

	const { username } = await updateUserProfile(userId, {
		firstName,
		lastName,
		userLocation: {
			upsert: {
				update: {
					province,
					city,
					country: 'Canada',
				},
				create: {
					province,
					city,
					country: 'Canada',
				},
			},
		},
	});

	return redirectWithToast(`/${username.username}/settings`, {
		title: 'Personal information updated',
		type: 'success',
		description: 'Your personal information has been updated successfully.',
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

	const verification = await prisma.verification.findUnique({
		where: {
			target_type: {
				target: userId,
				type: twoFAVerificationType,
			},
		},
		select: {
			id: true,
		},
	});

	if (!user) {
		return redirect('/login');
	}

	const data = {
		user,
		is2FAEnabled: Boolean(verification),
	};

	return json(data);
}

export default function SettingsRoute() {
	const data = useLoaderData<typeof loader>();

	const aboutFetcher = useFetcher();

	// const personalInformationFetcher = useFetcher();
	const logOutOtherSessionsFetcher = useFetcher();

	const sessionCount = data.user._count.sessions - 1;
	const { user } = data;

	const isUsernameSubmitting = useIsPending({
		formIntent: usernameUpdateActionIntent,
	});
	const isAboutSubmitting = aboutFetcher.state === 'submitting';

	const isProfileSubmitting = useIsPending({
		formIntent: profileUpdateActionIntent || deleteProfileActionIntent,
	});
	const isCoverSubmitting = useIsPending({
		formIntent: coverImageUpdateActionIntent || deleteCoverImageActionIntent,
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
		lastResult: useActionData(),
		shouldValidate: 'onSubmit',
		shouldRevalidate: 'onInput',
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: z.object({ cover: UploadImageSchema }) });
		},
	});

	const [personalInfoForm, personalInfoFields] = useForm({
		id: 'personal-info-form',
		shouldValidate: 'onInput',
		lastResult: useActionData(),
		shouldRevalidate: 'onInput',
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: PersonalInfoSchema });
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

	const [showPreview, setShowPreview] = useState(false);
	const profileImageId = data.user?.profileImage?.id;
	const [profileImageUrl, setProfileImageUrl] = useState<string | null>(() => {
		return profileImageId ? `/resources/images/${profileImageId}/profile` : null;
	});

	useEffect(() => {
		if (profileImageId) {
			setProfileImageUrl(`/resources/images/${profileImageId}/profile`);
			setShowPreview(false);
		} else {
			setProfileImageUrl(null);
		}
	}, [profileImageId]);

	const [showCoverPreview, setShowCoverPreview] = useState(false);
	const coverImageId = data.user?.coverImage?.id;
	const [coverImageUrl, setCoverImageUrl] = useState<string | null>(() => {
		return coverImageId ? `/resources/images/${coverImageId}/cover` : null;
	});

	useEffect(() => {
		if (coverImageId) {
			setCoverImageUrl(`/resources/images/${coverImageId}/cover`);
			setShowCoverPreview(false);
		} else {
			setCoverImageUrl(null);
		}
	}, [coverImageId]);

	const dialogProps = {
		actionUrl: '/delete-account',
		open: isDialogOpen,
		showDialog,
		title: 'Delete account',
		description: `Are you sure you want to delete your account? All of your data will be permanently removed.
		This action cannot be undone.`,
	};

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

	const commonFormElements = (
		<>
			<AuthenticityTokenInput />
			<HoneypotInputs />
			<ImageUploader
				fieldAttributes={{ ...getInputProps(profileFields.profile, { type: 'file' }) }}
				isSubmitting={isProfileSubmitting}
				htmlFor={profileFields.profile.id}
				showPreview={showPreview}
				setShowPreview={setShowPreview}
				profileImageUrl={profileImageUrl}
			/>
		</>
	);

	const commonCoverFormElements = (
		<>
			<AuthenticityTokenInput />
			<HoneypotInputs />
			<CoverImageUploader
				coverImageUrl={coverImageUrl}
				fieldAttributes={{ ...getInputProps(coverFields.cover, { type: 'file' }) }}
				showCoverPreview={showCoverPreview}
				setShowCoverPreview={setShowCoverPreview}
				htmlFor={coverFields.cover.id}
				isSubmitting={isCoverSubmitting}
			/>
		</>
	);

	return (
		<main className="relative mx-auto mt-8 max-w-[40rem] space-y-16 divide-y divide-border-tertiary">
			{/* Username */}
			<section>
				<Form {...getFormProps(usernameForm)} method="POST" encType="multipart/form-data" preventScrollReset={true}>
					<AuthenticityTokenInput />
					<HoneypotInputs />
					<div>
						<div className="flex items-center text-base font-semibold leading-7 text-text-primary">
							<UserCircleIcon height={32} strokeWidth={1} color="#a9adc1" />
							<h2 className="ml-4">Username</h2>
						</div>
						<p className="mt-3 text-sm leading-6 text-text-secondary">
							Update your username associated with you account.
						</p>
					</div>

					<div className="mt-8">
						<InputField
							fieldAttributes={{ ...getInputProps(usernameFields.username, { type: 'text' }) }}
							label="Username"
							htmlFor={usernameFields.username.id}
							errors={usernameFields.username.errors}
							errorId={usernameFields.username.errorId}
							additionalClasses={{
								backgroundColor: 'bg-bg-secondary',
								textColor: 'text-text-primary',
							}}
						/>
					</div>
					<div className="mt-4 sm:flex sm:items-center sm:space-x-4 sm:space-x-reverse">
						<SubmitButton
							name="intent"
							value={usernameUpdateActionIntent}
							text="Update"
							isSubmitting={isUsernameSubmitting}
							width="w-auto"
						/>
					</div>
				</Form>
			</section>

			{/* About me */}
			<section className="pt-16">
				<aboutFetcher.Form
					{...getFormProps(aboutForm)}
					method="POST"
					encType="multipart/form-data"
					preventScrollReset={true}
				>
					<AuthenticityTokenInput />
					<HoneypotInputs />
					<div>
						<div className="flex items-center text-base font-semibold leading-7 text-text-primary">
							<IdentificationIcon height={32} strokeWidth={1} color="#a9adc1" />
							<h2 className="ml-4">About me</h2>
						</div>
						<p className="mt-3 text-sm leading-6 text-text-secondary">Write a few sentences about yourself.</p>
					</div>
					<div className="mt-3">
						<SrOnlyLabel htmlFor={aboutFields.about.id}>About</SrOnlyLabel>
						<TextareaInput
							fieldAttributes={getTextareaProps(aboutFields.about)}
							rows={5}
							errors={aboutFields.about.errors}
							errorId={aboutFields.about.errorId}
						/>
					</div>
					<div className="mt-6">
						<h3 className="text-sm font-semibold leading-6 text-text-primary">Current About Me</h3>
						<p className="mt-1 text-sm leading-6 text-text-secondary">
							{data?.user?.about?.about || 'No information provided.'}
						</p>
					</div>

					<div className="mt-4 sm:flex sm:items-center sm:space-x-4 sm:space-x-reverse">
						<SubmitButton
							name="intent"
							value={aboutUpdateActionIntent}
							text="Update"
							isSubmitting={isAboutSubmitting}
							width="w-auto"
						/>
					</div>
				</aboutFetcher.Form>
			</section>

			{/* Profile image upload */}
			<section className="pt-16">
				<div>
					<div className="flex items-center text-base font-semibold leading-7 text-text-primary">
						<CameraIcon height={32} strokeWidth={1} color="#a9adc1" />
						<h2 className="ml-4">Profile Image</h2>
					</div>
					<p className="mt-3 text-sm leading-6 text-text-secondary">
						Upload a image of yourself to use as your profile photo.
						<br /> PNG, JPG, GIF up to 3MB
					</p>
				</div>

				{showPreview || !profileImageId ? (
					<Form
						{...getFormProps(profileForm)}
						method="POST"
						encType="multipart/form-data"
						preventScrollReset={true}
						className="mt-6"
					>
						{commonFormElements}
						<div className="relative mt-4 ">
							<SubmitButton
								text="Upload"
								isSubmitting={isProfileSubmitting}
								errors={profileFields.profile.errors}
								name="intent"
								value={profileUpdateActionIntent}
								width="w-auto"
							/>
							<div className="absolute -bottom-6">
								<InputErrors errors={profileFields.profile.errors} errorId={profileFields.profile.errorId} />
							</div>
						</div>
					</Form>
				) : (
					<Form method="POST" encType="multipart/form-data" preventScrollReset={true} className="mt-6">
						{commonFormElements}
						<div className="mt-4">
							<DeleteButton
								text="Remove"
								name="intent"
								value={deleteProfileActionIntent}
								width="w-auto"
								backgroundColor="bg-red-600 hover:bg-red-500"
							/>
						</div>
					</Form>
				)}
			</section>

			{/* Cover photo upload */}
			<section className="pt-16">
				<div>
					<div className="flex items-center text-base font-semibold leading-7 text-text-primary">
						<PhotoIcon height={32} strokeWidth={1} color="#a9adc1" />
						<h2 className="ml-4">Cover Image</h2>
					</div>
					<p className="mt-3 text-sm leading-6 text-text-secondary">PNG, JPG, GIF up to 3MB</p>
				</div>

				{showCoverPreview || !coverImageId ? (
					<Form
						{...getFormProps(coverForm)}
						className="col-span-full"
						method="POST"
						encType="multipart/form-data"
						preventScrollReset={true}
					>
						{commonCoverFormElements}
						<div className="relative mt-4 sm:flex sm:items-center sm:space-x-4 sm:space-x-reverse">
							<SubmitButton
								text={'Upload'}
								name="intent"
								value={coverImageUpdateActionIntent}
								isSubmitting={isCoverSubmitting}
								width="w-auto"
								errors={coverFields.cover.errors}
							/>
							<div className="absolute -bottom-6">
								<InputErrors errors={coverFields.cover.errors} errorId={coverFields.cover.errorId} />
							</div>
						</div>
					</Form>
				) : (
					<Form method="POST" encType="multipart/form-data" preventScrollReset={true} className="mt-6">
						{commonCoverFormElements}
						<div className="mt-4">
							<DeleteButton
								text="Remove"
								name="intent"
								value={deleteCoverImageActionIntent}
								width="w-auto"
								backgroundColor="bg-red-600 hover:bg-red-500"
							/>
						</div>
					</Form>
				)}
			</section>

			{/* Update email */}
			<section className="pt-16">
				<div className="flex items-center text-base font-semibold leading-7 text-text-primary">
					<EnvelopeIcon height={32} strokeWidth={1} color="#a9adc1" />
					<h2 className="ml-4">Email address</h2>
				</div>
				<p className="mt-3 text-sm leading-6 text-text-secondary">
					Your email address is used to log in and receive notifications.
				</p>

				<div className="mt-8">
					<InputField
						fieldAttributes={{ ...getInputProps(personalInfoFields.email, { type: 'email' }) }}
						label="Email"
						htmlFor={personalInfoFields.email.id}
						additionalClasses={{
							backgroundColor: 'bg-bg-secondary',
							textColor: 'text-text-primary',
						}}
						disabled={true}
					/>
				</div>
				<div className="mt-4 sm:flex sm:items-center sm:space-x-4 sm:space-x-reverse">
					<LinkWithPrefetch
						to={`/${user.username.username}/settings/change-email`}
						text="Change email →"
						className="inline-flex items-center rounded-md bg-indigo-400/10 px-3 py-2 text-xs font-medium text-indigo-400 ring-1 ring-inset ring-indigo-400/30"
					/>
				</div>
			</section>

			{/* Personal information */}
			<section className="pt-16">
				<Form
					{...getFormProps(personalInfoForm)}
					method="POST"
					encType="multipart/form-data"
					className="border-b border-border-tertiary pb-12"
				>
					<AuthenticityTokenInput />
					<HoneypotInputs />
					<h2 className="text-base font-semibold leading-7 text-text-primary">Personal Information</h2>
					<p className="mt-1 text-sm leading-6 text-text-secondary">
						Use a permanent address where you can receive mail.
					</p>
					<div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
						<div className="sm:col-span-3">
							<label
								htmlFor={personalInfoFields.firstName.id}
								className="block text-sm font-medium leading-6 text-text-primary"
							>
								First name
							</label>
							<div className="mt-2">
								<input
									{...getInputProps(personalInfoFields.firstName, { type: 'text' })}
									className="block w-full rounded-md border-0 bg-bg-secondary px-2 py-1.5 text-text-primary shadow-sm ring-1 ring-inset ring-border-tertiary focus:ring-2 focus:ring-inset focus:ring-indigo-500 aria-[invalid]:ring-red-600 sm:text-sm sm:leading-6"
								/>
								<div
									className={`transition-height overflow-hidden  py-1 duration-500 ease-in-out ${personalInfoFields.firstName.errors ? 'max-h-56' : 'max-h-0'}`}
								>
									<ErrorList errors={personalInfoFields.firstName.errors} id={personalInfoFields.firstName.errorId} />
								</div>
							</div>
						</div>
						<div className="sm:col-span-3">
							<label
								htmlFor={personalInfoFields.lastName.id}
								className="block text-sm font-medium leading-6 text-text-primary"
							>
								Last name
							</label>
							<div className="mt-2">
								<input
									{...getInputProps(personalInfoFields.lastName, { type: 'text' })}
									className="block w-full rounded-md border-0 bg-bg-secondary px-2 py-1.5 text-text-primary shadow-sm ring-1 ring-inset ring-border-tertiary focus:ring-2 focus:ring-inset focus:ring-indigo-500 aria-[invalid]:ring-red-600 sm:text-sm sm:leading-6"
								/>
								<div
									className={`transition-height overflow-hidden px-2 py-1 duration-500 ease-in-out ${personalInfoFields.lastName.errors ? 'max-h-56' : 'max-h-0'}`}
								>
									<ErrorList errors={personalInfoFields.lastName.errors} id={personalInfoFields.lastName.errorId} />
								</div>
							</div>
						</div>
						<div className="sm:col-span-3">
							<label
								htmlFor={personalInfoFields.email.id}
								className="block text-sm font-medium leading-6 text-text-primary"
							>
								Email address
							</label>
							<div className="mt-2 self-end">
								<input
									{...getInputProps(personalInfoFields.email, { type: 'email' })}
									disabled
									className=" block w-full cursor-not-allowed rounded-md border-0 bg-bg-secondary px-2 py-1.5 text-gray-500 shadow-sm ring-1 ring-inset ring-border-tertiary focus:ring-2 sm:text-sm sm:leading-6"
								></input>
							</div>
						</div>
						<div className="flex sm:col-span-3">
							<Link to={`/${data.user.username.username}/settings/change-email`} className="self-end text-text-notify">
								<button
									type="button"
									className="rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
								>
									Change Email
								</button>
							</Link>
						</div>
						<div className="sm:col-span-2 sm:col-start-1">
							<label
								htmlFor={personalInfoFields.country.id}
								className="block text-sm font-medium leading-6 text-text-primary"
							>
								Country
							</label>
							<div className="mt-2">
								<select
									{...getSelectProps(personalInfoFields.country)}
									className="block w-full rounded-md border-0 bg-bg-secondary px-2 py-1.5 text-text-primary shadow-sm ring-1 ring-inset ring-border-tertiary focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 [&_*]:text-black"
								>
									<option value={'Canada'}>Canada</option>
								</select>
								<div
									className={`transition-height overflow-hidden  py-1 duration-500 ease-in-out ${personalInfoFields.country.errors ? 'max-h-56' : 'max-h-0'}`}
								>
									<ErrorList errors={personalInfoFields.country.errors} id={personalInfoFields.country.errorId} />
								</div>
							</div>
						</div>
						<div className="sm:col-span-2">
							<label
								htmlFor={personalInfoFields.province.id}
								className="block text-sm font-medium leading-6 text-text-primary"
							>
								Province
							</label>
							<div className="mt-2">
								<select
									{...getSelectProps(personalInfoFields.province)}
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
									className={`transition-height overflow-hidden py-1 duration-500 ease-in-out ${personalInfoFields.province.errors ? 'max-h-56' : 'max-h-0'}`}
								>
									<ErrorList errors={personalInfoFields.province.errors} id={personalInfoFields.province.errorId} />
								</div>
							</div>
						</div>
						<div className="sm:col-span-2 sm:col-start-1">
							<label
								htmlFor={personalInfoFields.city.id}
								className="block text-sm font-medium leading-6 text-text-primary"
							>
								City
							</label>
							<div className="mt-2">
								<select
									{...getSelectProps(personalInfoFields.city)}
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
									className={`transition-height overflow-hidden  py-1 duration-500 ease-in-out ${personalInfoFields.city.errors ? 'max-h-56' : 'max-h-0'}`}
								>
									<ErrorList errors={personalInfoFields.city.errors} id={personalInfoFields.city.errorId} />
								</div>
							</div>
						</div>
					</div>
					<div className="mt-6 flex items-center justify-end gap-x-6">
						<button type="button" className="text-sm font-semibold leading-6 text-text-primary">
							Cancel
						</button>
						<Button type="submit" name="intent" label="Save Changes" value={perosnalInfoUpdateActionIntent} />
					</div>
				</Form>
			</section>

			<section className="pt-16">
				<div className=" flex flex-col py-8">
					{data.is2FAEnabled ? (
						<div className=" flex flex-col gap-x-6 gap-y-2 pb-6 sm:flex-row sm:justify-between">
							<div>
								<h2 className="text-base font-semibold leading-7 text-text-primary">Two-Factor Authentication</h2>
								<p className="mt-1 text-sm leading-6 text-text-secondary">
									Disabling two-factor authentication will make your account less secure.
								</p>
							</div>
							<Link
								to={`/${data.user.username.username}/settings/two-factor-authentication`}
								className=" flex self-end"
							>
								<button
									type="submit"
									className="flex flex-shrink-0 items-center justify-center self-end rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
								>
									Disable 2FA
								</button>
							</Link>
						</div>
					) : (
						<div className=" flex  flex-col gap-x-6 gap-y-2 pb-6 sm:flex-row sm:justify-between">
							<div>
								<h2 className="text-base font-semibold leading-7 text-text-primary">Two-Factor Authentication</h2>
								<p className="mt-1 text-sm leading-6 text-text-secondary">
									Add additional security to your account using two-factor authentication
								</p>
							</div>
							<Link
								to={`/${data.user.username.username}/settings/two-factor-authentication`}
								className=" flex self-end"
							>
								<button
									type="submit"
									className=" flex flex-shrink-0 items-center justify-center self-end rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
								>
									Enable Two-Factor Authentication
								</button>
							</Link>
						</div>
					)}
					<logOutOtherSessionsFetcher.Form
						method="POST"
						encType="multipart/form-data"
						className="flex flex-col gap-x-6 gap-y-2 pb-6 sm:flex-row sm:justify-between"
						preventScrollReset={true}
					>
						<AuthenticityTokenInput />
						<div>
							<h2 className="text-base font-semibold leading-7 text-text-primary">Log Out Other Sessions</h2>
							{sessionCount ? (
								<p className="mt-1 text-sm leading-6 text-text-secondary">
									You are currently logged in on {sessionCount} other {sessionCount === 1 ? 'session' : 'sessions'}{' '}
									across all of your devices
								</p>
							) : (
								<p className="mt-1 text-sm leading-6 text-text-secondary">
									You are not logged in on any other sessions across all of your devices.
								</p>
							)}
						</div>
						<button
							type="submit"
							className="flex flex-shrink-0 items-center justify-center self-end rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-red-600"
							disabled={sessionCount === 0}
							name="intent"
							value={signOutOfOtherDevicesActionIntent}
						>
							Log Out Other Sessions
						</button>
					</logOutOtherSessionsFetcher.Form>
					<div className="flex flex-col gap-x-6 gap-y-2 pb-6 sm:flex-row sm:justify-between">
						<div>
							<h2 className="text-base font-semibold leading-7 text-text-primary">Password</h2>
							<p className="mt-1 text-sm leading-6 text-text-secondary">
								Update your password associated with your Barfly account
							</p>
						</div>
						<Link to={`/${data.user.username.username}/settings/change-password`} className="self-end">
							<button
								type="button"
								className="flex flex-shrink-0 items-center justify-center self-end rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
							>
								Change Password
							</button>
						</Link>
					</div>
					<div className=" flex  flex-col gap-x-6 gap-y-2 sm:flex-row sm:justify-between">
						<div>
							<h2 className="text-base font-semibold leading-7 text-text-primary">Delete Account</h2>
							<p className="mt-1 text-sm leading-6 text-text-secondary">Permanently delete your Barfly account</p>
						</div>
						<button
							type="button"
							className="flex flex-shrink-0 items-center justify-center self-end rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 "
							onClick={() => showDialog(true)}
						>
							Delete Account
						</button>
					</div>
				</div>
			</section>
			<DialogBox {...dialogProps} />
		</main>
	);
}

export const meta: MetaFunction = () => {
	return [
		{ title: 'Settings | Barfly ' },
		{
			name: 'description',
			content: 'Update your account settings, profile information, and more.',
		},
	];
};
