import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {

    sgMail.send({
        to: email,
        from: "nickytuon75@gmail.com",
        subject: "Welcome to Tasks App",
        text: `Welcome to the app, ${name}.`
    })
}

const sendCancelEmail = (email, name) => {

    sgMail.send({
        to: email,
        from: "nickytuon75@gmail.com",
        subject: "Sorry to see you go",
        text: `Thanks ${name}`
    })
}

export { sendWelcomeEmail, sendCancelEmail }