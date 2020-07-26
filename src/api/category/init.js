import { success, fail } from "./../../services/response/";
import Category from "./model";
import { getAnyAdmin } from "../admin/init";
import { getAnyVendor } from "../vendor/init";
import { getAnyCollection } from "../collection/init";

export async function initCategory(req, res) {
  let admin;
  try {
    admin = await getAnyAdmin();
  } catch (err) {}

  if (!admin) admin = { _id: "5b54e618ae6b2a035fe83843" };

  let vendor;
  try {
    vendor = await getAnyVendor();
  } catch (err) {}

  if (!vendor) vendor = { _id: "5beab291c518c63dc217142c" };

  let collection;
  try {
    collection = await getAnyCollection();
  } catch (err) {}

  if (!collection) collection = { _id: "5b83d082f85b7a561ce9511d" };

  const category = {
    _id: "5b83d082f85b7a561ce95119",
    parent: "0",
    collections: collection._id,
    viewCount: 1,
    standing: "active",
    action: "allow",
    vendor: vendor._id,
    name: "Smart Phones",
    description: "Smart Phone Collections.",
    kind: "physical",
    updated: Date("2018-08-27T10:20:50.385Z"),
    createdAt: Date("2018-08-27T10:20:50.386Z"),
    updatedAt: Date("2018-08-27T10:28:10.419Z"),
    __v: 0,
    banner:
      "https://storage.googleapis.com/olaife/images/media/5b83d082f85b7a561ce951092dc855082f6fb1708614209d5e9343ef.jpeg",
    icon:
      "https://storage.googleapis.com/olaife/images/media/5b83d082f85b7a561ce95109c93f01b138b0ff3deed6d52015cd2585.jpeg"
  };

  const category1 = {
    _id: "5b83d2a5f85b7a561ce9510a",
    parent: "0",
    collections: collection._id,
    viewCount: 1,
    standing: "active",
    action: "allow",
    vendor: vendor._id,
    name: "Wearables ",
    description: "Wearables Collections.",
    kind: "physical",
    updated: Date("2018-08-27T10:29:57.993Z"),
    createdAt: Date("2018-08-27T10:29:57.995Z"),
    updatedAt: Date("2018-08-27T10:34:45.261Z"),
    __v: 0,
    icon:
      "https://storage.googleapis.com/olaife/images/media/5b83d2a5f85b7a561ce9510aa972f26f34c3ad4aeb2663454088f44a.jpeg",
    banner:
      "https://storage.googleapis.com/olaife/images/media/5b83d2a5f85b7a561ce9510abf690bf46f4d230ddaff108fcca86d68.jpeg"
  };

  const category2 = {
    _id: "5b83d3f1f85b7a561ce9510b",
    parent: "0",
    collections: collection._id,
    viewCount: 1,
    standing: "active",
    action: "allow",
    vendor: vendor._id,
    name: "Entertainment",
    description: "Entertainment Collection.",
    kind: "physical",
    updated: Date("2018-08-27T10:35:29.618Z"),
    createdAt: Date("2018-08-27T10:35:29.619Z"),
    updatedAt: Date("2018-08-27T10:40:15.728Z"),
    __v: 0,
    icon:
      "https://storage.googleapis.com/olaife/images/media/5b83d3f1f85b7a561ce9510b1231f13ad62983074f469b6a6718173c.jpeg",
    banner:
      "https://storage.googleapis.com/olaife/images/media/5b83d3f1f85b7a561ce9510bc9f3ee7882b9c62ec68a17a26319edb2.jpeg"
  };

  const category3 = {
    _id: "5b83d3f1f85b7a561ce9516b",
    parent: "0",
    collections: collection._id,
    viewCount: 1,
    standing: "active",
    action: "allow",
    vendor: vendor._id,
    name: "Bolt",
    description: "Bolt Collection.",
    kind: "physical",
    updated: Date("2018-08-27T10:35:29.618Z"),
    createdAt: Date("2018-08-27T10:35:29.619Z"),
    updatedAt: Date("2018-08-27T10:40:15.728Z"),
    __v: 0,
    icon:
      "https://storage.googleapis.com/olaife/images/media/5b83d3f1f85b7a561ce9510b1231f13ad62983074f469b6a6718173c.jpeg",
    banner:
      "https://storage.googleapis.com/olaife/images/media/5b83d3f1f85b7a561ce9510bc9f3ee7882b9c62ec68a17a26319edb2.jpeg"
  };

  const cat1 = new Category(category1);
  cat1.save().then(result => result);
  const cat2 = new Category(category2);
  cat2.save().then(result => result);
  const cat3 = new Category(category3);
  cat3.save().then(result => result);
  const cat = new Category(category);

  return cat
    .save()
    .then(result => {
      if (!result) {
        fail(res, 404, "Error not found newly added Category");
      }
      return success(res, 200, result, "Done Initializing Category Data!");
    })
    .catch(err => {
      fail(res, 500, `Error adding Category ${err.message}`);
    });
}

export function getAnyCategory() {
  Category.findOne()
    .sort({ created_at: -1 })
    .exec((_err, result) => result);
}
