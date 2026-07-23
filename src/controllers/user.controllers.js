import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/userModel.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const registerUser = asyncHandler( async (req, res) =>{
    // get user deatails from frontend
    // validation - not empty
    // check if user already exists: username , email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    //check for user creation
    //return res

    const {fullname, email, password} = req.body
    console.log("email : ", email);

  //checking validation
    if (
        [fullname, email, username, password].some((field) =>
        field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required")
    }

    //check if user already exists
    const existedUser = User.findOne({
        $or : [{ username }, { email }]   // new syntax to chk username, email is existed or not     
    })
    if (existedUser){
        throw new ApiError(409, "User with email or username already exists")
    }

    // check for images and avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;        // '?' means if available then take it
    const coverImagePath = req.files?.coverImage[0]?.path;

    if (! avatarLocalPath){                 // because avatar is mandatory
        throw new ApiError(400, "Avatar file is required")
    }
//upload them to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImagePath);

    if (! avatar){
        throw new ApiError(400, "Avatar file is required")
    }

    //create user object
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage : coverImage?.url || "",      // agr user ne coverImage di ho to uska url lo otherwise empty rhne do
        email,
        password,
        username : username.toLowerCase()
    })

    //removing password and refresh token field 
    const createdUser = await User.findById(user._id).select(  //lets chk if user is created or not
        "-password -refreshToken"                            //using _id param and removing pass, reftoken 
    )
    if (! createdUser){
        throw new ApiError(500, "something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "user registered successfully")
    )
    
})
export {registerUser}