import React, { useState, useCallback, useRef } from 'react';
import Cropper from 'react-easy-crop';
import { Upload, X, Check, Loader2, Image as ImageIcon } from 'lucide-react';
import { getCroppedImg } from '../utils/getCroppedImg';
import { supabase } from '../lib/supabase';
import { useToast } from './Toast';

interface ImageUploadWithCropProps {
  onUploadSuccess: (url: string) => void;
  aspect?: number;
  label?: string;
  currentImageUrl?: string;
}

export function ImageUploadWithCrop({ 
  onUploadSuccess, 
  aspect = 16 / 9,
  label = "Fazer Upload de Imagem",
  currentImageUrl
}: ImageUploadWithCropProps) {
  const toast = useToast();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result?.toString() || null);
      });
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      setIsUploading(true);
      
      // Obter o Blob recortado
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);

      // Gerar nome único
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.png`;

      let finalUrl = '';
      let usedStorage = false;

      // Lista de buckets para tentar no Supabase
      const possibleBuckets = ['event-images', 'events', 'public', 'avatars'];

      for (const bucketName of possibleBuckets) {
        try {
          const { error } = await supabase.storage
            .from(bucketName)
            .upload(fileName, croppedImageBlob, {
              contentType: 'image/png',
              cacheControl: '3600',
              upsert: false
            });

          if (!error) {
            const { data: publicData } = supabase.storage
              .from(bucketName)
              .getPublicUrl(fileName);

            finalUrl = publicData.publicUrl;
            usedStorage = true;
            break;
          }
        } catch (_) {
          // Tenta o próximo bucket
        }
      }

      // Se nenhum bucket do Supabase estivar criado/acessível, faz o fallback gracioso para Data URL (Base64)
      if (!finalUrl) {
        finalUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(croppedImageBlob);
        });
      }

      onUploadSuccess(finalUrl);

      if (usedStorage) {
        toast.success('Imagem Carregada!', 'Upload realizado com sucesso no Supabase Storage.');
      } else {
        toast.info('Imagem Processada!', 'Imagem ajustada e pronta para salvar.');
      }
      
      // Limpar estado
      setImageSrc(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
    } catch (error: any) {
      console.error('Erro no upload:', error);
      toast.error('Erro ao processar imagem', error.message || 'Falha ao salvar a imagem recortada.');
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        ref={fileInputRef}
        className="hidden"
      />

      {!imageSrc && (
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={triggerFileSelect}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 hover:border-[#303392] hover:bg-[#303392]/5 rounded-xl text-gray-600 dark:text-slate-400 font-bold transition-all"
          >
            <Upload className="w-5 h-5" />
            {label}
          </button>
          {currentImageUrl && (
            <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 flex-shrink-0">
              <img src={currentImageUrl} alt="Current" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      )}

      {/* Modal de Crop */}
      {imageSrc && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/50">
            <h3 className="text-white font-bold flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Recortar e Posicionar
            </h3>
            <button
              type="button"
              onClick={() => {
                setImageSrc(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="relative flex-1 bg-black">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
              classes={{
                containerClassName: "h-full w-full relative",
              }}
            />
          </div>

          <div className="p-4 bg-black/80 border-t border-white/10">
            <div className="max-w-md mx-auto flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <span className="text-white text-sm font-bold">Zoom</span>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full accent-[#E31E24]"
                />
              </div>
              <button
                type="button"
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#E31E24] to-[#B31217] text-white font-bold rounded-xl hover:shadow-[0_4px_15px_rgba(227,30,36,0.4)] transition-all disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Salvando Imagem...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Confirmar e Salvar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
