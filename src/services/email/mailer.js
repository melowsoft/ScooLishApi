import Mail from "email-templates";
import ejs from "ejs";
import path from "path";
import fs from "fs";
import _ from "underscore";
import aws from "aws-sdk";
import MailTemplate from "../../api/template/model";

class Email {
  static create(templateName, template) {
    const dataPath = fs.readFileSync(path.join(__dirname, "..", "emails", template), { encoding: "UTF8" });
    const mailTemplate = new MailTemplate({
      name: templateName,
      template: _.escape(dataPath),
    });

    mailTemplate.save()
      .then(() => {
      })
      .catch((err) => {
      });
  }

  static mailConfiguration(fromName, fromEmail) {
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
      send: true,
      transport: {
        SES: new aws.SES({ apiVersion: "2010-12-01" }),
      },

      render: (view, locals) => new Promise((resolve, reject) => {
        // This clean any name attached to the name of the template that will be used
        const templateName = view.replace(/\/.*/, "");
        // fetch template using the name of template name
        MailTemplate.findOne({ name: templateName })
          .then((ejsTemplate) => {
            // Check if the template exist
            if (!ejsTemplate) {
              return reject(new Error("Template not found"));
            }
            let html = ejs.render(_.unescape(ejsTemplate.template), locals);
            html = mailEngine.juiceResources(html);
            return resolve(html);
          })
          .then(err => reject(err));
      }),
    });

    return mailEngine;
  }

  static mailConfigurationForLocal() {
    const mailEngine = new Mail({
      juice: true,
      juiceResources: {
        preserveImportant: true,
        // webResources:{
        //     relativeTo: path.join(__dirname, '../assets'),
        // }
      },
      message: {
        from: '"AGBM Newly Selected" agmbhr@agmbresourceful.online',
      },
      views: {
        options: {
          extension: "ejs",
        },
      },
      send: true,
      transport: {
        host: "smtp.mailtrap.io",
        port: 465,
        secure: false, // true for 465, false for other ports
        auth: {
          user: "58988de5168ef1", // generated ethereal user
          pass: "b4b20e0115b2ec", // generated ethereal password
        },
        secureConnection: "false",
        tls: {
          rejectUnauthorized: false,
        },
      },

      render: (view, locals) => new Promise((resolve, reject) => {
        // This clean any name attached to the name of the template that will be used
        const templateName = view.replace(/\/.*/, "");
        // fetch template using the name of template name
        MailTemplate.findOne({ name: templateName })
          .then((ejsTemplate) => {
            // Check if the template exist
            if (!ejsTemplate) {
              return reject(new Error("Template not found"));
            }
            let html = ejs.render(_.unescape(ejsTemplate.template), locals);
            html = mailEngine.juiceResources(html);
            return resolve(html);
          })
          .then(err => reject(err));
      }),
    });

    return mailEngine;
  }
}

export default Email;
