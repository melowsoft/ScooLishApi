import bcrypt from "bcrypt";
import { success, fail } from "./../../services/response/";
import Customer from "./model";
import { randomNonce, saltRounds } from "./../../services/helpers";
import { getAnyProduct } from "../product/init";


export async function initCustomer(req, res) {
  let product;
  try {
    product = await getAnyProduct();
  } catch (err) {
  }

  if (!(product)) product = { _id: "5b54e618ae6b2a035fe83843" };

  const customer = {
    nonce: randomNonce(),
    publicAddress: "0x1b19bfacc9fbcedd42deed4fe200beb039ecd1e0",
    btcAddress: "0x1b19bfacc9fbcedd42deed4fe200beb039ecd1e1",
    wallet: "bez wallet",
    username: "Frica",
    cart: [{ product: product._id, quantity: 10 }, { product: product._id, quantity: 7 }],
    wishlist: [{ name: "Xmas Shopping", products: [{ product: product._id, quantity: 10 }, { product: product._id, quantity: 7 }] },
      { name: "Rentree´ Scolair", products: [{ product: product._id, quantity: 10 }, { product: product._id, quantity: 7 }] }],
    gender: "female",
    recoveryCode: 1001,
    password: "6090juy778",
    photo: "default-customer-photo",
    profile: "",
    preferences: {
      currency: "5b559970dc79a83543dddb60",
      languageList: "5b5599d7ad92653576aa718b",
    },
    fullname: "Jackie Jone",
    shipping: {
      country: "Ambazonia",
      state: "Anambra",
      city: "Awka",
      street: "GRA Quaters",
      building: "Plot 37, Bz street",
      zip: "5567",
    },
    phone: "097907689",
    email: "jones@hotdog.com",
    lastAccess: [{
      accessDate: "2018-08-20",
      ipAddress: "192.160.0.187",
    }],
    notifications: [{
      date: "2018-07-12T11:17:29.845Z",
      notice: "New user signup",
      standing: "unread",
    }],
    onlineStatus: true,
    standing: "active",
    action: "allow",
  };

  try {
    customer.password = await bcrypt.hash(customer.password, saltRounds);
  } catch (error) {
  }

  const record = new Customer(customer);
  return record.save()
    .then((result) => {
      if (!result) {
        fail(res, 404, "Error not found newly added Customer");
      }
      return success(res, 200, result, "Done Initializing Customer Data!");
    }).catch((err) => {
      fail(res, 500, `Error adding Customer ${err.message}`);
    });
}

export function getAnyCustomer() {
  Customer.findOne().sort({ created_at: -1 }).exec((_err, result) => result);
}
