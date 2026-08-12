import React, { useState } from 'react';
import { Upload, Image as ImageIcon, Copy, Check, Cloud, Code, Sparkles, AlertCircle, ExternalLink } from 'lucide-react';

export const CloudinaryUploader: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'upload' | 'code'>('upload');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setError(null);
      setUploadedUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select an image file first.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'spidey_jersey_assets');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload to Cloudinary');
      }

      setUploadedUrl(data.url);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err.message || 'An error occurred during upload.');
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const nodeJsCodeSnippet = `import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary SDK with your credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'qjoxb5yw',
  api_key: process.env.CLOUDINARY_API_KEY || '667232741296166',
  api_secret: process.env.CLOUDINARY_API_SECRET || '<your_api_secret>'
});

/**
 * Takes a file upload (file path, base64 string, or Buffer) and uploads it to Cloudinary.
 * @param fileInput - Local file path, base64 data string, or file Buffer
 * @param folder - Cloudinary folder name (optional)
 * @returns Promise<string> - The secure URL of the uploaded asset
 */
export async function uploadToCloudinary(
  fileInput: string | Buffer,
  folder: string = 'website_uploads'
): Promise<string> {
  // Handle Buffer uploads via upload_stream
  if (Buffer.isBuffer(fileInput)) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'auto' },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error('No response from Cloudinary'));
          resolve(result.secure_url);
        }
      );
      stream.end(fileInput);
    });
  }

  // Handle file path string or base64 Data URL
  const uploadResult = await cloudinary.uploader.upload(fileInput, {
    folder,
    resource_type: 'auto',
  });

  return uploadResult.secure_url;
}`;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl text-white">
      {/* Header Banner */}
      <div className="flex items-center justify-between pb-6 border-b border-zinc-800 mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-sky-500/10 border border-sky-500/30 rounded-xl text-sky-400">
            <Cloud className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold uppercase tracking-wide text-white flex items-center space-x-2">
              <span>Cloudinary Node.js SDK Image Uploader</span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-full">
                API Active
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Upload website assets using the Cloudinary Node.js SDK and receive instant CDN URLs.
            </p>
          </div>
        </div>

        {/* Sub Navigation */}
        <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800">
          <button
            onClick={() => setActiveSubTab('upload')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeSubTab === 'upload'
                ? 'bg-sky-600 text-white'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Interactive Uploader</span>
          </button>
          <button
            onClick={() => setActiveSubTab('code')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeSubTab === 'code'
                ? 'bg-sky-600 text-white'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Node.js SDK Function</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'upload' ? (
        <div className="space-y-6">
          {/* File Drag and Drop Area */}
          <div className="border-2 border-dashed border-zinc-700 hover:border-sky-500/60 transition-colors rounded-xl p-8 text-center bg-zinc-950/50 flex flex-col items-center justify-center relative cursor-pointer group">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
            />
            {previewUrl ? (
              <div className="flex flex-col items-center space-y-3">
                <img
                  src={previewUrl}
                  alt="Selected preview"
                  className="max-h-48 rounded-lg object-contain border border-zinc-700 shadow-md"
                />
                <p className="text-xs font-mono text-zinc-300">{file?.name} ({(file!.size / 1024).toFixed(1)} KB)</p>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-3">
                <div className="p-3 bg-zinc-900 rounded-full border border-zinc-700 group-hover:border-sky-500 text-zinc-400 group-hover:text-sky-400 transition-colors">
                  <ImageIcon className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-200">
                    Click or drag & drop image to upload
                  </p>
                  <p className="text-xs text-zinc-500 font-mono mt-1">
                    Supports PNG, JPG, WEBP, SVG up to 25MB
                  </p>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 rounded-lg text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Button */}
          <div className="flex justify-end">
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg transition-all flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>{uploading ? 'Uploading to Cloudinary...' : 'Upload Image via Node SDK'}</span>
            </button>
          </div>

          {/* Upload Result */}
          {uploadedUrl && (
            <div className="p-5 bg-sky-950/20 border border-sky-500/30 rounded-xl space-y-4">
              <div className="flex items-center space-x-2 text-sky-400 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Cloudinary Upload Successful!</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Result Image Preview */}
                <div className="md:col-span-1 bg-zinc-950 p-2 rounded-lg border border-zinc-800 flex flex-col items-center justify-center">
                  <img
                    src={uploadedUrl}
                    alt="Cloudinary result"
                    className="max-h-36 object-contain rounded"
                  />
                </div>

                {/* Returned URLs */}
                <div className="md:col-span-2 space-y-3 text-xs">
                  <div>
                    <label className="text-[11px] font-mono text-zinc-400 uppercase block mb-1">
                      Uploaded CDN URL (secure_url):
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        readOnly
                        value={uploadedUrl}
                        className="w-full bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded font-mono text-sky-300 text-xs focus:outline-none"
                      />
                      <button
                        onClick={() => copyToClipboard(uploadedUrl, 'url')}
                        className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300"
                        title="Copy URL"
                      >
                        {copied === 'url' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <a
                        href={uploadedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300"
                        title="Open in new tab"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Code Tab showing the function */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400">
              /src/utils/cloudinary.ts (Node.js SDK Implementation)
            </span>
            <button
              onClick={() => copyToClipboard(nodeJsCodeSnippet, 'code')}
              className="flex items-center space-x-1 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-200 rounded transition-colors"
            >
              {copied === 'code' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Function Code</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl font-mono text-xs text-sky-300 overflow-x-auto leading-relaxed">
            <code>{nodeJsCodeSnippet}</code>
          </pre>
        </div>
      )}
    </div>
  );
};
