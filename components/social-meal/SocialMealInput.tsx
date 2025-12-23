'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, Plus, Send, Loader2, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SocialMealInputProps {
  onTextSubmit: (text: string) => void;
  onImageUpload: (imageBase64: string) => void;
  onBuildMeal: () => void;
  isAnalyzing?: boolean;
  disabled?: boolean;
}

export function SocialMealInput({
  onTextSubmit,
  onImageUpload,
  onBuildMeal,
  isAnalyzing = false,
  disabled = false,
}: SocialMealInputProps) {
  const [text, setText] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (imagePreview) {
      onImageUpload(imagePreview);
      // Keep text if provided for combined analysis
      if (text.trim()) {
        onTextSubmit(text);
      }
    } else if (text.trim()) {
      onTextSubmit(text);
    }
    setText('');
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (text.trim() || imagePreview) {
        handleSubmit();
      }
    }
  };

  const clearImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const canSubmit = (text.trim() || imagePreview) && !isAnalyzing && !disabled;

  return (
    <div className="space-y-3">
      {/* Image preview */}
      {imagePreview && (
        <div className="relative inline-block">
          <img
            src={imagePreview}
            alt="Vald bild"
            className="h-24 w-24 object-cover rounded-xl border-2 border-white shadow-lg"
          />
          <button
            onClick={clearImage}
            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-md"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Input container */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-3">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="T.ex. 'korv, makaroner, ketchup och ett glas mjölk'"
            disabled={disabled || isAnalyzing}
            rows={1}
            className="w-full resize-none border-0 bg-transparent text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-0 text-base"
            style={{ minHeight: '24px', maxHeight: '120px' }}
          />
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between px-3 pb-3">
          <div className="flex items-center gap-2">
            {/* Camera button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isAnalyzing}
              className={cn(
                'p-2.5 rounded-xl transition-all',
                disabled || isAnalyzing
                  ? 'bg-gray-100 text-gray-400'
                  : 'bg-pink-50 text-pink-600 hover:bg-pink-100'
              )}
              title="Ta foto eller ladda upp bild"
            >
              <Camera className="h-5 w-5" />
            </button>

            {/* Build meal button */}
            <button
              onClick={onBuildMeal}
              disabled={disabled || isAnalyzing}
              className={cn(
                'p-2.5 rounded-xl transition-all',
                disabled || isAnalyzing
                  ? 'bg-gray-100 text-gray-400'
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
              )}
              title="Bygg måltid manuellt"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              'p-2.5 rounded-xl transition-all',
              canSubmit
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 shadow-md'
                : 'bg-gray-100 text-gray-400'
            )}
          >
            {isAnalyzing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>

      {/* Help text */}
      {!isAnalyzing && !imagePreview && !text && (
        <div className="text-xs text-gray-400 px-1">
          <span className="font-medium text-gray-500">Tips:</span> Skriv alla ingredienser och drycker.{' '}
          <span className="text-gray-400">Ex: &quot;2 korvar, pasta, ketchup, 2 dl mjölk&quot;</span>
        </div>
      )}

      {/* Analyzing indicator */}
      {isAnalyzing && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <Sparkles className="h-4 w-4 animate-pulse" />
          <span>AI analyserar din måltid...</span>
        </div>
      )}
    </div>
  );
}
