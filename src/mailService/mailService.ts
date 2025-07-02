import nodemailer from 'nodemailer';

const userEmail = process.env.EMAIL_USER;
if (!userEmail) {
   throw new Error('EMAIL_USER não configurado');
}

const password = process.env.EMAIL_PASSWORD;
if (!password) {
   throw new Error('EMAIL_PASSWORD não configurado');
}

let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: userEmail,
    pass: password
  }
});

export async function sendMailWithHtml(to: string, subject: string, html: string) {
 
  const mailOptions = {
    from: userEmail,
    to,
    subject,
    html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email enviado:', info.response);
    return true;
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return false;
  }
}

export async function sendMail(to: string, subject: string, text: string) {
  let mailOptions = {
    from: process.env.EMAIL_USER,
    to: to,
    subject: subject,
    text: text
  };

  try {
    let info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
    return true
  } catch (error) {
    console.error('Error sending email:', error);
    return false
  }
}


// sendMail('thalissonvieira@hotmail.com.br', 'Test Email', 'This is a test email from HonoJS Dashboard API')
// .then((result) => {
//   console.log('Email sent successfully:', result);
// })
// .catch((error) => { 
//     console.error('Error sending email:', error);
// });

// sendMailWithHtml('thalissonvieira@hotmail.com.br', 'Test Email', '<h1>This is a test email from HonoJS Dashboard API</h1>')
// .then((result) => {
//   console.log('Email sent successfully:', result);
// })
// .catch((error) => { 
//     console.error('Error sending email:', error);
// });