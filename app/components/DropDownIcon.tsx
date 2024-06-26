import { Fragment } from 'react';
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import Avatar from './Avatar';
import { Form } from '@remix-run/react';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';
import { useOptionalUser } from '~/utils/users';

function classNames(...classes: string[]) {
	return classes.filter(Boolean).join(' ');
}

export default function DropDownIcon({ imageId, username }: { imageId?: string; username?: string }) {
	const isLoggedInUser = useOptionalUser();

	return (
		<Menu as="div" className="relative inline-block text-left">
			<div>
				<MenuButton className="relative flex">
					<div className="">
						<Avatar imageId={imageId} />
					</div>
					<ChevronDownIcon
						className="absolute  -bottom-0 -right-0  h-4 w-4 rounded-full bg-bg-alt text-border-primary"
						aria-hidden="true"
					/>
				</MenuButton>
			</div>

			<Transition
				as={Fragment}
				enter="transition ease-out duration-100"
				enterFrom="transform opacity-0 scale-95"
				enterTo="transform opacity-100 scale-100"
				leave="transition ease-in duration-75"
				leaveFrom="transform opacity-100 scale-100"
				leaveTo="transform opacity-0 scale-95"
			>
				{isLoggedInUser ? (
					<MenuItems className="absolute right-0 z-10 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
						<div className="px-4 py-3">
							<p className="text-sm">Signed in as</p>
							<p className="truncate text-sm font-bold  text-gray-900">{username}</p>
						</div>
						<div className="py-1">
							<MenuItem>
								{({ active }) => (
									<a
										href={`/${username}`}
										className={classNames(
											active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
											'block px-4 py-2 text-sm',
										)}
									>
										Profile
									</a>
								)}
							</MenuItem>
							<MenuItem>
								{({ active }) => (
									<a
										href={`/${username}/settings`}
										className={classNames(
											active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
											'block px-4 py-2 text-sm',
										)}
									>
										Settings
									</a>
								)}
							</MenuItem>
						</div>
						<div className="py-1">
							<Form method="POST" action="/logout">
								<AuthenticityTokenInput />
								<MenuItem>
									{({ active }) => (
										<button
											type="submit"
											className={classNames(
												active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
												'block w-full px-4 py-2 text-left text-sm',
											)}
										>
											Log Out
										</button>
									)}
								</MenuItem>
							</Form>
						</div>
					</MenuItems>
				) : (
					<MenuItems className="absolute right-0 z-10 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
						<div className="px-4 py-3">
							<p className="text-sm"></p>
							<p className="truncate text-sm font-bold  text-gray-900">Account Settings</p>
						</div>
						<div className="py-1">
							<MenuItem>
								{({ active }) => (
									<a
										href={`/signup`}
										className={classNames(
											active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
											'block px-4 py-2 text-sm',
										)}
									>
										Sign up for an account
									</a>
								)}
							</MenuItem>
						</div>
						<div className="py-1">
							<MenuItem>
								{({ active }) => (
									<a
										href={`/login`}
										className={classNames(
											active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
											'block px-4 py-2 text-sm',
										)}
									>
										Log In
									</a>
								)}
							</MenuItem>
						</div>
					</MenuItems>
				)}
			</Transition>
		</Menu>
	);
}
