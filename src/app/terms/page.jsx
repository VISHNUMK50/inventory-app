"use client"

// pages/terms.js
import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function Terms() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Head>
        <title>Terms of Service</title>
        <meta name="description" content="Terms of Service for our platform" />
      </Head>

      <main>
        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
        
        <div className="prose prose-lg">
          <p className="mb-4">Last Updated: March 10, 2025</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
          <p>By accessing or using our service, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Use License</h2>
          <p>Permission is granted to temporarily use the materials on our website for personal, non-commercial use only. This is the grant of a license, not a transfer of title.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. User Accounts</h2>
          <p>When you create an account with us, you must provide accurate and complete information. You are responsible for safeguarding the password that you use to access the service and for any activities that occur under your account.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Content</h2>
          <p>Our service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material. You are responsible for the content you post.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Prohibited Uses</h2>
          <p>You may use our service only for lawful purposes and in accordance with these Terms. You agree not to use the service for any illegal or unauthorized purpose.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Intellectual Property</h2>
          <p>The service and its original content, features, and functionality are and will remain the exclusive property of our company and its licensors.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Termination</h2>
          <p>We may terminate or suspend your account immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users of the service.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">8. Limitation of Liability</h2>
          <p>In no event shall our company, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">9. Changes</h2>
          <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. It is your responsibility to check our terms periodically for changes.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">10. Contact Us</h2>
          <p>If you have any questions about these Terms, please contact us at <a href="mailto:legal@example.com" className="text-blue-600 hover:underline">legal@example.com</a>.</p>
          
          <div className="mt-8">
            <Link href="/privacy" className="text-blue-600 hover:underline">View our Privacy Policy</Link>
          </div>
          
          <div className="mt-4">
            <Link href="/" className="text-blue-600 hover:underline">Return to Home Page</Link>
          </div>
        </div>
      </main>
    </div>
  );
}