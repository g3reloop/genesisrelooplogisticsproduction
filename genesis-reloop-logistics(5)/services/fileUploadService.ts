import { supabase } from '../lib/supabase';
import { FileUpload, VerificationStatus } from '../types';

class FileUploadService {
  private maxFileSize: number = 10 * 1024 * 1024; // 10MB
  private allowedTypes: string[] = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  // Upload file to Supabase Storage
  async uploadFile(
    file: File,
    userId: string,
    category: string,
    jobId?: string
  ): Promise<FileUpload> {
    try {
      // Validate file
      this.validateFile(file);

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${category}/${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw new Error(error.message);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      // Save file record to database
      const { data: fileRecord, error: dbError } = await supabase
        .from('file_uploads')
        .insert({
          user_id: userId,
          job_id: jobId,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          file_url: urlData.publicUrl,
          file_category: category,
          verification_status: VerificationStatus.PENDING,
        })
        .select()
        .single();

      if (dbError) {
        // Clean up uploaded file if database insert fails
        await supabase.storage.from('documents').remove([fileName]);
        throw new Error(dbError.message);
      }

      return fileRecord;
    } catch (error: any) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  // Upload multiple files
  async uploadMultipleFiles(
    files: File[],
    userId: string,
    category: string,
    jobId?: string
  ): Promise<FileUpload[]> {
    try {
      const uploadPromises = files.map(file => 
        this.uploadFile(file, userId, category, jobId)
      );

      return await Promise.all(uploadPromises);
    } catch (error: any) {
      throw new Error(`Failed to upload files: ${error.message}`);
    }
  }

  // Get user's files
  async getUserFiles(
    userId: string,
    category?: string,
    jobId?: string
  ): Promise<FileUpload[]> {
    try {
      let query = supabase
        .from('file_uploads')
        .select('*')
        .eq('user_id', userId)
        .order('uploaded_at', { ascending: false });

      if (category) {
        query = query.eq('file_category', category);
      }

      if (jobId) {
        query = query.eq('job_id', jobId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    } catch (error: any) {
      throw new Error(`Failed to get user files: ${error.message}`);
    }
  }

  // Get file by ID
  async getFileById(fileId: string): Promise<FileUpload> {
    try {
      const { data, error } = await supabase
        .from('file_uploads')
        .select('*')
        .eq('id', fileId)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('File not found');
      }

      return data;
    } catch (error: any) {
      throw new Error(`Failed to get file: ${error.message}`);
    }
  }

  // Update file verification status
  async updateVerificationStatus(
    fileId: string,
    status: VerificationStatus,
    notes?: string
  ): Promise<FileUpload> {
    try {
      const { data, error } = await supabase
        .from('file_uploads')
        .update({
          verification_status: status,
          updated_at: new Date().toISOString(),
          ...(notes && { metadata: { notes } }),
        })
        .eq('id', fileId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error: any) {
      throw new Error(`Failed to update verification status: ${error.message}`);
    }
  }

  // Delete file
  async deleteFile(fileId: string): Promise<void> {
    try {
      // Get file record first
      const fileRecord = await this.getFileById(fileId);

      // Delete from database
      const { error: dbError } = await supabase
        .from('file_uploads')
        .delete()
        .eq('id', fileId);

      if (dbError) {
        throw new Error(dbError.message);
      }

      // Delete from storage
      const fileName = fileRecord.file_url.split('/').pop();
      if (fileName) {
        const { error: storageError } = await supabase.storage
          .from('documents')
          .remove([`${fileRecord.user_id}/${fileRecord.file_category}/${fileName}`]);

        if (storageError) {
          console.error('Error deleting file from storage:', storageError);
        }
      }
    } catch (error: any) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  // Get file download URL
  async getDownloadUrl(fileId: string): Promise<string> {
    try {
      const fileRecord = await this.getFileById(fileId);
      return fileRecord.file_url;
    } catch (error: any) {
      throw new Error(`Failed to get download URL: ${error.message}`);
    }
  }

  // Get signed URL for private files
  async getSignedUrl(fileId: string, expiresIn: number = 3600): Promise<string> {
    try {
      const fileRecord = await this.getFileById(fileId);
      const fileName = fileRecord.file_url.split('/').pop();
      
      if (!fileName) {
        throw new Error('Invalid file URL');
      }

      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(`${fileRecord.user_id}/${fileRecord.file_category}/${fileName}`, expiresIn);

      if (error) {
        throw new Error(error.message);
      }

      return data.signedUrl;
    } catch (error: any) {
      throw new Error(`Failed to get signed URL: ${error.message}`);
    }
  }

  // Validate file before upload
  private validateFile(file: File): void {
    // Check file size
    if (file.size > this.maxFileSize) {
      throw new Error(`File size must be less than ${this.maxFileSize / (1024 * 1024)}MB`);
    }

    // Check file type
    if (!this.allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} is not allowed`);
    }

    // Check file name length
    if (file.name.length > 255) {
      throw new Error('File name is too long');
    }
  }

  // Get file preview URL
  async getFilePreview(fileId: string): Promise<string | null> {
    try {
      const fileRecord = await this.getFileById(fileId);
      
      // Only return preview for image files
      if (fileRecord.file_type.startsWith('image/')) {
        return fileRecord.file_url;
      }

      return null;
    } catch (error) {
      console.error('Error getting file preview:', error);
      return null;
    }
  }

  // Compress image before upload
  async compressImage(file: File, quality: number = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        resolve(file);
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions (max 1920px width)
        const maxWidth = 1920;
        const maxHeight = 1080;
        let { width, height } = img;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  // Get upload progress (for large files)
  async uploadFileWithProgress(
    file: File,
    userId: string,
    category: string,
    jobId: string | undefined,
    onProgress: (progress: number) => void
  ): Promise<FileUpload> {
    try {
      // For now, we'll use the regular upload method
      // In a real implementation, you'd want to use chunked uploads for large files
      onProgress(0);
      
      const result = await this.uploadFile(file, userId, category, jobId);
      
      onProgress(100);
      return result;
    } catch (error: any) {
      throw new Error(`Failed to upload file with progress: ${error.message}`);
    }
  }

  // Get storage usage for user
  async getUserStorageUsage(userId: string): Promise<{
    totalFiles: number;
    totalSize: number;
    usedQuota: number;
    maxQuota: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('file_uploads')
        .select('file_size')
        .eq('user_id', userId);

      if (error) {
        throw new Error(error.message);
      }

      const totalFiles = data?.length || 0;
      const totalSize = data?.reduce((sum, file) => sum + file.file_size, 0) || 0;
      const maxQuota = 100 * 1024 * 1024; // 100MB default quota

      return {
        totalFiles,
        totalSize,
        usedQuota: totalSize,
        maxQuota,
      };
    } catch (error: any) {
      throw new Error(`Failed to get storage usage: ${error.message}`);
    }
  }

  // Check if user has storage quota available
  async hasStorageQuota(userId: string, fileSize: number): Promise<boolean> {
    try {
      const usage = await this.getUserStorageUsage(userId);
      return (usage.usedQuota + fileSize) <= usage.maxQuota;
    } catch (error) {
      console.error('Error checking storage quota:', error);
      return false;
    }
  }
}

// Export singleton instance
export const fileUploadService = new FileUploadService();
