'use client';

import { BLUR_ENABLED } from '@/app/config';
import { useAppState } from '@/state/AppState';
import { clsx } from 'clsx/lite';
import Image, { ImageProps } from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { fileNameForStorageUrl, storageTypeFromUrl } from '@/platforms/storage';

export default function ImageWithFallback({
  className,
  classNameImage = 'object-cover h-full',
  priority,
  blurDataURL,
  blurCompatibilityLevel = 'low',
  src,
  ...props
}: ImageProps & {
  blurCompatibilityLevel?: 'none' | 'low' | 'high'
  classNameImage?: string
}) {
  const { shouldDebugImageFallbacks } = useAppState();
  const [presignedSrc, setPresignedSrc] = useState<string | null>(null);
  const [wasCached, setWasCached] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [didError, setDidError] = useState(false);

  const onLoad = useCallback(() => setIsLoading(false), []);

  const [hideFallback, setHideFallback] = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);

  const isS3Image = typeof src === 'string' && storageTypeFromUrl(src) === 'aws-s3';

  const fetchPresignedUrl = useCallback(async () => {
    if (isS3Image) {
      try {
        const fileName = fileNameForStorageUrl(src);
        const response = await fetch(`/api/presigned-url/${encodeURIComponent(fileName)}`);

        if (response.ok) {
          const url = await response.text();
          setPresignedSrc(url);
        } else {
          console.error('Failed to get pre-signed URL:', await response.text());
          setDidError(true);
        }
      } catch (error) {
        console.error('Error fetching pre-signed URL:', error);
        setDidError(true);
      }
    } else {
      setPresignedSrc(src as string);
    }
  }, [isS3Image, src]);

  // Fetch pre-signed URL for S3 images
  useEffect(() => {
    fetchPresignedUrl();
  }, [fetchPresignedUrl, src]);

  const onError = useCallback(async () => {
    if (isS3Image) {
      console.log('Image load failed, attempting to refresh pre-signed URL');
      await fetchPresignedUrl();
    } else {
      setDidError(true);
    }
  }, [isS3Image, fetchPresignedUrl]);

  useEffect(() => {
    setWasCached(
      Boolean(imgRef.current?.complete) &&
        (imgRef.current?.naturalWidth ?? 0) > 0,
    );
  }, []);

  useEffect(() => {
    if (!isLoading && !didError) {
      const timeout = setTimeout(() => {
        setHideFallback(true);
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [isLoading, didError]);

  const showFallback =
      !wasCached &&
      !hideFallback;

  const getBlurClass = () => {
    switch (blurCompatibilityLevel) {
    case 'high':
      return 'blur-[4px] @xs:blue-md scale-[1.05]';
    case 'low':
      return 'blur-[2px] @xs:blue-md scale-[1.01]';
    }
  };

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      if (e.target instanceof HTMLElement && e.target.tagName === 'IMG') {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  // Don't render until we have the pre-signed URL for S3 images
  if (!presignedSrc && storageTypeFromUrl(src as string) === 'aws-s3') {
    return <div className={className}>Loading...</div>;
  }

  return (
    <div
      className={clsx(
        'flex relative',
        className,
      )}
    >
      <Image {...{
        ...props,
        src: presignedSrc || src,
        ref: imgRef,
        priority,
        className: classNameImage,
        onLoad,
        onError,
      }} />
      <div className={clsx(
        '@container',
        'absolute inset-0 pointer-events-none',
        'overflow-hidden',
        (showFallback || shouldDebugImageFallbacks) &&
            'transition-opacity duration-300 ease-in',
        !(BLUR_ENABLED && blurDataURL) && 'bg-main',
        (isLoading || shouldDebugImageFallbacks)
          ? 'opacity-100'
          : 'opacity-0',
      )}>
        {(BLUR_ENABLED && blurDataURL)
          ? <img {...{
            ...props,
            src: blurDataURL,
            className: clsx(
              getBlurClass(),
              classNameImage,
            ),
          }} />
          :  <div className={clsx(
            'w-full h-full',
            'bg-gray-100/50 dark:bg-gray-900/50',
          )} />}
      </div>
    </div>
  );
}