import {v2 as cloudinary} from "cloudinary"
import dotenv from "dotenv"
dotenv.config({})

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dv0yimv4z",
    api_key: process.env.CLOUDINARY_API_KEY || "963626417846119",
    api_secret: process.env.CLOUDINARY_API_SECRET || "8T90J9vTDOrGm4Sj2bXqZQjbZSY",
})

export const uploadMedia = async(file: string) => {
    try {
        const uploadResponse = await cloudinary.uploader.upload(file, {
            resource_type: "auto"
        })
        return uploadResponse
    } catch (error) {
        console.log(error)
    }
}

export const deleteMediaFromCloudinary = async(publicId: string) => {
    try {
        await cloudinary.uploader.destroy(publicId)
    } catch (error) {
        console.log(error)
    }
}

export const deleteVideoFromCloudinary = async (publicId: string) => {
    try {
        await cloudinary.uploader.destroy(publicId, {resource_type: "video"})
    } catch (error) {
        console.log(error)
    }
}