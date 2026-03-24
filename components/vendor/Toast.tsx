'use client';

import { useEffect } from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const config = {
    success: {
      icon: CheckCircle,
      bg: 'bg-green-500',
      border: 'border-green-600',
    },
    error: {
      icon: XCircle,
      bg: 'bg-red-500',
      border: 'border-red-600',
    },
    info: {
      icon: Info,
      bg: 'bg-blue-500',
      border: 'border-blue-600',
    },
  }[type];

  const Icon = config.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.9 }}
        className={`fixed top-4 right-4 ${config.bg} text-white px-6 py-4 rounded-xl shadow-2xl z-50 flex items-center gap-3 border-2 ${config.border}`}
      >
        <Icon className="w-5 h-5" />
        <span className="font-medium">{message}</span>
      </motion.div>
    </AnimatePresence>
  );
}
