import type { MetaFunction } from '@remix-run/node';

export const meta: MetaFunction = () => {
  return [
    { title: 'BarFly | Sign In' },
    {
      name: 'description',
      content:
        'Sign in to access exclusive content, manage your preferences, and stay connected with the latest updates.',
    },
  ];
};
// Update page description!!!

export default function SignIn() {
  return (
    <>
      <h1>Sign In</h1>
    </>
  );
}
