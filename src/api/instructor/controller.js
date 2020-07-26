import Vendor, { ObjectId } from "./model";
import { success, fail, notFound } from "../../services/response/index";
import { getProperty, propertyExist } from "../../services/helpers";
import { searchModelWithFilter } from "../../services/search";
import { findCourseByVendor } from "../course/controller";

// Find searched Vendor
export async function search(req, res) {
  const quest = req.query.q || "";
  const { from, size } = req.query;
  if (!quest) return fail(res, 422, `Why incorrect query string ${quest}?`);
  let results;
  try {
    results = await searchModelWithFilter(
      Vendor,
      quest,
      { approval: "pending" },
      { approved: "rejected" },
      { from, size, fields: ["businessName", "domainName"] }
    );
  } catch (err) {
    return fail(res, 500, "Error retrieving record(s). Search index not found");
  }
  const records = results.hits.hits;
  const counts = parseInt(results.hits.total, 10);
  if (!(counts > 0)) return notFound(res, `${counts} record found!`);
  // Substitute review id with review object and map object to mongoose form
  try {
    const newRecords = await Promise.all(
      records
        .filter(record => record !== undefined) // to avoid elasticsearch return of nullable values
        .map(async record => {
          // eslint-disable-next-line no-underscore-dangle
          const source = record._source;
          const newRecord = Object.assign({}, source);
          newRecord.id = record._id;
          // eslint-disable-next-line no-underscore-dangle
          newRecord._esScore = record._score;
          newRecord.businessName = source.businessName;
          newRecord.domainName = source.domainName;
          const { logo, description } = source.frontend;
          newRecord.frontend = { logo, description };
          return newRecord;
        })
    );
    return success(
      res,
      200,
      newRecords,
      `retrieved ${newRecords.length} record(s) successfully!`
    );
  } catch (err) {
    return fail(res, 500, `Error retrieving record(s).\r\n${err.message}`);
  }
}

// Retrieve and return all records from the database.
export function findAll(req, res) {
  return (
    Vendor.find()
      // eslint-disable-next-line object-property-newline
      .select({
        updated: true,
        onlineStatus: true,
        review: true,
        advertisements: true,
        // eslint-disable-next-line object-property-newline
        businessVerified: true,
        viewCount: true,
        templateChat: true,
        templateTicket: true,
        templateInvoice: true,
        templateMail: true,
        // eslint-disable-next-line object-property-newline
        templateBlog: true,
        templateProfile: true,
        templateProductDetail: true,
        templateProduct: true,
        templateHome: true,
        template: true,
        // eslint-disable-next-line object-property-newline
        frontend: true,
        address: true,
        profile: true,
        domainName: true,
        businessName: true,
        contractAddress: true
      })
      .populate({
        path: "review",
        select: "id subjectId comment rating",
        match: { standing: "active" }
      })
      .populate({ path: "products", match: { standing: "active" } })
      .populate({
        path: "currency",
        select: "id name code kind exchange symbol icon",
        match: { standing: "active" }
      })
      .populate({
        path: "language",
        select: "id name dbField icon",
        match: { standing: "active" }
      })
      .populate({ path: "templateHome.layout" })
      .populate({ path: "templateProduct.layout" })
      .populate({ path: "templateProductDetail.layout" })
      .populate({ path: "templateProfile.layout" })
      .populate({ path: "templateBlog.layout" })
      .populate({ path: "templateMail.layout" })
      .populate({ path: "templateInvoice.layout" })
      .populate({ path: "templateTicket.layout" })
      .populate({ path: "templateChat.layout" })
      .then(result =>
        success(res, 200, result, "retrieving record(s) was successfully!")
      )
      .catch(err =>
        fail(res, 500, `Error retrieving record(s).\r\n${err.message}`)
      )
  );
}
// Retrieve and return all Vendor Stat records from the database.
export function findStatRecords(req, res) {
  return (
    Vendor.find()
      // eslint-disable-next-line object-property-newline
      .select({
        updated: true,
        onlineStatus: true,
        review: true,
        advertisements: true,
        // eslint-disable-next-line object-property-newline
        businessVerified: true,
        viewCount: true,
        templateChat: true,
        templateTicket: true,
        templateInvoice: true,
        templateMail: true,
        // eslint-disable-next-line object-property-newline
        templateBlog: true,
        templateProfile: true,
        templateProductDetail: true,
        templateProduct: true,
        templateHome: true,
        template: true,
        // eslint-disable-next-line object-property-newline
        frontend: true,
        address: true,
        profile: true,
        domainName: true,
        businessName: true,
        contractAddress: true
      })
      .populate({
        path: "review",
        select: "id subjectId comment rating",
        match: { standing: "active" }
      })
      .populate({ path: "products", match: { standing: "active" } })
      .populate({
        path: "currency",
        select: "id name code kind exchange symbol icon",
        match: { standing: "active" }
      })
      .populate({
        path: "language",
        select: "id name dbField icon",
        match: { standing: "active" }
      })
      .populate({ path: "templateHome.layout" })
      .populate({ path: "templateProduct.layout" })
      .populate({ path: "templateProductDetail.layout" })
      .populate({ path: "templateProfile.layout" })
      .populate({ path: "templateBlog.layout" })
      .populate({ path: "templateMail.layout" })
      .populate({ path: "templateInvoice.layout" })
      .populate({ path: "templateTicket.layout" })
      .populate({ path: "templateChat.layout" })
      .then(result => {
        const vendorCountry = [];
        const vendorArray = result.map(vendor =>
          vendorCountry.push(vendor.address.country)
        );

        const resArray = {
          vendorCountry
        };
        success(res, 200, resArray, "retrieving record(s) was successfully!");
      })
      .catch(err =>
        fail(res, 500, `Error retrieving record(s).\r\n${err.message}`)
      )
  );
}

// Retrieve a single record with a given recordId
export function findOne(req, res) {
  const { userId, userType, userRole } = res.locals;
  if (!userId || !userType || !userRole) {
    return fail(res, 400, "Invalid authentication credentials");
  }
  if (userType !== "vendor") {
    return fail(
      res,
      422,
      `Only Vendors are allowed to retrieve this record not ${userType}`
    );
  }
  const recordId = req.params.vendorId || "";
  if (!recordId) return fail(res, 400, "No record Id as request parameter");
  if (!ObjectId.isValid(recordId)) {
    return fail(res, 422, "Invalid record Id as request parameter");
  }
  return Vendor.findById(recordId)
    .populate({
      path: "review",
      select: "id subjectId comment rating",
      match: { standing: "active" }
    })
    .populate({ path: "products", match: { standing: "active" } })
    .populate({
      path: "currency",
      select: "id name code kind exchange symbol icon",
      match: { standing: "active" }
    })
    .populate({
      path: "language",
      select: "id name dbField icon",
      match: { standing: "active" }
    })
    .populate({
      path: "templateHome.layout",
      select: "id name page style placeholders",
      match: { standing: "active" }
    })
    .populate({
      path: "templateProduct.layout",
      select: "id name page style placeholders",
      match: { standing: "active" }
    })
    .populate({
      path: "templateProductDetail.layout",
      select: "id name page style placeholders",
      match: { standing: "active" }
    })
    .populate({
      path: "templateProfile.layout",
      select: "id name page style placeholders",
      match: { standing: "active" }
    })
    .populate({
      path: "templateBlog.layout",
      select: "id name page style placeholders",
      match: { standing: "active" }
    })
    .populate({
      path: "templateMail.layout",
      select: "id name page style placeholders",
      match: { standing: "active" }
    })
    .populate({
      path: "templateInvoice.layout",
      select: "id name page style placeholders",
      match: { standing: "active" }
    })
    .populate({
      path: "templateTicket.layout",
      select: "id name page style placeholders",
      match: { standing: "active" }
    })
    .populate({
      path: "templateChat.layout",
      select: "id name page style placeholders",
      match: { standing: "active" }
    })
    .then(result => {
      if (!result) {
        return notFound(res, `Error: record not found with id ${recordId}.`);
      }
      return success(
        res,
        200,
        result,
        `retrieving record was successfully with id ${recordId}.`
      );
    })
    .catch(err => {
      if (err.kind === "ObjectId") {
        notFound(
          res,
          `Error retrieving record with id ${recordId}.\r\n${err.message}`
        );
      }
      return fail(
        res,
        500,
        `Error retrieving record with id ${recordId}.\r\n${err.message}`
      );
    });
}

// Retrieve a single record with a given recordId
export function findOneForAdmin(req, res) {
  const { userId, userType, userRole } = res.locals;
  if (!userId || !userType || !userRole) {
    return fail(res, 400, "Invalid authentication credentials");
  }
  if (userType !== "admin") {
    return fail(
      res,
      422,
      `Only Admins are allowed to retrieve this record not ${userType}`
    );
  }
  const recordId = req.params.vendorId || "";
  if (!recordId) return fail(res, 400, "No record Id as request parameter");
  if (!ObjectId.isValid(recordId)) {
    return fail(res, 422, "Invalid record Id as request parameter");
  }
  return (
    Vendor.findById(recordId)
      // eslint-disable-next-line object-property-newline
      .select({
        updated: true,
        onlineStatus: true,
        review: true,
        advertisements: true,
        // eslint-disable-next-line object-property-newline
        businessVerified: true,
        viewCount: true,
        templateChat: true,
        templateTicket: true,
        templateInvoice: true,
        templateMail: true,
        // eslint-disable-next-line object-property-newline
        templateBlog: true,
        templateProfile: true,
        templateProductDetail: true,
        templateProduct: true,
        templateHome: true,
        template: true,
        // eslint-disable-next-line object-property-newline
        frontend: true,
        address: true,
        profile: true,
        domainName: true,
        businessName: true,
        contractAddress: true
      })
      .populate({
        path: "review",
        select: "id subjectId comment rating",
        match: { standing: "active" }
      })
      .then(result => {
        if (!result) {
          return notFound(res, `Error: record not found with id ${recordId}.`);
        }
        return success(
          res,
          200,
          result,
          `retrieving record was successfully with id ${recordId}.`
        );
      })
      .catch(err => {
        if (err.kind === "ObjectId") {
          notFound(
            res,
            `Error retrieving record with id ${recordId}.\r\n${err.message}`
          );
        }
        return fail(
          res,
          500,
          `Error retrieving record with id ${recordId}.\r\n${err.message}`
        );
      })
  );
}

/**
 * @description findOneDomain
 * @param {Object} req http request object
 * @param {Object} res http request object returns
 * @requires {String} domainName as req parametr
 */
// Retrieve a single record with a given domainName
export function findOneDomain(req, res) {
  const domainName = req.params.domainName || "";
  if (!domainName)
    return fail(res, 400, "No record domain as request parameter");

  return (
    Vendor.findOne({ domainName })
      // eslint-disable-next-line object-property-newline
      .select({
        updated: true,
        onlineStatus: true,
        review: true,
        advertisements: true,
        // eslint-disable-next-line object-property-newline
        businessVerified: true,
        viewCount: true,
        templateChat: true,
        templateTicket: true,
        templateInvoice: true,
        templateMail: true,
        // eslint-disable-next-line object-property-newline
        templateBlog: true,
        templateProfile: true,
        templateProductDetail: true,
        templateProduct: true,
        templateHome: true,
        template: true,
        // eslint-disable-next-line object-property-newline
        frontend: true,
        address: true,
        profile: true,
        domainName: true,
        businessName: true,
        contractAddress: true
      })
      .populate({
        path: "review",
        select: "id subjectId comment rating",
        match: { standing: "active" }
      })
      .populate({
        path: "language",
        select: "id name dbField icon",
        match: { standing: "active" }
      })
      .populate({
        path: "templateHome.layout",
        select: "id name page style placeholders",
        match: { standing: "active" }
      })
      .populate({
        path: "templateProduct.layout",
        select: "id name page style placeholders",
        match: { standing: "active" }
      })
      .populate({
        path: "templateProductDetail.layout",
        select: "id name page style placeholders",
        match: { standing: "active" }
      })
      .populate({
        path: "templateProfile.layout",
        select: "id name page style placeholders",
        match: { standing: "active" }
      })
      .populate({
        path: "templateBlog.layout",
        select: "id name page style placeholders",
        match: { standing: "active" }
      })
      .populate({
        path: "templateMail.layout",
        select: "id name page style placeholders",
        match: { standing: "active" }
      })
      .populate({
        path: "templateInvoice.layout",
        select: "id name page style placeholders",
        match: { standing: "active" }
      })
      .populate({
        path: "templateTicket.layout",
        select: "id name page style placeholders",
        match: { standing: "active" }
      })
      .populate({
        path: "templateChat.layout",
        select: "id name page style placeholders",
        match: { standing: "active" }
      })
      .then(result => {
        if (!result) {
          return notFound(
            res,
            `Error: record not found with domain ${domainName}.`
          );
        }
        return success(
          res,
          200,
          result,
          `retrieving record was successfully with domain ${domainName}.`
        );
      })
      .catch(err => {
        if (err.kind === "ObjectId") {
          notFound(
            res,
            `Error retrieving record with domain ${domainName}.\r\n${
              err.message
            }`
          );
        }
        return fail(
          res,
          500,
          `Error retrieving record with domain ${domainName}.\r\n${err.message}`
        );
      })
  );
}

/**
 * @description findVendorById find a particular vendor by id
 * @param {String} vendorId vendor id
 * @returns {Promise} vendor object promise
 */
export function findVendorById(vendorId) {
  return (
    Vendor.findById(vendorId)
      // eslint-disable-next-line object-property-newline
      .select({
        updated: true,
        onlineStatus: true,
        review: true,
        advertisements: true,
        // eslint-disable-next-line object-property-newline
        businessVerified: true,
        viewCount: true,
        templateChat: true,
        templateTicket: true,
        templateInvoice: true,
        templateMail: true,
        // eslint-disable-next-line object-property-newline
        templateBlog: true,
        templateProfile: true,
        templateProductDetail: true,
        templateProduct: true,
        templateHome: true,
        template: true,
        // eslint-disable-next-line object-property-newline
        frontend: true,
        address: true,
        profile: true,
        domainName: true,
        businessName: true,
        contractAddress: true
      })
      .populate({
        path: "review",
        select: "id subjectId comment rating",
        match: { standing: "active" }
      })
      .populate({ path: "products", match: { standing: "active" } })
      .populate({
        path: "currency",
        select: "id name code kind exchange symbol icon",
        match: { standing: "active" }
      })
      .populate({
        path: "language",
        select: "id name dbField icon",
        match: { standing: "active" }
      })
      .populate({
        path: "templateHome.layout",
        select: "id name page style placeholders",
        match: { standing: "active" }
      })
      .populate({
        path: "templateProduct.layout",
        select: "id name page style placeholders",
        match: { standing: "active" }
      })
      .populate({
        path: "templateProductDetail.layout",
        select: "id name page style placeholders",
        match: { standing: "active" }
      })
      .populate({
        path: "templateProfile.layout",
        select: "id name page style placeholders",
        match: { standing: "active" }
      })
      .populate({
        path: "templateBlog.layout",
        select: "id name page style placeholders",
        match: { standing: "active" }
      })
      .populate({
        path: "templateMail.layout",
        select: "id name page style placeholders",
        match: { standing: "active" }
      })
      .populate({
        path: "templateInvoice.layout",
        select: "id name page style placeholders",
        match: { standing: "active" }
      })
      .populate({
        path: "templateTicket.layout",
        select: "id name page style placeholders",
        match: { standing: "active" }
      })
      .populate({
        path: "templateChat.layout",
        select: "id name page style placeholders",
        match: { standing: "active" }
      })
      .then(vendor => {
        if (!vendor) return {};
        return vendor;
      })
      .catch(err => {
        throw err;
      })
  );
}

// Returns the id, domain name and country of all vendors
export function findAllVendors() {
  return Vendor.find()
    .select("id domainName address.country")
    .then(vendor => vendor)
    .catch(err => {
      throw err;
    });
}

// Find a single vendor with a domainName
export function findVendorByDomain(domainName) {
  return (
    Vendor.findOne({ domainName })
      // eslint-disable-next-line object-property-newline
      .select({
        updated: true,
        onlineStatus: true,
        review: true,
        advertisements: true,
        // eslint-disable-next-line object-property-newline
        businessVerified: true,
        viewCount: true,
        templateChat: true,
        templateTicket: true,
        templateInvoice: true,
        templateMail: true,
        // eslint-disable-next-line object-property-newline
        templateBlog: true,
        templateProfile: true,
        templateProductDetail: true,
        templateProduct: true,
        templateHome: true,
        template: true,
        // eslint-disable-next-line object-property-newline
        frontend: true,
        address: true,
        profile: true,
        domainName: true,
        businessName: true,
        contractAddress: true
      })
      .populate({
        path: "review",
        select: "id subjectId comment rating",
        match: { standing: "active" }
      })
      .populate({ path: "products", match: { standing: "active" } })
      .populate({
        path: "currency",
        select: "id name code kind exchange symbol icon",
        match: { standing: "active" }
      })
      .populate({
        path: "language",
        select: "id name dbField icon",
        match: { standing: "active" }
      })
      .then(vendor => {
        if (!vendor) return false;
        return vendor;
      })
      .catch(err => {
        throw err;
      })
  );
}

// Retrieve a single record with a given recordId
export function findVerify(req, res) {
  const attribute = req.params.attribute || "";
  const value = req.params.value || "";
  if (!attribute || !value) {
    return fail(res, 400, "Error: Incorrect request parameter");
  }
  return Vendor.count({ attribute: value })
    .then(result => {
      if (!result && result !== 0) {
        return notFound(
          res,
          `Error: record not found with attribute ${attribute}.`
        );
      }
      if (result > 0) {
        return success(
          res,
          200,
          { exists: true },
          `${attribute} record with value ${value} exists.`
        );
      }
      return success(
        res,
        200,
        { exists: false },
        `No ${attribute} record with value ${value} exists.`
      );
    })
    .catch(err => {
      if (err.kind === "ObjectId") {
        notFound(
          res,
          `Error counting record with attribute ${attribute}.\r\n${err.message}`
        );
      }
      return fail(
        res,
        500,
        `Error counting record with attribute ${attribute}.\r\n${err.message}`
      );
    });
}

// Update record identified by the Id in the request
export async function update(req, res) {
  const data = req.body || {};
  const { userId, userType, userRole, userEmail } = res.locals;
  if (!userId || !userType || !userRole)
    return fail(res, 400, "Invalid authentication credentials");

  const vendorId = userId;
  if (userType !== "vendor") {
    return fail(
      res,
      422,
      `Only Vendors are allowed to update this record not ${userType}`
    );
  }
  // Validate request
  if (!userEmail && !data.email) {
    return fail(res, 422, "You must provide an alphanumeric email address");
  }

  let tempVendor;
  try {
    tempVendor = await Vendor.findById(vendorId);
  } catch (err) {}

  const newObject = {};
  if (data.fullname) newObject.fullname = data.fullname;
  if (data.phone) newObject.phone = data.phone;
  if (data.email && !userEmail && !tempVendor.email) {
    newObject.email = data.email;
  } else newObject.email = tempVendor.email;
  if (data.password) newObject.password = data.password;
  if (data.username) newObject.username = data.username;
  if (data.gender) newObject.gender = data.gender;
  if (data.wallet) newObject.wallet = data.wallet;
  if (data.businessName && !tempVendor.businessName) {
    newObject.businessName = data.businessName;
  } else newObject.businessName = tempVendor.businessName;
  if (data.recoveryCode) newObject.recoveryCode = data.recoveryCode;

  if (
    data.wishlist &&
    typeof data.wishlist === "object" &&
    data.wishlist[0].names &&
    data.wishlist[0].carts &&
    typeof data.wishlist[0].carts === "object"
  ) {
    let fieldName = "";
    let fieldCart = {};
    const fieldArray = [];
    data.wishlist.forEach((item, index, array) => {
      if (typeof item === "object" && item.name && item.cart) {
        fieldName = data.wishlist[index].name;
        fieldCart = data.wishlist[index].cart;
        fieldArray.push({ names: fieldName, carts: fieldCart });
      }
    });
    newObject.wishlist = {};
    newObject.wishlist = fieldArray;
  }

  if (
    data.cart &&
    typeof data.cart === "object" &&
    data.cart[0].product &&
    data.cart[0].quantity
  ) {
    let fieldProduct;
    let fieldQuantity;
    const fieldArray = [];
    data.cart.forEach((item, index, array) => {
      if (typeof item === "object" && item.product && item.quantity) {
        fieldProduct = data.cart[index].product;
        fieldQuantity = data.cart[index].quantity;
        fieldArray.push({ product: fieldProduct, quantity: fieldQuantity });
      }
    });
    newObject.cart = {};
    newObject.cart = fieldArray;
  }

  if (typeof data.completeProfile === "boolean") {
    newObject.completeProfile = data.completeProfile;
  }
  if (typeof data.emailVerified === "boolean") {
    newObject.emailVerified = data.emailVerified;
  }
  if (typeof data.domainNameSet === "boolean") {
    newObject.domainNameSet = data.domainNameSet;
  }
  if (typeof data.businessVerified === "boolean") {
    newObject.businessVerified = data.businessVerified;
  }

  if (data.preferences) {
    newObject.preferences = {};
    if (data.preferences.currency) {
      newObject.preferences.currency = data.preferences.currency;
    }
    if (data.preferences.language) {
      newObject.preferences.language = data.preferences.language;
    }
  }

  if (data.address) {
    newObject.address = {};
    if (
      data.address.country &&
      (tempVendor.address && !tempVendor.address.country)
    ) {
      newObject.address.country = data.address.country;
    } else newObject.address.country = tempVendor.address.country;

    if (data.address.state) newObject.address.state = data.address.state;
    if (data.address.city) newObject.address.city = data.address.city;
    if (data.address.street) newObject.address.street = data.address.street;
    if (data.address.building) {
      newObject.address.building = data.address.building;
    }
    if (data.address.zip) newObject.address.zip = data.address.zip;
  }

  if (propertyExist(data, "googleAnalytics", "trackingId")) {
    newObject.googleAnalytics = {};
    newObject.googleAnalytics.trackingId = data.googleAnalytics.trackingId;
  }

  if (propertyExist(data, "frontend") && data.frontend) {
    newObject.frontend = {};
    if (propertyExist(data, "frontend", "logo") && data.frontend.logo) {
      newObject.frontend.logo = data.frontend.logo;
    }
    if (propertyExist(data, "frontend", "banner") && data.frontend.banner) {
      newObject.frontend.banner = data.frontend.banner;
    }
    if (propertyExist(data, "frontend", "slogan") && data.frontend.slogan) {
      newObject.frontend.slogan = data.frontend.slogan;
    }
    if (
      propertyExist(data, "frontend", "description") &&
      data.frontend.description
    ) {
      newObject.frontend.description = data.frontend.description;
    }
    if (propertyExist(data, "frontend", "tag") && data.frontend.tag) {
      newObject.frontend.tag = data.frontend.tag;
    }
    if (propertyExist(data, "frontend", "theme") && data.frontend.theme) {
      newObject.frontend.theme = data.frontend.theme;
    }
  }

  if (propertyExist(data, "template") && data.template) {
    newObject.template = {};

    if (
      propertyExist(data, "template", "shopVariation") &&
      data.template.shopVariation
    ) {
      newObject.template.shopVariation = data.template.shopVariation;
    }
    if (
      propertyExist(data, "template", "productVariation") &&
      data.template.productVariation
    ) {
      newObject.template.productVariation = data.template.productVariation;
    }
    if (
      propertyExist(data, "template", "colorVariation") &&
      data.template.colorVariation
    ) {
      newObject.template.colorVariation = data.template.colorVariation;
    }
  }

  console.log(newObject);

  // Find record and update it with id
  return Vendor.findByIdAndUpdate(vendorId, newObject, { new: true })
    .then(result => {
      if (!result) {
        return notFound(
          res,
          `Error: newly submitted record not found with id ${vendorId}`
        );
      }
      return success(
        res,
        200,
        result,
        "New record has been created successfully!"
      );
    })
    .catch(err =>
      fail(
        res,
        500,
        `Error updating record with id ${vendorId}.\r\n${err.message}`
      )
    );
}

export async function markNotificationsRead(req, res) {
  const data = req.body || {};
  const { vendorId } = req.params;
  const { userId, userType } = res.locals;

  if (userType !== "vendor" || !ObjectId.isValid(vendorId)) {
    return fail(res, 422, "Invalid Vendor detected");
  }
  if (userId !== vendorId) {
    return fail(res, 422, "Invalid Vendor not allowed");
  }
  if (!Array.isArray(data.notifications)) {
    return fail(res, 422, "Invalid notifications referenced in the request");
  }

  // Construct the Update object using mongoose $set Operator
  const filterObject = {
    notifications: { $elemMatch: { standing: "unread" } }
  };
  const newObject = { "notifications.$[].standing": "read" };
  newObject.updated = Date.now();

  try {
    const result = await Vendor.findOneAndUpdate(
      { _id: vendorId, ...filterObject },
      {
        $set: {
          ...newObject
        }
      },
      { new: true }
    );
    if (!result) {
      return notFound(res, "Unable to retrieve updated Notifications");
    }
    return success(res, 200, result, "Notifications have been marked read!");
  } catch (err) {
    return fail(res, 500, "Error updating this Notification status");
  }
}

// Patch record identified by the Id in the request
export async function modify(req, res) {
  const recordId = req.params.vendorId || "";
  const data = req.body || {};
  if (!recordId) return fail(res, 400, "No record Id as request parameter");
  if (!ObjectId.isValid(recordId)) {
    return fail(res, 422, "Invalid record Id as request parameter");
  }

  const { userId, userType, userRole } = res.locals;
  if (!userId || !userType || !userRole) {
    return fail(res, 400, "Invalid authentication credentials");
  }

  if (userType === "admin" && (userRole === "master" || userRole === "super")) {
    // we are cool!
  } else {
    return fail(
      res,
      422,
      `Only Admin is allowed to update this record not ${userType} ${userRole}`
    );
  }

  const newObject = {};
  newObject.admin = userId;
  newObject.updated = Date.now();
  if (getProperty(data, "standing")) newObject.standing = data.standing;

  if (getProperty(data, "businessVerified")) {
    newObject.businessVerified = data.businessVerified;
  }
  if (getProperty(data, "comment")) {
    newObject.comment = data.comment;
  }

  if (["active", "inactive", "trashed"].includes(data.standing)) {
    newObject.standing = data.standing;
  } else {
    return fail(
      res,
      422,
      `User status can only be "active", "inactive", or "trashed", not ${
        data.standing
      }`
    );
  }

  if (
    data.action &&
    (userRole === "super" || userRole === "master") &&
    ["allow", "restrict", "deny"].includes(data.action)
  ) {
    newObject.action = data.action;
  } else {
    return fail(
      res,
      422,
      `Only Master can take Administrative Action against a vendor not ${userRole}`
    );
  }

  // Find record and update it with id
  return Vendor.findByIdAndUpdate(recordId, newObject, { new: true })
    .then(result => {
      if (!result) {
        return notFound(
          res,
          `Error: newly submitted record not found with id ${recordId}`
        );
      }
      return success(
        res,
        200,
        result,
        "New record has been created successfully!"
      );
    })
    .catch(err =>
      fail(
        res,
        500,
        `Error updating record with id ${recordId}.\r\n${err.message}`
      )
    );
}

// Patch record identified by the Id in the request
export async function deploy(req, res) {
  const data = req.body || {};
  if (!data.contractAddress) {
    return fail(res, 400, "Why no payment activation in body parameter");
  }
  if (data.contractAddress.length !== 42) {
    return fail(res, 400, "The contract Address is invalid");
  }
  const { userId, userType, userRole } = res.locals;
  if (!userId || !userType || !userRole) {
    return fail(res, 400, "Invalid authentication credentials");
  }

  if (userType !== "vendor") {
    return fail(res, 422, "Only vendor is allowed to deploy contract address");
  }

  const vendor = await findVendorById(userId);
  // if (vendor.contractAddress) {
  //   return fail(res, 422, "Contract deployment can only be done once");
  // }

  const newObject = {};
  newObject.contractAddress = data.contractAddress;
  newObject.activationDate = Date.now();
  newObject.paymentActivation = true;

  if (getProperty(vendor, "action") !== "allow") {
    return fail(
      res,
      422,
      `Admin action needs to be "allowed" for this operation, not ${
        vendor.action
      }.`
    );
  }
  if (getProperty(vendor, "standing") !== "active") {
    return fail(
      res,
      422,
      `Admin action needs to be "allowed" for this operation, not ${
        vendor.action
      }.`
    );
  }
  if (getProperty(vendor, "businessVerified") !== "true") {
    return fail(
      res,
      422,
      `Only verified businesses can be approved, not ${getProperty(
        vendor,
        "businessVerified"
      )}.`
    );
  }
  // Find record and update it with id
  return Vendor.findByIdAndUpdate(userId, newObject, { new: true })
    .then(result => {
      if (!result) {
        return notFound(
          res,
          `Error: newly submitted record not found with id ${userId}`
        );
      }
      return success(
        res,
        200,
        result,
        "New record has been deployed successfully!"
      );
    })
    .catch(err =>
      fail(res, 500, `Error saving record with id ${userId}.\r\n${err.message}`)
    );
}

// Patch record identified by the Id in the request
export async function approve(req, res) {
  const recordId = req.params.vendorId || "";
  const data = req.body || {};
  if (!recordId) return fail(res, 400, "No record Id as request parameter");
  if (!ObjectId.isValid(recordId)) {
    return fail(res, 422, "Invalid record Id as request parameter");
  }
  if (!data.approval) {
    return fail(res, 400, "Why no account approval status body parameter");
  }
  if (
    ["pending", "accepted", "rejected"].includes(getProperty(data.approval))
  ) {
    return fail(
      res,
      400,
      `Why invalid account approval status body parameter ${data.approval}`
    );
  }
  const { userId, userType, userRole } = res.locals;
  if (!userId || !userType || !userRole) {
    return fail(res, 400, "Invalid authentication credentials");
  }

  if (userType === "admin" && (userRole === "master" || userRole === "super")) {
    // we are cool!
  } else {
    return fail(
      res,
      422,
      `Only Admin is allowed to update this record not ${userType} ${userRole}`
    );
  }

  const newObject = {};
  newObject.updated = Date.now();
  newObject.approval = data.approval;
  newObject.approvedBy = userId;

  const vendor = await findVendorById(recordId);
  if (data.approval === "rejected") {
    if (!data.comment) {
      return fail(res, 422, "State the reseaon for rejecting Vendor Account");
    }
    if (!(data.comment.length > 20)) {
      return fail(res, 422, "Comment is too short.");
    }
    newObject.comment = data.comment;
  }

  let ok = false;
  if (data.approval === "accepted") ok = true;

  if (!(ok && vendor.standing === "active")) {
    return fail(
      res,
      422,
      `Only "Active" vendors can be granted approval not ${vendor.standing}.`
    );
  }
  if (!(ok && getProperty(vendor, "action") === "allow")) {
    return fail(
      res,
      422,
      `Admin action needs to be "allowed" for this operation, not ${
        vendor.action
      }.`
    );
  }
  if (!(ok && getProperty(vendor, "businessVerified") === "true")) {
    return fail(
      res,
      422,
      `Only verified businesses can be approved, not ${getProperty(
        vendor,
        "businessVerified"
      )}.`
    );
  }
  // Find record and update it with id
  return Vendor.findByIdAndUpdate(recordId, newObject, { new: true })
    .then(result => {
      if (!result) {
        return notFound(
          res,
          `Error: newly submitted record not found with id ${recordId}`
        );
      }
      return success(
        res,
        200,
        result,
        "New record has been approved successfully!"
      );
    })
    .catch(err =>
      fail(
        res,
        500,
        `Error approving record with id ${recordId}.\r\n${err.message}`
      )
    );
}

// Delete a vendor with the specified vendorId in the request
export async function destroy(req, res) {
  const recordId = req.params.vendorId || "";
  const { userId, userType, userRole } = res.locals;
  if (!recordId) return fail(res, 400, "No record Id as request parameter");
  if (!ObjectId.isValid(recordId)) {
    return fail(res, 422, "Invalid record Id as request parameter");
  }
  if (!userId || !userType || !userRole) {
    return fail(res, 400, "Invalid authentication credentials");
  }

  if (userType === "admin" && userRole === "super") {
    // we are cool!
  } else {
    return fail(
      res,
      422,
      `Only Super Admin is allowed to delete record not ${userRole}`
    );
  }

  const product = await findProductByVendor(recordId);
  if (product) {
    return fail(
      res,
      422,
      "Operation not allowed. Vendor still has product(s)."
    );
  }

  return Vendor.findByIdAndRemove(recordId)
    .then(record => {
      if (!record) return notFound(res, `Record not found with id ${recordId}`);
      return success(res, 200, [], "Record deleted successfully!");
    })
    .catch(err => {
      if (err.kind === "ObjectId" || err.name === "NotFound") {
        return notFound(
          res,
          `Error: record not found with id ${recordId}\r\n${err.message}`
        );
      }
      return fail(
        res,
        500,
        `Error: could not delete record with id ${recordId}\r\n${err.message}`
      );
    });
}
