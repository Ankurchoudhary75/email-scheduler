import nodemailer from 'nodemailer';
import { prisma } from '../config/prisma';

const transporterCache = new Map<string, nodemailer.Transporter>();

export async function getOrCreateEtherealTransporter(senderId: string) {
  if (transporterCache.has(senderId)) {
    return transporterCache.get(senderId)!;
  }

  const sender = await prisma.sender.findUnique({ where: { id: senderId } });
  if (!sender) {
    throw new Error(`Sender with ID ${senderId} not found`);
  }

  let user = sender.etherealUser;
  let pass = sender.etherealPass;

  if (!user || !pass) {
    // Generate new Ethereal test account automatically
    const testAccount = await nodemailer.createTestAccount();
    user = testAccount.user;
    pass = testAccount.pass;

    await prisma.sender.update({
      where: { id: senderId },
      data: {
        etherealUser: user,
        etherealPass: pass,
      },
    });

    console.log(`[Ethereal] Created test account for sender ${sender.email}: ${user}`);
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user, pass },
  });

  transporterCache.set(senderId, transporter);
  return transporter;
}

export async function sendEmailViaEthereal(
  senderId: string,
  fromEmail: string,
  fromName: string,
  toEmail: string,
  subject: string,
  body: string
) {
  const transporter = await getOrCreateEtherealTransporter(senderId);

  const info = await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: toEmail,
    subject: subject,
    text: body,
    html: `<div style="font-family: sans-serif; padding: 20px; line-height: 1.6; color: #333;">
      <h2 style="color: #4F46E5;">${subject}</h2>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <div style="font-size: 15px;">${body.replace(/\n/g, '<br/>')}</div>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #999;">Sent via ReachInbox Email Job Scheduler</p>
    </div>`,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  console.log(`[Ethereal] Message sent to ${toEmail}. Preview URL: ${previewUrl}`);

  return {
    messageId: info.messageId,
    previewUrl: previewUrl || undefined,
  };
}
