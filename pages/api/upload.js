import multiparty from "multiparty";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import fs from "fs";
import mime from "mime-types";

import { mongooseConnect } from "@/lib/mongoose";

const S3BucketName = "image-bucket-admin";

export default async function ImageHandler(req, res) {
  await mongooseConnect();

  
  const form = new multiparty.Form();

  try {
    // Parse the form data
    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (error, fields, files) => {
        if (error) {
          reject(error);
        } else {
          resolve({ fields, files });
        }
      });
    });

    // S3 Client configuration
    const client = new S3Client({
      region: "eu-west-2",
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      },
    });

    const links = [];
    for (const file of files.file) {
      const fileType = file.originalFilename.split(".").pop();
      const imageFileName = `${Date.now()}.${fileType}`;
    
      try {
        const fileBody = fs.readFileSync(file.path);
        await client.send(
          new PutObjectCommand({
            Bucket: S3BucketName,
            Key: imageFileName,
            Body: fileBody,
            ACL: 'public-read',
            ContentType: mime.lookup(file.path),
          })
        );
    
        const link = `https://${S3BucketName}.s3.amazonaws.com/${imageFileName}`;
        links.push(link);
      } catch (uploadError) {
        console.error("Upload error for file:", imageFileName, uploadError);
      }
    }

    // Respond with success message and links
    res.json({ message: "Upload successful", links, fields });
  } catch (error) {
    console.error("Error during file upload:", error);
    res.status(500).json({ error: "File upload failed" });
  }
}

export const config = {
  api: { bodyParser: false },
};
