import api from '@/lib/api';

export const uploadService = {
  /**
   * Upload an image to Supabase storage
   */
  async uploadImage(file: File, folder: string = 'changelog'): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const response = await api.post('/api/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log('Upload response:', response.data);
    // Backend returns { success: true, message: "...", data: { url: "...", path: "..." } }
    return response.data.data?.url || response.data.url;
  },

  /**
   * Delete an image from Supabase storage
   */
  async deleteImage(url: string): Promise<void> {
    await api.delete('/api/upload/image', {
      data: { url },
    });
  },
};
