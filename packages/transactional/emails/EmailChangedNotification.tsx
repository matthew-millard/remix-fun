import { Body, Container, Head, Heading, Html, Link, Preview, Text } from '@react-email/components';

interface EmailChangedNotificationProps {
	userId: string;
	title: string;
}

export default function EmailChangedNotification({ userId, title }: EmailChangedNotificationProps) {
	return (
		<Html>
			<Head />
			<Preview>
				We're writing to let you know that your email address associated with your Barfly account has been changed.
			</Preview>
			<Body style={main}>
				<Container style={container}>
					<Heading style={h1}>{title}</Heading>

					<Text style={{ ...text, marginBottom: '14px' }}>
						We're writing to let you know that your email address associated with your Barfly account has been changed.
					</Text>

					<Text
						style={{
							...text,
							color: '#ababab',
							marginTop: '14px',
							marginBottom: '16px',
						}}
					>
						If you changed your email address, then you can safely ignore this. But if you did not change your email
						address, then please contact support immediately.
					</Text>
					<Text
						style={{
							...text,
							margin: '14px 0',
							fontWeight: 'bolder',
						}}
					>
						Your Account ID
					</Text>
					<code style={code}>{userId}</code>

					<h2 style={h2}>Barfly</h2>
					<Text style={footer}>
						<Link href="https://barfly.ca" target="_blank" style={{ ...link, color: 'blue' }}>
							Barfly
						</Link>
						, the barflies guide
						<br />
						to the best drinking establishments in Canada 🇨🇦
					</Text>
				</Container>
			</Body>
		</Html>
	);
}

EmailChangedNotification.PreviewProps = {
	userId: 'clvd38gnm00023z0vve1hnpj2',
	title: 'Your Barfly email has been changed',
} as EmailChangedNotificationProps;

const main = {
	backgroundColor: '#ffffff',
};

const container = {
	paddingLeft: '12px',
	paddingRight: '12px',
	margin: '0 auto',
};

const h1 = {
	color: '#000',
	fontFamily:
		"ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji",
	fontSize: '24px',
	fontWeight: 'bold',
	margin: '40px 0',
	padding: '0',
};

const h2 = {
	color: '#000',
	fontFamily:
		"ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji",
	fontSize: '24px',
	fontWeight: 'bold',
	margin: '40px 0',
	padding: '0',
};

const link = {
	color: '#2754C5',
	fontFamily:
		"ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji",
	fontSize: '14px',
	textDecoration: 'underline',
};

const text = {
	color: '#000',
	fontFamily:
		"ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji",
	fontSize: '14px',
	margin: '24px 0',
};

const footer = {
	color: '#898989',
	fontFamily:
		"ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji",
	fontSize: '12px',
	lineHeight: '22px',
	marginTop: '12px',
	marginBottom: '24px',
};

const code = {
	display: 'inline-block',
	padding: '16px 4.5%',
	width: '90.5%',
	backgroundColor: '#f4f4f4',
	borderRadius: '5px',
	border: '1px solid #eee',
	color: '#000',
};
