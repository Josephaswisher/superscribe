import React from 'react';
import { Mic, FileText, Image as ImageIcon } from 'lucide-react';

interface ArtifactCardProps { 
    type: 'image' | 'audio' | 'pdf'; 
    name: string; 
}

export const ArtifactCard: React.FC<ArtifactCardProps> = ({ type, name }) => (
  <div className="flex items-center gap-3 p-3 bg-[#2a2a2a] border border-gray-700 rounded-lg max-w-sm mt-2 shadow-sm cursor-pointer hover:bg-[#333] transition-colors group">
    <div className={`w-10 h-10 rounded flex items-center justify-center shrink-0 ${type === 'image' ? 'bg-purple-500/20 text-purple-400 group-hover:bg-purple-500 group-hover:text-white' : ''}
        ${type === 'audio' ? 'bg-red-500/20 text-red-400 group-hover:bg-red-500 group-hover:text-white' : ''}
        ${type === 'pdf' ? 'bg-[#d97757]/20 text-[#d97757] group-hover:bg-[#d97757] group-hover:text-white' : ''}
    `}>
      {type === 'image' && <ImageIcon className="w-5 h-5" />}
      {type === 'audio' && <Mic className="w-5 h-5" />}
      {type === 'pdf' && <FileText className="w-5 h-5" />}
    </div>
    <div className="flex flex-col overflow-hidden">
      <span className="text-sm font-bold text-gray-200 truncate pr-2">{name}</span>
      <span className="text-xs text-gray-500 capitalize">{type} Upload</span>
    </div>
  </div>
);