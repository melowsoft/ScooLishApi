/**
 * @description
 * Create Class that handle Image Upload
 * @author ifeoluwa Odewale
 */
import crypto from "crypto";
import storage from "@google-cloud/storage";

class FileSystem {
  /**
   * Generate a random cryptographic filename with
   * @method generateRandomFilename
   */
  static generateRandomFilename(extension) {
    // create pseudo random bytes
    const bytes = crypto.pseudoRandomBytes(32);

    // create the md5 hash of the random bytes
    const checksum = crypto.createHash("MD5").update(bytes).digest("hex");

    // return as filename the hash with the output extension
    return `${checksum}.${extension}`;
  }

  static getBase64Extension(data) {
    let ext;
    if (data.search("data:image/png;base64,") > -1) {
      ext = "png";
    } else if (data.search("data:image/jpeg;base64,") > -1) {
      ext = "jpeg";
    }

    return ext;
  }

  static gclound(file, options) {
    const bucket = this.getBucket();
    return new Promise((resolve, reject) => {
      bucket.upload(file, options)
        .then(() => resolve(options))
        .catch(err => reject(err));
    });
  }

  static getCloudUploadOptions(file, meta, ext = "jpeg") {
    return {
      destination: file,
      public: true,
      metadata: {
        contentType: `image/${ext}`,
        metadata: meta,
      },
    };
  }

  static remove(fileURL) {
    const bucket = this.getBucket();
    return new Promise((resolve, reject) => {
      const gFile = bucket.file(fileURL);
      gFile.delete((err, result) => {
        if (err) return reject(err);
        return resolve(result);
      });
    });
  }

  static saveFile(image, filename, ext) {
    const base64EncodedImageString = image.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64EncodedImageString, "base64");
    const bucket = this.getBucket();
    const file = bucket.file(filename);
    return new Promise((resolve, reject) => {
      file.save(imageBuffer, {
        metadata: { contentType: `image/${ext}` },
        public: true,
        validation: "md5",
      }, (error) => {
        if (error) {
          return reject(error);
        }
        return resolve({});
      });
    });
  }

  static getGoogleBucketName(gbname = true) {
    return gbname === true ? process.env.GOOGLE_BUCKET : process.env.GOOGLE_BUCKET_DEFAULT_IMAGES;
  }

  static getBucket(gbname = true) {
    const googleProjectId = process.env.GOOGLE_PROJECT_ID;

    const gcs = storage({
      projectId: googleProjectId,
      keyFilename: "gcloud.config.json",
    });
    return gcs.bucket(this.getGoogleBucketName(gbname));
  }

  static getAllFiles(defaultType) {
    const bucket = this.getBucket(false);
    const images = [];
    const type = defaultType === "all" ? "" : defaultType;
    const query = {
      prefix: `images/stock/${type}`,
    };
    return new Promise((resolve, reject) => {
      bucket.getFiles(query, (err, files, nextQuery) => {
        if (err) {
          return reject(err);
        }
        files.forEach((file, index) => {
          images.push(`https://storage.googleapis.com/${this.getGoogleBucketName(false)}/${file.metadata.name}`);
        });
        return resolve(images);
      });
    });
  }
}

export default FileSystem;

