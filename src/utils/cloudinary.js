import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"

(async function() {
    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
    });
})

const uploadOnCloudinary = async (localFilePath) =>{
    try {
        if (! localFilePath) return null                 // mtlb file path hi ni h toh kha upload kre toh return null
        //else upload file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type : auto                 // auto khud detect krega file type
        })
        // file has uploaded successfully
        console.log("file uploaded on cloudinary ",
            response.url );
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temp. file as the opration got failed
        return null;
    }
}

export {uploadOnCloudinary}





