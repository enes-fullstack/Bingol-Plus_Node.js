import cloudinary from "./config.js";
import config from "../config/config.js";

interface UploadResult {
    url: string;
    publicId: string;
}

export const uploadImage = async (filePath: string): Promise<UploadResult> => {
    const result = await cloudinary.uploader.upload(filePath, {
        folder: config.cloudinary.folder,
        resource_type: "image"
    });

    return { url: result.secure_url, publicId: result.public_id };
};

export const uploadImageFromBuffer = async (buffer: Buffer): Promise<UploadResult> => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: config.cloudinary.folder,
                resource_type: "image"
            },
            (err, result) => {
                if (err) return reject(err);
                if (!result) return reject(new Error("Cloudinary upload failed"));
                resolve({ url: result.secure_url, publicId: result.public_id });
            }
        );
        stream.end(buffer);
    });
};

export const deleteImage = async (publicId: string): Promise<void> => {
    await cloudinary.uploader.destroy(publicId);
};

export const extractPublicId = (url: string): string | null => {
    try {
        const uploadIdx = url.indexOf("/upload/");
        if (uploadIdx === -1) return null;
        let pub = url.substring(uploadIdx + "/upload/".length);
        // Strip version prefix v123456/
        pub = pub.replace(/^v\d+\//, "");
        // If URL was optimized (contains transformation like w_36,h_36...), strip first segment that looks like transformation
        // Transformation segment contains ',' or starts with 'w_'/'h_'/'c_' etc. and does not equal folder name
        const folder = config.cloudinary.folder;
        if (folder && pub.includes("/")) {
            const folderIdx = pub.indexOf(folder + "/");
            if (folderIdx !== -1) {
                pub = pub.substring(folderIdx);
            } else if (pub.split("/")[0].includes(",") || /^[whc]_/.test(pub.split("/")[0])) {
                pub = pub.split("/").slice(1).join("/");
            }
        }
        // Remove file extension
        pub = pub.replace(/\.[^/.]+$/, "");
        return pub || null;
    } catch {
        return null;
    }
};

export const optimizeUrl = (url: string | null | undefined, width: number, height: number): string | null => {
    if (!url) return null;
    if (!url.includes("/upload/")) return url;
    return url.replace("/upload/", `/upload/w_${width},h_${height},c_fill,f_auto,q_auto/`);
};
