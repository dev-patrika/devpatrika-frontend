import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';

const ConfirmModal = () => {
  const { confirmDialog } = useUIStore();
  const { isOpen, title, message, onConfirm, onCancel } = confirmDialog;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
            onClick={onCancel}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#09090b] border border-zinc-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl pointer-events-auto"
            >
              <div className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mb-4 ring-1 ring-rose-500/20">
                    <AlertTriangle className="w-6 h-6 text-rose-500" />
                  </div>
                  
                  <h3 className="text-lg font-bold text-zinc-100 mb-2">
                    {title || 'Are you sure?'}
                  </h3>
                  
                  <p className="text-sm text-zinc-400 mb-6">
                    {message}
                  </p>
                  
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={onCancel}
                      className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 py-2.5 rounded-xl font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={onConfirm}
                      className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-rose-900/20"
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
