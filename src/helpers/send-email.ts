const nodemailer = require("nodemailer");

const smtpOptions = {
  host: process.env["emailHost"],
  port: 587,
  auth: {
    user: process.env["emailUser"],
    pass: process.env["emailPassword"],
  },
  secure: false, // Use 'false' for STARTTLS
  tls: { rejectUnauthorized: false },
};

async function sendEmail({
  email,
  subject,
  html,
  from = `${email}`,
}: {
  email: string;
  subject: string;
  html: string;
  from?: string;
}) {
  try {
    console.log("Sending email to:", email);

    const transporter = nodemailer.createTransport(smtpOptions);

    const response = await transporter.sendMail({
      from,
      to: "founder@iness.fitness",
      subject,
      html,
    });

    console.log("Email response:", response);

    return response.rejected.length === 0;
  } catch (error) {
    console.log(error.message);

    throw new Error("Unable to send the query, try again");
  }
}

module.exports = { sendEmail };
