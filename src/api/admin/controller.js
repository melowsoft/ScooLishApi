/**
 * @author 4Dcoder
 * @description users with administrative privilege to manage the software
 */

import Admin, { ObjectId } from "./model";
import { success, fail, notFound } from "./../../services/response/";
import * as helper from "../../services/helpers";

// Retrieve a single record with a given recordId
export function findVerify(req, res) {
  const attribute = req.params.attribute || "";
  const value = req.params.value || "";
  if (!attribute || !value) return fail(res, 400, "Error: Incorrect request parameter");
  return Admin.count({ attribute: value })
    .then((result) => {
      if (!result && result !== 0) return notFound(res, `Error: record not found with attribute ${attribute}.`);
      if (result > 0) return success(res, 200, { exists: true }, `${attribute} record with value ${value} exists.`);
      return success(res, 200, { exists: false }, `No ${attribute} record with value ${value} exists.`);
    }).catch((err) => {
      if (err.kind === "ObjectId") {
        return notFound(res, `Error counting record with attribute ${attribute}.\r\n${err.message}`);
      }
      return fail(res, 500, `Error counting record with attribute ${attribute}.\r\n${err.message}`);
    });
}

/**
 * @description findAdminById find a particular admin by id
 * @param {String} adminId admin id
 * @returns {Promise} admin object promise
 */
export function findAdminById(adminId) {
  return Admin
    .findById(adminId)
    .then((admin) => {
      if (!admin) return {};
      return admin;
    })
    .catch((err) => { throw err; });
}

// Retrieve and return all records from the database.
export function findAll(req, res) {
  return Admin.find()
    .then(result => success(res, 200, result, "retrieving record(s) was successfully!"))
    .catch(err => fail(res, 500, `Error retrieving record(s).\r\n${err.message}`));
}

// Retrieve a single record with a given recordId
export function findOne(req, res) {
  let recordId = req.params.adminId || "";
  const { userId, userType, userRole } = res.locals;
  if (!userId || !userType || !userRole) return fail(res, 400, "Invalid authentication credentials");
  if (userType !== "admin") return fail(res, 422, `Only Admins are allowed to update this record not ${userType}`);

  if (!recordId) recordId = userId;
  if (!ObjectId.isValid(recordId)) return fail(res, 422, "Invalid record Id as request parameter");
  return Admin.findById(recordId)
    .then((result) => {
      if (!result) return notFound(res, "Error record not found.");
      return success(res, 200, result, "retrieving record was successfully!");
    }).catch((err) => {
      if (err.kind === "ObjectId") {
        notFound(res, `Error retrieving record.\r\n${err.message}`);
      }
      return fail(res, 500, `Error retrieving record.\r\n${err.message}`);
    });
}

// Update record identified by the Id in the request
export async function update(req, res) {
  const data = req.body || {};
  const { userId, userType, userRole, userEmail } = res.locals;
  if (!userId || !userType || !userRole) return fail(res, 400, "Invalid authentication credentials");
  if (userType !== "admin") return fail(res, 422, `Only Admins are allowed to update this record not ${userType}`);

  // Validate request
  if (!data.phone) return fail(res, 422, "phone cannot be empty and must be alphanumeric.");
  if (!data.address) return fail(res, 422, "address cannot be empty and must be alphanumeric.");
  if (!userEmail && !data.email) return fail(res, 422, "You must provide an alphanumeric email address");

  const record = await findAdminById(userId);
  const isComplete = record.completeProfile;
  if (record.action !== "allow") {
    return fail(res, 422, "You cannot update a this record");
  }
  const newObject = {};

  if (
    record.username === ""
    &&
      helper.propertyExist(data, "username")
  ) {
    if (data.username !== "") newObject.username = data.username;
  }

  if (
    (!helper.propertyExist(record, "email")
    || record.email === "")
    &&
      helper.propertyExist(data, "email")
  ) {
    if (data.email !== "") {
      if (!userEmail) newObject.email = data.email.toLowerCase();
    }
  }

  newObject.updatedBy = userId;
  newObject.updated = Date.now();
  if (!isComplete && data.username !== "") newObject.username = data.username;
  if (data.fullname) newObject.fullname = data.fullname;
  if (data.phone) newObject.phone = data.phone;
  if (data.address) newObject.address = data.address;
  if (!isComplete && data.email !== "") {
    if (!userEmail) newObject.email = data.email.toLowerCase();
  }
  if (data.password) newObject.password = await helper.hashPassword(data.password);
  if (typeof data.onlineStatus === "boolean") newObject.onlineStatus = data.onlineStatus;
  newObject.completeProfile = true;

  // Find record and update it with id
  return Admin.findByIdAndUpdate(userId, newObject, { new: true })
    .then((result) => {
      if (!result) return notFound(res, `Error: newly submitted record not found with id ${userId}`);
      return success(res, 200, result, "Record has been created successfully!");
    })
    .catch(err => fail(res, 500, `Error updating record with id ${userId}.\r\n${err.message}`));
}

// Patch record identified by the Id in the request
export async function modify(req, res) {
  const recordId = req.params.adminId || "";
  const data = req.body || {};
  if (!recordId) return fail(res, 400, "No record Id as request parameter");
  if (!ObjectId.isValid(recordId)) return fail(res, 422, "Invalid record Id as request parameter");

  const { userId, userType, userRole } = res.locals;
  if (!userId || !userType || !userRole) return fail(res, 400, "Invalid authentication credentials");

  if (userType === "admin" && (userRole === "master" || userRole === "super")) {
    // we are cool!
  } else {
    return fail(res, 422, `Only Admin Master is allowed to update this record not ${userType} role ${userRole}`);
  }

  const record = await Admin.findById(recordId).exec();
  if (record.role === "super") {
    return fail(res, 422, "You cannot modify a super admin");
  }

  const newObject = {};
  newObject.updatedBy = userId;
  newObject.updated = Date.now();
  if (data.standing) newObject.standing = data.standing;

  if (data.role === "super") {
    return fail(res, 422, "You cannot assign a Super Admin role");
  }

  if (data.role === "master" && userRole !== "super") {
    return fail(res, 422, `Only Super Admin can assign master role not a ${userRole} admin`);
  }

  if (data.role && (["master", "support", "finance", "technical"]).indexOf(data.role) > -1) {
    newObject.role = data.role;
  }

  if (data.standing && (userRole === "super" || userRole === "master")) {
    // ok
  } else {
    return fail(res, 422, `Only Super or Master Admin can alter admin user status not ${userRole}`);
  }

  if (data.standing && (["active", "inactive", "trashed"]).indexOf(data.standing) > -1) {
    //
  } else {
    return fail(res, 422, `User status can only be "active", "inactive", or "trashed", not ${data.standing}`);
  }

  if (data.standing && (userRole === "super" || userRole === "master") &&
   (["active", "inactive", "trashed"]).indexOf(data.standing) >= 0) {
    newObject.standing = data.standing;
  } else {
    return fail(res, 422, `Only Super or Master Admin can alter admin user status not ${userRole}`);
  }

  // Find record and update it with id
  return Admin.findByIdAndUpdate(recordId, newObject, { new: true })
    .then((result) => {
      if (!result) return notFound(res, `Error: newly submitted record not found with id ${recordId}`);
      return success(res, 200, result, "New record has been created successfully!");
    })
    .catch(err => fail(res, 500, `Error updating record with id ${recordId}.\r\n${err.message}`));
}

// Delete a admin with the specified adminId in the request
export async function destroy(req, res) {
  const recordId = req.params.adminId || "";
  if (!recordId) return fail(res, 400, "No record Id as request parameter");
  if (!ObjectId.isValid(recordId)) return fail(res, 422, "Invalid record Id as request parameter");

  const { userId, userType, userRole } = res.locals;
  if (!userId || !userType || !userRole) return fail(res, 400, "Invalid authentication credentials");

  if (userType === "admin" && userRole === "super") {
    // we are cool!
  } else {
    return fail(res, 422, `Only Super Admin is allowed to delete this record not ${userType} role ${userRole}`);
  }
  return Admin.findByIdAndRemove(recordId)
    .then((record) => {
      if (!record) return notFound(res, `Record not found with id ${recordId}`);
      return success(res, 200, [], "Record deleted successfully!");
    })
    .catch((err) => {
      if (err.kind === "ObjectId" || err.name === "NotFound") {
        return notFound(res, `Error: record not found with id ${recordId}\r\n${err.message}`);
      }
      return fail(res, 500, `Error: could not delete record with id ${recordId}\r\n${err.message}`);
    });
}

// ///////////////////////////////////////////////////
// Analytics
// //////////////////////////////////////////////////

/**
 * @description First Admin user to register is given the "super" role
 * the function uses a Promise interface because unlike findById(),
 * the countDocuments of mongoose package doesn't return a promise
 */

export function countAdmin(condition) {
  return new Promise((resolve, reject) => {
    Admin.countDocuments(condition)
      .exec((err, result) => {
        if (err) reject(err);
        return resolve(result);
      });
  });
}

