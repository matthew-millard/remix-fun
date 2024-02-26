import { Link } from '@remix-run/react';

export default function Logo() {
  return (
    <Link to="/" className="py-3">
      <span className="text-text-primary underlined block whitespace-nowrap text-2xl lg:text-3xl font-bold  transition focus:outline-none">
        Barfly
      </span>
    </Link>
  );
}
