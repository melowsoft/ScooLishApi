/**
 *
 * @description Currency is infered from the vendor currency preferences for all vendor courses
 * courses with the same parent names are siblings or varaity options
 * @property {String} code course code
 * @property {String} sku course sku
 * @property {String} upc course upc
 * @property {String} name name of course
 * @property {Schema.Types.ObjectId} vendor vendorID that created course
 * @property {Array} category [{main, sub}] course category
 * @property {Schema.Types.ObjectId} brand brandID
 * @property {Array} description [{color, unit, long, short, tag}] course description
 * @property {Number} shipmentWaitTime The amount of time in hours it will take for
 *  the course to be shipped
 * @property {Array} variety [{options, parent}] course variety
 * @property {Array} price [{deal, valuation, unitPrice, costPrice, slashPrice,
 *  discount, discountType, tax, taxType}]
 * @property {Array} images [{image_sm, image_md, image_lg, image_front, image_back,
 *  image_top, image_bottom, image_right,
 * image_left, icon}] course images
 * @property {Array} shippingDetails [{cost, weight, length, width, height}] shipping details
 * @property {Array} manufactureDetails [{make, model, releaseDate}] manufacturing details
 * @property {Array} download [{downloadable, downloadName}] download details
 * @property {Number} available [{name, value}] extra fields
 * @property {Array} extraFields [{name, value}] extra fields
 * @property {Array} approval [{approved, approvedBy, approvedById, comment}] approval details
 * @property {Array} analytics [{feature, viewDate, viewCount }]
 * @property {String} standing course display status "active", "inactive", "trashed"
 * trashed items can be restore after a while if the system has not emptied it automatically
 * @property {Date} updated last update date
 * @property {Boolean} action course action by admin, default is true. When false,
 *  course cannot be updated
 * @property {Object} admin  The admin's ObjectId who last modified the record
 * @property {String} action  The admins' action on the record ["allow", "restrict", "deny"]
 * allow: owner can display, transact, update, modify standing or #delete record
 * restrict: owner can update, modify #delete record by cannot display or transact it
 * deny: record cannot be updated, modified, display by owner and its readonly.
 */

import mongoose, { Schema } from "mongoose";

import { randomNum } from "./../../services/helpers";

const CourseSchema = new Schema(
  {
    code: {
      type: String,
      unique: true,
      required: [true, "Why no Code?"],
      default: randomNum(),
      es_indexed: true
    },

    name: {
      type: String,
      required: [true, "Why no course name?"],
      max: 200,
      es_indexed: true
    },

    instructor: {
      type: Schema.Types.ObjectId,
      ref: "Instructor",
      required: [true, "Why no instructor?"],
      es_indexed: true
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Why no category?"],
      es_indexed: true
    },

    description: {
      type: String,
      required: [true, "Why no Description?"],
      max: 5000
    },

    descriptionTag: { type: Array, default: [], es_indexed: true },

    price: {
      deal: {
        type: Boolean,
        required: [false, "Why no Deal?"],
        default: false,
        es_indexed: true
      },

      unitPrice: {
        type: Number,
        required: [true, "Why no Unit price?"],
        es_indexed: true
      },

      slashPrice: { type: Number, es_indexed: true },
      discount: {
        type: Number,
        required: [false, "Why no Discount?"],
        default: 0.0,
        es_indexed: true
      }
    },
    image: {
      type: String,
      default: "",
      es_indexed: true
    },
    videos: {
      type: Array,
      default: [],
      es_indexed: true
    },

    download: {
      downloadable: {
        type: Boolean,
        required: [false, "Why no Download?"],
        default: false,
        es_indexed: true
      },
      downloadName: {
        type: String,
        default: "Bezop-course-Download",
        es_indexed: true
      }
    },

    approvalAdmin: {
      approved: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending",
        es_indexed: true
      },
      approvedBy: {
        type: Schema.Types.ObjectId,
        ref: "Admin",
        es_indexed: true
      },
      comment: { type: String }
    },
    approval: {
      type: Schema.Types.ObjectId,
      ref: "Approval",
      es_indexed: true
    },
    approved: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "accepted",
      es_indexed: true
    },
    analytics: {
      feature: { type: Boolean, default: false, es_indexed: true },
      advertise: { type: Boolean, default: false, es_indexed: true },
      viewDate: { type: Date, default: Date.now, es_indexed: true },
      viewCount: { type: Number, default: 1, es_indexed: true },
      totalSold: { type: Number, default: 1, es_indexed: true },
      totalOrdered: { type: Number, default: 1, es_indexed: true }
    },
    review: [{ type: Schema.Types.ObjectId, ref: "Review", es_indexed: true }],
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

const Course = mongoose.model("Course", CourseSchema);
export const { ObjectId } = mongoose.Types;
export default Course;
