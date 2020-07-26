import dotenv from "dotenv";
import bcrypt from "bcryptjs";

dotenv.config();

export const saltRounds = 10;

export function timestamp() {
  return `${new Date().toISOString().slice(0, 22)}Z`;
  //   return new Date().toISOString().slice(0, 19).replace("T", " ")+"Z";
}

export function dateDaysAgo(since = 0) {
  const today = new Date();
  today.setDate(today.getDate() - since);
  return today.toISOString();
}

export function randomNonce() {
  return Math.floor(Math.random() * 1000000);
}

export function randomNum() {
  return Math.floor(Math.random() * 1000000);
}

export async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index += 1) {
    // eslint-disable-next-line no-await-in-loop
    await callback(array[index], index, array);
  }
}

/**
 * @description addToArrayOfObjects add a new object item to an array of objects
 * @param {Object} arrayOfObjects the array of object
 * @param {Number} limit maximum number of objects the array should not exceed
 * @param {Object} newObjectElement the new item to be added to the array of objects
 * @returns {Object} the new array of Objects
 */
export function addToArrayOfObjects(arrayOfObjects, limit, newObjectElement) {
  const size = Object.keys(arrayOfObjects).length;
  if (size < limit) {
    arrayOfObjects.push(newObjectElement);
  } else {
    // arr.splice(indexToRemove, numToRemove)
    arrayOfObjects.splice(0, 1);
    arrayOfObjects.push(newObjectElement);
  }
  return arrayOfObjects;
}

/**
 * @description getClientAccess get the Ip Address and TimeSTamp of a request object.
 * @param {Object} req the request object
 * @returns {Object} { accessDate, ipAddress } access date and the ip address
 */
export function getClientAccess(req) {
  const ipAddress = req.ip || req._remoteAddress;
  // const lang = req.get("accept-language");
  const accessDate = req._startTime || "";
  return { accessDate, ipAddress };
}

/**
 * @description getClientDetails get the Ip Address and TimeSTamp of a request object.
 * @param {Object} req the request object
 * @returns {String} userAgent/ipAddress the browser and the Ip Address
 */
export function getClientDetails(req) {
  const acceptLanguage = req.get("accept-language");
  const userAgent = req.get("user-agent");
  return `${userAgent}/${acceptLanguage}`;
}

export async function hashPassword(plaintextPassword) {
  await bcrypt.hash(plaintextPassword, saltRounds);
}

/**
 * @description getProperty get sub property of a compound object.
 * @param {Object} givenObject the parent object
 * @param {String} givenProperty the parent object's property to check for
 * @param {String} args sub properties
 * @returns {String} or false if its not a property
 */
export function getProperty(givenObject, givenProperty, ...args) {
  if (typeof givenObject !== "object" || !givenProperty) {
    return false;
  }
  let value;
  switch (args.length) {
    case 0:
      value = givenObject[givenProperty];
      break;
    case 1:
      value = givenObject[givenProperty][args[0]];
      break;
    case 2:
      value = givenObject[givenProperty][args[0]][args[1]];
      break;
    default:
      return false;
  }

  if (typeof value === "boolean") return value.toString();
  if (value) return value;
  return false;
}

export function hasProp(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

/**
 * @description propertyExist determines if parameter is a (descendant) property of the object.
 * @param {String} mainObject the parent object
 * @param {String} dirChild direct child of parent object
 * @param {String} dirDirChild grand-child of the parent object
 * @param {String} dirDirDirChild great grand-child of the parent object
 * @param {String} dirDirDirDirChild 4th descendant of the parent object
 * @returns {Boolean} indicating if the parameter passed is a (descendant) property of the object.
 */
export function propertyExist(
  mainObject = {},
  dirChild = null,
  dirDirChild = null,
  dirDirDirChild = null,
  dirDirDirDirChild = null
) {
  let checker;
  // let value;
  if (dirDirChild === null) {
    checker = hasProp(mainObject, dirChild);
    // value = mainObject[dirChild];
  } else if (dirDirDirChild === null) {
    checker =
      hasProp(mainObject, dirChild) &&
      hasProp(mainObject[dirChild], dirDirChild);
    // value = mainObject[dirChild][dirDirChild];
  } else if (dirDirDirDirChild === null) {
    checker =
      hasProp(mainObject, dirChild) &&
      hasProp(mainObject[dirChild], dirDirChild) &&
      hasProp(mainObject[dirChild][dirDirChild], dirDirDirChild);
    // value = mainObject[dirChild][dirDirChild][dirDirDirChild];
  } else {
    checker =
      hasProp(mainObject, dirChild) &&
      hasProp(mainObject[dirChild], dirDirChild) &&
      hasProp(mainObject[dirChild][dirDirChild], dirDirDirChild) &&
      hasProp(
        mainObject[dirChild][dirDirChild][dirDirDirChild],
        dirDirDirDirChild
      );
    // value = mainObject[dirChild][dirDirChild][dirDirDirChild][dirDirDirDirChild];
  }
  // return (checker, value);
  return checker;
}

/**
 * @description dollarConverter converts any currency to USD and vice-versa
 * @param {String} code currency code usually 3 characters e.g. BEZ for Bezop
 * @param {String} amount currency amount for conversion is given in another currency
 * if conversion is TO_USD or the amount in USD if to be converted into the desire currency
 * @param {String} conversion the conversion system i.e.  'TO_USD' or 'FROM_USD'
 * @returns {Number} The equivalent amount.
 */

export async function dollarConverter(code, amount, conversion = "TO_USD") {
  if (conversion !== "TO_USD" && conversion !== "FROM_USD") {
    throw new Error(
      "Unknown conversion type. Please enter 'TO_USD' or 'FROM_USD'"
    );
  }
  if (typeof code !== "string" && typeof amount !== "number") {
    throw new Error("Wrong datatype for currency code or amount");
  }
  try {
    const currency = await findCurrencyByCode(code);
    if (!currency.exchange) {
      throw new Error(`May be ${code} currency is not yet supported`);
    }
    const currencyPerUsd = currency.exchange;
    if (conversion === "TO_USD") return amount / currencyPerUsd;
    if (conversion === "FROM_USD") return amount * currencyPerUsd;
  } catch (err) {
    throw new Error(err);
  }
  return 0;
}

export async function getCurrentUnitPrice(product, quantity, unitPrice) {
  let output;
  let currentStockAvailable;
  let totalPrice;

  // Check if product valuation is either "FIFO", "LIFO" or "AVCO"
  switch (product.price.valuation) {
    case "FIFO":
      output = product.price.unitPrice;
      break;
    case "LIFO":
      output = unitPrice;
      break;
    case "AVCO":
      currentStockAvailable =
        parseInt(product.available, 10) + parseInt(quantity, 10);
      totalPrice =
        parseInt(product.available, 10) *
          parseInt(product.price.unitPrice, 10) +
        parseInt(quantity, 10) * parseInt(unitPrice, 10);
      output = parseInt(totalPrice / currentStockAvailable, 10).toFixed(2);
      break;
    default:
      output = unitPrice;
      break;
  }
  return output;
}

export function findEmail(User, email) {
  return new Promise((resolve, reject) => {
    User.findOne({ email, action: "allow" }).exec((err, result) => {
      if (err) reject(err);
      return resolve(result);
    });
  });
}
