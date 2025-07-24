import mongoose from "mongoose";
import app from "../app"

mongoose.set("strictQuery", false);

export const connectDB = async () => {
  mongoose
    .connect(process.env.MONGODB_CONNECTION_STRING!)
    .then(() => {
      console.log("MongoDB connected");
      app.listen(process.env.PORT, () => {
        console.log(`Server is running on Port : ${process.env.PORT}`);
      });
    })
    .catch(console.error);
};
