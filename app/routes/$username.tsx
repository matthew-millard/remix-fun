import { useOptionalUser } from '~/utils/users';

export default function Dashboard() {
	const user = useOptionalUser();
	console.log(user);
	return (
		<>
			<h1>Dashboard</h1>
			<h3>{user ? user.firstName : ''}</h3>
		</>
	);
}
