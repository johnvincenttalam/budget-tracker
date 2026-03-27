import { useState, useCallback } from 'react';
import { hashPin } from './pin';
import { useBudgetStore } from '../../shared/store/useBudgetStore';

interface PinSetupProps {
  onClose: () => void;
}

export function PinSetup({ onClose }: PinSetupProps) {
  const setPinHash = useBudgetStore((s) => s.setPinHash);
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [firstPin, setFirstPin] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleDigit = useCallback((digit: string) => {
    setError(false);
    setPin((prev) => {
      if (prev.length >= 4) return prev;
      const next = prev + digit;
      if (next.length === 4) {
        if (step === 'enter') {
          setFirstPin(next);
          setStep('confirm');
          setTimeout(() => setPin(''), 0);
        } else {
          if (next === firstPin) {
            hashPin(next).then((hash) => {
              setPinHash(hash);
              onClose();
            });
          } else {
            setError(true);
            setTimeout(() => {
              setPin('');
              setFirstPin('');
              setStep('enter');
              setError(false);
            }, 500);
          }
        }
      }
      return next;
    });
  }, [step, firstPin, setPinHash, onClose]);

  const handleBackspace = useCallback(() => {
    setError(false);
    setPin((prev) => prev.slice(0, -1));
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-8">
        {/* Title */}
        <div className="text-center">
          <p className="text-white text-lg font-semibold">
            {step === 'enter' ? 'Enter New PIN' : 'Confirm PIN'}
          </p>
          <p className="text-slate-400 text-sm mt-1">
            {step === 'enter' ? 'Choose a 4-digit PIN' : 'Enter the same PIN again'}
          </p>
        </div>

        {/* PIN dots */}
        <div className={`flex gap-4 ${error ? 'animate-shake' : ''}`}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-150 ${
                i < pin.length
                  ? error
                    ? 'bg-red-500'
                    : 'bg-emerald-400'
                  : 'bg-slate-700'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-red-400 text-sm -mt-4">PINs don't match. Try again.</p>
        )}

        {/* Number pad */}
        <div className="grid grid-cols-3 gap-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'].map((key) => {
            if (key === '') return <div key="empty" />;
            if (key === 'back') {
              return (
                <button
                  key="back"
                  onClick={handleBackspace}
                  className="w-18 h-18 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-800 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12l2.25-2.25M14.25 12L12 14.25m-2.58 4.92l-6.374-6.375a1.125 1.125 0 010-1.59L9.42 4.83c.21-.211.497-.33.795-.33H19.5a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25h-9.284c-.298 0-.585-.119-.795-.33z" />
                  </svg>
                </button>
              );
            }
            return (
              <button
                key={key}
                onClick={() => handleDigit(key)}
                className="w-18 h-18 rounded-full flex items-center justify-center text-2xl font-medium text-white bg-slate-800/60 active:bg-slate-700 transition-colors"
              >
                {key}
              </button>
            );
          })}
        </div>

        {/* Cancel button */}
        <button
          onClick={onClose}
          className="text-slate-400 text-sm mt-2 active:text-slate-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
