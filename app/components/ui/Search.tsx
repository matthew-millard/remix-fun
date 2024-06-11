import {
	Combobox,
	ComboboxInput,
	ComboboxOption,
	ComboboxOptions,
	Dialog,
	DialogPanel,
	Label,
	Transition,
	TransitionChild,
} from '@headlessui/react';
import { ChevronRightIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { UsersIcon } from '@heroicons/react/24/outline';
import { Link, useFetcher, useNavigate, useSearchParams } from '@remix-run/react';
import { useEffect, useId, useState } from 'react';
import { useDebounce } from '~/hooks/useDebounce';
import Spinner from '../Spinner';
import { ActionData } from '~/root';

function classNames(...classes: string[]) {
	return classes.filter(Boolean).join(' ');
}

export interface User {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	username: string;
	profileImageId: string | null;
	userLocation: string;
	createdAt: Date;
}

interface SearchProps {
	isOpen: boolean;
	closeSearch: () => void;
	status?: 'idle' | 'loading' | 'success' | 'error';
	autoFocus?: boolean;
	autoSubmit?: boolean;
}

export default function Search({ isOpen, closeSearch, status, autoFocus = false, autoSubmit = false }: SearchProps) {
	const navigate = useNavigate();
	const fetcher = useFetcher<ActionData>();
	const data = fetcher.data;
	const searchResults = data?.searchResults || { filteredUsers: [] };
	const filteredUsers = searchResults.filteredUsers;

	const isPending = fetcher.state !== 'idle';

	const [query, setQuery] = useState('');
	const [searchParams] = useSearchParams();
	const id = useId();

	const handleFormChange = useDebounce((form: HTMLFormElement) => {
		const formData = new FormData(form);
		fetcher.submit(formData, { method: 'POST', action: '/' });
	}, 400);

	const [profileImageUrls, setProfileImageUrls] = useState<Record<string, string | null>>({});

	useEffect(() => {
		if (filteredUsers.length > 0) {
			const urls: Record<string, string | null> = {};
			filteredUsers.forEach(user => {
				if (user.profileImageId) {
					urls[user.id] = `/resources/images/${user.profileImageId}/profile`;
				} else {
					urls[user.id] = null;
				}
			});
			setProfileImageUrls(urls);
		}
	}, [filteredUsers]);

	return (
		<Transition show={isOpen} afterLeave={() => setQuery('')} appear>
			<Dialog className="relative z-10" onClose={closeSearch}>
				<TransitionChild
					enter="ease-out duration-300"
					enterFrom="opacity-0"
					enterTo="opacity-100"
					leave="ease-in duration-200"
					leaveFrom="opacity-100"
					leaveTo="opacity-0"
				>
					<div className="fixed inset-0 bg-slate-900 bg-opacity-50 backdrop-blur-sm" />
				</TransitionChild>

				<fetcher.Form
					method="POST"
					className="fixed inset-0 z-10 w-screen overflow-y-auto p-4 sm:p-6 md:p-20"
					onChange={e => autoSubmit && handleFormChange(e.currentTarget)}
				>
					<TransitionChild
						enter="ease-out duration-300"
						enterFrom="opacity-0 scale-95"
						enterTo="opacity-100 scale-100"
						leave="ease-in duration-200"
						leaveFrom="opacity-100 scale-100"
						leaveTo="opacity-0 scale-95"
					>
						<DialogPanel className="mx-auto max-w-3xl transform divide-y divide-border-tertiary overflow-hidden rounded-md bg-bg-secondary shadow-2xl ring-1 ring-inset ring-border-tertiary transition-all  ">
							<Combobox<User>
								onChange={(user: User) => {
									navigate(`/${user.username}/profile`);
									closeSearch();
								}}
								onClose={() => setQuery('')}
							>
								{({ activeOption }) => (
									<>
										<div className="relative">
											{isPending ? (
												<div className="pointer-events-none absolute left-4 top-3.5 h-5 w-5">
													<Spinner />
												</div>
											) : (
												<MagnifyingGlassIcon
													className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-gray-400"
													aria-hidden="true"
												/>
											)}
											<Label htmlFor={id} className="sr-only"></Label>
											<ComboboxInput
												type="search"
												name="query"
												id={id}
												defaultValue={searchParams.get('query') ?? ''}
												// eslint-disable-next-line jsx-a11y/no-autofocus
												autoFocus={autoFocus}
												className=" h-12 w-full rounded-t-md border-0  bg-transparent pl-11 pr-4 text-text-primary placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 focus:ring-offset-0 sm:text-sm"
												placeholder="Barflies, bars, cocktails..."
												onChange={event => setQuery(event.target.value)}
												onBlur={() => setQuery('')}
											/>
										</div>

										{filteredUsers.length > 0 && (
											<ComboboxOptions
												as="div"
												static
												hold
												className="flex transform-gpu divide-x divide-border-tertiary"
											>
												<div
													className={classNames(
														'max-h-96 min-w-0 flex-auto scroll-py-4 overflow-y-auto px-6 py-4',
														activeOption && 'sm:h-96',
													)}
												>
													<h2 className="mb-4 mt-2 text-xs font-semibold text-text-secondary">Recent searches</h2>

													<div className="-mx-2 text-sm text-text-secondary">
														{filteredUsers.map(user => (
															<ComboboxOption
																as="div"
																key={user.id}
																value={user}
																className={({ focus }) =>
																	classNames(
																		'flex cursor-default select-none items-center rounded-md p-2',
																		focus && 'bg-bg-alt text-text-primary',
																	)
																}
															>
																{({ focus }) => (
																	<>
																		<span className="flex h-8 w-8 overflow-hidden rounded-full bg-gray-200">
																			{profileImageUrls[user.id] ? (
																				<img
																					src={profileImageUrls[user.id]}
																					alt="Profile"
																					className="h-full w-full object-cover"
																				/>
																			) : (
																				<UsersIcon className="h-full w-full text-gray-400" aria-hidden="true" />
																			)}
																		</span>
																		<span className="ml-3 flex-auto truncate">{`${user.firstName} ${user.lastName}`}</span>
																		{focus && (
																			<ChevronRightIcon
																				className="ml-3 h-5 w-5 flex-none text-gray-400"
																				aria-hidden="true"
																			/>
																		)}
																	</>
																)}
															</ComboboxOption>
														))}
													</div>
												</div>

												{activeOption && (
													<div className="hidden h-96 w-1/2 flex-none flex-col divide-y divide-border-tertiary overflow-y-auto sm:flex">
														<div className="flex flex-col items-center p-6 text-center">
															<span className="flex h-20 w-20 overflow-hidden rounded-full bg-gray-200 ">
																{profileImageUrls[activeOption.id] ? (
																	<img
																		src={profileImageUrls[activeOption.id]}
																		alt="Profile"
																		className="h-full w-full object-cover"
																	/>
																) : (
																	<UsersIcon className="h-full w-full text-gray-400" aria-hidden="true" />
																)}
															</span>
															<h2 className="mt-3 font-semibold text-text-primary">
																{activeOption.firstName} {activeOption.lastName}
															</h2>
															<p className="text-sm leading-6 text-gray-500">{activeOption.username}</p>
														</div>
														<div className="flex flex-auto flex-col justify-between p-6">
															<dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm text-text-secondary">
																<dt className="col-end-1 font-semibold text-text-primary">Location</dt>
																<dd>{activeOption.userLocation}</dd>
																<dt className="col-end-1 font-semibold text-text-primary">Member since</dt>

																<dd>
																	{new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long' }).format(
																		new Date(activeOption.createdAt),
																	)}
																</dd>
															</dl>
															<Link
																to={`/${activeOption.username}/profile`}
																onClick={closeSearch}
																className="mt-6 flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
															>
																View profile
															</Link>
														</div>
													</div>
												)}
											</ComboboxOptions>
										)}

										{query !== '' && filteredUsers.length === 0 && (
											<div className="px-6 py-14 text-center text-sm sm:px-14">
												<UsersIcon className="mx-auto h-6 w-6 text-gray-400" aria-hidden="true" />
												<p className="mt-4 font-semibold text-text-primary">No people found</p>
												<p className="mt-2 text-gray-500">
													We couldn’t find anything with that term. Please try again.
												</p>
											</div>
										)}
									</>
								)}
							</Combobox>
						</DialogPanel>
					</TransitionChild>
				</fetcher.Form>
			</Dialog>
		</Transition>
	);
}
