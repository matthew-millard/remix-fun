export default function LoginButton() {
  return (
    <>
      <div className="flex">
        <a
          href="/log-in"
          className="-mx-3 text-nowrap text-base font-semibold leading-6 text-text-primary hover:bg-bg-secondary block rounded-md px-3 py-2  "
        >
          Log in <span aria-hidden="true">&rarr;</span>
        </a>
      </div>
    </>
  );
}
