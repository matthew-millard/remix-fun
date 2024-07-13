import { Tooltip as ReactTooltip } from 'react-tooltip';

export const tooltipId = 'tooltip-id';

type TooltipProps = {
	id?: string;
	place?: 'top' | 'bottom' | 'left' | 'right';
};

export default function Tooltip({ id = 'tooltip-id', place = 'top' }: TooltipProps) {
	return (
		<>
			<ReactTooltip
				id={id}
				style={{ backgroundColor: 'rgb(55 65 81)', color: 'white', borderRadius: '5px' }}
				place={place}
			/>
		</>
	);
}
