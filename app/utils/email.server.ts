import { json } from '@remix-run/node';
import { Resend } from 'resend';

interface Email {
	from?: string;
	to: string[];
	subject: string;
	html: string;
}

export async function sendEmail({ from = 'Barfly <matt@barfly.ca>', to, subject, html }: Email) {
	const resend = new Resend(process.env.RESEND_API_KEY);
	const { data, error } = await resend.emails.send({
		from,
		to,
		subject,
		html,
	});

	if (error) {
		console.error({ error });
		return json({ message: 'An error occured' }, { status: 500 });
	}

	return data;
}
