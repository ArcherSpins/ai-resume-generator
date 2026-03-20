import nodemailer from 'nodemailer';
import fs from 'fs';
import { config } from '../config/index.js';
import { isS3Configured, isS3Key, getObjectStream } from './s3Service.js';

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
    });
  }
  return transporter;
}

/**
 * Send resume by email. Attaches the primary file (DOCX or XLSX if generated, otherwise PDF).
 * @param {string} toEmail
 * @param {string} attachmentPathOrS3Key - local file path or S3 key to the file to attach
 * @param {string} attachmentFilename - e.g. 'resume.pdf', 'resume.docx', 'resume.xlsx'
 * @param {string} [userName]
 */
export async function sendResumeEmail(toEmail, attachmentPathOrS3Key, attachmentFilename, userName) {
  const transport = getTransporter();
  if (!config.smtp.host) {
    console.warn('SMTP not configured; skipping email to', toEmail);
    return;
  }

  let attachmentContent;
  if (isS3Configured() && isS3Key(attachmentPathOrS3Key)) {
    attachmentContent = await getObjectStream(attachmentPathOrS3Key);
  } else {
    attachmentContent = fs.createReadStream(attachmentPathOrS3Key);
  }

  const filename = attachmentFilename || 'resume.pdf';

  await transport.sendMail({
    from: config.smtp.from,
    to: toEmail,
    subject: 'Your Resume is Ready',
    text: `Hi${userName ? ` ${userName}` : ''},\n\nYour generated resume is attached.\n\nBest regards,\nAI Resume Builder`,
    attachments: [{ filename, content: attachmentContent }],
  });
}
