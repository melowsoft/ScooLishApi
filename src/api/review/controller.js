
import Review, { ObjectId } from "./model";
import { success, fail, notFound } from "./../../services/response";
import Product from "../product/model";
import Category from "../category/model";
import Brand from "../brand/model";
import Vendor from "../vendor/model";
import Order from "../order/model";
import Blog from "../blog/model";
import Ticket from "../ticket/model";

// Returns the id, subjectId, comment and rating for all matching review subjects
export function findAllReviews(subject) {
  return Review.find({ subject })
    .select("id subjectId comment rating")
    .then(review => review)
    .catch((err) => {
      throw err;
    });
}

// Find a single review with a given product id
export function findReviewById(id) {
  return Review
    .findById(id)
    .then((result) => {
      if (!result) return {};
      return result;
    })
    .catch((err) => { throw err; });
}

// Find all review for a given vendor
export function findReviewByVendor(vendor) {
  return Review.find({ vendor })
    .then((result) => {
      if (!result) return {};
      return result;
    })
    .catch((err) => { throw err; });
}

// Find all ratings for a given vendor
export function findRatingByVendor(vendor) {
  return Review.find({ vendor })
    .select("rating")
    .then((result) => {
      if (!result) return 0;
      return result;
    })
    .catch((err) => { throw err; });
}

// Retrieve and return all records from the database.
export function findAll(req, res) {
  return Review.find()
    .populate({ path: "customer", select: "id fullname", match: { standing: "active" } })
    .populate({ path: "vendor", select: "id fullname", match: { standing: "active" } })
    .then(result => success(res, 200, result, "retrieving record(s) was successfully!"))
    .catch(err => fail(res, 500, `Error retrieving record(s).\r\n${err.message}`));
}

// Retrieve a single record with a given recordId
export function findOne(req, res) {
  const recordId = req.params.reviewId || "";
  if (!recordId) return fail(res, 400, "No record Id as request parameter");
  if (!ObjectId.isValid(recordId)) return fail(res, 422, "Invalid record Id as request parameter");
  return Review.findById(recordId)
    .populate({ path: "customer", select: "id fullname", match: { standing: "active" } })
    .populate({ path: "vendor", select: "id fullname", match: { standing: "active" } })
    .then((result) => {
      if (!result) return notFound(res, `Error: record not found with id ${recordId}.`);
      return success(res, 200, result, `retrieving record was successfully with id ${recordId}.`);
    })
    .catch((err) => {
      if (err.kind === "ObjectId") {
        notFound(res, `Error retrieving record with id ${recordId}.\r\n${err.message}`);
      }
      return fail(res, 500, `Error retrieving record with id ${recordId}.\r\n${err.message}`);
    });
}

// Create and Save a new record
export function create(req, res) {
  const data = req.body || {};
  const { userId, userType } = res.locals;

  if (!(userType === "customer" || userType === "vendor")) {
    return fail(res, 422, `${userType}'s Id  should be specified and not ${userId}`);
  }
  // Validate request
  if (!data.subject) return fail(res, 422, "subject cannot be empty");
  if (!(["product", "category", "brand", "vendor", "order", "blog", "ticket"].includes(data.subject))) {
    return fail(res, 422, "subject must be either of product, category, brand, vendor, or order");
  }
  if (!data.subjectId) return fail(res, 422, "subjectId cannot be empty");
  if (!ObjectId.isValid(data.subjectId)) return fail(res, 422, "Invalid subject Id");
  if (data.rating) {
    if (!(Number(data.rating) > 0 && Number(data.rating) < 6)) {
      return fail(res, 422, "rating must be between [1 and 5].");
    }
  }

  const newObject = {};
  newObject.subject = data.subject;
  newObject.subjectId = data.subjectId;
  if (userType === "customer") newObject.customer = userId;
  if (userType === "vendor") newObject.vendor = userId;
  if (data.comment) newObject.comment = data.comment;
  if (data.rating) newObject.rating = data.rating;

  let Model;

  switch (data.subject) {
    case "product": Model = Product;
      break;
    case "category": Model = Category;
      break;
    case "brand": Model = Brand;
      break;
    case "vendor": Model = Vendor;
      break;
    case "order": Model = Order;
      break;
    case "blog": Model = Blog;
      break;
    case "ticket": Model = Ticket;
      break;
    default: Model = null;
  }

  // Create a record
  const record = new Review(newObject);

  // Save Product in the database
  return record.save()
    .then((result) => {
      if (!result) return notFound(res, "Error: newly submitted record not found");
      return Model.findOneAndUpdate(
        { _id: data.subjectId },
        { $addToSet: { review: result } }, (error, savedRecord) => {
          if (error) {
            return fail(res, 500, `Error adding record with id ${data.subjectId}. ${error.message}`);
          }
          return success(res, 200, result, "New record has been created successfully!");
        },
      );
    })
    .catch(err => fail(res, 500, `Error creating record. ${err.message}`));
}


// Update record identified by the Id in the request
export function update(req, res) {
  const recordId = req.params.reviewId || "";
  if (!recordId) return fail(res, 400, "No record Id as request parameter");
  if (!ObjectId.isValid(recordId)) return fail(res, 422, "Invalid record Id as request parameter");
  const data = req.body || {};
  const { userId, userType } = res.locals;

  if (!(userType === "customer" || userType === "vendor")) {
    return fail(res, 422, `${userType}'s Id  should be specified and not ${userId}`);
  }
  // Validate request
  if (!data.subject) return fail(res, 422, "subject cannot be empty");
  if (!(["product", "category", "brand", "vendor", "order", "blog", "ticket"].includes(data.subject))) {
    return fail(res, 422, "subject must be either of product, category, brand, vendor, stock, or order");
  }
  if (!data.subjectId) return fail(res, 422, "subjectId cannot be empty");
  if (!ObjectId.isValid(data.subjectId)) return fail(res, 422, "Invalid subject Id");
  if (data.rating) {
    if (!(Number(data.rating) > 0 && Number(data.rating) < 6)) return fail(res, 422, "rating must be between [1 and 5].");
  }
  const newObject = {};
  newObject.subject = data.subject;
  newObject.subjectId = data.subjectId;
  if (userType === "customer") newObject.customer = userId;
  if (userType === "vendor") newObject.vendor = userId;
  if (data.comment) newObject.comment = data.comment;
  if (data.rating) newObject.rating = data.rating;

  // Find record and update it with id
  return Review.findByIdAndUpdate(recordId, newObject, { new: true })
    .then((result) => {
      if (!result) return notFound(res, `Error: newly submitted record not found with id ${recordId}`);
      return success(res, 200, result, "New record has been created successfully!");
    })
    .catch(err => fail(res, 500, `Error updating record with id ${recordId}.\r\n${err.message}`));
}

// Patch record identified by the Id in the request
export function modify(req, res) {
  const recordId = req.params.categoryId || "";
  if (!recordId) return fail(res, 400, "No record Id as request parameter");
  if (!ObjectId.isValid(recordId)) return fail(res, 422, "Invalid record Id as request parameter");
  const data = req.body || {};
  const { userId, userType } = res.locals;

  if (userType === "admin") {
    // OK
  } else {
    return fail(res, 422, `Only Admins are allowed to modify this record not ${userType}`);
  }

  // Validate request
  if (!data.standing) return fail(res, 422, "Review status cannot be empty");
  if (!(["active", "inactive", "trashed"].includes(data.subject))) {
    return fail(res, 422, "Review status must be either of \"active\", \"inactive\", \"trashed\"");
  }
  if (data.action) {
    if (!(["allow", "restrict", "deny"].includes(data.action))) {
      return fail(res, 422, "Review action must be either of \"allow\", \"restrict\", \"deny\"");
    }
  }
  const newObject = {};
  newObject.admin = userId;
  newObject.update = Date.now();
  if (data.standing) newObject.standing = data.standing;
  if (data.action) newObject.action = data.action;


  // Find record and update it with id
  return Review.findByIdAndUpdate(recordId, newObject, { new: true })
    .then((result) => {
      if (!result) return notFound(res, `Error: newly submitted record not found with id ${recordId}`);
      return success(res, 200, result, "New record has been created successfully!");
    })
    .catch(err => fail(res, 500, `Error updating record with id ${recordId}.\r\n${err.message}`));
}

// Delete a review with the specified reviewId in the request
export async function destroy(req, res) {
  const recordId = req.params.reviewId || "";

  if (!recordId) return fail(res, 400, "No record Id as request parameter");
  if (!ObjectId.isValid(recordId)) return fail(res, 422, "Invalid record Id as request parameter");

  const record = await findReviewById(recordId);
  let Model;

  switch (record.subject) {
    case "product": Model = Product;
      break;
    case "category": Model = Category;
      break;
    case "brand": Model = Brand;
      break;
    case "vendor": Model = Vendor;
      break;
    case "order": Model = Order;
      break;
    case "blog": Model = Order;
      break;
    case "ticket": Model = Ticket;
      break;
    default: Model = null;
  }


  return Review.findByIdAndRemove(recordId)
    .then((result) => {
      if (!result) return notFound(res, `Record not found with id ${recordId}`);
      return Model.findOneAndUpdate(
        { _id: record.subjectId },
        { $pull: { review: recordId } }, (error, savedRecord) => {
          if (error) {
            return fail(res, 500, `Failed to delete ${record.subject} review with id ${recordId}. ${error.message}`);
          }
          return success(res, 200, savedRecord, "Record deleted successfully!");
        },
      );
    })
    .catch((err) => {
      if (err.kind === "ObjectId" || err.name === "NotFound") {
        return notFound(res, `Error: record not found with id ${recordId}\r\n${err.message}`);
      }
      return fail(res, 500, `Error: could not delete record with id ${recordId}\r\n${err.message}`);
    });
}
