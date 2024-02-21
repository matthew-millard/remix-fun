export default function LoginButton() {
  return (
    <>
      <div className="flex">
        <a href="/log-in" className="text-sm font-semibold leading-6 text-gray-900">
          Log in <span aria-hidden="true">&rarr;</span>
        </a>
      </div>
    </>
  );
}
