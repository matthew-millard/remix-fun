import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { EllipsisHorizontalIcon } from '@heroicons/react/20/solid';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

type ProfileOptionsMenuProps = {
	isViewAsPublic: boolean;
	setIsViewAsPublic: (isViewAsPublic: boolean) => void;
	isDisabled?: boolean;
};

export default function ProfileOptionsMenu({ isViewAsPublic, setIsViewAsPublic, isDisabled }: ProfileOptionsMenuProps) {
	const viewAsPublic = (
		<span className="flex gap-x-3 px-4 py-3 text-text-secondary hover:bg-bg-alt">
			<EyeIcon aria-hidden="true" className="h-6 w-6" />
			<span className="font-medium">View as</span>
		</span>
	);

	const viewAsSelf = (
		<span className="flex gap-x-3 px-4 py-3 text-text-secondary hover:bg-bg-alt">
			<EyeSlashIcon aria-hidden="true" className="h-6 w-6" />
			<span className="font-medium">Exit view as</span>
		</span>
	);

	return (
		<Menu as="div" className="relative inline-block text-left">
			<div>
				<MenuButton
					disabled={isDisabled}
					className="flex items-center rounded-md bg-bg-secondary px-2 py-1 text-text-secondary hover:bg-bg-alt focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
				>
					<span className="sr-only">Open options</span>
					<EllipsisHorizontalIcon aria-hidden="true" className="h-5 w-5 lg:h-7 lg:w-7" />
				</MenuButton>
			</div>

			<MenuItems className="absolute z-10 mt-2 w-48 overflow-hidden rounded-md bg-bg-secondary shadow-lg ring-1 ring-black ring-opacity-5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in">
				<div className="flex flex-col">
					<MenuItem as="button" onClick={() => setIsViewAsPublic(!isViewAsPublic)}>
						{isViewAsPublic ? viewAsSelf : viewAsPublic}
					</MenuItem>
				</div>
			</MenuItems>
		</Menu>
	);
}
