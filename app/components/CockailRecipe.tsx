import { Cocktail } from '~/routes/cocktails+/$cocktail';
import ProTip from './ProTip';

export default function CocktailRecipe({ cocktail }: { cocktail: Cocktail }) {
	return (
		<div>
			<h2 className="mt-12 text-2xl font-bold tracking-tight text-text-primary">Recipe</h2>
			<ul className="mt-4 space-y-6 text-text-secondary lg:border-r lg:border-bg-alt">
				{cocktail.ingredients.map((ingredient, index) => (
					<li key={index} className="flex gap-x-3">
						<span className="flex gap-x-3">
							<strong className="font-semibold text-text-notify">{ingredient.measurement}</strong>
							<strong className="font-semibold text-text-primary">{ingredient.ingredient}</strong>
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
				<ProTip cocktail={cocktail} />
			</div>
		</div>
	);
}
