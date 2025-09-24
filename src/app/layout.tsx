// FIX: Import React to fix "Cannot find namespace 'React'" error.
import React from 'react';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Image Editor',
  description: 'An intuitive web application that uses the Qwen Image Edit API to allow users to upload an image, provide a text prompt, and receive an AI-edited version of their image. Features include configurable editing parameters and a side-by-side comparison of the original and edited images.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-900 text-white antialiased">{children}</body>
    </html>
  );
}
