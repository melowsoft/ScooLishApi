/*
* @author 4Dcoder
* @coauthor Sylvia
*/

import express from "express";
import * as review from "./controller";
import { isValidAdmin, isValidVendor, isValidCustomer } from "../auth/controller";
import { initReview } from "./init";

const router = express.Router();

router.get("/init/review", initReview);

/**
 * @api {post} /reviews/customer Create review
 * @apiName CreateReviewCustomer
 * @apiGroup Review
 * @apiParam {String} access_token master access token.
 * @apiParam {String}  subject review subject
 * @apiParam {String} subjectId  subjectID
 * @apiParam {String} comment  review comment
 * @apiParam {String} rating  review rating
 * @apiParam {String} standing  review status(show/trashed)
 * @apiParam {Date} updated date of last update
 * @apiSuccess {Object} Review Review's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Review not found.
 * @apiError 401 master access only.
 */
router.post("/reviews/customer", isValidCustomer, review.create);

/**
 * @api {post} /reviews/vendor Create review
 * @apiName CreateReviewVendor
 * @apiGroup Review
 * @apiParam {String} access_token master access token.
 * @apiParam {String}  subject review subject
 * @apiParam {String} subjectId  subjectID
 * @apiParam {String} comment  review comment
 * @apiParam {String} rating  review rating
 * @apiParam {String} standing  review status(show/trashed)
 * @apiParam {Date} updated date of last update
 * @apiSuccess {Object} Review Review's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Review not found.
 * @apiError 401 master access only.
 */
router.post("/reviews/vendor", isValidVendor, review.create);

/**
 * @api {get} /reviews Retrieve reviews
 * @apiName RetrieveReviews
 * @apiGroup Review
 * @apiSuccess {Object[]} rows List of Reviews.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 */
router.get("/reviews/vendor/:vendorDomain", review.findAll);

/**
 * @description Customers can view all their reviews across vendors
 */
router.get("/reviews/customer", review.findAll);

/**
 * @api {get} /reviews/:id Retrieve review
 * @apiName RetrieveReview
 * @apiGroup Review
 * @apiSuccess {Object} review Review's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Review not found.
 */
router.get("/reviews/:reviewId", review.findOne);

/**
 * @api {put} /reviews/:id Update review
 * @apiName UpdateReview
 * @apiGroup Review
 * @apiPermission master
 * @apiParam {String} access_token master access token.
 * @apiParam {Schema.Types.ObjectId} customer customerID
 * @apiParam {Schema.Types.ObjectId} vendor vendorID
 * @apiParam {String}  subject review subject
 * @apiParam {String} subjectId  subjectID
 * @apiParam {String} comment  review comment
 * @apiParam {String} rating  review rating
 * @apiParam {String} standing  review status(show/trashed)
 * @apiParam {Date} updated date of last update
 * @apiSuccess {Object} review Review's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Review not found.
 * @apiError 401 master access only.
 */
router.put("/reviews/:reviewId", isValidCustomer, review.update);


/**
 * @api {patch} /reviews/:id Modify review
 * @apiName ModifyReview
 * @apiGroup Review
 * @apiPermission master
 * @apiParam {String} access_token master access token.
 * @apiParam {String} standing  review status(show/trashed)
 * @apiParam {String}  action Administrative acion on review
 * @apiSuccess {Object} review Review's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Review not found.
 * @apiError 401 master access only.
 */
router.patch("/reviews/:reviewId", isValidAdmin, review.modify);


/**
 * @api {delete} /reviews/:id Delete review
 * @apiGroup Review
 * @apiPermission master
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Review not found.
 * @apiError 401 master access only.
 */
router.delete("/reviews/:reviewId", isValidCustomer, review.destroy);

/**
 * @api {delete} /reviews/admin/:reviewIds(*) Delete array of reviews by Admin
 * @apiName DeleteReviewAdmin
 * @apiGroup Review
 * @apiParam {String} reviewIds arrays of review Ids
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Review not found.
 * @apiError 401 master access only.
 */
router.delete("/reviews/admin/:reviewIds(*)", isValidAdmin, review.destroy);

export default router;
