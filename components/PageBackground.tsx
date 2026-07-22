'use client';

export default function PageBackground({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: 'transparent' }}>
      {children}
    </div>
  );
}
