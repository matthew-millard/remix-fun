import { CameraIcon } from '@heroicons/react/24/outline';
import { json, MetaFunction } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import cocktailImageUrl from '~/assets/images/cocktails/old_fashioned.jpg';
import { CocktailRecipe, PublishedBy } from '~/components';
import profileImageUrl from '~/assets/images/users/witek_wojaczek.jpg';
import Reviews from '~/components/ui/Reviews';

export type Cocktail = {
	type: string;
	name: string;
	history: string;
	description: string;
	ingredients: { measurement: string; ingredient: string }[];
	garnish: string;
	glass: string;
	ice: string;
	proTips: string[];
	preparation: string;
	image: {
		url: string;
		alt: string;
		photographer: {
			name: string;
			url: string;
		};
	};
	publishedBy: {
		author: {
			name: string;
			href: string;
			imageUrl: string;
			alt: string;
		};
		date: string;
		datetime: string;
	};
};

const cocktail: Cocktail = {
	type: 'Cocktail',
	name: 'Old Fashioned',
	history: `The term "cocktail" first appeared in print in 1806, defined as a mix of spirits, sugar, water, and bitters. This simple mixture is essentially what the Old Fashioned embodies.`,
	description: `The Old Fashioned is a well-balanced cocktail with a strong whiskey base. The bitters add a subtle complexity, complementing the sweetness of the sugar. The citrus garnish, if used, adds a refreshing aroma and a hint of brightness. The overall flavor is rich, slightly sweet, and deeply satisfying, making it a favorite for whiskey enthusiasts and cocktail purists alike.`,
	ingredients: [
		{ measurement: '2 oz', ingredient: 'Bourbon or rye whiskey' },
		{ measurement: '1/4 oz', ingredient: '2:1 Demerara syrup' },
		{ measurement: '2 dashes', ingredient: 'Angostura bitters' },
		{ measurement: '1 dash', ingredient: "Gaz Regan's Orange bitters" },
	],
	garnish: 'Orange twist',
	glass: 'Rocks glass',
	ice: 'Block ice',
	proTips: [
		'Use 2 parts raw demerara sugar or organic cane sugar to 1 part filtered water (by weight) when making your sugar syrup.',
	],
	preparation:
		'Add all the ingredients into a mixing glass, add ice and stir until well-chilled and diluted. Strain into a rocks glass filled with a large ice cube. Garnish with an orange twist.',
	image: {
		url: cocktailImageUrl,
		alt: 'Old Fashioned cocktail',
		photographer: {
			name: 'Matt Millard',
			url: '/mattmillard',
		},
	},
	publishedBy: {
		author: {
			name: 'Witek Wojaczek',
			href: '/witekwojaczek',
			imageUrl: profileImageUrl,
			alt: 'Witek Wojaczek profile image',
		},
		date: 'Jun 26, 2024',
		datetime: '2024-06-26',
	},
};

export async function loader() {
	return json({ cocktail });
}

export default function CocktailRoute() {
	const { cocktail } = useLoaderData<typeof loader>();
	return (
		<div className="">
			<div className="mx-auto grid max-w-7xl  auto-rows-auto lg:grid-cols-2 lg:gap-x-8">
				{/* Heading */}
				<div className="p-6 lg:col-span-2 lg:p-8">
					<div className="flex flex-col">
						<div className="mb-4">
							<PublishedBy cocktail={cocktail} />
						</div>
						<p className="text-base font-semibold leading-7 text-text-notify">{cocktail.type}</p>
						<h1 className="mt-2 text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">{cocktail.name}</h1>
						<p className="mt-4 text-xl leading-8 text-text-secondary">{cocktail.history}</p>
					</div>
				</div>

				{/* Image */}
				<figure className="mx-auto p-6 lg:col-start-2 lg:row-span-2 lg:px-8 lg:pt-0">
					<div className="">
						<img
							className="aspect-square rounded-lg object-cover shadow-xl"
							src={cocktail.image.url}
							alt={cocktail.image.alt}
						/>
						<figcaption className="mt-3 flex text-xs text-text-secondary lg:text-sm">
							<CameraIcon className="h-4 w-4 flex-none text-text-secondary lg:h-5 lg:w-5" aria-hidden="true" />
							<span className="ml-2">
								Photograph by{' '}
								<Link to={cocktail.image.photographer.url} prefetch="intent">
									<strong className="text-xs font-medium text-text-primary hover:underline lg:text-sm">
										{cocktail.image.photographer.name}
									</strong>
								</Link>
							</span>
						</figcaption>
					</div>
					<div className="hidden lg:block">
						<Reviews />
					</div>
				</figure>

				{/* Information & Recipe */}
				<div className="p-6 lg:col-span-1 lg:col-start-1 lg:row-start-2 lg:px-8 lg:pb-8 lg:pt-0">
					<div className="w-fulltext-base leading-7 text-text-secondary lg:col-start-1 lg:row-start-1 lg:w-full">
						<p>{cocktail.description}</p>
						<CocktailRecipe cocktail={cocktail} />
						<div className="lg:hidden">
							<Reviews />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

// Meta Function
export const meta: MetaFunction<typeof loader> = ({ data }) => {
	return [
		{ title: `Barfly | ${data.cocktail.name}` },
		{
			name: 'description',
			content:
				'Add a description here to help with SEO and click-through rates. This will be visible in search engine results.',
		},
	];
};

// Handle Function
export const handle = {
	breadcrumb: () => {
		return (
			<>
				<Link
					prefetch="intent"
					className="ml-1 text-xs text-gray-400 hover:text-gray-500  lg:ml-4 lg:text-sm"
					to={`/cocktails/${cocktail.name}`.toLowerCase().split(' ').join('-')}
				>
					{cocktail.name}
				</Link>
			</>
		);
	},
};
