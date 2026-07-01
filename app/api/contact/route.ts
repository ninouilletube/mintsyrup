import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const { email, message } = await req.json() as { email: string; message: string };

  if (!email?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 });
  }

  const { error } = await resend.emails.send({
    from: 'Mint Syrup <onboarding@resend.dev>',
    to: 'chatchep@gmail.com',
    replyTo: email,
    subject: 'Message depuis Mint Syrup',
    text: `De : ${email}\n\n${message}`,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
