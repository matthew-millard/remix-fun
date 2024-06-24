import { generateTOTP } from '@epic-web/totp';

// Paste your string here. It should start with "otpauth://totp/" and include a secret and other params
const otpString = `otpauth://totp/localhost%3A3000:matthew.richie.millard%40gmail.com?secret=V4QRZFWVUL3IPRES&issuer=localhost%3A3000&algorithm=SHA1&digits=5&period=10`;

const otpUri = new URL(otpString);
const { secret, algorithm, digits, period } = Object.fromEntries(otpUri.searchParams.entries());

const { otp } = generateTOTP({
	secret,
	algorithm,
	digits,
	period,
});

console.log(otp);
