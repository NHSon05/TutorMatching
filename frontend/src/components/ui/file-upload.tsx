import * as React from "react";

export interface FileUploadProps {
  accept?: string;
  maxSizeMB?: number;
  multiple?: boolean;
  onFilesChange?: (files: File[]) => void;
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  error?: string | boolean;
  disabled?: boolean;
  className?: string;
}

export function FileUpload({
  accept = "image/*,.pdf",
  maxSizeMB = 5,
  multiple = false,
  onFilesChange,
  label,
  helperText,
  error,
  disabled = false,
  className = "",
}: FileUploadProps) {
  const [files, setFiles] = React.useState<File[]>([]);
  const [isDragging, setIsDragging] = React.useState(false);
  const [fileError, setFileError] = React.useState<string | null>(null);

  const inputRef = React.useRef<HTMLInputElement>(null);

  const validateAndAddFiles = (newFiles: FileList | File[]) => {
    setFileError(null);
    const validList: File[] = [];
    const maxBytes = maxSizeMB * 1024 * 1024;

    for (let i = 0; i < newFiles.length; i++) {
      const f = newFiles[i];
      if (f.size > maxBytes) {
        setFileError(`Tệp "${f.name}" vượt quá kích thước cho phép (${maxSizeMB}MB)`);
        return;
      }
      validList.push(f);
    }

    const updated = multiple ? [...files, ...validList] : validList;
    setFiles(updated);
    onFilesChange?.(updated);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || !e.dataTransfer.files) return;
    validateAndAddFiles(e.dataTransfer.files);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(e.target.files);
    }
  };

  const handleRemoveFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    onFilesChange?.(updated);
  };

  const hasError = Boolean(error || fileError);
  const errorMessage = typeof error === "string" ? error : fileError || undefined;

  return (
    <div className={`w-full space-y-2.5 ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      {/* Dropzone Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl transition-all duration-150 cursor-pointer select-none ${
          hasError
            ? "border-status-error bg-status-error/5"
            : isDragging
            ? "border-brand bg-brand/5 scale-[1.01]"
            : "border-gray-300 dark:border-gray-700 hover:border-gray-400 bg-gray-50/50 dark:bg-gray-800/30"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={handleFileChange}
          className="sr-only"
        />

        <div className="w-10 h-10 rounded-full bg-brand/10 text-brand flex items-center justify-center mb-2.5">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>

        <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 text-center">
          Nhấn để tải lên <span className="font-normal text-gray-500">hoặc kéo thả tệp vào đây</span>
        </p>
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
          Hỗ trợ định dạng {accept} (Tối đa {maxSizeMB}MB)
        </p>
      </div>

      {errorMessage && (
        <p className="text-xs text-status-error font-medium">{errorMessage}</p>
      )}
      {helperText && !errorMessage && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{helperText}</p>
      )}

      {/* Selected Files List */}
      {files.length > 0 && (
        <ul className="space-y-1.5 pt-1">
          {files.map((file, idx) => (
            <li
              key={`${file.name}-${idx}`}
              className="flex items-center justify-between p-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs shadow-2xs"
            >
              <div className="flex items-center gap-2.5 truncate mr-2">
                <svg className="w-4 h-4 text-brand shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span className="font-medium text-gray-800 dark:text-gray-200 truncate">
                  {file.name}
                </span>
                <span className="text-[11px] text-gray-400 shrink-0">
                  ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                </span>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile(idx);
                }}
                className="p-1 text-gray-400 hover:text-status-error rounded-md transition-colors cursor-pointer"
                aria-label="Xóa tệp"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default FileUpload;
