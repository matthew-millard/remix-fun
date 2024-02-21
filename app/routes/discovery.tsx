import type { MetaFunction } from '@remix-run/node';

export const meta: MetaFunction = () => {
  return [
    { title: 'BarFly | Discovery' },
    { name: 'description', content: 'Search and discover bars from across Canada.' },
  ];
};
// Update page description!!!

export default function Discovery() {
  return (
    <>
      <h1>Discover Bars</h1>
    </>
  );
}
