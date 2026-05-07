import { useEffect, useState, useRef } from 'react';
import { X, Download, FileText } from 'lucide-react';
import { socket } from '../api/socket';

interface SharedNotesProps {
  roomId: string;
  onClose: () => void;
}

export const SharedNotes = ({ roomId, onClose }: SharedNotesProps) => {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Listen for initial notes when joining
    socket.on('initial-notes', (notes: string) => {
      setValue(notes || '');
    });

    // Listen for updates from others
    socket.on('notes-update', (content: string) => {
      setValue(content || '');
    });

    // Request current notes when mounting
    socket.emit('get-initial-notes', roomId);

    return () => {
      socket.off('initial-notes');
      socket.off('notes-update');
    };
  }, [roomId]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    setValue(content);
    socket.emit('notes-update', roomId, content);
  };

  const downloadNotes = () => {
    const element = document.createElement("a");
    const file = new Blob([value], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `meeting-notes-${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
  };

  return (
    <div className="notes-panel">
      <div className="notes-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={18} color="var(--primary-color)" />
          <h3 style={{ margin: 0 }}>Shared Notes</h3>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="tool-btn" onClick={downloadNotes} title="Download as Text">
            <Download size={18} />
          </button>
          <button className="tool-btn danger" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>
      </div>
      
      <div className="notes-content">
        <textarea 
          ref={textareaRef}
          className="notes-textarea"
          value={value} 
          onChange={handleChange}
          placeholder="Start typing meeting notes here... (Changes are synced in real-time)"
        />
      </div>
      <div className="notes-footer">
        Real-time sync active
      </div>
    </div>
  );
};
