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
            className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm"
            onClick={onCancel}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-card border border-border rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl pointer-events-auto"
            >
              <div className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4 ring-1 ring-red-500/20">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  </div>
                  
                  <h3 className="text-base font-bold text-foreground mb-1.5 font-sans">
                    {title || 'Are you sure?'}
                  </h3>
                  
                  <p className="text-xs text-muted-foreground mb-6 leading-relaxed font-sans">
                    {message}
                  </p>
                  
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={onCancel}
                      className="flex-1 bg-muted hover:bg-muted/80 text-foreground border border-border py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer active:scale-[0.98]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={onConfirm}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-xs font-semibold transition-colors shadow-lg shadow-red-500/15 cursor-pointer active:scale-[0.98]"
                    >
                      Yes, Clear
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
