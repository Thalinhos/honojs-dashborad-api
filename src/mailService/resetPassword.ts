
import { gerarMailToken } from "../jwt-util/jwt.js";
import { sendMailWithHtml } from "./mailService.js";



export async function sendResetPasswordEmail(userEmail: string) {

  const frontendUrl = process.env.FRONTEND_URL;
  if (!frontendUrl) {
      throw new Error('FRONTEND_URL is not defined in environment variables');
  }

  const emailToken = await gerarMailToken({ email: userEmail }, Math.floor(Date.now() / 1000) + 60 * 5)
  if (!emailToken) {
    throw new Error('Erro ao gerar token');
  }

  const resetUrl = `${frontendUrl}/auth/reset-password/${emailToken}`;
  const htmlContent = `
    <h1>Redefinição de Senha</h1>
    <p>Clique no link abaixo para redefinir sua senha:</p>
    <a href="${resetUrl}">Redefinir Senha</a>
  `;

  const ok = await sendMailWithHtml(userEmail, 'Redefinição de Senha', htmlContent);
  if (!ok) {
    throw new Error('Erro ao enviar email de redefinição de senha');
  }

  return true;
}

// export async function resetPasswordByMail(id: string) {

//     const tokenMail = await gerarToken({ _id: id }, Math.floor(Date.now() / 1000) + 60 * 5);
//     if (!tokenMail) {
//         throw new Error('Erro ao gerar token para redefinição de senha');
//     }

//     const emailSend = await sendMail(myEmail as string, 'Redefinição de Senha', `Clique no link para redefinir sua senha: <a href="http://localhost:3000/auth/reset-password/${tokenMail}">Redefinir Senha</a>`);
//     if(!emailSend) {
//         throw new Error('Erro ao enviar email de redefinição de senha');
//     }
//     return true;
// }