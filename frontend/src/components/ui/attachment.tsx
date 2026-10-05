import * as React from "react";

export type AttachmentType = "pdf" | "image" | "doc" | "archive" | "general";

export interface AttachmentProps {
  fileName: string;
  fileSize?: string | number;
  fileType?: AttachmentType;
  url?: string;
  onDownload?: () => void;
  onPreview?: () => void;
  onDelete?: () => void;
  disabled?: boolean;
  className?: string;
}

function formatFileSize(size?: string | number): string {
  if (!size) return "";
  if (typeof size === "string") return size;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileTypeIcon(type: AttachmentType) {
  switch (type) {
    case "pdf":
      return (
        <span className="w-8 h-8 rounded-lg bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 flex items-center justify-center font-bold text-[10px] shrink-0 border border-red-100 dark:border-red-900/40">
          PDF
        </span>
      );
    case "doc":
      return (
        <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 border border-blue-100 dark:border-blue-900/40">
          DOC
        </span>
      );
    case "image":
      return (
        <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0 border border-emerald-100 dark:border-emerald-900/40">
          IMG
        </span>
      );
    case "archive":
      return (
        <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 flex items-center justify-center font-bold text-[10px] shrink-0 border border-amber-100 dark:border-amber-900/40">
          ZIP
        </span>
      );
    default:
      return (
        <span className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 flex items-center justify-center font-bold text-[10px] shrink-0 border border-gray-200 dark:border-gray-700">
          FILE
        </span>
      );
  }
}

export function Attachment({
  fileName,
  fileSize,
  fileType = "general",
  url,
  onDownload,
  onPreview,
  onDelete,
  disabled = false,
  className = "",
}: AttachmentProps) {
  const handleAction = () => {
    if (disabled) return;
    if (onPreview) {
      onPreview();
    } else if (onDownload) {
      onDownload();
    } else if (url) {
      window.open(url, "_blank");
    }
  };

  return (
    <div
      className={`inline-flex items-center justify-between p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xs max-w-sm w-full transition-all duration-150 ${
        disabled ? "opacity-50 cursor-not-allowed" : "hover:border-gray-300 dark:hover:border-gray-600"
      } ${className}`}
    >
      <div
        onClick={handleAction}
        className={`flex items-center gap-3 truncate flex-1 min-w-0 mr-2 ${
          disabled ? "" : "cursor-pointer"
        }`}
      >
        {getFileTypeIcon(fileType)}

        <div className="flex flex-col min-w-0 truncate">
          <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate hover:text-brand transition-colors">
            {fileName}
          </span>
          {fileSize && (
            <span className="text-[11px] text-gray-400 dark:text-gray-500 font-normal">
              {formatFileSize(fileSize)}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {(onDownload || url) && (
          <button
            type="button"
            aria-label="Tải về"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              onDownload?.();
              if (url && !onDownload) {
                window.open(url, "_blank");
              }
            }}
            className="p-1.5 text-gray-400 hover:text-brand hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            aria-label="Xóa tệp đính kèm"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 text-gray-400 hover:text-status-error hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default Attachment;
