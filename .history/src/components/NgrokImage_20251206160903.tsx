import React, { useEffect, useState } from 'react';

interface NgrokImageProps {
  src: string;
  alt?: string;
  className?: string;
  // Các props khác của img nếu cần (width, height...)
  [key: string]: any; 
}

const NgrokImage: React.FC<NgrokImageProps> = ({ src, alt, className, ...props }) => {
  const [imageObjectUrl, setImageObjectUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // 1. KIỂM TRA ĐIỀU KIỆN
  // Chỉ dùng thủ thuật fetch khi URL chứa 'ngrok-free.app'
  const isNgrokFree = src && src.includes('ngrok-free.app');

  useEffect(() => {
    // Nếu không phải Ngrok, hoặc không có src, thì không làm gì cả (dùng thẻ img thường)
    if (!isNgrokFree || !src) return;

    let isMounted = true;

    const fetchImage = async () => {
      try {
        setIsLoading(true);
        setHasError(false);

        const response = await fetch(src, {
          headers: {
            'ngrok-skip-browser-warning': 'true',
          },
        });

        if (!response.ok) throw new Error('Load ảnh thất bại');

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);

        if (isMounted) {
          setImageObjectUrl(objectUrl);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Lỗi tải ảnh Ngrok:', error);
        if (isMounted) {
          setHasError(true);
          setIsLoading(false);
        }
      }
    };

    fetchImage();

    return () => {
      isMounted = false;
      if (imageObjectUrl) {
        URL.revokeObjectURL(imageObjectUrl);
      }
    };
  }, [src, isNgrokFree]);

  // --- TRƯỜNG HỢP 1: MÔI TRƯỜNG PRODUCTION / LOCALHOST (Không dùng Ngrok) ---
  if (!isNgrokFree) {
    return (
      <img 
        src={src} 
        alt={alt || 'image'} 
        className={className} 
        onError={(e) => (e.currentTarget.style.display = 'none')} // Tự ẩn nếu lỗi
        {...props} 
      />
    );
  }

  // --- TRƯỜNG HỢP 2: ĐANG TẢI ẢNH NGROK ---
  if (isLoading) {
    return <div className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded ${className}`} style={{ minHeight: '100px' }} />;
  }

  // --- TRƯỜNG HỢP 3: LỖI TẢI ẢNH NGROK ---
  if (hasError || !imageObjectUrl) {
    return <div className={`bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs text-slate-400 border border-dashed border-slate-300 ${className}`} style={{ minHeight: '100px' }}>Ảnh lỗi</div>;
  }

  // --- TRƯỜNG HỢP 4: HIỂN THỊ ẢNH NGROK THÀNH CÔNG ---
  return <img src={imageObjectUrl} alt={alt || 'image'} className={className} {...props} />;
};

export default NgrokImage;