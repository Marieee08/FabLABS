// Create this file at: app/api/contact/route.js (for Next.js App Router)
// OR at: pages/api/contact.js (for Next.js Pages Router)

import nodemailer from 'nodemailer';

// For App Router
export async function POST(request: { json: () => PromiseLike<{ name: any; email: any; message: any; }> | { name: any; email: any; message: any; }; }) {
  try {
    const { name, email, message } = await request.json();
    
    // Create a transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Use Gmail or your preferred service
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'fablab@evc.pshs.edu.ph',
      subject: `New FabLABS Inquiry from ${name}`,
      text: `
        Name: ${name}
        Email: ${email}

        Message: ${message}
      `,
      html: `
        <h3>New Contact Form Message</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
