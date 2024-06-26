import { useId, useState } from 'react';
import Search from './ui/Search';

export default function MagnifyingGlass() {
	const searchInputId = useId();
	const [isSearchOpen, setIsSearchOpen] = useState(false);

	function openSearch() {
		setIsSearchOpen(true);
	}

	function closeSearch() {
		setIsSearchOpen(false);
		// Defocus the button
		setTimeout(() => {
			document.getElementById(searchInputId)?.blur();
		}, 0);
	}
	return (
		<>
			<button id={searchInputId} type="button" className="p-1 text-gray-400  hover:text-gray-500 " onClick={openSearch}>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					strokeWidth={1.5}
					stroke="currentColor"
					className="size-6"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
					/>
				</svg>
			</button>
			{isSearchOpen && <Search isOpen={isSearchOpen} closeSearch={closeSearch} autoSubmit={true} />}
		</>
	);
}
