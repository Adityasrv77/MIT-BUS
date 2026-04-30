'use client';
import dynamic from 'next/dynamic';

const GuestView = dynamic(() => import('../../components/GuestView'), { ssr: false });

export default function GuestPage() {
  return <GuestView />;
}
