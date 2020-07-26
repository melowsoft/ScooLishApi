import Mail from "email-templates";
import ejs from "ejs";
import _ from "underscore";
import aws from "aws-sdk";
import Template from "../../api/template/model";

export async function mailConfiguration(fromName, fromEmail, sendStatus = true) {
  aws.config.loadFromPath("awsmail.config.json");
  const mailEngine = new Mail({
    juice: true,
    juiceResources: {
      preserveImportant: true,
    },
    message: {
      from: `${fromName} ${fromEmail}`,
    },
    views: {
      options: {
        extension: "ejs",
      },
    },
    // Stop from previewing in the browser
    preview: false,
    send: sendStatus,
    transport: {
      SES: new aws.SES({ apiVersion: "2010-12-01" }),
    },
    render: (view, locals) => (
      new Promise((resolve, reject) => {
      // This clean any name attached to the name of the template that will be used
        const templateName = view.replace(/\/.*/, "");
        // fetch template using the name of template name
        Template.findOne({ name: templateName })
          .then((ejsTemplate) => {
          // Check if the template exist
            if (!ejsTemplate) {
              reject(new Error("Template not found"));
            }
            let html = ejs.render(_.unescape(ejsTemplate.style), locals);
            html = mailEngine.juiceResources(html);
            resolve(html);
          })
          .catch(err => reject(err));
      })
    ),
  });
  return mailEngine;
}

/**
 * @description sendMail send mail recipient
 * @param {String} senderName the name of the sender
 * @param {String} senderEmail the email of the sender
 * @param {String} recipientName the name of the recipient
 * @param {String} recipientEmail the email of the recipient
 * @param {String} template the template that will be use
 * @param {String} subject the subject of the mail to be sent
 * @param {Object} local the values that ejs template requires
 * @returns {Object} The response of the function.
 */
export async function sendMail(
  senderName,
  senderEmail,
  template,
  subject,
  recipientName,
  recipientEmail,
  local,
) {
  try {
    const mailConfig = await mailConfiguration(senderName, senderEmail);
    return mailConfig.send({
      template,
      message: {
        to: `${recipientName} ${recipientEmail}`,
        subject,
        bcc: "'Test' research@bezop.io",
      },
      locals: local,
    })
      .then(() => ({ success: true, message: "Successfully send mail" }))
      .catch((err) => {
        process.on("unhandledRejection", (error) => {
          throw new Error(error);
        });
        throw new Error(err);
      });
  } catch (err) {
    throw new Error(err);
  }
}
