import SimpleEncryptor from "simple-encryptor";

const encryptor = SimpleEncryptor(process.env.JWT_ENCRYPTION_KEY);

export const jwtSecret = process.env.JWT_SECRET || "SOME hidden key";

/**
 * @param {String} key the encryption key
 * @param {Object} obj the object or string to encrypt
 */
export function encrypt(obj) {
  return encryptor.encrypt(obj);
}

/**
 * @param {String} key the encryption key
 * @param {String} encrypted the encrypted to be decrypted
 */
export function decrypt(encrypted) {
  return encryptor.decrypt(encrypted);
}

// Retrieve token from request header
export const getToken = (req) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.split(" ")[0] === "Bearer") {
    // eslint-disable-next-line prefer-destructuring
    token = req.headers.authorization.split(" ")[1];
  } else if (req.query && req.query.token) {
    // eslint-disable-next-line prefer-destructuring
    token = req.query.token;
  }
  if (!token) return null;
  try {
    const decrypted = decrypt(token);
    return decrypted;
  } catch (err) {
    return null;
  }
};
