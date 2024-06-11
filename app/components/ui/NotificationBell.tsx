import { BellIcon } from '@heroicons/react/24/outline';

export default function NotificationBell() {
	return (
		<button
			type="button"
			className="relative flex-shrink-0 rounded-full bg-transparent p-1 text-gray-400 hover:text-gray-500"
		>
			<span className="absolute -inset-1.5" />
			<span className="sr-only">View notifications</span>
			<BellIcon className="h-6 w-6" aria-hidden="true" />
		</button>
	);
}
