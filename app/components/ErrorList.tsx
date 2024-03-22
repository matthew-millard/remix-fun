export default function ErrorList({
	errors,
	id,
	fontSize = '10px',
}: {
	errors?: Array<string> | null;
	id: string;
	fontSize?: string;
}) {
	return errors?.length ? (
		<ul className="flex flex-col gap-1" id={id}>
			{errors.map((error, i) => (
				<li key={i} style={{ fontSize }} className="text-foreground-destructive  text-red-500">
					{error}
				</li>
			))}
		</ul>
	) : null;
}
