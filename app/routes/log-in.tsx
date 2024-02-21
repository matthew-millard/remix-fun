import type { MetaFunction } from '@remix-run/node';

export const meta: MetaFunction = () => {
  return [
    { title: 'BarFly | Log In' },
    {
      name: 'description',
      content:
        'Sign in to access exclusive content, manage your preferences, and stay connected with the latest updates.',
    },
  ];
};
// Update page description!!!

export default function LogIn() {
  return (
    <>
      <h1>Log In</h1>
    </>
  );
}
