const express = require('express');
const nodemailer = require('nodemailer');

const router = express.Router();

// POST /api/contact
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body || {};

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // build transporter from environment variables
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !port || !user || !pass) {
      console.warn('SMTP environment variables not fully configured.');
      return res.status(500).json({ message: 'Email server not configured' });
    }

    const secure = port === 465; // common convention

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });

    const to = process.env.CONTACT_TO_EMAIL || user;
    const from = process.env.CONTACT_FROM_EMAIL || user;

    const mailOptions = {
      from: `${name} <${from}>`,
      to,
      subject: `[Contact] ${subject} — from ${name} <${email}>`,
      text: `You received a new contact message:\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`,
      html: `<p><strong>Name:</strong> ${name}</p>
             <p><strong>Email:</strong> ${email}</p>
             <p><strong>Subject:</strong> ${subject}</p>
             <hr />
             <p>${message.replace(/\n/g, '<br/>')}</p>`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Contact email sent:', info && info.messageId);

    // persist message to MongoDB if model exists
    try {
      const ContactMessage = require('../models/ContactMessage');
      const doc = new ContactMessage({ name, email, subject, message, status: 'new' });
      await doc.save();
    } catch (e) {
      console.warn('Could not save contact message to DB:', e.message || e);
    }

    res.json({ ok: true, message: 'Email sent' });
  } catch (err) {
    console.error('Failed to send contact email', err);
    res.status(500).json({ message: 'Failed to send email' });
  }
});

module.exports = router;
