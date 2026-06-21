import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const adminSchema = new mongoose.Schema({
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        lowercase: true, 
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    password: { type: String, required: true },
    fullName: { type: String, required: true },
    image: { type: String },
    role: { type: String, enum: ["Admin"], default: "Admin" },
    refreshToken: { type: String }
}, { timestamps: true });
adminSchema.pre("save", async function(){
    if(!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10);
});
adminSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password);
};
adminSchema.methods.generateAccessToken = function(){
    return jwt.sign({ _id: this._id, email: this.email, fullName: this.fullName, role: this.role }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRY });
};
adminSchema.methods.generateRefreshToken = function(){
    return jwt.sign({ _id: this._id, role: this.role }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRY });
};
export const Admin = mongoose.model("Admin", adminSchema);