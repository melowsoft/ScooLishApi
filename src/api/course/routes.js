import express from "express";
import * as product from "./controller";
import { isValidAdmin, isValidInstructor } from "../auth/controller";

const router = express.Router();

/**
 * @api {post} /course Create product
 * @description New created course are pending (an inactive state). Pending course require
 * user action to become active without any admin intervention. User action to activate
 * product include resolve issues relating to suspended vendor, brand, or category
 * A product can be pending because of insifficient product information such
 * lack of image, unit_price.
 * @apiName CreateProduct
 * @apiGroup Product
 * @apiParam {String} code product code
 * @apiParam {String} sku product sku
 * @apiParam {String} upc product upc
 * @apiParam {String} name name of product
 * @apiParam {Schema.Types.ObjectId} vendor vendorID that created product
 * @apiParam {Array} category [{main, sub}] product category
 * @apiParam {Schema.Types.ObjectId} brand brandID
 * @apiParam {Array} description [{color, unit, long, short, tag}] product description
 * @apiParam {Array} variety [{options, parent}] product variety
 * @apiParam {Array} price [{deal, valuation, unitPrice, costPrice, slashPrice, discount,
 *  discountType, tax, taxType}]
 * @apiParam {Array} images [{image_sm, image_md, image_lg, image_front, image_back, image_top,
 *  image_bottom, image_right,
 * image_left, icon}] product images
 * @apiParam {Array} shippingDetails [{cost, weight, length, width, height}] shipping details
 * @apiParam {Array} manufactureDetails [{make, model, releaseDate}] manufacturing details
 * @apiParam {Array} download [{downloadable, downloadName}] download details
 * @apiParam {Array} extraFields [{name, value}] extra fields
 * @apiParam {Array} appproval [{approved, approvedBy, approvedById, comment}] approval details
 * @apiParam {Array} analytics [{feature, viewDate, viewCount }]
 * @apiParam {String} standing product status(active/pending/remove/restore/trash)
 * @apiParam {Date} updated last update date
 * @apiParam {Boolean} action product action by admin, default is true. When false,
 *  product cannot be update
 * @apiSuccess {Object} product Product's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Product not found.
 * @apiError 401 master access only.
 */
router.post("/course", isValidInstructor, product.create);

/**
 * @api {post} /course/bolt Create  product from AliExpress
 * @description New created course are pending (an inactive state).
 */

/**
 * @api {get} vendor/:vendorDomain/course/kind/:kind Retrieve kinds of course
 * @description retrieve certain kinds of course a given vendor. Unauthenticated route
 * @apiName RetrieveProductsKind
 * @apiGroup Product
 * @apiParam {String} vendorDomain products’ vendors (unique) subdomain.
 * @apiParam {String} kind products’ query property [ normal | deal | feature | popular | latest]
 * @apiSuccess {Object[]} rows List of products.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 */
router.get("/products/stats", product.findStatRecords);
router.get("/products/admin", isValidAdmin, product.findAllProducts);
router.get("/products/vendor/:vendorDomain/?:kind", product.findAll);

/**
 * @api {get} /products/:id Retrieve any product.
 * @description retrieve any product. Unauthenticated route
 * @apiName RetrieveProduct
 * @apiGroup Product
 * @apiParam {String} productId product's (unique) Id.
 * @apiSuccess {Object} product Product's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Product not found.
 */
router.get("/products/:productId", product.findOne);

/**
 * @api {get} /products/operations/[:productIds] Retrieve multiple products
 * @description retrieve products for a given array of product id sent in diff ways
 *  1. JSON format: get http://server/url?array=["foo","bar"] -> let idArray = JSON.parse(req.query.array);
 *  2. CSV format: get http://server/url?array=foo,bar -> idArray = req.query.array.split(",");
 *  3. Percent Encoding & Repeat array: get http://server/url?arr[]=foo&arr[]=bar&arr[]=cat -> idArray = req.query.arr;
 *  4. Slashes: get http://server/url/foo/bar/... ->  app.get('/url/(:arr)*', function(req, res) ->
 *  idArray = [req.params.arr].concat(req.params[0].split("/").slice(1));
 * @apiName RetrieveProduct
 * @apiGroup Product
 * @apiParam {Array} productIds array of strings of unique product's Id
 * @apiSuccess {Object} product Product's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Product not found.
 */
// router.get("/products/operations/(:productIds)*", product.findSome);
router.get("/products/operations/:productIds(*)", product.findSome);

/**
 * @api {put} /products/:id Update product
 * @description update a product. Authenticated route for admin/vendor
 * Vendors can only update product(s) she owns and product action is true and standing is not trash.
 * Vendors can remove products from store, restore it and trash (remove|restore|trash).
 * Trashed products are only delete by later by admin if the product is not found
 * in any transanction such as order and abitration.
 * Admins only modify products action (status) namely: true | false
 * @apiName UpdateProduct
 * @apiGroup Product
 * @apiParam {String} code product code
 * @apiParam {String} sku product sku
 * @apiParam {String} upc product upc
 * @apiParam {String} name name of product
 * @apiParam {Schema.Types.ObjectId} vendor vendorID that created product
 * @apiParam {Array} category [{main, sub}] product category
 * @apiParam {Schema.Types.ObjectId} brand brandID
 * @apiParam {Array} description [{color, unit, long, short, tag}] product description
 * @apiParam {Array} variety [{options, parent}] product variety
 * @apiParam {Array} price [{deal, valuation, unitPrice, costPrice, slashPrice, discount,
 *  discountType, tax, taxType}]
 * @apiParam {Array} images [{image_sm, image_md, image_lg, image_front, image_back, image_top,
 *  image_bottom, image_right,
 * image_left, icon}] product images
 * @apiParam {Array} shippingDetails [{cost, weight, length, width, height}] shipping details
 * @apiParam {Array} manufactureDetails [{make, model, releaseDate}] manufacturing details
 * @apiParam {Array} download [{downloadable, downloadName}] download details
 * @apiParam {Array} extraFields [{name, value}] extra fields
 * @apiParam {Array} appproval [{approved, approvedBy, approvedById, comment}] approval details
 * @apiParam {Array} analytics [{feature, viewDate, viewCount }]
 * @apiParam {String} standing product status(active/pending/remove/restore/trash)
 * @apiParam {Date} updated last update date
 * @apiParam {Boolean} action product action by admin, default is true. When false,
 *  product cannot be update
 * @apiSuccess {Object} product Product's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Product not found.
 * @apiError 401 master access only.
 */
router.put("/products/:productId", isValidInstructor, product.update);

/**
 * @description vendor has exclusive right to their products to update
 * the admin can only modify by patching
 */
router.patch("/admin/products/:productId", isValidAdmin, product.modify);

/**
 * @description vendor has exclusive right to their products to update
 * the admin can only modify by patching
 */
router.patch(
  "/products/approval/:productId",
  isValidInstructor,
  product.approval
);

/**
 * @api {delete} /products/vendor/:productIds(*) Delete array of products by Vendor
 * @apiName DeleteProduct
 * @apiGroup Product
 * @apiPermission master
 * @apiParam {String} productIds slash-separated array of product Ids
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Product not found.
 * @apiError 401 master access only.
 */

/**
 * @api {delete} /products/admin/:productIds(*) Delete array of products by admin
 * @apiName DeleteProduct
 * @apiGroup Product
 * @apiPermission master
 * @apiParam {String} productIds slash-separated array of product Ids
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Product not found.
 * @apiError 401 master access only.
 */

export default router;
