import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Play, Pause, Scissors, Check, X, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoTrimmerProps {
  file: File;
  onTrim: (blob: Blob, start: number, end: number, thumbnail: string) => void;
  onCancel: () => void;
  minDuration?: number;
  maxDuration?: number;
}

export function VideoTrimmer({ file, onTrim, onCancel, minDuration = 8, maxDuration = 60 }: VideoTrimmerProps) {
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [duration, setDuration] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(15);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      setDuration(dur);
      setEndTime(Math.min(dur, maxDuration));
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (videoRef.current.currentTime >= endTime) {
        videoRef.current.currentTime = startTime;
        if (!isPlaying) videoRef.current.pause();
      }
    }
  };

  const captureThumbnail = (time: number): Promise<string> => {
    return new Promise((resolve) => {
      if (videoRef.current) {
        const video = videoRef.current;
        const prevTime = video.currentTime;
        video.currentTime = time;
        
        video.onseeked = () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
          video.currentTime = prevTime;
          resolve(canvas.toDataURL('image/jpeg', 0.8));
          video.onseeked = null;
        };
      } else {
        resolve('');
      }
    });
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    const thumbnail = await captureThumbnail(startTime);
    onTrim(file, startTime, endTime, thumbnail);
    setIsProcessing(false);
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    const ms = Math.floor((time % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  const selectedDuration = endTime - startTime;
  const isValidDuration = selectedDuration >= minDuration && selectedDuration <= maxDuration;

  return (
    <div className="flex flex-col h-full bg-black text-white">
      {/* Premium Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/50 to-transparent">
        <button onClick={onCancel} className="p-2 -ml-2 text-white/70 hover:text-white transition-colors">
          <X size={24} />
        </button>
        <div className="text-center">
          <h2 className="text-sm font-bold tracking-tight">Trim Video</h2>
          <div className={cn(
            "text-[10px] font-mono mt-0.5 px-2 py-0.5 rounded-full inline-block",
            isValidDuration ? "bg-primary/20 text-primary" : "bg-red-500/20 text-red-400"
          )}>
            {formatTime(selectedDuration)}s Selected
          </div>
        </div>
        <button 
          onClick={handleConfirm}
          disabled={isProcessing || !isValidDuration}
          className="text-sm font-bold text-primary disabled:opacity-30 disabled:grayscale transition-all p-2 -mr-2"
        >
          {isProcessing ? <Loader2 className="animate-spin" size={18} /> : "Next"}
        </button>
      </div>

      {/* Video Preview */}
      <div className="relative flex-1 flex items-center justify-center p-4">
        <div className="relative w-full h-full max-h-[70vh] aspect-[9/16] rounded-2xl overflow-hidden bg-zinc-900 border border-white/5 shadow-2xl">
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain"
            onLoadedMetadata={onLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            playsInline
            onClick={togglePlay}
          />
          
          <AnimatePresence>
            {!isPlaying && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.2 }}
                className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none"
              >
                <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl">
                  <Play size={32} className="fill-white text-white ml-2" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modern Timeline UX */}
      <div className="px-6 py-10 space-y-8 bg-gradient-to-t from-black to-transparent">
        <div className="relative h-16 rounded-xl overflow-hidden group">
          {/* Timeline Background (Waveform style) */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-8 flex items-center gap-[2px] opacity-20 px-2">
            {Array.from({ length: 80 }).map((_, i) => (
              <div 
                key={i} 
                className="flex-1 bg-white rounded-full transition-transform" 
                style={{ height: `${20 + Math.random() * 60}%` }}
              />
            ))}
          </div>

          {/* Timeline Control Layer */}
          <div className="absolute inset-0 z-10">
            {/* Shaded Areas (Outside Selected Range) */}
            <div 
              className="absolute inset-y-0 left-0 bg-black/60 backdrop-blur-[1px]"
              style={{ width: `${(startTime / duration) * 100}%` }}
            />
            <div 
              className="absolute inset-y-0 right-0 bg-black/60 backdrop-blur-[1px]"
              style={{ left: `${(endTime / duration) * 100}%` }}
            />

            {/* Selected Range Visualizer */}
            <div 
              className="absolute inset-y-0 border-y-2 border-white/30"
              style={{ 
                left: `${(startTime / duration) * 100}%`, 
                width: `${((endTime - startTime) / duration) * 100}%` 
              }}
            >
              {/* Playhead */}
              <motion.div 
                animate={{ left: `${((currentTime - startTime) / (endTime - startTime)) * 100}%` }}
                className="absolute inset-y-0 w-0.5 bg-white shadow-[0_0_10px_white] z-20"
                transition={{ type: 'tween', ease: 'linear', duration: 0.1 }}
              />
            </div>

            {/* Draggable Handles */}
            <div 
              className="absolute inset-y-0 left-0 flex items-center cursor-ew-resize z-30 group/handle"
              style={{ left: `calc(${(startTime / duration) * 100}% - 10px)` }}
            >
              <div className="w-5 h-full bg-primary rounded-l-lg flex items-center justify-center border-l-2 border-y-2 border-white/20 active:scale-y-110 transition-transform">
                <div className="w-0.5 h-4 bg-white/40 rounded-full" />
              </div>
              <input 
                type="range"
                min={0}
                max={endTime - 0.5}
                step={0.1}
                value={startTime}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setStartTime(val);
                  if (videoRef.current) videoRef.current.currentTime = val;
                }}
                className="absolute inset-0 opacity-0 w-full h-full cursor-ew-resize"
              />
            </div>

            <div 
              className="absolute inset-y-0 right-0 flex items-center cursor-ew-resize z-30 group/handle"
              style={{ left: `${(endTime / duration) * 100}%` }}
            >
              <div className="w-5 h-full bg-primary rounded-r-lg flex items-center justify-center border-r-2 border-y-2 border-white/20 active:scale-y-110 transition-transform -ml-5">
                <div className="w-0.5 h-4 bg-white/40 rounded-full" />
              </div>
              <input 
                type="range"
                min={startTime + 0.5}
                max={duration}
                step={0.1}
                value={endTime}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setEndTime(val);
                  if (videoRef.current) videoRef.current.currentTime = val;
                }}
                className="absolute inset-0 opacity-0 w-full h-full cursor-ew-resize"
              />
            </div>
          </div>
        </div>

        {/* Info & Duration limits */}
        <div className="flex justify-between items-center px-2">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-white/30 uppercase">Min Duration</span>
            <span className="text-xs font-mono">{minDuration}s</span>
          </div>
          <div className="text-center">
            <p className={cn(
              "text-[11px] font-bold transition-colors",
              isValidDuration ? "text-primary/70" : "text-red-400"
            )}>
              {isValidDuration 
                ? "Perfect length for high engagement!" 
                : selectedDuration < minDuration ? "Too short for a short" : "Too long for a short"}
            </p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-white/30 uppercase">Max Duration</span>
            <span className="text-xs font-mono">{maxDuration}s</span>
          </div>
        </div>
      </div>
    </div>
  );
}
