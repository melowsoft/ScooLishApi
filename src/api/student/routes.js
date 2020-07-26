/*
 * @author 4Dcoder
 * @coauthor Sylvia
 */

import express from "express";
import * as customer from "./controller";
import { isValidAdmin, isValidStudent } from "../auth/controller";
import { initCustomer } from "./init";

const router = express.Router();

router.get("/init/customer", initCustomer);

/**
 * @api {get} /customers Retrieve customers
 * @apiName RetrieveCustomers
 * @apiGroup Customer
 * @apiSuccess {Object[]} rows List of Customers.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 */

router.get("/customers", isValidAdmin, customer.findAll);

/**
 * @api {get} /customers/:cutomerId Retrieve customer
 * @apiName RetrieveCustomer
 * @apiGroup Customer
 * @apiSuccess {Object} customer Customer's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Customer not found.
 */
router.get("/customers/:customerId", isValidStudent, customer.findOne);

router.get("/customers/admin/:customerId", isValidAdmin, customer.findOne);

/**
 * @api {get} /customers/verify/:attribute/:value Verify customer
 * @apiName VerifyCustomer
 * @apiGroup Customer
 * @description This routes checks customer attributes like unique email, address etc
 * @apiSuccess {Object} customer Customer's data.
 * @apiParam any Customer's attribute.
 * @apiParam any Customer's attribute value.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Customer not found.
 */
router.get(
  "/customers/verify/:attribute/:value",
  isValidStudent,
  customer.findVerify
);

/**
 * @api {patch} /customers/:id Marks notifications for a customer read
 * @apiName MarkNotificationRead
 * @apiGroup Customer
 * @apiParam {Array} notifications [ObjectId(), ObjectId()] customer notifications Ids
 * @apiSuccess {Object} customer Customer's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Customer not found.
 */
router.patch(
  "/customers/:customerId/notifications/read",
  isValidStudent,
  customer.markNotificationsRead
);

/**
 * @api {put} /customers/:customerId Update customer
 * @apiName UpdateCustomer
 * @apiGroup Customer
 * @apiPermission master
 * @apiParam {String} access_token master access token.
 * @apiParam {Number} nonce customer authentication nonce
 * @apiParam {String} publicAddress customer metamask address
 * @apiParam {String} btcAddress bitcoin address
 * @apiParam {String} wallet customer's wallet
 * @apiParam {Array} cart [{product, quantity}] customer's cart
 * @apiParam {Array} wishlist [{names, carts[{product, quantity}]}] customer's wishlist
 * @apiParam {String} fullname customer's full name
 * @apiParam {String} username customer's username
 * @apiParam {String} gender customer's gender
 * @apiParam {String} phone customer's phone number
 * @apiParam {String} password customer's password
 * @apiParam {String} email customer's email
 * @apiParam {String} recoveryCode customer's recovery code
 * @apiParam {String} profile customer's profile
 * @apiParam {Array} preferences [{currency, language}] customer preferences
 * @apiParam {Array} shipping [{country, state, city, street, building, zip}]
 *  customer's shipping details
 * @apiParam {Array} notifications [{date, notice, standing}] customer notifications
 * @apiParam {Array} lastAccess [{accessDate, ipAddress}] details of last access
 * @apiParam {String} standing customer's status (active/unverified/suspended/trashed)
 * @apiParam {Date} updated date of last update
 * @apiparam {Boolean} onlineStatus admin's online Status
 * @apiSuccess {Object} customer Customer's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Customer not found.
 * @apiError 401 master access only.
 */
router.put("/customers/:customerId", isValidStudent, customer.update);

router.put(
  "/customers/:customerId/password/update",
  isValidStudent,
  customer.passwordUpdate
);

/**
 * @api {patch} /customers/:id Modify customer by admin
 * @apiName ModifyCustomer
 * @apiGroup Customer
 * @apiPermission master
 * @apiParam {String} access_token master access token.
 * @apiParam {Array} notifications [{date, notice, standing}] customer notifications
 * @apiParam {Array} lastAccess [{accessDate, ipAddress}] details of last access
 * @apiParam {String} standing customer's status (active/unverified/suspended/trashed)
 * @apiParam {Date} updated date of last update
 * @apiparam {Boolean} onlineStatus admin's online Status
 * @apiSuccess {Object} customer Customer's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Customer not found.
 * @apiError 401 master access only.
 */
router.patch("/customers/:customerId", isValidAdmin, customer.modify);

/**
 * @api {delete} /customers/:id Delete customer
 * @apiName DeleteCustomer
 * @apiGroup Customer
 * @apiPermission master
 * @apiParam {String} access_token master access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Customer not found.
 * @apiError 401 master access only.
 */
router.delete("/customers/:customerId", isValidAdmin, customer.destroy);

export default router;
