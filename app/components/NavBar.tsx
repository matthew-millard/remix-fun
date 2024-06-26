import { useState } from 'react';
import { Dialog, DialogPanel } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { DropDownIcon, Logo, ThemeSwitcher } from '../components';
import { Link, NavLink, useLoaderData, useNavigate } from '@remix-run/react';
import { type loader } from '../root';
import { useOptionalUser } from '~/utils/users';
import NotificationBell from './ui/NotificationBell';
import MagnifyingGlass from './MagnifyingGlass';
import Breadcrumbs from './ui/Breadcrumbs';
import { WrenchScrewdriverIcon } from '@heroicons/react/20/solid';

const navigation = [
	{ name: 'Discovery', href: '/discovery' },
	{ name: 'Directory', href: '/directory' },
	{ name: 'Bar Of The Month', href: '/bar-of-the-month' },
];

export default function NavBar() {
	const navigate = useNavigate();
	const data = useLoaderData<typeof loader>();
	const isLoggedInUser = useOptionalUser();
	const isAdmin = data.user?.roles.some(role => role.name === 'admin');

	const profileImageId = data.user?.profileImage?.id;
	const username = data.user?.username.username;
	const mobileNavigation = isLoggedInUser
		? [{ name: 'Profile', href: `/${username}` }, { name: 'Settings', href: `/${username}/settings` }, ...navigation]
		: [{ name: 'Log In', href: '/login' }, ...navigation];

	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	return (
		<header className="flex-none">
			<nav
				className="mx-auto flex max-w-7xl items-center justify-between gap-x-6  px-6 pb-2 pt-4 lg:px-8"
				aria-label="Global"
			>
				<div className="flex  lg:flex-1">
					<Logo />
				</div>
				<div className="hidden lg:flex lg:gap-x-12">
					{navigation.map(item => (
						<NavLink
							key={item.name}
							to={item.href}
							className="block whitespace-nowrap text-base font-medium text-text-secondary hover:text-text-primary focus:text-text-primary focus:outline-none"
							prefetch="intent"
						>
							{item.name}
						</NavLink>
					))}
				</div>
				<div className="hidden flex-1 items-center justify-end gap-x-6 lg:flex">
					<MagnifyingGlass />
					<NotificationBell />
					<ThemeSwitcher />
					<DropDownIcon imageId={profileImageId} username={username} />
					{isAdmin ? <WrenchScrewdriverIcon height={'24'} color="white" onClick={() => navigate(`/admin`)} /> : null}
				</div>
				<div className="flex gap-4 lg:hidden">
					<MagnifyingGlass />
					<NotificationBell />
					<button
						type="button"
						className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-text-primary"
						onClick={() => setMobileMenuOpen(true)}
					>
						<span className="sr-only">Open main menu</span>
						<Bars3Icon className="h-6 w-6" aria-hidden="true" />
					</button>
				</div>
			</nav>
			<div className="mx-auto max-w-7xl px-6 pb-2 lg:px-8">
				<Breadcrumbs />
			</div>
			<Dialog as="div" className="lg:hidden" open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)}>
				<div className="fixed inset-0 z-10" />
				<DialogPanel className="fixed inset-y-0 right-0 z-10 w-full overflow-y-auto bg-bg-primary px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
					<div className="flex items-center justify-between gap-x-6">
						<div className="my-3 sm:invisible">
							<Logo />
						</div>
						<div className="flex gap-4">
							<ThemeSwitcher />
							<MagnifyingGlass />
							<button
								type="button"
								className="-m-2.5 rounded-md p-2.5 text-text-primary"
								onClick={() => setMobileMenuOpen(false)}
							>
								<span className="sr-only">Close menu</span>
								<XMarkIcon className="h-6 w-6" aria-hidden="true" />
							</button>
						</div>
					</div>
					<div className="mt-6 flow-root">
						<div className="-my-6 divide-y divide-gray-500/10">
							<div className="space-y-2 py-6">
								{mobileNavigation.map(item => (
									<Link
										key={item.name}
										to={item.href}
										className="-mx-3 block rounded-md px-3 py-2 text-base font-medium leading-7 text-text-primary hover:bg-bg-secondary"
										prefetch="viewport"
										onClick={() => setMobileMenuOpen(false)}
									>
										{item.name}
									</Link>
								))}
							</div>
						</div>
					</div>
				</DialogPanel>
			</Dialog>
		</header>
	);
}
