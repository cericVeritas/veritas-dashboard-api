import nodemailer from "nodemailer";


const transporter = nodemailer.createTransport({
  host: "smtp-mail.outlook.com",
  port: 587,
  secure: false, // Use true for port 465, false for port 587
  auth: {
    user: "ceric@veritasallies.com",
    pass: "Servuscare2022!",
  },
});

export default transporter;
