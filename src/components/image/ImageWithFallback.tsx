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
  width,
  height,
  ...props
}: ImageProps & {
  blurCompatibilityLevel?: 'none' | 'low' | 'high'
  classNameImage?: string
}) {
  const { shouldDebugImageFallbacks } = useAppState();
  const [wasCached, setWasCached] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [didError, setDidError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  const onLoad = useCallback(() => setIsLoading(false), []);
  const onError = useCallback(() => setDidError(true), []);

  const [hideFallback, setHideFallback] = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get the image and container elements
    const imageElement = imgRef.current;
    const containerElement = containerRef.current;

    if (!imageElement || !containerElement) return;

    // Function to prevent default behavior
    const preventDefault = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // Prevent context menu
    const handleContextMenu = (e: MouseEvent) => preventDefault(e);

    // Touch event handlers - critical for iOS
    const handleTouchStart = (e: TouchEvent) => {
      // Short taps are still allowed for interface interaction
      const touchTimeoutId = setTimeout(() => {
        // Only prevent long press (context menu trigger)
        preventDefault(e);
      }, 200);

      // Clear the timeout on touch end
      const clearTouchTimeout = () => clearTimeout(touchTimeoutId);
      document.addEventListener('touchend', clearTouchTimeout, { once: true });
    };

    // Disable selection
    const handleSelectStart = (e: Event) => preventDefault(e);

    [imageElement, containerElement].forEach(element => {
      element.addEventListener('contextmenu', handleContextMenu);
      element.addEventListener('selectstart', handleSelectStart);
      element.addEventListener('touchstart', handleTouchStart, { passive: false });
      element.addEventListener('dragstart', preventDefault);
      element.draggable = false;
    });

    // Clean up event listeners
    return () => {
      [imageElement, containerElement].forEach(element => {
        element.removeEventListener('contextmenu', handleContextMenu);
        element.removeEventListener('selectstart', handleSelectStart);
        element.removeEventListener('touchstart', handleTouchStart);
        element.removeEventListener('dragstart', preventDefault);
      });
    };
  }, []);

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

  useEffect(() => {
    const fetchImageUrl = async () => {
      if (typeof src === 'string' && storageTypeFromUrl(src) === 'aws-s3') {
        // Get the file name part of the URL
        const fileName = fileNameForStorageUrl(src);
        // Use our protected API route instead of pre-signed URL
        const protectedUrl = `/api/protected-image/${fileName}`;
        setImageSrc(protectedUrl);
      } else {
        setImageSrc(src as string);
      }
    };

    fetchImageUrl();
  }, [src]);

  if (!imageSrc) {
    return <div className={className}>Loading...</div>;
  }

  return (
    <div
      className={clsx(
        'flex relative select-none',
        className,
      )}
      ref={containerRef}
    >
      <Image {...{
        ...props,
        width,
        height,
        src: imageSrc,
        ref: imgRef,
        priority,
        className: classNameImage,
        onLoad,
        onError,
        draggable: 'false',
        style: {
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          pointerEvents: 'none',
        },
      }} />
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'auto',
          touchAction: 'manipulation',
        }}
      >
        <rect
          width="100%"
          height="100%"
          fill="transparent"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
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
          : <div className={clsx(
            'w-full h-full',
            'bg-gray-100/50 dark:bg-gray-900/50',
          )}/>}
      </div>
    </div>
  );
}