import { Form, useActionData, useFetcher, useLoaderData } from '@remix-run/react';
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
import { checkCSRF } from '~/utils/csrf.server';
import { canadaData } from '~/utils/canada-data';
import { useEffect, useRef, useState } from 'react';
import {
	CoverImageUploader,
	DialogBox,
	ImageUploader,
	InputField,
	InputSelectField,
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
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { getFormProps, getInputProps, getSelectProps, getTextareaProps, useForm } from '@conform-to/react';

import { convertFileToBuffer } from '~/utils/file-utils';
import { findUniqueUser, updateUserProfile } from '~/utils/prisma-user-helpers';
import { bcrypt, getPasswordHash, requireUser, requireUserId, verifyUserPassword } from '~/utils/auth.server';
import { invariantResponse } from '~/utils/misc';
import { getSession } from '~/utils/session.server';
import { prisma } from '~/utils/db.server';
import { redirectWithToast } from '~/utils/toast.server';
import { z } from 'zod';
import { useIsPending } from '~/hooks/useIsPending';
import { twoFAVerificationType } from './two-factor-authentication+/_layout';
import {
	CameraIcon,
	EnvelopeIcon,
	IdentificationIcon,
	InformationCircleIcon,
	ShieldCheckIcon,
	UserCircleIcon,
	PhotoIcon,
	ArrowRightEndOnRectangleIcon,
	LockClosedIcon,
	XCircleIcon,
} from '@heroicons/react/24/outline';
import { InputErrors } from '~/components/InputField';
import { DeleteButton } from '~/components/ImageUploader';
import { changePasswordSchema } from './change-password';

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
const changePasswordActionIntent = 'change-password';

export async function action({ request, params }: ActionFunctionArgs) {
	const user = await requireUser(request);

	const uploadHandler = createMemoryUploadHandler({ maxPartSize: MAX_UPLOAD_SIZE });
	const formData = await parseMultipartFormData(request, uploadHandler);

	const userId = user.id;
	invariantResponse(user.username.username === params.username, 'Not authorized', {
		status: 403,
	});
	await checkCSRF(formData, request.headers);
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
		case changePasswordActionIntent: {
			return changePasswordAction({ request, userId, formData });
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

async function signOutOfOtherDevicesAction({ request, userId, formData }: ProfileActionArgs) {
	const submission = await parseWithZod(formData, {
		async: true,
		schema: z
			.object({
				password: z.string(),
			})
			.transform(async (data, ctx) => {
				// get the user's password for database
				const user = await prisma.user.findUnique({
					where: {
						id: userId,
					},
					select: {
						password: {
							select: {
								hash: true,
							},
						},
					},
				});

				// check if the password is correct
				const isValidPassword = await bcrypt.compare(data.password, user.password.hash);

				if (!isValidPassword) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: 'Incorrect password',
						path: ['password'],
					});
					return z.NEVER;
				}

				return data;
			}),
	});

	// If the submission is not successful, return the submission without the password
	if (submission.status !== 'success') {
		return json(submission.reply({ hideFields: ['password'] }), {
			status: submission.status === 'error' ? 400 : 200,
		});
	}

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

	return json(submission.reply({ resetForm: true, hideFields: ['password'] }));
}

async function changePasswordAction({ userId, formData }: ProfileActionArgs) {
	const submission = await parseWithZod(formData, {
		async: true,
		schema: changePasswordSchema.superRefine(async ({ currentPassword, newPassword }, ctx) => {
			if (currentPassword && newPassword) {
				const user = await verifyUserPassword({ id: userId }, currentPassword);
				if (!user) {
					ctx.addIssue({
						path: ['currentPassword'],
						code: 'custom',
						message: 'Incorrect password.',
					});
				}
			}
		}),
	});

	// clear the payload so we don't send the password back to the client
	submission.payload = {};

	if (submission.status !== 'success') {
		return json(submission.reply({ formErrors: ['Submission failded'] }), {
			status: submission.status === 'error' ? 400 : 200,
		});
	}

	const { newPassword } = submission.value;

	const user = await prisma.user.update({
		select: { username: true },
		where: { id: userId },
		data: {
			password: {
				update: {
					hash: await getPasswordHash(newPassword),
				},
			},
		},
	});

	// return json(submission.reply({ resetForm: true }));

	return redirectWithToast(`/${user.username.username}/settings`, {
		title: 'Password Changed',
		type: 'success',
		description: 'Your password has been successfully changed.',
	});
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
	const lastResult = useActionData();
	const { user } = data;

	const aboutFetcher = useFetcher();

	const isLogOutOtherSessionsSubmitting = useIsPending({
		formIntent: signOutOfOtherDevicesActionIntent,
		state: 'submitting',
	});

	const sessionCount = data.user._count.sessions - 1;

	const isUsernameSubmitting = useIsPending({
		formIntent: usernameUpdateActionIntent,
		state: 'submitting',
	});
	const isPersonalInfoSubmitting = useIsPending({
		formIntent: perosnalInfoUpdateActionIntent,
		state: 'submitting',
	});
	const isAboutSubmitting = aboutFetcher.state === 'submitting';

	const isProfileSubmitting = useIsPending({
		formIntent: profileUpdateActionIntent || deleteProfileActionIntent,
		state: 'submitting',
	});
	const isCoverSubmitting = useIsPending({
		formIntent: coverImageUpdateActionIntent || deleteCoverImageActionIntent,
		state: 'submitting',
	});

	const isChangePasswordSubmitting = useIsPending({
		formIntent: changePasswordActionIntent,
	});

	const [usernameForm, usernameFields] = useForm({
		id: 'username-form',
		lastResult,
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
		lastResult,
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
		lastResult,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: z.object({ profile: UploadImageSchema }) });
		},
	});

	const [coverForm, coverFields] = useForm({
		id: 'cover-form',
		lastResult,
		shouldValidate: 'onSubmit',
		shouldRevalidate: 'onInput',
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: z.object({ cover: UploadImageSchema }) });
		},
	});

	const [personalInfoForm, personalInfoFields] = useForm({
		id: 'personal-info-form',
		shouldValidate: 'onInput',
		lastResult,
		shouldRevalidate: 'onInput',
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: PersonalInfoSchema });
		},
		defaultValue: {
			firstName: data.user?.firstName,
			lastName: data.user?.lastName,
		},
	});

	const [loggingOutOtherSessionsForm, loggingOutOtherSessionsFields] = useForm({
		id: 'log-out-other-sessions-form',
		lastResult,
		shouldValidate: 'onSubmit',
		shouldRevalidate: 'onInput',
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: z.object({ password: z.string() }) });
		},
		defaultValue: {
			password: '',
		},
	});

	const [changePasswordform, changePasswordfields] = useForm({
		id: 'change-password-form',
		shouldValidate: 'onSubmit',
		shouldRevalidate: 'onInput',
		constraint: getZodConstraint(changePasswordSchema),
		lastResult,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: changePasswordSchema });
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

	const changePasswordFormRef = useRef<HTMLFormElement>(null);
	useEffect(() => {
		if (isChangePasswordSubmitting) {
			changePasswordFormRef.current?.reset();
		}
	}, [isChangePasswordSubmitting]);

	return (
		<main className="relative mx-auto mt-8 max-w-[40rem] space-y-16 divide-y divide-border-tertiary">
			{/* Username */}
			<section>
				<Form {...getFormProps(usernameForm)} method="POST" encType="multipart/form-data" preventScrollReset={true}>
					<AuthenticityTokenInput />

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
							stateText="Updating..."
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
							stateText="Updating..."
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
								stateText="Updating..."
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
								stateText="Updating..."
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
								stateText="Deleting..."
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
					Your email address that is used to log in and receive notifications.
				</p>

				<div className="mt-8">
					<InputField
						fieldAttributes={{ id: 'email-address', type: 'email', value: data?.user?.email, readOnly: true }}
						label="Current email"
						htmlFor="email-address"
						additionalClasses={{
							backgroundColor: 'bg-bg-secondary',
							textColor: 'text-text-primary',
						}}
						disabled
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
				<div>
					<div className="flex items-center text-base font-semibold leading-7 text-text-primary">
						<InformationCircleIcon height={32} strokeWidth={1} color="#a9adc1" />
						<h2 className="ml-4">Personal Information</h2>
					</div>
					<p className="mt-3 text-sm leading-6 text-text-secondary">
						Your personal information will be shared with other users on the platform.
					</p>
				</div>
				<Form {...getFormProps(personalInfoForm)} method="POST" encType="multipart/form-data" preventScrollReset={true}>
					<AuthenticityTokenInput />

					<div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
						<div className="sm:col-span-3">
							<InputField
								fieldAttributes={{ ...getInputProps(personalInfoFields.firstName, { type: 'text' }) }}
								label="First name"
								htmlFor={personalInfoFields.firstName.id}
								errors={personalInfoFields.firstName.errors}
								errorId={personalInfoFields.firstName.errorId}
								additionalClasses={{
									backgroundColor: 'bg-bg-secondary',
									textColor: 'text-text-primary',
								}}
							/>
						</div>
						<div className="sm:col-span-3">
							<InputField
								fieldAttributes={{ ...getInputProps(personalInfoFields.lastName, { type: 'text' }) }}
								label="Last name"
								htmlFor={personalInfoFields.lastName.id}
								errors={personalInfoFields.lastName.errors}
								errorId={personalInfoFields.lastName.errorId}
								additionalClasses={{
									backgroundColor: 'bg-bg-secondary',
									textColor: 'text-text-primary',
								}}
							/>
						</div>

						<div className="sm:col-span-2 sm:col-start-1">
							<InputSelectField
								fieldAttributes={{ ...getSelectProps(personalInfoFields.country) }}
								defaultValue="Canada"
								defaultOption={<option value="Canada">Canada</option>}
								label="Country"
								htmlFor={personalInfoFields.country.id}
								errors={personalInfoFields.country.errors}
								errorId={personalInfoFields.country.errorId}
							/>
						</div>
						<div className="sm:col-span-2">
							<InputSelectField
								fieldAttributes={{ ...getSelectProps(personalInfoFields.province) }}
								value={selectedProvince}
								defaultOption={<option value="">-- Select Province --</option>}
								options={Object.keys(canadaData).map(province => ({
									value: province,
									label: province.replace(/([A-Z])/g, ' $1').trim(),
								}))}
								label="Province"
								htmlFor={personalInfoFields.province.id}
								errors={personalInfoFields.province.errors}
								errorId={personalInfoFields.province.errorId}
								onChange={e => handleProvinceChange(e.target.value)}
							/>
						</div>
						<div className="sm:col-span-2 sm:col-start-1">
							<InputSelectField
								fieldAttributes={{ ...getSelectProps(personalInfoFields.city) }}
								value={selectedCity}
								defaultOption={<option value="">-- Select City --</option>}
								options={
									selectedProvince
										? canadaData[selectedProvince as keyof typeof canadaData].map(city => ({
												value: city,
												label: city,
											}))
										: []
								}
								label="City"
								htmlFor={personalInfoFields.city.id}
								errors={personalInfoFields.city.errors}
								errorId={personalInfoFields.city.errorId}
								onChange={e => handleCityChange(e.target.value)}
							/>
						</div>
					</div>
					<div className="relative mt-4 sm:flex sm:items-center sm:space-x-4 sm:space-x-reverse">
						<SubmitButton
							text={'Update'}
							name="intent"
							value={perosnalInfoUpdateActionIntent}
							isSubmitting={isPersonalInfoSubmitting}
							width="w-auto"
							stateText="Updating..."
						/>
					</div>
				</Form>
			</section>

			{/* Two-factor authentication */}
			<section className="pt-16">
				<div className="flex items-center text-base font-semibold leading-7 text-text-primary">
					<ShieldCheckIcon height={32} strokeWidth={1} color="#a9adc1" />
					<h2 className="ml-4">Two-Factor Authentication</h2>
				</div>
				<p className="mt-3 text-sm leading-6 text-text-secondary">
					{data.is2FAEnabled
						? 'Disabling two-factor authentication will make your account less secure.'
						: 'Add additional security to your account using two-factor authentication.'}
				</p>
				<div className="mt-8 sm:flex sm:items-center sm:space-x-4 sm:space-x-reverse">
					<LinkWithPrefetch
						to={`/${data.user.username.username}/settings/two-factor-authentication`}
						text={data.is2FAEnabled ? 'Disable 2FA →' : 'Enable 2FA →'}
						className="inline-flex items-center rounded-md bg-indigo-400/10 px-3 py-2 text-xs font-medium text-indigo-400 ring-1 ring-inset ring-indigo-400/30"
					/>
				</div>
			</section>

			{/* Log out other sessions */}
			<section className="pt-16">
				<div className="flex items-center text-base font-semibold leading-7 text-text-primary">
					<ArrowRightEndOnRectangleIcon height={32} strokeWidth={1} color="#a9adc1" />
					<h2 className="ml-4">Log Out Other Sessions</h2>
				</div>
				<p className="mt-3 text-sm leading-6 text-text-secondary">
					{sessionCount
						? `You are currently logged in on ${sessionCount} other ${sessionCount === 1 ? 'session' : 'sessions'} across all of your devices`
						: 'You are not logged in on any other sessions across all of your devices.'}
				</p>
				<Form
					method="POST"
					encType="multipart/form-data"
					preventScrollReset={true}
					{...getFormProps(loggingOutOtherSessionsForm)}
				>
					<AuthenticityTokenInput />
					<div className="mt-8">
						<InputField
							fieldAttributes={{ ...getInputProps(loggingOutOtherSessionsFields.password, { type: 'password' }) }}
							label="Your password"
							htmlFor={loggingOutOtherSessionsFields.password.id}
							errors={loggingOutOtherSessionsFields.password.errors}
							errorId={loggingOutOtherSessionsFields.password.errorId}
							additionalClasses={{
								backgroundColor: 'bg-bg-secondary',
								textColor: 'text-text-primary',
							}}
						/>
					</div>
					<div className="relative mt-4 sm:flex sm:items-center sm:space-x-4 sm:space-x-reverse">
						<SubmitButton
							text={'Log out other sessions'}
							name="intent"
							value={signOutOfOtherDevicesActionIntent}
							isSubmitting={isLogOutOtherSessionsSubmitting}
							disabled={sessionCount === 0}
							backgroundColor="bg-red-600 hover:bg-red-500"
							width="w-auto"
							stateText="Logging out other sessions..."
						/>
					</div>
				</Form>
			</section>

			{/* Change password */}
			<section className="pt-16">
				<div className="flex items-center text-base font-semibold leading-7 text-text-primary">
					<LockClosedIcon height={32} strokeWidth={1} color="#a9adc1" />
					<h2 className="ml-4">Password</h2>
				</div>
				<p className="mt-3 text-sm leading-6 text-text-secondary">Update your password associated with your account.</p>
				<Form
					ref={changePasswordFormRef}
					{...getFormProps(changePasswordform)}
					method="POST"
					encType="multipart/form-data"
					preventScrollReset
					className="mt-8 grid grid-cols-1 gap-y-8"
				>
					<AuthenticityTokenInput />

					<InputField
						fieldAttributes={{ ...getInputProps(changePasswordfields.currentPassword, { type: 'password' }) }}
						htmlFor={changePasswordfields.currentPassword.id}
						errors={changePasswordfields.currentPassword.errors}
						errorId={changePasswordfields.currentPassword.errorId}
						label="Current password"
						additionalClasses={{
							backgroundColor: 'bg-bg-secondary',
							textColor: 'text-text-primary',
						}}
					/>
					<InputField
						fieldAttributes={{ ...getInputProps(changePasswordfields.newPassword, { type: 'password' }) }}
						htmlFor={changePasswordfields.newPassword.id}
						errors={changePasswordfields.newPassword.errors}
						errorId={changePasswordfields.newPassword.errorId}
						label="New password"
						additionalClasses={{
							backgroundColor: 'bg-bg-secondary',
							textColor: 'text-text-primary',
						}}
					/>
					<InputField
						fieldAttributes={{ ...getInputProps(changePasswordfields.confirmNewPassword, { type: 'password' }) }}
						htmlFor={changePasswordfields.confirmNewPassword.id}
						errors={changePasswordfields.confirmNewPassword.errors}
						errorId={changePasswordfields.confirmNewPassword.errorId}
						label="Confirm new password"
						additionalClasses={{
							backgroundColor: 'bg-bg-secondary',
							textColor: 'text-text-primary',
						}}
					/>

					<div className="relative mt-4 sm:flex sm:items-center sm:space-x-4 sm:space-x-reverse">
						<SubmitButton
							text={'Change Password'}
							isSubmitting={isChangePasswordSubmitting}
							name="intent"
							value={changePasswordActionIntent}
							width="w-auto"
							stateText="Updating..."
						/>
					</div>
				</Form>
			</section>

			{/* Delete account */}
			<section className="py-16">
				<div className="flex items-center text-base font-semibold leading-7 text-text-primary">
					<XCircleIcon height={32} strokeWidth={1} color="rgb(239 68 68)" />
					<h2 className="ml-4 text-red-500">Delete Account</h2>
				</div>
				<p className="mt-3 text-sm leading-6 text-text-secondary">
					Once you delete your account, there is no going back. Please be certain.
				</p>
				<div className="relative mt-8 sm:flex sm:items-center sm:space-x-4 sm:space-x-reverse">
					<button
						type="button"
						className="inline-flex items-center rounded-md bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-600 ring-1 ring-inset ring-red-500/30 hover:text-red-500"
						onClick={() => showDialog(true)}
					>
						Delete Account
					</button>
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
