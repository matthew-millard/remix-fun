import { CheckIcon } from '@heroicons/react/24/outline';
import { MetaFunction } from '@remix-run/node';
import { Link } from '@remix-run/react';
import cocktailImageUrl from '~/assets/images/cocktails/old_fashioned.jpg';

export default function OldFashionedRoute() {
	return (
		<div className="">
			<div className="mx-auto grid max-w-7xl auto-rows-auto lg:grid-cols-2 lg:grid-rows-[auto] lg:gap-x-8">
				{/* Heading */}
				<div className=" p-6 lg:p-8">
					<div className="">
						<p className="text-base font-semibold leading-7 text-text-notify">Cocktail</p>
						<h1 className="mt-2 text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">Old Fashioned</h1>
						<p className="mt-6 text-xl leading-8 text-text-secondary">
							In the late 19th, the American cocktail scene was awash with new drinks made with all manner of spirits,
							bitters, fruit juices and syrups, and of course it wasn&apos;t to everybody&apos;s taste.
						</p>
					</div>
				</div>

				{/* Image */}
				<div className="mx-auto p-6 lg:relative lg:row-span-2 lg:p-8 lg:py-28">
					<div className="lg:sticky lg:top-20">
						<img
							className="aspect-square rounded-lg object-cover shadow-xl"
							src={cocktailImageUrl}
							alt="old fashioned cocktail"
						/>
					</div>
				</div>

				{/* Information & Recipe */}
				<div className="p-6 lg:p-8">
					<div className="w-fulltext-base leading-7 text-text-secondary lg:col-start-1 lg:row-start-1 lg:w-full">
						<p>
							Faucibus commodo massa rhoncus, volutpat. Dignissim sed eget risus enim. Mattis mauris semper sed amet
							vitae sed turpis id. Id dolor praesent donec est. Odio penatibus risus viverra tellus varius sit neque
							erat velit. Faucibus commodo massa rhoncus, volutpat. Dignissim sed eget risus enim. Mattis mauris semper
							sed amet vitae sed turpis id.
						</p>
						<ul role="list" className="mt-8 space-y-8 text-text-secondary">
							<li className="flex gap-x-3">
								<CheckIcon className="mt-1 h-5 w-5 flex-none text-pink-500" aria-hidden="true" />
								<span>
									<strong className="font-semibold text-text-primary">Push to deploy.</strong> Lorem ipsum, dolor sit
									amet consectetur adipisicing elit. Maiores impedit perferendis suscipit eaque, iste dolor cupiditate
									blanditiis ratione.
								</span>
							</li>
							<li className="flex gap-x-3">
								<CheckIcon className="mt-1 h-5 w-5 flex-none text-pink-500" aria-hidden="true" />
								<span>
									<strong className="font-semibold text-text-primary">SSL certificates.</strong> Anim aute id magna
									aliqua ad ad non deserunt sunt. Qui irure qui lorem cupidatat commodo.
								</span>
							</li>
							<li className="flex gap-x-3">
								<CheckIcon className="mt-1 h-5 w-5 flex-none text-pink-500" aria-hidden="true" />
								<span>
									<strong className="font-semibold text-text-primary">Database backups.</strong> Ac tincidunt sapien
									vehicula erat auctor pellentesque rhoncus. Et magna sit morbi lobortis.
								</span>
							</li>
						</ul>
						<p className="mt-8">
							Et vitae blandit facilisi magna lacus commodo. Vitae sapien duis odio id et. Id blandit molestie auctor
							fermentum dignissim. Lacus diam tincidunt ac cursus in vel. Mauris varius vulputate et ultrices hac
							adipiscing egestas. Iaculis convallis ac tempor et ut. Ac lorem vel integer orci.
						</p>
						<h2 className="mt-16 text-2xl font-bold tracking-tight text-text-primary">No server? No problem.</h2>
						<p className="mt-6">
							Id orci tellus laoreet id ac. Dolor, aenean leo, ac etiam consequat in. Convallis arcu ipsum urna nibh.
							Pharetra, euismod vitae interdum mauris enim, consequat vulputate nibh. Maecenas pellentesque id sed
							tellus mauris, ultrices mauris. Tincidunt enim cursus ridiculus mi. Pellentesque nam sed nullam sed diam
							turpis ipsum eu a sed convallis diam.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

// Meta Function
export const meta: MetaFunction = () => {
	return [
		{ title: 'Barfly | Old Fashioned' },
		{
			name: 'description',
			content:
				'Add a description here to help with SEO and click-through rates. This will be visible in search engine results.',
		},
	];
};

// Handle Function
export const handle = {
	breadcrumb: () => (
		<Link
			prefetch="intent"
			className="ml-1 text-xs text-gray-400 hover:text-gray-500  lg:ml-4 lg:text-sm"
			to={`/login`}
		>
			Old Fashioned
		</Link>
	),
};
