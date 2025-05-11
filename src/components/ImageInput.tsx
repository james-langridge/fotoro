'use client';

import { blobToImage } from '@/utility/blob';
import { useRef, RefObject } from 'react';
import { CopyExif, getOrientation } from '@/utility/exif';
import { clsx } from 'clsx/lite';
import { ACCEPTED_PHOTO_FILE_TYPES } from '@/photo';
import { FiUploadCloud } from 'react-icons/fi';
import { MAX_IMAGE_SIZE } from '@/platforms/next-image';
import ProgressButton from './primitives/ProgressButton';
import { useAppState } from '@/state/AppState';

export default function ImageInput({
  ref: inputRefExternal,
  id = 'file',
  onStart,
  onBlobReady,
  shouldResize,
  maxSize = MAX_IMAGE_SIZE,
  quality = 0.8,
  showButton,
  disabled: disabledProp,
  debug,
}: {
  ref?: RefObject<HTMLInputElement | null>
  id?: string
  onStart?: () => void
  onBlobReady?: (args: {
    blob: Blob,
    extension?: string,
    hasMultipleUploads?: boolean,
    isLastBlob?: boolean,
  }) => Promise<any>
  shouldResize?: boolean
  maxSize?: number
  quality?: number
  showButton?: boolean
  disabled?: boolean
  debug?: boolean
}) {
  const inputRefInternal = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const inputRef = inputRefExternal ?? inputRefInternal;

  const {
    uploadState: {
      isUploading,
      image,
      filesLength,
      fileUploadIndex,
    },
    setUploadState,
    resetUploadState,
  } = useAppState();

  const disabled = disabledProp || isUploading;

  return (
    <div className="flex flex-col gap-4 min-w-0">
      <div className="flex items-center gap-2 sm:gap-4">
        <label
          htmlFor={id}
          className={clsx(
            'shrink-0 select-none text-main',
            disabled && 'pointer-events-none cursor-not-allowed',
          )}
        >
          {showButton &&
            <ProgressButton
              type="button"
              isLoading={disabled}
              progress={filesLength > 1
                ? (fileUploadIndex + 1) / filesLength * 0.95
                : undefined}
              icon={<FiUploadCloud
                size={18}
                className="translate-x-[-0.5px] translate-y-[0.5px]"
              />}
              aria-disabled={disabled}
              onClick={() => inputRef.current?.click()}
              hideTextOnMobile={false}
              primary
            >
              {isUploading
                ? filesLength > 1
                  ? `Uploading ${fileUploadIndex + 1} of ${filesLength}`
                  : 'Uploading'
                : 'Upload Photos'}
            </ProgressButton>}
          <input
            ref={inputRef}
            id={id}
            type="file"
            className="hidden!"
            accept={ACCEPTED_PHOTO_FILE_TYPES.join(',')}
            disabled={disabled}
            multiple
            onChange={async e => {
              onStart?.();
              const { files } = e.currentTarget;
              if (files && files.length > 0) {
                setUploadState?.({ filesLength: files.length });
                for (let i = 0; i < files.length; i++) {
                  const file = files[i];
                  setUploadState?.({
                    fileUploadIndex: i,
                    fileUploadName: file.name,
                  });
                  const callbackArgs = {
                    extension: file.name.split('.').pop()?.toLowerCase(),
                    hasMultipleUploads: files.length > 1,
                    isLastBlob: i === files.length - 1,
                  };

                  const isPng = callbackArgs.extension === 'png';

                  const canvas = canvasRef.current;

                  // Specify wide gamut to avoid data loss while resizing
                  const ctx = canvas?.getContext(
                    '2d', { colorSpace: 'display-p3' },
                  );

                  if ((shouldResize || isPng) && canvas && ctx) {
                    // Process images that need resizing
                    const image = await blobToImage(file);

                    setUploadState?.({ image });

                    ctx.save();

                    // Replace the problematic orientation handling in your ImageInput component
                    // with this corrected version:

                    // Get EXIF orientation
                    const orientation = await getOrientation(file)
                      .catch(err => {
                        console.warn('⚠️ Failed to get orientation', err);
                        return 1;
                      }) ?? 1;

                    console.log('📐 Original EXIF orientation', { orientation });

                    // Don't modify the orientation value - use it directly!
                    // The canvas transformations below will handle the actual rotation

                    // Calculate dimensions
                    const ratio = image.width / image.height;

                    // For orientations 5-8, we need to swap width and height
                    const needsRotation = orientation >= 5 && orientation <= 8;
                    let canvasWidth, canvasHeight;

                    if (needsRotation) {
                      // Swap dimensions for 90/270 degree rotations
                      canvasWidth = Math.round(ratio >= 1 ? maxSize / ratio : maxSize);
                      canvasHeight = Math.round(ratio >= 1 ? maxSize : maxSize * ratio);
                    } else {
                      // Normal dimensions
                      canvasWidth = Math.round(ratio >= 1 ? maxSize : maxSize * ratio);
                      canvasHeight = Math.round(ratio >= 1 ? maxSize / ratio : maxSize);
                    }

                    // Set initial canvas size
                    canvas.width = canvasWidth;
                    canvas.height = canvasHeight;

                    console.log('📏 Canvas dimensions', {
                      canvasWidth,
                      canvasHeight,
                      needsRotation,
                    });

                    // Save the context state
                    ctx.save();

                    // Apply the correct transformation based on EXIF orientation
                    switch(orientation) {
                    case 1:
                      // Normal - no transformation needed
                      break;

                    case 2:
                      // Horizontal flip
                      ctx.scale(-1, 1);
                      ctx.translate(-canvasWidth, 0);
                      break;

                    case 3:
                      // 180 degree rotation
                      ctx.rotate(Math.PI);
                      ctx.translate(-canvasWidth, -canvasHeight);
                      break;

                    case 4:
                      // Vertical flip
                      ctx.scale(1, -1);
                      ctx.translate(0, -canvasHeight);
                      break;

                    case 5:
                      // Horizontal flip + 90 degree CCW rotation
                      canvas.width = canvasHeight;
                      canvas.height = canvasWidth;
                      ctx.rotate(-Math.PI / 2);
                      ctx.scale(-1, 1);
                      ctx.translate(-canvasWidth, 0);
                      break;

                    case 6:
                      // 90 degree clockwise rotation
                      canvas.width = canvasHeight;
                      canvas.height = canvasWidth;
                      ctx.rotate(Math.PI / 2);
                      ctx.translate(0, -canvasWidth);
                      break;

                    case 7:
                      // Horizontal flip + 90 degree CW rotation
                      canvas.width = canvasHeight;
                      canvas.height = canvasWidth;
                      ctx.rotate(Math.PI / 2);
                      ctx.scale(-1, 1);
                      ctx.translate(-canvasHeight, -canvasWidth);
                      break;

                    case 8:
                      // 90 degree counter-clockwise rotation
                      canvas.width = canvasHeight;
                      canvas.height = canvasWidth;
                      ctx.rotate(-Math.PI / 2);
                      ctx.translate(-canvasHeight, 0);
                      break;
                    }

                    // Draw the image with the transformation applied
                    ctx.drawImage(image, 0, 0, canvasWidth, canvasHeight);

                    // Restore the context state
                    ctx.restore();

                    // Continue with the blob creation...
                    canvas.toBlob(
                      async blob => {
                        if (blob) {
                          console.log('✅ Canvas blob created with correct orientation');

                          // IMPORTANT: For JPEG output, we don't need to preserve EXIF orientation
                          // because we've already applied the rotation to the image data itself.
                          // The output image should have orientation=1 (normal)

                          await onBlobReady?.({
                            ...callbackArgs,
                            blob: blob,  // This blob now has the correct orientation baked in
                          });
                        }
                      },
                      'image/jpeg',
                      quality,
                    );
                  } else {
                    // No need to process
                    await onBlobReady?.({
                      ...callbackArgs,
                      blob: file,
                    });
                  }
                }
              } else {
                resetUploadState?.();
              }
            }}
          />
        </label>
      </div>
      <canvas
        ref={canvasRef}
        className={clsx(
          'bg-gray-50 dark:bg-gray-900/50 rounded-md',
          'border border-gray-200 dark:border-gray-800',
          'w-[400px]',
          (!image || !debug) && 'hidden',
        )}
      />
    </div>
  );
}
