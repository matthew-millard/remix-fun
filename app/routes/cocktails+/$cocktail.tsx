import { CameraIcon } from '@heroicons/react/24/outline';
import { BoltIcon } from '@heroicons/react/24/solid';
import { json, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { PublishedBy } from '~/components';
import Reviews from '~/components/ui/Reviews';
import { requireUserId } from '~/utils/auth.server';
import { prisma } from '~/utils/db.server';

export async function loader({ request, params }: LoaderFunctionArgs) {
	await requireUserId(request);
	const cocktailName = new URLSearchParams(params)
		.get('cocktail')
		.split('-')
		.map(word => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');

	const cocktail = await prisma.cocktail.findUnique({
		where: { name: cocktailName },
		include: {
			ingredients: true,
			image: { include: { photographer: true } },
			author: { include: { profileImage: true, username: true } },
		},
	});

	const data = { cocktail };

	return json(data);
}

export default function CocktailRoute() {
	const { cocktail } = useLoaderData<typeof loader>();
	const cocktailImageUrl = `/resources/images/${cocktail.image[0].id}/cocktail`;

	return (
		<div className="">
			<div className="mx-auto grid max-w-7xl  auto-rows-auto lg:grid-cols-2 lg:gap-x-8">
				{/* Heading */}
				<div className="p-6 lg:col-span-2 lg:p-8">
					<div className="flex flex-col">
						<div className="mb-4">
							<PublishedBy />
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
							src={cocktailImageUrl}
							alt={cocktail.image[0].altText}
						/>
						<figcaption className="mt-3 flex text-xs text-text-secondary lg:text-sm">
							<CameraIcon className="h-4 w-4 flex-none text-text-secondary lg:h-5 lg:w-5" aria-hidden="true" />
							<span className="ml-2">
								Photograph by{' '}
								<Link to={cocktail.image[0].photographer.href} prefetch="intent">
									<strong className="text-xs font-medium text-text-primary hover:underline lg:text-sm">
										{cocktail.image[0].photographer.name}
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
						<CocktailRecipe />
						<div className="lg:hidden">
							<Reviews />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export function CocktailRecipe() {
	const { cocktail } = useLoaderData<typeof loader>();

	return (
		<div>
			<h2 className="mt-12 text-2xl font-bold tracking-tight text-text-primary">Recipe</h2>
			<ul className="mt-4 space-y-6 text-text-secondary">
				{cocktail.ingredients.map((ingredient, index) => (
					<li key={index} className="flex gap-x-3">
						<span className="flex gap-x-3">
							<strong className="font-semibold text-text-notify">{ingredient.measurement}</strong>
							<strong className="font-semibold text-text-primary">{ingredient.name}</strong>
						</span>
					</li>
				))}
				<div className="flex flex-col gap-y-1 text-sm lg:flex-row lg:gap-x-6">
					<li className="flex gap-x-2">
						<strong className="text-pink-500">Garnish</strong>
						<strong className="text-text-primary">{cocktail.garnish}</strong>
					</li>
					<li className="flex gap-x-2">
						<strong className="text-pink-500">Glass</strong>
						<strong className=" text-text-primary">{cocktail.glass}</strong>
					</li>
					<li className="flex gap-x-2">
						<strong className="text-pink-500">Ice</strong>
						<strong className="text-text-primary">{cocktail.ice}</strong>
					</li>
				</div>
			</ul>
			<h3 className="mt-12 text-2xl font-bold tracking-tight text-text-primary">Method</h3>
			<p className="mt-3">{cocktail.preparation}</p>
			<div className="mt-12">
				<ProTip />
			</div>
		</div>
	);
}

export function ProTip() {
	const { cocktail } = useLoaderData<typeof loader>();

	return (
		<fieldset className="flex flex-col rounded-md  border border-border-secondary p-4 shadow-sm">
			<legend className="flex items-center gap-x-2 pl-1 pr-2">
				<BoltIcon className="h-4 w-4 text-yellow-400 lg:h-5 lg:w-5" />
				<h3 className="text-sm font-semibold text-text-primary lg:text-base">Pro Tip</h3>
			</legend>
			<p className="-mt-2">{cocktail.tip}</p>
		</fieldset>
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
	breadcrumb: ({ params }: LoaderFunctionArgs) => {
		const cocktailName = new URLSearchParams(params)
			.get('cocktail')
			.split('-')
			.map(word => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
		return (
			<>
				<Link
					prefetch="intent"
					className="ml-1 text-xs text-gray-400 hover:text-gray-500  lg:ml-4 lg:text-sm"
					to={`/cocktails/${cocktailName}`}
				>
					{cocktailName}
				</Link>
			</>
		);
	},
};
