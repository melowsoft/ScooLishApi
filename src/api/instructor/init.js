import bcrypt from "bcrypt";
import { success, fail } from "./../../services/response/";
import Vendor from "./model";
import { randomNonce, saltRounds } from "./../../services/helpers";

const vendor = {
  nonce: 34635564,
  publicAddress: randomNonce(),
  username: "xilly",
  fullname: "Jammy Xilly",
  phone: "081234567890",
  address: "No7 Bright Estate, Lekki Phase I, Lagos",
  email: "billy@gmail.com",
  domainName: "nanotechnology.com",
  businessName: "Nano Technologies Inc.",
  language: "English",
  password: "wendy7678",
  tagline: "Nano Tech",
  details: "Nano Technology is the emerging trand",
  website: "http://www.nanotechnology.com",
  facebook: "facebook.com/solidOxford",
  skype: "@solidOxford",
  google_plus: "@solidOxford",
  twitter: "@solidOxford",
  youtube: "@solidOxford",
  pinterest: "@solidOxford",
  tag: "wears",
  description: "Blaze Fashion Design Unlimited",
  country: "U.S.A",
  city: "Dallas",
  zip: "10201",
  state: "Texas",
  theme: "light",
  logo: "logo",
  banner: "banner",
  home_page_style: "light",
  product_page_style: "dark",
  product_detail_page_style: "dark",
  profile_page_style: "dark",
  blog_page_style: "dark",
  mail_page_style: "dark",
  invoice_page_style: "dark",
  ticket_page_style: "dark",
  approvedBy: ("5b83d082f85b7a561ce95109"),
  approvedAt: Date.now(),
};

export async function initVendor(req, res) {
  try {
    vendor.password = await bcrypt.hash(vendor.password, saltRounds);
  } catch (error) {
  }
  const record = new Vendor(vendor);
  return record.save()
    .then((result) => {
      if (!result) {
        fail(res, 404, "Error not found newly added vendor");
      }
      return success(res, 200, result, "Done Initializing Vendor Data!");
    }).catch((err) => {
      fail(res, 500, `Error adding vendor ${err.message}`);
    });
}

export function getAnyVendor() {
  Vendor.findOne().sort({ created_at: -1 }).exec((_err, result) => result);
}
