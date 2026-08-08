import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/userModel.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

const generateAccessAndRefreshToken = async(userId) =>{
    try{
        const user = User.findById(userId)
        const accessToken = user.generateAccessToken()
        const RefreshToken = user.generateRefreshToken()

        user.RefreshToken = refreshToken        //saving refreshTOken in database
        await user.save({ validateBeforeSave : false})

        return {accessToken, refreshToken};

    } catch(error){
        throw new ApiError(500, "something went wrong while generating refresh and access token")
    }

}

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

    const {fullname, email, password, username } = req.body
    //console.log("email : ", email);
    
   //console.log(req.files);

  //checking validation
    if (
        [fullname, email, username, password].some((field) =>
        field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required")
    }

    //check if user already exists
    const existedUser = await User.findOne({
        $or : [{ username }, { email }]   // new syntax to chk username, email is existed or not     
    })
    if (existedUser){
        throw new ApiError(409, "User with email or username already exists")
    }

    // check for images and avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;        // '?' means if available then take it
  // const coverImagePath = req.files?.coverImage[0]?.path;
   //classic approach fro checking coverImage
   let coverImageLocalPath;
   if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length >0) {
    coverImageLocalPath = req.files.coverImage[0].path
   }


    if (! avatarLocalPath){                 // because avatar is mandatory
        throw new ApiError(400, "Avatar file is required")
    }
//upload them to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    //console.log(avatar)

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

const loginUser = asyncHandler( async (req, res) =>{
    //req.body -> data
    //username or email based login
    //find the user in database
    //password check
    // generate refresh and access token
    // send cookie

    const  {email, username, password} = req.body;

    if (!(username || email)){
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })
    if (!user){
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid){
        throw new ApiError(401, "invalid credentials")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly : true,          //fpr security cookies only managed by server
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken" , accessToken, options)
    .cookie("refreshToken" , refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user : loggedInUser, accessToken, refreshToken
            },
            "User logged In successfully"
        )
    )
})

const logoutUser = asyncHandler(async(req, res) =>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken : undefined
            }
        },{
            new: true
        }
    )

    return res
    .status(200)
    .clearCookie("accessToken" , options)
    .clearCookie("refreshToken", options)
    .json( new ApiResponse(200, {}, "User Logged Out"))
})

const refreshAccessToken = asyncHandler(async (req, res) =>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (! incomingRefreshToken){
        throw new ApiError(401, " unauthorized Access")
    }

   try {
     const decodedToken = jwt.verify(                    //verify the token
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
    )

    // each refreshToken has a ._id property in it find the user in database using this
    const user = await User.findById(decodedToken?._id)

    if (! user){
        throw new ApiError(401, "invalid Refresh Token")
    }

    if (incomingRefreshToken !== user?.refreshToken){
        throw new ApiError(401, "refresh token is expired or used")   // compar refresh token user's and incoming 
    }

    const options={
        httpOnly : true,
        secure : true
    }

    const {accessToken , newRefreshToken} = await generateAccessAndRefreshToken(user._id)

    return res
    .status(200)
    .cookie("accessToken" , accessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(
        new ApiResponse(
            200,
            {accessToken , refreshToken : newRefreshToken},
            "Access Token Refreshed"
        )
    )
   } catch (error) {
        throw new ApiError(401, error?.message || "invalid refresh Token")
   }

})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken 

 }