import {
	Combobox,
	ComboboxInput,
	ComboboxOption,
	ComboboxOptions,
	Dialog,
	DialogPanel,
	Transition,
	TransitionChild,
} from '@headlessui/react';
import { ChevronRightIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { UsersIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

function classNames(...classes: string[]) {
	return classes.filter(Boolean).join(' ');
}

interface Person {
	id: string;
	name: string;
	phone: string;
	email: string;
	role: string;
	url: string;
	profileUrl: string;
	imageUrl: string;
}

const people: Person[] = [
	{
		id: '1',
		name: 'Finn Crooks',
		phone: '1-613-223-9371',
		email: 'finncrooks@barfly.ca',
		role: 'Co-Founder / CEO',
		url: 'https://barfly.ca/finncrooks',
		profileUrl: '#',
		imageUrl:
			'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
	},
	{
		id: '2',
		name: 'Hamish Millard',
		phone: '1-493-747-9031',
		email: 'lesliealexander@example.com',
		role: 'Co-Founder / CEO',
		url: 'https://example.com',
		profileUrl: '#',
		imageUrl:
			'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
	},
];

const recent: Person[] = [people[0], people[1]];

interface SearchProps {
	isOpen: boolean;
	closeSearch: () => void;
}

export default function Search({ isOpen, closeSearch }: SearchProps) {
	const [query, setQuery] = useState('');

	const filteredPeople: Person[] =
		query === ''
			? []
			: people.filter(person => {
					return person.name.toLowerCase().includes(query.toLowerCase());
				});
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

				<div className="fixed inset-0 z-10 w-screen overflow-y-auto p-4 sm:p-6 md:p-20">
					<TransitionChild
						enter="ease-out duration-300"
						enterFrom="opacity-0 scale-95"
						enterTo="opacity-100 scale-100"
						leave="ease-in duration-200"
						leaveFrom="opacity-100 scale-100"
						leaveTo="opacity-0 scale-95"
					>
						<DialogPanel className="mx-auto max-w-3xl transform divide-y divide-border-tertiary overflow-hidden rounded-md bg-bg-secondary shadow-2xl ring-1 ring-inset ring-border-tertiary transition-all  ">
							<Combobox<Person> onChange={(person: Person) => (window.location.href = person.profileUrl)}>
								{({ activeOption }) => (
									<>
										<div className="relative">
											<MagnifyingGlassIcon
												className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-gray-400"
												aria-hidden="true"
											/>
											<ComboboxInput
												autoFocus
												className=" h-12 w-full rounded-t-md border-0  bg-transparent pl-11 pr-4 text-text-primary placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 focus:ring-offset-0 sm:text-sm"
												placeholder="Barflies, bars..."
												onChange={event => setQuery(event.target.value)}
												onBlur={() => setQuery('')}
											/>
										</div>

										{(query === '' || filteredPeople.length > 0) && (
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
													{query === '' && (
														<h2 className="mb-4 mt-2 text-xs font-semibold text-text-secondary">Recent searches</h2>
													)}
													<div className="-mx-2 text-sm text-text-secondary">
														{(query === '' ? recent : filteredPeople).map(person => (
															<ComboboxOption
																as="div"
																key={person.id}
																value={person}
																className={({ focus }) =>
																	classNames(
																		'flex cursor-default select-none items-center rounded-md p-2',
																		focus && 'bg-bg-alt text-text-primary',
																	)
																}
															>
																{({ focus }) => (
																	<>
																		<img src={person.imageUrl} alt="" className="h-6 w-6 flex-none rounded-full" />
																		<span className="ml-3 flex-auto truncate">{person.name}</span>
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
														<div className="flex-none p-6 text-center">
															<img src={activeOption.imageUrl} alt="" className="mx-auto h-16 w-16 rounded-full" />
															<h2 className="mt-3 font-semibold text-text-primary">{activeOption.name}</h2>
															<p className="text-sm leading-6 text-gray-500">{activeOption.role}</p>
														</div>
														<div className="flex flex-auto flex-col justify-between p-6">
															<dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm text-gray-700">
																<dt className="col-end-1 font-semibold text-text-primary">Location</dt>
																<dd>{activeOption.phone}</dd>
																<dt className="col-end-1 font-semibold text-text-primary">URL</dt>
																<dd className="truncate">
																	<a href={activeOption.url} className="text-indigo-600 underline">
																		{activeOption.url}
																	</a>
																</dd>
																<dt className="col-end-1 font-semibold text-text-primary">Email</dt>
																<dd className="truncate">
																	<a href={`mailto:${activeOption.email}`} className="text-indigo-600 underline">
																		{activeOption.email}
																	</a>
																</dd>
															</dl>
															<button
																type="button"
																className="mt-6 w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
															>
																View profile
															</button>
														</div>
													</div>
												)}
											</ComboboxOptions>
										)}

										{query !== '' && filteredPeople.length === 0 && (
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
				</div>
			</Dialog>
		</Transition>
	);
}
