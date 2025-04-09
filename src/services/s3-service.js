const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3Config = {
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
};

const BUCKET_NAME = process.env.S3_BUCKET_NAME;

const s3Client = new S3Client(s3Config);

const s3Service = {
  /**
   * Upload a file to S3
   * @param {string} key - The S3 object key (path/filename)
   * @param {Buffer} data - The file data as a Buffer
   * @param {string} contentType - The MIME type of the file
   * @returns {Promise<string>} - The S3 URL of the uploaded file
   */
  uploadFile: async (key, data, contentType) => {
    try {
      const params = {
        Bucket: BUCKET_NAME,
        Key: key,
        Body: data,
        ContentType: contentType
      };

      const command = new PutObjectCommand(params);
      await s3Client.send(command);

      return `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      throw new Error(`Failed to upload file to S3: ${error.message}`);
    }
  },

  /**
   * Get a file from S3
   * @param {string} key - The S3 object key
   * @returns {Promise<Buffer>} - The file data as a Buffer
   */
  getFile: async (key) => {
    try {
      const params = {
        Bucket: BUCKET_NAME,
        Key: key
      };

      const command = new GetObjectCommand(params);
      const response = await s3Client.send(command);

      return streamToBuffer(response.Body);
    } catch (error) {
      console.error('Error getting file from S3:', error);
      throw new Error(`Failed to get file from S3: ${error.message}`);
    }
  },

  /**
   * Delete a file from S3
   * @param {string} key - The S3 object key
   * @returns {Promise<void>}
   */
  deleteFile: async (key) => {
    try {
      const params = {
        Bucket: BUCKET_NAME,
        Key: key
      };

      const command = new DeleteObjectCommand(params);
      await s3Client.send(command);
    } catch (error) {
      console.error('Error deleting file from S3:', error);
      throw new Error(`Failed to delete file from S3: ${error.message}`);
    }
  },

  /**
   * Generate a pre-signed URL for downloading a file
   * @param {string} key - The S3 object key
   * @param {number} expiresIn - Expiration time in seconds (default: 3600)
   * @returns {Promise<string>} - The pre-signed URL
   */
  getSignedUrl: async (key, expiresIn = 3600) => {
    try {
      const params = {
        Bucket: BUCKET_NAME,
        Key: key
      };

      const command = new GetObjectCommand(params);
      return await getSignedUrl(s3Client, command, { expiresIn });
    } catch (error) {
      console.error('Error generating pre-signed URL:', error);
      throw new Error(`Failed to generate pre-signed URL: ${error.message}`);
    }
  }
};

/**
 * Helper function to convert a readable stream to a buffer
 * @param {ReadableStream} stream - The readable stream
 * @returns {Promise<Buffer>} - The buffer
 */
const streamToBuffer = async (stream) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
};

module.exports = s3Service;