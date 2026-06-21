import { asyncHandler } from "../utils/asyncHandler.utils.js";
import { ApiError } from "../utils/apiError.utils.js";
import jwt from "jsonwebtoken";
import { Faculty } from "../model/faculty.model.js";
import { Admin } from "../model/admin.model.js";

export const verifyJwt = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
    if(!token) throw new ApiError(401, "Unauthorized");
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    let user = await Admin.findById(decoded._id).select("-password -refreshToken");
    let role = "Admin";
    if(!user){
        user = await Faculty.findById(decoded._id).select("-password -refreshToken");
        role = "Faculty";
    }
    if(!user) throw new ApiError(401, "Unauthorized");
    req.user = user;
    req.role = role;
    next();
});