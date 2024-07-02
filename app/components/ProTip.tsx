import { BoltIcon } from '@heroicons/react/24/solid';
import { Cocktail } from '~/routes/cocktails+/$cocktail';

export default function ProTip({ cocktail }: { cocktail: Cocktail }) {
	return (
		<fieldset className="mt-3 flex flex-col  rounded-md border border-border-primary p-4 pb-2 shadow-sm">
			<legend className="flex items-center gap-x-2 pl-1 pr-2">
				<BoltIcon className="h-4 w-4 text-yellow-400 lg:h-5 lg:w-5" />
				<h3 className="text-sm font-semibold text-text-primary lg:text-base">
					{cocktail.proTips.length > 1 ? 'Pro Tips' : 'Pro Tip'}
				</h3>
			</legend>
			<div className="-mt-2">
				{cocktail.proTips.map((proTip, index) => {
					return (
						<ul key={index} className="mb-2 flex items-baseline gap-x-2 text-sm text-text-secondary lg:text-base">
							{cocktail.proTips.length > 1 ? (
								<span className="text-text-primary" aria-hidden="true">
									{index + 1}.
								</span>
							) : null}
							<li>{proTip}</li>
						</ul>
					);
				})}
			</div>
		</fieldset>
	);
}
