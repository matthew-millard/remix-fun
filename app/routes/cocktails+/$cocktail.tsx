import { CameraIcon } from '@heroicons/react/24/outline';
import { json, MetaFunction } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import cocktailImageUrl from '~/assets/images/cocktails/old_fashioned.jpg';
import { CocktailRecipe, PublishedBy } from '~/components';

export type Cocktail = {
	name: string;
	ingredients: { measurement: string; ingredient: string }[];
	garnish: string;
	glass: string;
	ice: string;
	proTip: string;
	preparation: string;
	image: {
		url: string;
		alt: string;
		photographer: {
			name: string;
			url: string;
		};
	};
};

const cocktail: Cocktail = {
	name: 'Old Fashioned',
	ingredients: [
		{ measurement: '2 oz', ingredient: 'Bourbon or rye whiskey' },
		{ measurement: '1/4 oz', ingredient: '2:1 Demerara syrup' },
		{ measurement: '2 dashes', ingredient: 'Angostura bitters' },
		{ measurement: '1 dash', ingredient: "Gaz Regan's Orange bitters" },
	],
	garnish: 'Orange twist',
	glass: 'Rocks glass',
	ice: 'Block ice',
	proTip: 'Use 2:1 (by weight) demerara syrup for a richer, more flavorful Old Fashioned.',
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
};

export async function loader() {
	return json({ cocktail });
}

export default function OldFashionedRoute() {
	const { cocktail } = useLoaderData<typeof loader>();
	return (
		<div className="">
			<div className="mx-auto grid max-w-7xl auto-rows-auto lg:grid-cols-2 lg:grid-rows-[auto] lg:gap-x-8">
				{/* Heading */}
				<div className=" p-6 lg:p-8">
					<div className="flex flex-col">
						<div className="mb-4">
							<PublishedBy />
						</div>
						<p className="text-base font-semibold leading-7 text-text-notify">Cocktail</p>
						<h1 className="mt-2 text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">{cocktail.name}</h1>
						<p className="mt-4 text-xl leading-8 text-text-secondary">
							In the late 19th, the American cocktail scene was awash with new drinks made with all manner of spirits,
							bitters, fruit juices and syrups, and of course it wasn&apos;t to everybody&apos;s taste.
						</p>
					</div>
				</div>

				{/* Image */}
				<figure className="mx-auto p-6 lg:relative lg:row-span-2 lg:p-8 lg:py-28">
					<div className="lg:sticky lg:top-20">
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
									<strong className="font-semibold text-text-primary">{cocktail.image.photographer.name}</strong>
								</Link>
							</span>
						</figcaption>
					</div>
				</figure>

				{/* Information & Recipe */}
				<div className="p-6 lg:p-8">
					<div className="w-fulltext-base leading-7 text-text-secondary lg:col-start-1 lg:row-start-1 lg:w-full">
						<p>
							Faucibus commodo massa rhoncus, volutpat. Dignissim sed eget risus enim. Mattis mauris semper sed amet
							vitae sed turpis id. Faucibus commodo massa rhoncus, volutpat. Dignissim sed eget risus enim. Mattis
							mauris semper sed amet vitae sed turpis id.
						</p>
						<CocktailRecipe cocktail={cocktail} />
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
