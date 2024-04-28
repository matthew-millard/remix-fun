import { Body, Container, Head, Heading, Html, Link, Preview, Text } from '@react-email/components';

interface VerifyEmailAddressProps {
	otp: string;
	verifyUrl: string;
	title: string;
}

export default function VerifyEmailAddress({ otp, verifyUrl, title }: VerifyEmailAddressProps) {
	return (
		<Html>
			<Head />
			<Preview>Verify your email with this magic link</Preview>
			<Body style={main}>
				<Container style={container}>
					<Heading style={h1}>{title}</Heading>
					<Link
						href={verifyUrl}
						target="_blank"
						style={{
							...link,
							display: 'block',
							marginBottom: '16px',
						}}
					>
						Verify your email address with this magic link
					</Link>
					<Text style={{ ...text, marginBottom: '14px' }}>Or, copy and paste this temporary one-time passcode:</Text>
					<code style={code}>{otp}</code>
					<Text
						style={{
							...text,
							color: '#3a3d4a',
							marginTop: '12px',
							marginBottom: '38px',
						}}
					>
						(This verification link will expire in 15 minutes.)
					</Text>
					<Text
						style={{
							...text,
							color: '#3a3d4a',
							marginTop: '14px',
							marginBottom: '16px',
						}}
					>
						If you did not request a change to your email address associated with your Barfly account, you can safely
						ignore this email.
					</Text>

					<h2 style={h2}>Barfly</h2>
					<Text style={footer}>
						<Link href="https://barfly.ca" target="_blank" style={{ ...link, color: 'blue' }}>
							Barfly
						</Link>
						, the barflies guide to the best drinking establishments in Canada 🇨🇦
					</Text>
				</Container>
			</Body>
		</Html>
	);
}

VerifyEmailAddress.PreviewProps = {
	otp: 'QWERTY',
	title: 'Change Email Address',
	verifyUrl: 'http://localhost:3000/verify?type=change-email&target=clvd38gnm00023z0vve1hnpj2&code=1RDPK4',
} as VerifyEmailAddressProps;

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
	color: 'blue',
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
