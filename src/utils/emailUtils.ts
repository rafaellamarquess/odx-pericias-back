import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "Gmail", // Ou outro serviço (SendGrid, etc.)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendResetPasswordEmail = async (email: string, token: string) => {
  const resetLink = `http://localhost:3000/reset-password/${token}`; // Ajuste para sua URL de frontend
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Redefinição de Senha",
    text: `Você solicitou a redefinição de sua senha. Clique no link para redefinir: ${resetLink}. Este link expira em 1 hora.`,
  };

  await transporter.sendMail(mailOptions);
};