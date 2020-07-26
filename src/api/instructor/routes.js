/*
 * @author TonyStacks
 *
 */

import express from "express";
import * as instructor from "./controller";
import { isValidAdmin, isValidInstructor } from "../auth/controller";
import { initVendor } from "./init";

const router = express.Router();

/**
 * @api {get} /vendors/search Search vendors
 * @apiName SearchVendors
 * @apiGroup Vendor
 * @apiSuccess {Object[]} rows List of Vendors.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 */
router.get("/vendors/search", vendor.search);

/**
 * @api {get} /vendors Retrieve vendors
 * @apiName RetrieveVendors
 * @apiGroup Vendor
 * @apiSuccess {Object[]} rows List of Vendors.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 */
router.get("/vendors/admin", isValidAdmin, vendor.findAll);
router.get("/vendors/stats", vendor.findStatRecords);

/**
 * @api {get} /vendors/:id Retrieve vendor
 * @apiName RetrieveVendor
 * @apiGroup Vendor
 * @apiSuccess {Object} vendor Vendor's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Vendor not found.
 */
router.get("/vendors/:vendorId", isValidInstructor, vendor.findOne);
router.get("/vendors/admin/:vendorId", isValidAdmin, vendor.findOneForAdmin);

/**
 * @description No sensitive infor is sent via this route
 */
router.get("/vendors/domain/:domainName", vendor.findOneDomain);
/**
 * @api {get} /vendor/verify/:attribute/:value Verify customer
 * @apiName VerifyVendor
 * @apiGroup Vendor
 * @apiSuccess {Object} customer Vendor's data.
 * @apiParam any Vendor's attribute.
 * @apiParam any Vendor's attribute value.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Vendor not found.
 */
router.get(
  "/vendors/verify/:attribute/:value",
  isValidInstructor,
  vendor.findVerify
);

/**
 * @api {put} /vendors/:id Update vendor
 * @apiName UpdateVendor
 * @apiGroup Vendor
 * @apiPermission master
 * @apiParam {String} access_token master access token.
 * @apiParam {Number} nonce is the vendor's authentication nonce
 * @apiParam {String} publicAddress is the vendor's MetaMask address
 * @apiParam {String} businessName is the vendor's business name
 * @apiParam {String} domainName is the vendor's unique domain name
 * @apiParam {String} email is the vendor's email address
 * @apiParam {String} password is the vendor's password
 * @apiParam {String} recoveryCode is the vendor's recovery code
 * @apiParam {String} fullname is the vendor's full name
 * @apiParam {String} username is the vendor's username
 * @apiParam {String} phone is the vendor's phone
 * @apiParam {Array} profile [{website, facebook, linkedin, instagram, skype, googlePlus,
 *  twitter, youtube, pinterest]} is the vendor's social media profile
 * @apiParam {Array} address [{country, state, city, street, building, zip}] is the vendor's
 *  physical address
 * @apiParam {Array} preferences [{currency, language}] is the vendor's preferences
 * @apiParam {Array} frontend [{logo,banner, slogan, description, tag, theme }] is the
 * vendor's frontend settings/preferences
 * @apiParam {Array} template [{home, product, productDetail,profile, blog, mail,
 *  invoice, ticket }] is the vendor's templates
 * @apiParam {Schema.Types.ObjectId} products is the vendor's products
 * @apiParam {Array} productsApproved [{accepted,rejected, defaulted }] are the
 *  vendor's prodcucts approeved
 * @apiParam {Number} viewCount is the number of views a vendor has
 * @apiParam {Array} lastAccess [{accessDate, ipAddress}] is the vendor's last access details
 * @apiParam {Array} account [{ completeProfile, emailVerified, domainNameSet,
 *  businessVerified}] is the vendor's account status
 * @apiParam {Array} notifications [{date, notice, standing}] is the vendor notifications
 * @apiParam {String} standing is the vendor's account status(active/unverified/suspended/trashed)
 * @apiParam {Date} updated is the date of last update
 * @apiParam {String} approvedBy is the id of the admin that approved the vendor
 * @apiparam {Boolean} onlineStatus admin's online Status
 * @apiParam {Date} approvedAt is the date the vendor was approved
 * @apiSuccess {Object} product Vendor's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Vendor not found.
 * @apiError 401 master access only.
 */
router.put("/vendors/vendor", isValidInstructor, vendor.update);

router.patch("/vendors/admin/:vendorId", isValidAdmin, vendor.modify);

/**
 * @api {patch} /vendors/:id Marks notifications for a vendor read
 * @apiName MarkNotificationRead
 * @apiGroup Vendor
 * @apiParam {Array} notifications [ObjectId(), ObjectId()] vendor notifications Ids
 * @apiSuccess {Object} Vendor's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Vendor not found.
 */
router.patch(
  "/vendors/:vendorId/notifications/read",
  isValidInstructor,
  vendor.markNotificationsRead
);

/**
 * @api {patch} /vendors/approval/:vendorId Approve vendor
 * @apiName ApproveVendor
 * @apiGroup Vendor
 * @apiPermission master
 * @apiParam {String} access_token master access token.
 * @apiParam {Number} nonce is the admin's authentication nonce
 * @apiParam {String} vendor's id
 * @apiParam {String} approval ["pending", "accepted", "rejected"]
 */
router.patch("/vendors/approval/:vendorId", isValidAdmin, vendor.approve);

/**
 * @api {patch} "/vendors/vendor/deploy Saved Deployed Contract Address
 * @apiName SaveContractAddress
 * @apiGroup Vendor
 * @apiPermission vendor
 * @apiParam {contractAddress} vendor's deployed contract address.
 */
router.patch("/vendors/vendor/deploy", isValidInstructor, vendor.deploy);

/**
 * @api {delete} /vendors/:id Delete vendor
 * @apiName DeleteVendor
 * @apiGroup Vendor
 * @apiPermission master
 * @apiParam {String} access_token master access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Vendor not found.
 * @apiError 401 master access only.
 */
router.delete("/vendors/:vendorId", isValidInstructor, vendor.destroy);

export default router;
