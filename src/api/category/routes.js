import { Router } from "express";
import * as category from "./controller";
import { isValidInstructor, isValidAdmin } from "../auth/controller";

const router = new Router();

router.get("/categories/search", category.search);
/**
 * @api {post} /categories Create category
 * @apiName CreateCategory
 * @apiGroup Category
 * @apiParam {String} access_token master access token.
 * @apiParam {String} name name of category
 * @apiParam {String} description category description
 * @apiParam {String} kind category type (digital/physical)
 * @apiParam {String} icon category icon
 * @apiParam {String} banner category banner
 * @apiParam {String} parent parent category
 * @apiParam {Schema.Types.ObjectId} vendor  vendor that created category
 * @apiParam {Number} view_count number of views
 * @apiParam {String} standing status of category (active/suspended/trashed)
 * @apiParam {Date} updated date of last update
 * @apiSuccess {Object} Category Category's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Category not found.
 * @apiError 401 master access only.
 */
router.post(
  "/categories/instructor/category",
  isValidInstructor,
  category.create
);
router.post("/categories/admin/category", isValidAdmin, category.create);

export default router;
