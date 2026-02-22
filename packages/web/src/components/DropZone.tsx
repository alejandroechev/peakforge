import { useCallback, useRef, useState } from 'react';

interface DropZoneProps {
  onUpload: (text: string) => void;
}

export function DropZone({ onUpload }: DropZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) file.text().then(onUpload);
  }, [onUpload]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) file.text().then(onUpload);
  };

  return (
    <div
      className="drop-zone"
      style={{
        flex: 1,
        border: dragOver ? '2px dashed var(--accent)' : '2px dashed var(--border)',
        margin: 24,
        borderRadius: 12,
      }}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <div className="icon">📊</div>
      <p>Drop a CSV spectrum file here, or click to upload</p>
      <p style={{ fontSize: 12, opacity: 0.6 }}>
        Format: x (wavenumber/wavelength), y (intensity) — comma, tab, or semicolon separated
      </p>
      <input ref={fileRef} type="file" accept=".csv,.txt,.tsv" hidden onChange={handleFile} />
      <button className="primary" onClick={() => fileRef.current?.click()}>
        Select File
      </button>
    </div>
  );
}
