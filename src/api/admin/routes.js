/*
 * @author 4Dcoder
 * @coauthor Sylvia
 */

import express from "express";
import * as admin from "./controller";

import { isValidAdmin } from "../auth/controller";

const router = express.Router();

/**
 * @api {get} /admins Retrieve admins
 * @apiName RetrieveAdmins
 * @apiGroup Admin
 * @apiSuccess {Object[]} rows List of Admins.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 */
router.get("/admins", isValidAdmin, admin.findAll);

/**
 * @api {get} /admins/verify/:attribute/:value Verify admin
 * @apiName VerifyAdmin
 * @apiGroup Admin
 * @apiSuccess {Object} Admin Admin's data.
 * @apiParam any Admin's attribute.
 * @apiParam any Admin's attribute value.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Admin not found.
 */
router.get("/admins/verify/:attribute/:value", isValidAdmin, admin.findVerify);

/**
 * @api {get} /admins/:adminId Retrieve admin
 * @apiName RetrieveAdmin
 * @apiGroup Admin
 * @apiSuccess {Object} admin Admin's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Admin not found.
 */
router.get("/admins/:adminId", isValidAdmin, admin.findOne);

router.get("/admins/admin/:adminId", isValidAdmin, admin.findOne);

/**
 * @api {put} /admins Update admin
 * @apiName UpdateAdmin
 * @apiGroup Admin
 * @apiPermission master
 * @apiParam {String} access_token master access token.
 * @apiParam {Number} nonce authentication nonce generated every time
 * @apiParam {String} publicAddress  Metamask public address
 * @apiParam {String} username  admin's username
 * @apiParam {String} role  admin's role
 * @apiParam {Array} lastAccess [{accessDate, ipAddress}] user's last login/access
 * @apiParam {String} fullname  admin's first and last name
 * @apiParam {String} phone  admin's phone number
 * @apiParam {String} address  admin's physical address
 * @apiParam {String} email  admin's email address
 * @apiParam {String} password  admin's password
 * @apiParam {Array} notifications [{date, notice, standing}] admin's notifications
 * @apiParam {String} standing  admin's status
 * @apiParam {Date} updated update date
 * @apiParam {String} updatedBy  AdminID of staff who updated the record
 * @apiparam {Boolean} onlineStatus admin's online Status
 * @apiSuccess {Object} admin Admin's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Admin not found.
 * @apiError 401 master access only.
 */
router.put("/admins", isValidAdmin, admin.update);

/**
 * @api {patch} /admins/:adminId Modify admin
 * @apiName ModifyAdmin
 * @apiGroup Admin
 * @apiPermission master
 * @apiParam {String} access_token master access token.
 * @apiParam {Number} nonce authentication nonce generated every time
 * @apiParam {String} publicAddress  Metamask public address
 * @apiParam {String} username  admin's username
 * @apiParam {String} role  admin's role
 * @apiParam {Array} lastAccess [{accessDate, ipAddress}] user's last login/access
 * @apiParam {String} fullname  admin's first and last name
 * @apiParam {String} phone  admin's phone number
 * @apiParam {String} address  admin's physical address
 * @apiParam {String} email  admin's email address
 * @apiParam {Array} notifications [{date, notice, standing}] admin's notifications
 * @apiParam {String} standing  admin's status
 * @apiParam {Date} updated update date
 * @apiParam {String} updatedBy  AdminID of staff who updated the record
 * @apiparam {Boolean} onlineStatus admin's online Status
 * @apiSuccess {Object} admin Admin's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Admin not found.
 * @apiError 401 master access only.
 */
router.patch("/admins/:adminId", isValidAdmin, admin.modify);

/**
 * @api {delete} /admins/:adminId Delete admin
 * @apiName DeleteAdmin
 * @apiGroup Admin
 * @apiPermission master
 * @apiParam  access_token master access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Admin not found.
 * @apiError 401 master access only.
 */
router.delete("/admins/:adminId", isValidAdmin, admin.destroy);

export default router;
