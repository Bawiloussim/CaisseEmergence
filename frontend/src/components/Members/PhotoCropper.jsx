import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import Modal from '../UI/Modal';

const OUTPUT_SIZE = 400;

function getCroppedDataUrl(imageSrc, cropPixels) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(
        image,
        cropPixels.x,
        cropPixels.y,
        cropPixels.width,
        cropPixels.height,
        0,
        0,
        OUTPUT_SIZE,
        OUTPUT_SIZE
      );
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    image.onerror = reject;
    image.src = imageSrc;
  });
}

const PhotoCropper = ({ image, onCancel, onValidate }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((_, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleValidate = async () => {
    if (!croppedAreaPixels) return;
    const dataUrl = await getCroppedDataUrl(image, croppedAreaPixels);
    onValidate(dataUrl);
  };

  return (
    <Modal onClose={onCancel} title="Recadrer la photo">
      <div className="space-y-4">
        <div className="relative w-full h-80 bg-gray-900 rounded-lg overflow-hidden">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Zoom</label>
          <input
            type="range"
            min="1"
            max="3"
            step="0.1"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <p className="text-xs text-gray-400">Déplacez et zoomez l'image pour cadrer le visage dans le cercle.</p>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onCancel} className="btn-outline">
            Annuler
          </button>
          <button type="button" onClick={handleValidate} className="btn-primary">
            Valider le cadrage
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PhotoCropper;
