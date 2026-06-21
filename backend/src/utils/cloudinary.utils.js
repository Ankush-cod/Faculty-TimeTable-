import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
/**
 * Upload file to Cloudinary
 * @param {string} localFilePath - Path to the local file to upload
 * @param {string} folderName - Folder name in Cloudinary (optional)
 * @returns {Promise<Object>} - Cloudinary response object
 */
export const uploadOnCloudinary = async (localFilePath, folderName = "faculty-timetable") => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: folderName,
    });
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    return response;
  } catch (error) {
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    console.error("Cloudinary upload error:", error);
    return null;
  }
};
/**
 * Delete file from Cloudinary
 * @param {string} publicId - Public ID of the file to delete
 * @returns {Promise<Object>} - Cloudinary deletion response
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) return null;
    const response = await cloudinary.uploader.destroy(publicId);
    return response;
  } catch (error) {
    console.error("Cloudinary deletion error:", error);
    return null;
  }
};
/**
 * Get Cloudinary URL for a public ID
 * @param {string} publicId - Public ID of the file
 * @param {Object} options - Additional transformation options
 * @returns {string} - Cloudinary URL
 */
export const getCloudinaryUrl = (publicId, options = {}) => {
  try {
    if (!publicId) return null;
    return cloudinary.url(publicId, {
      secure: true,
      ...options,
    });
  } catch (error) {
    console.error("Error generating Cloudinary URL:", error);
    return null;
  }
};
