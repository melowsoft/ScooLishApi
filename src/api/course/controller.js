/* eslint-disable prefer-destructuring */
// import lodash from "lodash";
import moment from "moment";
import requestCountry from "request-country";
import Course, { ObjectId } from "./model";
import {
  findInstructorByDomain,
  findAllInstructors,
  findInstructorById
} from "./../course/controller";
import { success, fail, notFound } from "../../services/response/index";
import {
  hasProp,
  propertyExist,
  getCurrentUnitPrice
} from "../../services/helpers";

/**
 * Finds all Bolt Products
 */
export function findAllBoltProducts(req, res) {
  const { userId } = res.locals;
  return Product.find({ isBolt: true, vendor: userId })
    .then(result => {
      res.json(result);
    })
    .catch(err =>
      fail(
        res,
        400,
        `Error occured while attempting to fetch products. ${err.message}`
      )
    );
}

// Find a single product with a given product id
export function findProductById(id) {
  return Product.findById(id)
    .populate({
      path: "review",
      select: "id subjectId comment rating customer",
      match: { standing: "active" },
      populate: { path: "customer" }
    })
    .populate({
      path: "vendor",
      select: "id url businessName domainName contractAddress publicAddress"
    })
    .populate({ path: "brand", select: "id name icon" })
    .populate({ path: "collections", select: "id name icon" })
    .populate({ path: "category", select: "id name icon" })
    .populate({
      path: "approval",
      select: "id reviewer product vendor comment approved standing"
    })
    .then(result => {
      if (!result) return {};
      return result;
    })
    .catch(err => {
      throw err;
    });
}

// Find a single product with a given vendor id
export function findProductByVendor(vendor) {
  return Product.findOne({ vendor })
    .then(result => {
      if (!result) return false;
      return result;
    })
    .catch(err => {
      throw err;
    });
}

// Find all Products for Admin
export function findAllProducts(req, res) {
  return Product.find()
    .populate({
      path: "review",
      select: "id subjectId comment rating customer",
      match: { standing: "active" }
    })
    .populate({
      path: "vendor",
      select: "id url businessName domainName contractAddress"
    })
    .populate({
      path: "brand",
      select: "id name icon",
      match: { standing: "active" }
    })
    .populate({
      path: "collections",
      select: "id name icon",
      match: { standing: "active" }
    })
    .populate({
      path: "category",
      select: "id name icon",
      match: { standing: "active" }
    })
    .populate({
      path: "approval",
      select: "id reviewer product vendor comment approved standing"
    })
    .then(result =>
      success(res, 200, result, "retrieving record(s) was successfully!")
    )
    .catch(err =>
      fail(res, 500, `Error retrieving record(s).\r\n${err.message}`)
    );
}

export function findStatRecords(req, res) {
  return Product.find()
    .populate({
      path: "review",
      select: "id subjectId comment rating customer",
      match: { standing: "active" }
    })
    .populate({
      path: "vendor",
      select: "id url businessName domainName contractAddress"
    })
    .populate({
      path: "brand",
      select: "id name icon",
      match: { standing: "active" }
    })
    .populate({
      path: "collections",
      select: "id name icon",
      match: { standing: "active" }
    })
    .populate({
      path: "category",
      select: "id name icon",
      match: { standing: "active" }
    })
    .populate({
      path: "approval",
      select: "id reviewer product vendor comment approved standing"
    })
    .then(result => {
      // discounts stats
      const discountArray = [];
      const totalDiscount = result.map(product =>
        discountArray.push(product.price.discount)
      );

      // Monthly Sales
      const monthArray = [];
      const monthProducts = result.map(product =>
        monthArray.push(moment(product.createdAt).format("MMMM"))
      );

      const resArray = {
        discount: discountArray,
        productMonth: monthArray
      };

      success(res, 200, resArray, "retrieving record(s) was successfully!");
    })
    .catch(err =>
      fail(res, 500, `Error retrieving record(s).\r\n${err.message}`)
    );
}

/**
 * @description create save a new Course and return it if successful
 * a check is perform to ensure only valid instructors are creating their course
 * the new document is saved on the courses collection and also push into course array
 * in instructor collection.
 * @param {Object} req request object
 * @param {Object} res request object
 * @returns {Object} res carry success, data, and message
 */

export async function create(req, res) {
  const data = req.body || {};
  const { userId, userType } = res.locals;
  if (userType !== "instructor") {
    return fail(
      res,
      422,
      `Only instructors are allowed to add courses not ${userType}`
    );
  }
  // Validate request
  if (!data.name) {
    return fail(
      res,
      422,
      "Course name can not be empty and must be alphanumeric."
    );
  }
  if (!data.category) {
    return fail(
      res,
      422,
      "Course category can not be empty and must be alphanumeric."
    );
  }

  if (!data.description) {
    return fail(
      res,
      422,
      "Course description can not be empty and must be alphanumeric."
    );
  }
  if (!data.price.unitPrice) {
    return fail(
      res,
      422,
      "Course unit price can not be empty and must be numeric."
    );
  }

  let instructor;
  try {
    instructor = await findInstructorById(userId);
    if (hasProp(instructor, "courses")) {
      return fail(res, 422, `Unknown instructor ${userId}.`);
    }
  } catch (err) {
    return fail(res, 422, "Unable to find Instructor Information");
  }
  if (!instructor)
    return fail(res, 422, "Unable to find Instructor Information");

  const newObject = {};
  newObject.instructor = userId;
  newObject.category = data.category;

  if (data.code) newObject.code = data.code;

  if (data.name)
    newObject.name =
      typeof data.name === "string" ? data.name.replace(/%/g, "") : "Unnamed";
  if (data.brand) newObject.brand = data.brand;

  if (data.description.unit) newObject.descriptionUnit = data.description.unit;
  if (data.description) newObject.description = data.description;

  if (data.description.tag) newObject.descriptionTag = data.description.tag;

  newObject.price = {};
  if (data.price.deal && typeof data.price.deal === "boolean") {
    newObject.price.deal = data.price.deal;
  } else if (data.price.deal && data.price.deal.toLowerCase() === "true") {
    newObject.price.deal = true;
  } else if (data.price.deal && data.price.deal.toLowerCase() === "false") {
    newObject.price.deal = false;
  }

  if (data.price.unitPrice && !Number.isNaN(parseFloat(data.price.unitPrice))) {
    newObject.price.unitPrice = parseFloat(data.price.unitPrice, 10);
  }

  if (
    data.price.slashPrice &&
    !Number.isNaN(parseFloat(data.price.slashPrice))
  ) {
    newObject.price.slashPrice = data.price.slashPrice;
  }
  if (data.price.discount && !Number.isNaN(parseFloat(data.price.discount))) {
    newObject.price.discount = data.price.discount;
  }

  newObject.download = {};
  if (
    data.download.downloadable &&
    (typeof data.download.downloadable === "boolean" ||
      data.download.downloadable.toLowerCase() === "true" ||
      data.download.downloadable.toLowerCase() === "false")
  ) {
    newObject.download.downloadable = Boolean(data.download.downloadable);
  }
  if (data.download.downloadName) {
    newObject.download.downloadName = data.download.downloadName;
  }

  // Create a Course
  const course = new Course(newObject);

  // Save Course in the database
  return course
    .save()
    .then(result => {
      if (!result) {
        return fail(res, 404, "Error not found newly added course");
      }
      return success(
        res,
        200,
        result,
        "New course record has been created successfully!"
      );
    })
    .catch(err =>
      fail(res, 500, `Error occurred while creating the Course. ${err.message}`)
    );
}

/**
 * @description findAll retrieves products that meet search creteria
 * Retrieve kinds of products instructor/:vendorDomain/products/kind/:kind?page=0&limit=50
 * kind (optional) = [ deal | feature | popular | latest | normal ]
 * @param {Object} req http request object
 * @param {Object} res http response object
 */
export async function findAll(req, res) {
  const { vendorDomain, kind } = req.params;
  if (!vendorDomain) {
    return fail(res, 422, "Vendor shop has not been specified.");
  }

  let vendorId;

  const instructor = await findVendorByDomain(vendorDomain);

  if (instructor && instructor.id) {
    vendorId = instructor.id;
  } else {
    return fail(res, 422, "Error: unknown instructor.");
  }

  let page = req.query.page || 0;
  page = Math.max(0, page - 1); // using a zero-based page index for use with skip()
  let limit = req.query.limit || 10; // record size or counts/page to take
  if (Number(req.query.limit) > 10) limit = Number(req.query.limit);
  if (Number(req.query.limit) > 50) limit = 50; // cap on 50 records/page

  const offset = page * limit; // skip number of records

  const today = new Date(Date.now());
  // only docs from the past 30 days
  const dateFloor = new Date().setDate(today.getDate() - 30);

  let filter = {
    instructor: vendorId
  };

  const filter1 = {
    instructor: vendorId,
    createdAt: { $gte: dateFloor }
  };

  const filter2 = {
    instructor: vendorId,
    "analytics.feature": true
  };

  const filter3 = {
    instructor: vendorId,
    "price.deal": true
  };

  const filter4 = {
    instructor: {
      $ne: vendorId
    },
    approved: "pending"
  };

  let sort = { createdAt: -1 };

  switch (kind) {
    case "normal":
      sort = { createdAt: 1 };
      break;
    case "latest":
      filter = filter1;
      sort = { createdAt: -1 };
      break;
    case "popular":
      sort = { "analytics.viewCount": 1 };
      break;
    case "feature":
      filter = filter2;
      break;
    case "unapproved":
      filter = filter4;
      break;
    case "deal":
      filter = filter3;
      break;
    default:
      sort = { createdAt: 1 };
  }

  const query = Product.find(filter)
    .populate({
      path: "review",
      select: "id subjectId comment rating customer",
      match: { standing: "active" }
    })
    .populate({
      path: "instructor",
      select: "id url businessName domainName contractAddress publicAddress"
    })
    .populate({
      path: "brand",
      select: "id name icon",
      match: { standing: "active" }
    })
    .populate({
      path: "collections",
      select: "id name icon",
      match: { standing: "active" }
    })
    .populate({
      path: "category",
      select: "id name icon",
      match: { standing: "active" }
    })
    .limit(100)
    .sort(sort);

  return query.countDocuments((err, count) => {
    if (err) {
      return fail(res, 500, `Error retrieving course(s).\r\n${err.message}`);
    }
    return query
      .skip(offset)
      .limit(limit)
      .exec("find", (erro, result) => {
        if (erro) {
          return fail(
            res,
            500,
            `Error retrieving course(s).\r\n${erro.message}`
          );
        }
        return success(
          res,
          200,
          { count, result },
          "course(s) retrieved successfully!"
        );
      });
  });
}

/**
 * @description findSome retrieves array of products requested
 * Retrieve multiple products "/products/operations/(:productIds)*"
 * productIds are slashed separated course Ids
 * @param {Object} req http request object
 * @param {Object} res http response object
 */
export async function findSome(req, res) {
  const data = {};
  const productIds = req.params.productIds.split("/");
  const filteredProductIds = productIds.filter(product => product !== "");
  let products = [];
  try {
    products = await Promise.all(
      filteredProductIds.map(id => findProductById(id))
    );
  } catch (err) {
    return fail(res, 500, err.message);
  }
  products.forEach(product => {
    if (product._id) {
      data[product._id] = product;
    }
  });
  const size = Object.keys(data).length;
  if (size > 0) {
    return success(res, 200, data, `${size} results retrieved successfully!`);
  }
  return notFound(res, "Error: product(s) not found");
}

/**
 * @description findSimilar retrieves products in the same category with a given one
 * Retrieve multiple products "/products/similar/:productId"
 * @param {Object} req http request object
 * @param {Object} res http response object
 * @returns {Promise}
 */
export async function findSimilar(req, res) {
  const recordId = req.params.productId || "";
  if (!ObjectId.isValid(recordId)) {
    return fail(res, 422, "Invalid record Id as request parameter");
  }

  const product = await findProductById(recordId);

  const newProduct = new Product({ brand: product.brand });
  return newProduct.findSimilarBrands((err, similarBrands) => {
    if (err) return notFound(res, "No similar brands found");
    const size = Object.keys(similarBrands).length;
    if (size > 0) {
      return success(
        res,
        200,
        similarBrands,
        `${size} results retrieved successfully!`
      );
    }
    return notFound(res, "Error: product(s) not found");
  });
}

// Find a single product with a productId instructor
export function findOne(req, res) {
  const productId = req.params.productId || "";

  // Validate request
  if (!productId) {
    return fail(res, 400, "Invalid Product Id as request parameter");
  }

  return Product.findById(productId)
    .populate({
      path: "review",
      select: "id subjectId comment rating customer createdAt",
      match: { standing: "active" },
      populate: {
        path: "customer",
        select: "id username fullname email"
      }
    })
    .populate({
      path: "instructor",
      select: "id url businessName domainName contractAddress"
    })
    .populate({
      path: "brand",
      select: "id name icon",
      match: { standing: "active" }
    })
    .populate({
      path: "collections",
      select: "id name icon",
      match: { standing: "active" }
    })
    .populate({
      path: "category",
      select: "id name icon",
      match: { standing: "active" }
    })
    .populate({
      path: "approval",
      select: "id reviewer product instructor comment approved standing"
    })
    .then(result => {
      if (!result) {
        return fail(res, 404, `Error: product not found with id ${productId}`);
      }
      return success(res, 200, result, "product(s) retrieved successfully!");
    })
    .catch(err => {
      if (err.kind === "ObjectId" || err.name === "NotFound") {
        return notFound(
          res,
          `Error: product not found with id ${productId}.\r\n ${err.message}`
        );
      }
      return fail(
        res,
        500,
        `Error retrieving product with id ${productId}.\r\n ${err.message}`
      );
    });
}

// Patch a product identified by the productId in the request
export function modify(req, res) {
  const productId = req.params.productId || "";
  const data = req.body || {};
  const { userId, userType } = res.locals;
  let InstructorId;

  if (userType === "admin") {
    InstructorId = userId;
  } else {
    return fail(
      res,
      422,
      `Only instructors are allowed to add products not ${userType}`
    );
  }

  // Validate request
  if (!vendorId) {
    return fail(
      res,
      422,
      "Product instructor can not be empty and must be alphanumeric."
    );
  }

  if (!data.name) {
    return fail(
      res,
      422,
      "Product name can not be empty and must be alphanumeric."
    );
  }

  if (!data.collections) {
    return fail(
      res,
      422,
      "Product category can not be empty and must be alphanumeric."
    );
  }

  if (!data.description.long) {
    return fail(
      res,
      422,
      "Product description can not be empty and must be alphanumeric."
    );
  }

  if (!data.price.unitPrice) {
    return fail(
      res,
      422,
      "Product unit price can not be empty and must be numeric."
    );
  }

  const newObject = {};
  newObject.category = data.category;
  newObject.collections = data.collections;
  if (data.code) newObject.code = data.code;
  if (data.sku) newObject.sku = data.sku;
  if (data.upc) newObject.upc = data.upc;
  if (data.name)
    newObject.name =
      typeof data.name === "string" ? data.name.replace(/%/g, "") : "Unnamed";
  if (data.brand) newObject.brand = data.brand;
  if (data.description.color) {
    newObject.descriptionColor = data.description.color;
  }
  if (data.description.unit) newObject.descriptionUnit = data.description.unit;
  if (data.description.long) newObject.descriptionLong = data.description.long;
  if (data.description.short) {
    newObject.descriptionShort = data.description.short;
  }
  if (data.description.tag && typeof data.description.tag === "object") {
    newObject.descriptionTag = [];
    newObject.descriptionTag = data.description.tag;
  }

  newObject.variety = {};
  if (data.variety.options && typeof data.variety.options === "boolean") {
    newObject.variety.options = data.variety.options;
    if (data.variety.parent) newObject.variety.parent = data.variety.parent;
  } else if (
    data.variety.options &&
    data.variety.options.toLowerCase() === "true"
  ) {
    newObject.variety.options = true;
    if (data.variety.parent) newObject.variety.parent = data.variety.parent;
  } else if (
    data.variety.options &&
    data.variety.options.toLowerCase() === "false"
  ) {
    newObject.variety.options = false;
    if (data.variety.parent) newObject.variety.parent = data.variety.parent;
  }

  if (data.variety.options === true && !data.variety.parent) {
    return fail(res, 422, "Enter variety parent name or set options to false.");
  }

  const shipmentWaitTime = Number(data.shipmentWaitTime);
  if (typeof shipmentWaitTime === "number" && shipmentWaitTime > 0) {
    newObject.shipmentWaitTime = shipmentWaitTime;
  }

  newObject.price = {};
  if (data.price.deal && typeof data.price.deal === "boolean") {
    newObject.price.deal = data.price.deal;
  } else if (data.price.deal && data.price.deal.toLowerCase() === "true") {
    newObject.price.deal = true;
  } else if (data.price.deal && data.price.deal.toLowerCase() === "false") {
    newObject.price.deal = false;
  }

  if (
    data.price.valuation &&
    (data.price.valuation.toUpperCase() === "LIFO" ||
      data.price.valuation.toUpperCase() === "FIFO" ||
      data.price.valuation.toUpperCase() === "AVCO")
  ) {
    newObject.price.valuation = data.price.valuation.toUpperCase();
  }
  if (data.price.unitPrice && typeof data.price.unitPrice === "number") {
    newObject.price.unitPrice = data.price.unitPrice;
  }
  if (data.price.costPrice && typeof data.price.costPrice === "number") {
    newObject.price.costPrice = data.price.costPrice;
  }
  if (data.price.slashPrice && typeof data.price.slashPrice === "number") {
    newObject.price.slashPrice = data.price.slashPrice;
  }
  if (data.price.discount && typeof data.price.discount === "number") {
    newObject.price.discount = data.price.discount;
  }
  if (
    data.price.discountType &&
    (data.price.discountType.toLowerCase() === "fixed" ||
      data.price.discountType.toLowerCase() === "percent")
  ) {
    newObject.price.discountType = data.price.discountType.toLowerCase();
  }
  if (data.price.tax && typeof data.price.tax === "number") {
    newObject.price.tax = data.price.tax;
  }
  if (
    data.price.taxType &&
    (data.price.taxType.toLowerCase() === "fixed" ||
      data.price.taxType.toLowerCase() === "percent")
  ) {
    newObject.price.taxType = data.price.taxType.toLowerCase();
  }

  newObject.shippingDetails = {};
  if (data.shippingDetails.cost) {
    newObject.shippingDetails.cost = data.shippingDetails.cost;
  }
  if (data.shippingDetails.weight) {
    newObject.shippingDetails.weight = data.shippingDetails.weight;
  }
  if (data.shippingDetails.length) {
    newObject.shippingDetails.length = data.shippingDetails.length;
  }
  if (data.shippingDetails.width) {
    newObject.shippingDetails.width = data.shippingDetails.width;
  }
  if (data.shippingDetails.height) {
    newObject.shippingDetails.height = data.shippingDetails.height;
  }

  newObject.manufactureDetails = {};
  if (propertyExist(data, "manufactureDetails", "make")) {
    newObject.manufactureDetails.make = data.manufactureDetails.make;
  }
  if (propertyExist(data, "manufactureDetails", "modelNumber")) {
    newObject.manufactureDetails.modelNumber =
      data.manufactureDetails.modelNumber;
  }
  if (propertyExist(data, "manufactureDetails", "releaseDate")) {
    newObject.manufactureDetails.releaseDate =
      data.manufactureDetails.releaseDate;
  }

  if (
    data.download.downloadable &&
    typeof data.download.downloadable === "boolean"
  ) {
    newObject.download = {};
    newObject.download.downloadable = data.download.downloadable;
    if (data.download.downloadName) {
      newObject.download.downloadName = data.download.downloadName;
    }
  } else if (
    data.download.downloadable &&
    data.download.downloadable.toLowerCase() === "true"
  ) {
    newObject.download = {};
    newObject.download.downloadable = true;
    if (data.download.downloadName) {
      newObject.download.downloadName = data.download.downloadName;
    }
  } else if (
    data.download.downloadable &&
    data.download.downloadable.toLowerCase() === "false"
  ) {
    newObject.download = {};
    newObject.download.downloadable = false;
    if (data.download.downloadName) {
      newObject.download.downloadName = data.download.downloadName;
    }
  }

  if (
    propertyExist(data, "extraFields") &&
    typeof data.extraFields === "object" &&
    propertyExist(data.extraFields[0], "name") &&
    propertyExist(data.extraFields[0], "value")
  ) {
    let fieldName;
    let fieldValue;
    const fieldArray = [];
    data.extraFields.forEach((item, index, array) => {
      if (typeof item === "object" && item.name && item.value) {
        fieldName = data.extraFields[index].name;
        fieldValue = data.extraFields[index].value;
        fieldArray.push({ name: fieldName, value: fieldValue });
      }
    });
    newObject.extraFields = {};
    newObject.extraFields = fieldArray;
  }

  if (propertyExist(data, "action")) {
    newObject.action = data.action;
  }

  newObject.updated = Date.now();

  // Find product and update it with the request body
  return Product.findByIdAndUpdate(productId, newObject, { new: true })
    .then(result => {
      if (!result) {
        return notFound(res, `Product not found with id ${productId} first`);
      }
      return success(
        res,
        200,
        result.view(true),
        "Product deleted successfully!"
      );
    })
    .catch(err => {
      if (err.kind === "ObjectId" || err.name === "NotFound") {
        return notFound(
          res,
          `Product not found with id ${productId}\r\n${err.message}`
        );
      }
      return fail(
        res,
        500,
        `Error updating product with id ${productId}\r\n${err.message}`
      );
    });
}

// Update a product identified by the productId in the request
export function update(req, res) {
  const productId = req.params.productId || "";
  const data = req.body || {};
  const { userId, userType } = res.locals;
  let vendorId;

  if (userType === "instructor") {
    vendorId = userId;
  } else {
    return fail(
      res,
      422,
      `Only instructors are allowed to add products not ${userType}`
    );
  }

  // Validate request
  if (!vendorId) {
    return fail(
      res,
      422,
      "Product instructor can not be empty and must be alphanumeric."
    );
  }

  if (!data.name) {
    return fail(
      res,
      422,
      "Product name can not be empty and must be alphanumeric."
    );
  }

  if (!data.category) {
    return fail(
      res,
      422,
      "Product category can not be empty and must be alphanumeric."
    );
  }

  if (!data.description.long) {
    return fail(
      res,
      422,
      "Product description can not be empty and must be alphanumeric."
    );
  }

  if (!data.price.unitPrice) {
    return fail(
      res,
      422,
      "Product unit price can not be empty and must be numeric."
    );
  }

  const newObject = {};
  newObject.instructor = vendorId;
  if (data.code) newObject.code = data.code;
  if (data.sku) newObject.sku = data.sku;
  if (data.upc) newObject.upc = data.upc;
  if (data.name)
    newObject.name =
      typeof data.name === "string" ? data.name.replace(/%/g, "") : "Unnamed";
  if (data.brand) newObject.brand = data.brand;
  if (data.collections) newObject.collections = data.collections;
  if (data.category) newObject.category = data.category;
  if (data.brand) newObject.brand = data.brand;
  if (data.description.color) {
    newObject.descriptionColor = data.description.color;
  }
  if (data.description.unit) newObject.descriptionUnit = data.description.unit;
  if (data.description.long) newObject.descriptionLong = data.description.long;
  if (data.description.short) {
    newObject.descriptionShort = data.description.short;
  }
  if (data.description.tag) newObject.descriptionTag = data.description.tag;

  newObject.variety = {};
  if (data.variety.options && typeof data.variety.options === "boolean") {
    newObject.variety.options = data.variety.options;
    if (data.variety.parent) newObject.variety.parent = data.variety.parent;
  } else if (
    data.variety.options &&
    data.variety.options.toLowerCase() === "true"
  ) {
    newObject.variety.options = true;
    if (data.variety.parent) newObject.variety.parent = data.variety.parent;
  } else if (
    data.variety.options &&
    data.variety.options.toLowerCase() === "false"
  ) {
    newObject.variety.options = false;
    if (data.variety.parent) newObject.variety.parent = data.variety.parent;
  }

  if (data.variety.options === true && !data.variety.parent) {
    return fail(res, 422, "Enter variety parent name or set options to false.");
  }

  const shipmentWaitTime = Number(data.shipmentWaitTime);
  if (typeof shipmentWaitTime === "number" && shipmentWaitTime > 0) {
    newObject.shipmentWaitTime = shipmentWaitTime;
  }

  newObject.price = {};
  if (data.price.deal && typeof data.price.deal === "boolean") {
    newObject.price.deal = data.price.deal;
  } else if (data.price.deal && data.price.deal.toLowerCase() === "true") {
    newObject.price.deal = true;
  } else if (data.price.deal && data.price.deal.toLowerCase() === "false") {
    newObject.price.deal = false;
  }

  if (
    data.price.valuation &&
    (data.price.valuation.toUpperCase() === "LIFO" ||
      data.price.valuation.toUpperCase() === "FIFO" ||
      data.price.valuation.toUpperCase() === "AVCO")
  ) {
    newObject.price.valuation = data.price.valuation.toUpperCase();
  }
  if (data.price.unitPrice && typeof data.price.unitPrice === "number") {
    newObject.price.unitPrice = data.price.unitPrice;
  }
  if (data.price.costPrice && typeof data.price.costPrice === "number") {
    newObject.price.costPrice = data.price.costPrice;
  }
  if (data.price.slashPrice && typeof data.price.slashPrice === "number") {
    newObject.price.slashPrice = data.price.slashPrice;
  }
  if (data.price.discount && typeof data.price.discount === "number") {
    newObject.price.discount = data.price.discount;
  }
  if (
    data.price.discountType &&
    (data.price.discountType.toLowerCase() === "fixed" ||
      data.price.discountType.toLowerCase() === "percent")
  ) {
    newObject.price.discountType = data.price.discountType.toLowerCase();
  }
  if (data.price.tax && typeof data.price.tax === "number") {
    newObject.price.tax = data.price.tax;
  }
  if (
    data.price.taxType &&
    (data.price.taxType.toLowerCase() === "fixed" ||
      data.price.taxType.toLowerCase() === "percent")
  ) {
    newObject.price.taxType = data.price.taxType.toLowerCase();
  }

  newObject.shippingDetails = {};
  if (data.shippingDetails.cost) {
    newObject.shippingDetails.cost = data.shippingDetails.cost;
  }
  if (data.shippingDetails.weight) {
    newObject.shippingDetails.weight = data.shippingDetails.weight;
  }
  if (data.shippingDetails.length) {
    newObject.shippingDetails.length = data.shippingDetails.length;
  }
  if (data.shippingDetails.width) {
    newObject.shippingDetails.width = data.shippingDetails.width;
  }
  if (data.shippingDetails.height) {
    newObject.shippingDetails.height = data.shippingDetails.height;
  }

  newObject.manufactureDetails = {};
  if (data.manufactureDetails.make) {
    newObject.manufactureDetails.make = data.manufactureDetails.make;
  }
  if (data.manufactureDetails.modelNumber) {
    newObject.manufactureDetails.modelNumber =
      data.manufactureDetails.modelNumber;
  }
  if (data.manufactureDetails.releaseDate) {
    newObject.manufactureDetails.releaseDate =
      data.manufactureDetails.releaseDate;
  }

  if (
    data.download.downloadable &&
    typeof data.download.downloadable === "boolean"
  ) {
    newObject.download = {};
    newObject.download.downloadable = data.download.downloadable;
    if (data.download.name) newObject.download.name = data.download.name;
  } else if (
    data.download.downloadable &&
    data.download.downloadable.toLowerCase() === "true"
  ) {
    newObject.download = {};
    newObject.download.downloadable = true;
    if (data.download.name) newObject.download.name = data.download.name;
  } else if (
    data.download.downloadable &&
    data.download.downloadable.toLowerCase() === "false"
  ) {
    newObject.download = {};
    newObject.download.downloadable = false;
    if (data.download.name) newObject.download.name = data.download.name;
  }

  if (
    data.extraFields &&
    typeof data.extraFields === "object" &&
    data.extraFields[0].name &&
    data.extraFields[0].value
  ) {
    let fieldName;
    let fieldValue;
    const fieldArray = [];
    data.extraFields.forEach((item, index, array) => {
      if (typeof item === "object" && item.name && item.value) {
        fieldName = data.extraFields[index].name;
        fieldValue = data.extraFields[index].value;
        fieldArray.push({ name: fieldName, value: fieldValue });
      }
    });
    newObject.extraFields = {};
    newObject.extraFields = fieldArray;
  }

  newObject.updated = Date.now();

  // Find product and update it with the request body
  return Product.findByIdAndUpdate(productId, newObject, { new: true })
    .then(result => {
      if (!result) {
        return notFound(res, `Product not found with id ${productId} first`);
      }
      return success(res, 200, result, "Product deleted successfully!");
    })
    .catch(err => {
      if (err.kind === "ObjectId" || err.name === "NotFound") {
        return notFound(
          res,
          `Product not found with id ${productId}\r\n${err.message}`
        );
      }
      return fail(
        res,
        500,
        `Error updating product with id ${productId}\r\n${err.message}`
      );
    });
}

// Approval by Admin to overide crowd-approval instructors
export async function approval(req, res) {
  const recordId = req.params.productId || "";
  const data = req.body || {};
  const { userId, userType } = res.locals;
  let vendorId;
  const newObject = {};

  if (userType === "instructor") {
    vendorId = userId;
  } else {
    return fail(
      res,
      422,
      `Only instructors are allowed to approval products not ${userType}`
    );
  }

  // Validate request
  if (!vendorId) {
    return fail(
      res,
      422,
      "Product instructor cannot be empty and must be alphanumeric."
    );
  }
  if (!ObjectId.isValid(recordId)) {
    return fail(res, 422, "Invalid record Id as request parameter");
  }
  if (!data.approval) {
    return fail(
      res,
      422,
      "Product instructor cannot be empty and must be alphanumeric."
    );
  }
  if (!data.approval.approved) {
    return fail(
      res,
      422,
      "Product instructor cannot be empty and must be alphanumeric."
    );
  }
  if (!["pending", "accepted", "rejected"].includes(data.approval.approved)) {
    return fail(
      res,
      422,
      `product approval is either "accepted" or "rejected", not "${
        data.approval.approved
      }".`
    );
  }
  const product = await findProductById(recordId);
  if (product.vendor === vendorId) {
    return fail(res, 422, "A vendor cannot approve her product.");
  }

  newObject.approvalAdmin = {};
  if (
    data.approval.approved !== "accepted" &&
    !data.approval.comment.toString().length > 50
  ) {
    return fail(
      res,
      422,
      "State reason(s) for not granting this product approval (50 characters text)!"
    );
  }
  if (data.approval.approved) {
    newObject.approvalAdmin.approved = data.approval.approved;
    newObject.approved = data.approval.approved;
  }
  if (data.approval.approvedBy) {
    newObject.approvalAdmin.approvedBy = data.approval.approvedBy;
  }
  if (data.approval.comment) {
    newObject.approvalAdmin.comment = data.approval.comment;
  }

  // Find product and update it with the request body
  return Product.findByIdAndUpdate(recordId, newObject, { new: true })
    .then(result => {
      if (!result) {
        return notFound(res, `Product not found with id ${recordId} first`);
      }
      return success(
        res,
        200,
        result.view(true),
        "Product deleted successfully!"
      );
    })
    .catch(err => {
      if (err.kind === "ObjectId" || err.name === "NotFound") {
        return notFound(
          res,
          `Product not found with id ${recordId}\r\n${err.message}`
        );
      }
      return fail(
        res,
        500,
        `Error updating product with id ${recordId}\r\n${err.message}`
      );
    });
}

// ///////////////////////////////////////////////////
// Analytics
// //////////////////////////////////////////////////

/**
 * @description countProduct counts the exact number of products
 * @param {String} id product id of the product to be counted
 * @param {Object} condition filter query for products to be counted
 * @returns {Promise} count ot products.
 */
export function countProduct(condition = {}) {
  return new Promise((resolve, reject) =>
    Product.countDocuments(condition).exec((err, result) => {
      if (!err) resolve(result);
      reject(err);
    })
  );
}
