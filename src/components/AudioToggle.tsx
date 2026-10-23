import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { isSoundMuted, toggleSound, playTactileTick } from '../utils/audio';

export const AudioToggle: React.FC = () => {
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setMuted(isSoundMuted());
  }, []);

  const handleClick = () => {
    const nextState = toggleSound();
    setMuted(nextState);
    if (!nextState) {
      playTactileTick();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`p-2 rounded-xl border transition-all cursor-pointer ${
        !muted
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
          : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
      }`}
      title={muted ? 'تفعيل المؤثرات الصوتية الفطرية' : 'كتم المؤثرات الصوتية'}
    >
      {!muted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
    </button>
  );
};
