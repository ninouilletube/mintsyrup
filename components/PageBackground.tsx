'use client';

export default function PageBackground({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#FAE2E8' }}>
      {children}
    </div>
  );
}
