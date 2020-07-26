import { success, fail } from "./../../services/response/";
import Review from "./model";
import { getAnyCustomer } from "../customer/init";
import { getAnyProduct } from "../product/init";

export async function initReview(req, res) {
  let product;
  try {
    product = await getAnyProduct();
  } catch (err) {
  }

  if (!(product)) product = { _id: "5b54e618ae6b2a035fe83843" };

  let customer;
  try {
    customer = await getAnyCustomer();
  } catch (err) {
  }

  if (!(customer)) customer = { _id: "5b83c483f85b7a561ce95107" };

  const review = {
    customer: customer._id,
    subject: "product",
    subjectId: product._id,
    comment: "My order was not delivered on time and it arrived in bad condition.",
    rating: 3,
  };

  const record = new Review(review);
  return record.save()
    .then((result) => {
      if (!result) {
        fail(res, 404, "Error not found newly added Review");
      }
      return success(res, 200, result, "Done Initializing Review Data!");
    }).catch((err) => {
      fail(res, 500, `Error adding Review ${err.message}`);
    });
}

export function getAnyReview() {
  Review.findOne().sort({ created_at: -1 }).exec((_err, result) => result);
}
