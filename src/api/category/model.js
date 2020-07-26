/**
 *
 * @property {String} name Category's name or title
 * @property {String} description  category description
 * @property {String} kind  category type (digital/physical)
 * @property {String} icon  category icon
 * @property {String} banner  category banner
 * @property {String} parent  parent category
 * @property {Object} vendor  vendor that created category
 * @property {Number} viewCount  number of views
 * @property {String} standing  status of category "active", "inactive", "trashed"
 * trashed items can be restore after a while if the system has not emptied it automatically
 * @property {Date} updated date of last update
 * @property {Object} admin  The admin's ObjectId who last modified the record
 * @property {String} action  The admins' action on the record ["allow", "restrict", "deny"]
 * allow: owner can display, transact, update, modify standing or #delete record
 * restrict: owner can update, modify #delete record by cannot display or transact it
 * deny: record cannot be updated, modified, display by owner and its readonly.
 */

import mongoose, { Schema } from "mongoose";

const CategorySchema = new Schema(
  {
    name: { type: String, required: [true, "Why no name?"], es_indexed: true },
    description: {
      type: String,
      required: [true, "Why no description?"],
      es_indexed: true
    },

    banner: {
      type: String,
      required: [false, "Why no banner?"],
      es_indexed: true
    },
    parent: { type: String, default: "0", es_indexed: true },
    instructor: {
      type: Schema.Types.ObjectId,
      ref: "Instructor",
      es_indexed: true
    },

    standing: {
      type: String,
      enum: ["active", "inactive", "trashed"],
      default: "active",
      es_indexed: true
    },
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

const model = mongoose.model("Category", CategorySchema);

export const { schema } = model.schema;
export const { ObjectId } = mongoose.Types;
export default model;
