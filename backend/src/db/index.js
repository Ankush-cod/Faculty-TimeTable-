import mongoose from 'mongoose';
import { DB_Name } from '../constants.js';
export const connectDB = async () => {
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URI}/${DB_Name}`, {
            writeConcern: { w: 1 }
        })
        console.log("Connected to MongoDB successfully");
    }catch(error)
    {
        console.log("Error connecting to MongoDB:", error);
        process.exit(1);
    }
}