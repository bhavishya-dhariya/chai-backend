import mongoose from "mongoose"

const connectDB = async() =>{
    try {
       const connnectionInstance = await mongoose.connect(`${process.env.MONGO_URI}`)
       console.log(`\n MongDB connected !!
        ${connnectionInstance.connection.host}`);
    } catch (error) {
        console.log("MongoDB connnection Failed ", error);
    }
}

export default connectDB