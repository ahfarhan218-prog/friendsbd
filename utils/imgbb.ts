import { API_BASE } from '../services/mongoService';

export async function uploadImageToImgBB(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      return data.data.url;
    } else {
      throw new Error(data.message || 'Failed to upload image locally');
    }
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}
