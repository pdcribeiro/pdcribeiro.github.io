const CLOUD_NAME = 'nootes';
const UPLOAD_PRESET = 'nootes';

export default {
  async upload(file) {
    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    const response = await fetch(url, {
      method: 'post',
      body: formData,
    });
    const data = await response.json();
    return { id: data.public_id, url: data.secure_url };
  },
};
