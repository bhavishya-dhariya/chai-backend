import mongoose, {Schema} from "mongoose"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new  Schema(
    {
        username : {
           type : String,
           required : true,
           unique : true,
           lowercase : true,
           trim : true,
           index : true 
        },
        email : {
           type : String,
           required : true,
           unique : true,
           lowercase : true,
           trim : true,
        },
        fullname : {
           type : String,
           required : true,
           index : true,
           trim : true,
        },
        avatar : {
            type : String,  //Cloudinary url
            required : true,
        },
        coverImage : {
            type : String,  //Cloudinary url
        },
        watchHistory : {
            type : Schema.Types.ObjectId,
            ref : "Video"
        },
        password : {
            type : String,
            required : [true, "password is required"]
        },
        refreshToken : {
            type : String
        }  
    },
    {
        timestamps : true 
    }
);

userSchema.pre("save" , async function (next){              //pre ek middleware h jiske pass sare schame data 
    if (! this.isModified("password")) return next();       // ka access h usse or bcrypt se pass hash kiya h 

    this.password = bcrypt.hash(this.password , 10)
    next()
})

userSchema.methods.isPasswordCorrect = async function(password){      // yha apne apna custom method banaya h
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        { //payload
            _id : this._id,
            email : this.email,
            username : this.username,
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn : process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        { //payload
            _id : this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn : process.env.REFESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema)