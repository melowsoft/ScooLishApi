/**
 * @author 4Dcoder
 * @description cart is an instance of whislist
 * @property {Number} nonce customer authentication nonce
 * @property {String} publicAddress customer metamask address
 * @property {String} btcAddress bitcoin address
 * @property {String} wallet customer's wallet
 * @property {Array} cart [{product, quantity}] customer's cart
 * @property {Array} wishlist [{names, carts[{product, quantity}]}] customer's wishlist
 * @property {String} fullname customer's full name
 * @property {String} username customer's username
 * @property {String} gender customer's gender
 * @property {String} phone customer's phone number
 * @property {String} password customer's password
 * @property {String} email customer's email
 * @property {String} recoveryCode customer's recovery code
 * @property {String} profile customer's profile
 * @property {Array} preferences [{currency, language}] customer preferences
 * @property {Array} shipping [{country, state, city, street, building, zip}]
 * customer's shipping details
 * @property {Array} notifications [{date, notice, standing}] customer notifications
 * @property {Array} lastAccess [{accessDate, ipAddress}] details of last access
 * @property {Boolean} onlineStatus admin's online Status
 * @property {String} standing customer's account status "active", "inactive", "trashed"
 * trashed items can be restore after a while if the system has not emptied it automatically
 * @property {Date} updated date of last update
 * @property {Object} admin  The admin's ObjectId who last modified the record
 * @property {String} action  The admins' action on the record ["allow", "restrict", "deny"]
 * allow: owner can display, transact, update, modify standing or #delete record
 * restrict: owner can update, modify #delete record by cannot display or transact it
 * deny: record cannot be updated, modified, display by owner and its readonly.
 */

import mongoose, { Schema } from "mongoose";
import { randomNonce } from "./../../services/helpers";

const studentSchema = new Schema(
  {
    nonce: {
      type: Number,
      default: randomNonce(),
      required: [true, "Why no authentication nonce?"]
    },

    wallet: { type: String, default: "" },
    cart: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true
        },
        quantity: { type: Number, default: 1, required: true }
      }
    ],
    wishlist: [
      {
        date: { type: Date, default: Date.now },
        names: {
          type: String,
          trim: true,
          max: 100,
          min: [2, "Too short name"]
        },
        carts: [
          {
            product: {
              type: Schema.Types.ObjectId,
              ref: "Product",
              required: true
            },
            quantity: { type: Number, default: 1, required: true }
          }
        ]
      }
    ],
    fullname: { type: String, default: "" },
    username: { type: String },
    gender: { type: String, enum: ["male", "female"] },
    phone: { type: String, default: "" },
    password: { type: String, default: "" },
    email: { type: String, lowercase: true, max: 100, trim: true },
    photo: { type: String },
    recoveryCode: {
      type: Number,
      default: randomNonce(),
      required: [false, "Why no recovery code?"]
    },
    profile: { type: String, default: "recommendation system" },
    preferences: {
      currency: { type: Schema.Types.ObjectId, ref: "Currency" },
      language: { type: Schema.Types.ObjectId, ref: "LanguageList" }
    },

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
    lastAccess: [
      {
        accessDate: { type: Date },
        ipAddress: { type: String, min: 15, max: 45 }
      }
    ],
    onlineStatus: { type: Boolean, default: false },
    standing: {
      type: String,
      enum: ["active", "inactive", "trashed"],
      default: "active"
    },
    updated: { type: Date, default: Date.now },
    admin: { type: Schema.Types.ObjectId, ref: "Admin" },
    action: {
      type: String,
      enum: ["allow", "restrict", "deny"],
      default: "allow"
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

const Student = mongoose.model("Student", studentSchema);
export const { ObjectId } = mongoose.Types;
export default Student;
