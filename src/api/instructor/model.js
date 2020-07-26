/**
 * @author TonyStacks
 * @property {Number} nonce is the vendor's authentication nonce
 * @property {String} publicAddress is the vendor's MetaMask address
 * @property {String} businessName is the vendor's business name
 * @property {String} domainName is the vendor's unique domain name
 * @property {String} email is the vendor's email address
 * @property {String} password is the vendor's password
 * @property {String} recoveryCode is the vendor's recovery code
 * @property {String} fullname is the vendor's full name
 * @property {String} username is the vendor's username
 * @property {String} phone is the vendor's phone
 * @property {Array} profile [{website, facebook, linkedin, instagram, skype,
 *  googlePlus, twitter, youtube, pinterest]} is the vendor's social media profile
 * @property {Array} address [{country, state, city, street, building, zip}] is the
 * vendor's physical address
 * @property {Array} preferences [{currency, language}] is the vendor's preferences
 * @property {Array} frontend [{logo,banner, slogan, description, tag, theme }] is the
 * vendor's frontend settings/preferences
 * @property {Array} template [{home, product, productDetail,profile, blog, mail, invoice, ticket }]
 * is the vendor's templates
 * @property {Object} products is the vendor's products
 * @property {Array} productsApproved [{accepted,rejected, defaulted }] are the vendor's
 * prodcucts approeved
 * @property {Number} viewCount is the number of views a vendor has
 * @property {Array} lastAccess [{accessDate, ipAddress}] is the vendor's last access details
 * @property {Array} account [{ completeProfile, emailVerified, domainNameSet, businessVerified}]
 * is the vendor's account status
 * @property {Array} notifications [{date, notice, standing}] is the vendor notifications
 * @property {String} standing Vendor account status which can be "active", "inactive", "trashed"
 * trashed items can be restore after a while if the system has not emptied it automatically
 * @property {Date} updated is the date of last update
 * @property {Boolean} onlineStatus admin's online Status
 * @property {Object} admin  The admin's ObjectId who last modified the record
 * @property {String} action  The admins' action on the record ["allow", "restrict", "deny"]
 * allow: owner can display, transact, update, modify standing or #delete record
 * restrict: owner can update, modify #delete record by cannot display or transact it
 * deny: record cannot be updated, modified, display by owner and its readonly.
 */

import mongoose, { Schema } from "mongoose";
import { randomNonce } from "./../../services/helpers";

const InstructorSchema = new Schema(
  {
    subscriptionType: {
      type: String,
      max: 42,
      required: [false, "Why no Subscription Type?"]
    },
    contractAddress: {
      type: String,
      required: [false, "Why no SmartContract address?"]
    },

    email: { type: String, lowercase: true, max: 100, trim: true },
    password: { type: String, lowercase: false, trim: true },
    recoveryCode: {
      type: Number,
      default: randomNonce(),
      required: [false, "Why no recovery code?"]
    },
    fullname: { type: String, max: 200, default: "" },
    username: { type: String, default: "" },
    phone: { type: String, max: 200, default: "" },
    profile: {
      website: { type: String, max: 200, default: "", es_indexed: true },
      facebook: { type: String, max: 200, default: "" },
      linkedin: { type: String, max: 200, default: "" },
      instagram: { type: String, max: 200, default: "" },
      skype: { type: String, max: 200, default: "" },
      googlePlus: { type: String, max: 200, default: "" },
      twitter: { type: String, max: 200, default: "" },
      youtube: { type: String, max: 200, default: "" },
      pinterest: { type: String, max: 200, default: "" }
    },
    address: {
      country: { type: String, default: "" },
      state: { type: String, default: "" },
      city: { type: String, default: "" },
      street: { type: String, default: "" },
      building: { type: String, default: "" },
      zip: { type: Number, default: "" },
      geolocation: {
        longitude: { type: Number, min: -180.0, max: 180.0 },
        latitude: { type: Number, min: -90.0, max: 90.0 }
      }
    },

    viewCount: { type: Number, default: 1, es_indexed: true },
    lastAccess: [
      {
        accessDate: { type: Date },
        ipAddress: { type: String, min: 15, max: 45 }
      }
    ],
    completeProfile: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },

    activationDate: { type: Date, es_indexed: true },
    approval: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "accepted",
      es_indexed: true
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: "Admin", es_indexed: true },
    comment: { type: String },
    advertisements: [
      {
        image: { type: String },
        link: { type: String }
      }
    ],
    notifications: [
      {
        date: { type: Date, default: Date.now },
        notice: { type: String, max: 2000 },
        standing: {
          type: String,
          enum: ["unread", "read", "trashed"],
          default: "unread"
        }
      }
    ],
    review: [{ type: Schema.Types.ObjectId, ref: "Review", es_indexed: true }],
    googleAnalytics: {
      trackingId: { type: String, default: "" }
    },
    standing: {
      type: String,
      enum: ["active", "inactive", "trashed"],
      default: "active",
      es_indexed: true
    },
    onlineStatus: { type: Boolean, default: false, es_indexed: true },
    updated: { type: Date, default: Date.now, es_indexed: true },
    admin: { type: Schema.Types.ObjectId, ref: "Admin" },
    action: {
      type: String,
      enum: ["allow", "restrict", "deny"],
      default: "allow",
      es_indexed: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (obj, ret) => {
        delete ret._id;
      }
    }
  }
);

const Instructor = mongoose.model("Instructor", InstructorSchema);
export const { ObjectId } = mongoose.Types;
export default Instructor;
