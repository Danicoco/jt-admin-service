const nodeMailer = require("nodemailer");

let transport = nodeMailer.createTransport({
    host: 'smtp.zoho.com',
    port: 465,
    secure: true, 
    auth: {
      user: process.env.ZOHO_AUTH_USER,
      pass: process.env.ZOHO_AUTH_PASS,   
    },
});

const sendEmailNotification = async (email, subject, text) => {
    const mailOptions = {
        // from: process.env.mailtrap_auth_user,
        from: `"Jamestown Support" <${process.env.ZOHO_AUTH_USER}>`,
        to: email,
        subject: subject,
        html: text
    }

    try {
        await transport.sendMail(mailOptions);
        console.log("Email sent successfully!")
    } catch (error) {
        // console.log("There was a problem sending the email")
        console.log("There was a problem sending the email:", error.message);
    }
};

module.exports = {
    sendEmailNotification
}