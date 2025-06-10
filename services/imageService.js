const sharp = require('sharp');
const fs = require('fs').promises;

class ImageService {
  async analyzeImage(imagePath) {
    try {
      const metadata = await sharp(imagePath).metadata();
      
      return {
        format: metadata.format,
        width: metadata.width,
        height: metadata.height,
        size: metadata.size
      };
    } catch (error) {
      console.error('Image analysis error:', error);
      throw error;
    }
  }
}

module.exports = new ImageService();