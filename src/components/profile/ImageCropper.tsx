import React, { useState, useCallback } from 'react';
import Cropper, { Point, Area } from 'react-easy-crop';
import { X, Check, RotateCw } from 'lucide-react';

interface ImageCropperProps {
  image: string;
  onCropComplete: (croppedImage: Blob) => void;
  onCancel: () => void;
  aspect?: number;
  circular?: boolean;
}

export default function ImageCropper({ image, onCropComplete, onCancel, aspect = 1, circular = false }: ImageCropperProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropChange = (crop: Point) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropCompleteCallback = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area,
    rotation = 0
  ): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    const rotRad = (rotation * Math.PI) / 180;

    // calculate bounding box of the rotated image
    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
      image.width,
      image.height,
      rotation
    );

    // set canvas size to match the bounding box
    canvas.width = bBoxWidth;
    canvas.height = bBoxHeight;

    // translate canvas context to a central point to allow rotating and flipping around the center
    ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
    ctx.rotate(rotRad);
    ctx.translate(-image.width / 2, -image.height / 2);

    // draw rotated image
    ctx.drawImage(image, 0, 0);

    // croppedAreaPixels values are bounding box relative
    // extract the cropped image using these values
    const data = ctx.getImageData(
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height
    );

    // set canvas width to final desired crop size
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // paste generated rotate image with correct offsets for x,y crop values.
    ctx.putImageData(data, 0, 0);

    // As a blob
    return new Promise((resolve, reject) => {
      canvas.toBlob((file) => {
        if (file) resolve(file);
        else reject(new Error('Canvas is empty'));
      }, 'image/jpeg');
    });
  };

  const rotateSize = (width: number, height: number, rotation: number) => {
    const rotRad = (rotation * Math.PI) / 180;

    return {
      width:
        Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
      height:
        Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
    };
  };

  const handleDone = async () => {
    if (croppedAreaPixels) {
      try {
        const croppedImage = await getCroppedImg(image, croppedAreaPixels, rotation);
        onCropComplete(croppedImage);
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-white/10">
        <button onClick={onCancel} className="p-2 text-white/70">
          <X size={20} />
        </button>
        <h2 className="text-white font-bold text-sm">Crop Photo</h2>
        <button onClick={handleDone} className="p-2 text-primary">
          <Check size={20} />
        </button>
      </div>

      <div className="relative flex-1 bg-black">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={aspect}
          onCropChange={onCropChange}
          onCropComplete={onCropCompleteCallback}
          onZoomChange={onZoomChange}
          cropShape={circular ? 'round' : 'rect'}
          showGrid={true}
        />
      </div>

      <div className="p-6 bg-zinc-900 border-t border-white/10 space-y-6">
        <div className="flex items-center gap-4">
          <span className="text-xs text-white/50 w-10">Zoom</span>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 h-1.5 bg-white/10 rounded-full appearance-none accent-primary"
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => setRotation((prev) => (prev + 90) % 360)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-white text-xs font-bold"
          >
            <RotateCw size={14} /> Rotate
          </button>
          
          <div className="flex items-center gap-4">
             <button
               onClick={onCancel}
               className="text-xs font-bold text-white/50"
             >
               Cancel
             </button>
             <button
               onClick={handleDone}
               className="px-6 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
             >
               Set Photo
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
