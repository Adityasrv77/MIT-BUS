'use client';
import dynamic from 'next/dynamic';

const RoleSelect = dynamic(() => import('../../components/RoleSelect'), { ssr: false });

export default function RoleSelectPage() {
  return <RoleSelect />;
}
