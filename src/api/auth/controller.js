/**
 * File /auth/controller.js
 * @desc It handles User users Login and Signup
 * @author 4Dcoder
 * @date 6 August 2018
 * @params publicAddress for metamask
 */

import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import Admin from "./../admin/model";
import Instructor from "./../instructor/model";
import Student from "./../student/model";
import {
  getClientAccess,
  addToArrayOfObjects,
  randomNonce,
  findEmail,
  saltRounds,
  getClientDetails
} from "./../../services/helpers";
import { success, fail, notFound } from "./../../services/response";
import { jwtSecret, getToken, encrypt } from "./../../services/jwt";
import { countAdmin } from "../admin/controller";

// ///////////////////////////////////////////////////
// 1. First, find the record with public Address
// /:userType/:authType/publicaddress/:publicAddress
// //////////////////////////////////////////////////
export async function find(req, res, next) {
  let User = null;
  let adminCount;
  const { userType, authType, publicAddress, subscriptionType } = req.params;
  if (!userType || !authType || !publicAddress) {
    return fail(
      res,
      401,
      "Request should have a Metamask address or auth  and user type"
    );
  }

  if (userType === "admin") {
    User = Admin;
    if (authType === "signup") {
      try {
        adminCount = await countAdmin({});
      } catch (err) {}
    }
  } else if (userType === "instructor") {
    User = Instructor;
  } else if (userType === "student") {
    User = Student;
  } else {
    return fail(res, 401, "Request should have a valid user type");
  }

  const newUser = new User({ publicAddress });

  return User.findOne({ publicAddress })
    .exec()
    .then(user => {
      if ((!user && authType === "login") || (user && authType === "signup")) {
        const msg =
          authType === "login"
            ? ` ${userType} is not found, please signup`
            : ` ${userType} already exist, login`;
        return fail(
          res,
          401,
          `User with publicAddress ${publicAddress} ${msg} `
        );
      }

      // /////////////////////////////////////////////////////////////
      // If the user doesn't exit and access is signup, Create a User
      // /////////////////////////////////////////////////////////////

      if (!user && authType === "signup") {
        if (userType === "admin" && adminCount === 0) {
          newUser.role = "super";
          newUser.standing = "active";
          newUser.completeProfile = true;
          newUser.notifications = {
            date: Date.now(),
            notice: "Please update your profile",
            standing: "unread"
          };
        }
        if (userType === "admin" && adminCount > 0) {
          newUser.notifications = {
            date: Date.now(),
            notice: "Please update your profile",
            standing: "unread"
          };
        }
        if (userType === "instructor") {
          newUser.domainName = publicAddress;
          if (subscriptionType) {
            newUser.subscriptionType = subscriptionType;
          }
        }

        return newUser
          .save()
          .then(record =>
            success(
              res,
              200,
              {
                publicAddress,
                nonce: record.nonce,
                authType: "signup",
                subscriptionType
              },
              "new User record has been created"
            )
          )
          .catch(err =>
            fail(
              res,
              500,
              err.message || "Some error occurred while creating the User."
            )
          );
      }

      // /////////////////////////////////////////////////////////////
      // If the user exist and access is login, authenticate a User
      // /////////////////////////////////////////////////////////////
      if (user && authType === "login") {
        return success(
          res,
          200,
          { publicAddress, nonce: user.nonce, authType },
          "Login successful!"
        );
      }
      return fail(res, 500, "Unknown error finding user.");
    })
    .catch(next);
}

// ///////////////////////////////////////////////////
// 2. Secondly, the signed message is posted with publicAddress
// /{post} /:userType/auth/:authType Authenticate
// body { signature, publicAddress }
// returns the accessToken if Authentication is successful
// //////////////////////////////////////////////////
export function auth(req, res, next) {
  let User = null;
  const { signature, publicAddress } = req.body;
  const { userType, authType } = req.params;
  if (!signature || !publicAddress) {
    return fail(res, 401, "Request should have signature and publicAddress");
  }

  switch (userType) {
    case "admin":
      User = Admin;
      break;
    case "instructor":
      User = Instructor;
      break;
    case "student":
      User = Student;
      break;
    default:
      return fail(res, 401, "Unknown user type!");
  }

  let currentUser = {};

  return (
    User.findOne({ publicAddress, action: "allow" })
      .exec()

      // //////////////////////////////////////////////////
      // Step 1: Get the user with the given publicAddress
      // //////////////////////////////////////////////////

      .then(user => {
        if (!user) {
          return fail(
            res,
            401,
            `User with publicAddress ${publicAddress} is not allowed access or not found in database.`
          );
        }
        const clientAccess = getClientAccess(req);
        // Log last_access
        user.lastAccess = addToArrayOfObjects(
          user.lastAccess,
          10,
          clientAccess
        );
        return user
          .save()
          .then(record => record)
          .catch(err =>
            fail(res, 401, err.message || "Unable to update user lastAccess.")
          );
      })

      // //////////////////////////////////////////////////
      // Step 2: Verify digital signature
      // //////////////////////////////////////////////////

      .then(user => {
        const msg = `I am signing my one-time nonce: ${
          user.nonce
        } to ${authType}`;

        // We now are in possession of msg, publicAddress and signature. We
        // can perform an elliptic curve signature verification with ecrecover
        const msgBuffer = ethUtil.toBuffer(msg);
        const msgHash = ethUtil.hashPersonalMessage(msgBuffer);
        const signatureBuffer = ethUtil.toBuffer(signature);
        const signatureParams = ethUtil.fromRpcSig(signatureBuffer);
        const publicKey = ethUtil.ecrecover(
          msgHash,
          signatureParams.v,
          signatureParams.r,
          signatureParams.s
        );
        const addressBuffer = ethUtil.publicToAddress(publicKey);
        const address = ethUtil.bufferToHex(addressBuffer);

        // The signature verification is successful if the address found with
        // ecrecover matches the initial publicAddress
        if (address.toLowerCase() !== publicAddress.toLowerCase()) {
          return fail(res, 401, "Signature verification failed");
        }
        return user;
      })

      // //////////////////////////////////////////////////
      // Step 3: Generate a new nonce for the user
      // //////////////////////////////////////////////////

      .then(user => {
        user.nonce = randomNonce();
        return user
          .save()
          .then(record => record)
          .catch(err =>
            fail(res, 401, err.message || "\r\nUnable to update user nonce.")
          );
      })

      // //////////////////////////////////////////////////
      // Step 4: Create JWT
      // //////////////////////////////////////////////////

      .then(user => {
        currentUser = user;
        return new Promise((resolve, reject) =>
          // https://github.com/auth0/node-jsonwebtoken
          jwt.sign(
            {
              payload: {
                id: user.id,
                publicAddress,
                email: user.email,
                device: getClientDetails(req)
              }
            },
            jwtSecret,
            null,
            (err, token) => {
              if (err) return reject(err);
              return resolve(token);
            }
          )
        );
      })
      .then(accessToken => {
        try {
          const encrypted = encrypt(accessToken);
          success(
            res,
            200,
            { accessToken: encrypted, id: currentUser.id },
            "Authentication successful!"
          );
        } catch (err) {
          fail(res, 401, "Unable to generate an access token");
        }
      })
      .catch(next)
  );
}

// Authorize to access admin protected route
export function isValidAdmin(req, res, next) {
  const accessToken = getToken(req);
  let filter;

  if (!req.params) {
    return fail(res, 403, "Authentication Failed: invalid request parameters.");
  }

  if (!accessToken) {
    return fail(res, 403, "Authentication Failed: undefined token.");
  }

  try {
    const {
      payload: { id, publicAddress, email, device }
    } = jwt.verify(accessToken, jwtSecret);
    if (device !== getClientDetails(req))
      throw new Error("Admin verification failed");
    if (publicAddress && email) {
      filter = { publicAddress, email };
    } else if (publicAddress) {
      filter = { publicAddress };
    } else if (email) {
      filter = { email };
    }
    return (
      Admin.findOne(filter)
        .select({ publicAddress: true, email: true })
        .exec()
        // Step 1: Get the admin with the given publicAddress
        .then(admin => {
          if (!admin) {
            return notFound(
              res,
              `Admin with publicAddress ${publicAddress} or
        email ${email} is not found in database.`
            );
          }
          res.locals.userId = id;
          res.locals.userType = "admin";
          res.locals.userRole = admin.role;
          res.locals.userEmail = email;
          return next();
        })
    );
  } catch (err) {
    return fail(res, 401, "Admin verification failed");
  }
}

// Authorize to access Instructors protected route
export function isValidInstructor(req, res, next) {
  const accessToken = getToken(req);
  let filter;

  if (!req.params) {
    return fail(res, 403, "Authentication Failed: invalid request parameters.");
  }

  if (!accessToken) {
    return fail(res, 403, "Authentication Failed: undefined token.");
  }

  try {
    const {
      payload: { id, publicAddress, email, device }
    } = jwt.verify(accessToken, jwtSecret);
    if (device !== getClientDetails(req))
      throw new Error("Instructor verification failed");
    if (publicAddress && email) {
      filter = { publicAddress, email };
    } else if (publicAddress) {
      filter = { publicAddress };
    } else if (email) {
      filter = { email };
    }
    return (
      Instructor.findOne(filter)
        .select({ publicAddress: true, email: true })
        .exec()
        // Step 1: Get the instructor with the given publicAddress
        .then(instructor => {
          if (!instructor)
            return notFound(
              res,
              `Instructor with publicAddress ${publicAddress} is not found in database.`
            );
          if (instructor.id !== id) {
            return fail(res, 401, "Instructor verification failed");
          }
          res.locals.userId = id;
          res.locals.userType = "instructor";
          res.locals.userRole = "instructor";
          res.locals.userEmail = email;
          return next();
        })
    );
  } catch (err) {
    return fail(res, 401, "Instructor verification failed");
  }
}

// Authorize to access Student protected route
export function isValidStudent(req, res, next) {
  const accessToken = getToken(req);
  let filter;

  if (!req.params) {
    return fail(res, 403, "Authentication Failed: invalid request parameters.");
  }

  if (!accessToken) {
    return fail(res, 403, "Authentication Failed: undefined token.");
  }

  try {
    const {
      payload: { id, publicAddress, email, device }
    } = jwt.verify(accessToken, jwtSecret);
    if (device !== getClientDetails(req))
      throw new Error("Student verification failed");
    if (publicAddress && email) {
      filter = { publicAddress, email };
    } else if (publicAddress) {
      filter = { publicAddress };
    } else if (email) {
      filter = { email };
    }
    return (
      Student.findOne(filter)
        .select({ publicAddress: true, email: true })
        .exec()
        // Step 1: Get the student with the given publicAddress
        .then(student => {
          if (!student)
            return notFound(
              res,
              `Student with publicAddress ${publicAddress} is not found in database.`
            );
          if (student.id !== id) {
            return fail(res, 401, "Student verification failed");
          }
          res.locals.userId = id;
          res.locals.userType = "student";
          res.locals.userRole = "student";
          res.locals.userEmail = email;
          return next();
        })
    );
  } catch (err) {
    return fail(res, 401, "Student verification failed");
  }
}

export async function emailSignup(req, res, next) {
  let User = null;
  const { email, password, subscription } = req.body;
  const { userType } = req.params;

  if (!email || !password) {
    return fail(res, 401, "Request should have signature and publicAddress");
  }
  if (!req.params) {
    return fail(res, 403, "Authentication Failed: invalid request parameters.");
  }
  switch (userType) {
    case "admin":
      User = Admin;
      break;
    case "instructor":
      User = Instructor;
      break;
    case "student":
      User = Student;
      break;
    default:
      return fail(res, 401, "Unknown user type!");
  }

  let user;

  try {
    user = (await findEmail(User, email)) || {};
  } catch (err) {
    return fail(
      res,
      500,
      `Error finding user with email ${email}. ${err.message}`
    );
  }

  if (user && email === user.email) {
    return fail(res, 500, `User with email already exist. ${email}`);
  }

  return bcrypt
    .hash(password, saltRounds)
    .then(hash => {
      const newUser = new User({
        email: req.body.email,

        password: hash,
        notifications: {
          date: Date.now(),
          notice: "Please update your profile",
          standing: "unread"
        }
      });
      if (subscription) {
        newUser.subscriptionType = subscription;
      }
      return newUser
        .save()
        .then(saved =>
          success(res, 200, saved, "new User record has been created")
        )
        .catch(err => fail(res, 500, `Error creating user. ${err}`));
    })
    .catch(err => fail(res, 500, `Error encrypting user password. ${err}`));
}

export async function emailLogin(req, res, next) {
  let User = null;
  const { email, password } = req.body;
  const { userType } = req.params;
  if (!email || !password) {
    return fail(res, 401, "Request should have signature and publicAddress");
  }
  if (!req.params) {
    return fail(res, 403, "Authentication Failed: invalid request parameters.");
  }
  switch (userType) {
    case "admin":
      User = Admin;
      break;
    case "instructor":
      User = Instructor;
      break;
    case "student":
      User = Student;
      break;
    default:
      return fail(res, 401, "Unknown user type!");
  }

  let currentUser;
  let user;

  try {
    user = (await findEmail(User, email)) || {};
  } catch (err) {
    return fail(
      res,
      500,
      `Error finding user with email ${email}. ${err.message}`
    );
  }
  if (!user.email)
    return fail(res, 500, `Could not find user with email ${email}`);
  const match = await bcrypt.compare(password, user.password);

  if (match) {
    // //////////////////////////////////////////////////
    // Step 4: Create JWT
    // //////////////////////////////////////////////////
    user.nonce = randomNonce();
    return user
      .save()
      .then(record => {
        currentUser = record;
        return new Promise((resolve, reject) =>
          jwt.sign(
            {
              payload: {
                id: record.id,
                publicAddress: record.publicAddress,
                email,
                device: getClientDetails(req)
              }
            },
            jwtSecret,
            null,
            (err, token) => {
              if (err) reject(err);
              resolve(token);
            }
          )
        );
      })
      .then(accessToken => {
        try {
          const encrypted = encrypt(accessToken);
          success(
            res,
            200,
            { accessToken: encrypted, id: currentUser.id },
            "Authentication successful!"
          );
        } catch (err) {
          fail(res, 401, "Unable to generate an access token");
        }
      })
      .catch(next);
  }
  return fail(res, 403, "Authentication Failed: invalid credentials.");
}
