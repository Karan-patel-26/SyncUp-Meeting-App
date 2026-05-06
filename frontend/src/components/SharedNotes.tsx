import { useEffect, useState, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { X, Download } from 'lucide-react';
import { socket } from '../api/socket';

interface SharedNotesProps {
  roomId: string;
  onClose: () => void;
}

export const SharedNotes = ({ roomId, onClose }: SharedNotesProps) => {
  const [value, setValue] = useState('');
  const quillRef = useRef<ReactQuill>(null);
  const isIncomingChange = useRef(false);

  useEffect(() => {
    // Listen for initial notes when joining
    socket.on('initial-notes', (notes: string) => {
      isIncomingChange.current = true;
      setValue(notes);
    });

    // Listen for updates from others
    socket.on('notes-update', (delta: string) => {
      isIncomingChange.current = true;
      setValue(delta);
    });

    return () => {
      socket.off('initial-notes');
      socket.off('notes-update');
    };
  }, []);

  const handleChange = (content: string, _delta: any, source: string) => {
    setValue(content);
    
    // Only emit if the change was made by the user, not by a socket event
    if (source === 'user') {
      socket.emit('notes-update', roomId, content);
    }
  };

  const downloadNotes = () => {
    const element = document.createElement("a");
    const file = new Blob([value], {type: 'text/html'});
    element.href = URL.createObjectURL(file);
    element.download = `meeting-notes-${Date.now()}.html`;
    document.body.appendChild(element);
    element.click();
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
      ['link', 'clean']
    ],
  };

  return (
    <div className="notes-panel">
      <div className="notes-header">
        <h3 style={{ margin: 0 }}>Shared Notes</h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="tool-btn" onClick={downloadNotes} title="Download HTML">
            <Download size={18} />
          </button>
          <button className="tool-btn danger" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
      </div>
      
      <div className="notes-content">
        <ReactQuill 
          ref={quillRef}
          theme="snow" 
          value={value} 
          onChange={handleChange}
          modules={modules}
          placeholder="Start typing meeting notes..."
        />
      </div>
    </div>
  );
};
