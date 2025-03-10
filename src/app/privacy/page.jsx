"use client";

// pages/privacy.js
import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function Privacy() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Head>
        <title>Privacy Policy</title>
        <meta name="description" content="Privacy Policy for our platform" />
      </Head>

      <main>
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        
        <div className="prose prose-lg">
          <p className="mb-4">Last Updated: March 10, 2025</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Information We Collect</h2>
          <p>We collect information you provide directly to us when you create an account, use our services, or communicate with us. This may include your name, email address, and any other information you choose to provide.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. How We Use Your Information</h2>
          <p>We use the information we collect to provide, maintain, and improve our services, communicate with you, and comply with legal obligations. We may also use your information to personalize your experience and send you information about features and services that may be of interest to you.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Cookies and Tracking Technologies</h2>
          <p>We use cookies and similar tracking technologies to track activity on our service and hold certain information. Cookies are files with a small amount of data which may include an anonymous unique identifier.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Data Security</h2>
          <p>The security of your data is important to us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Third-Party Services</h2>
          <p>Our service may link to or use third-party services that are not operated by us. We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party services.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Children's Privacy</h2>
          <p>Our service does not address anyone under the age of 13. We do not knowingly collect personally identifiable information from children under 13.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Changes to This Privacy Policy</h2>
          <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date at the top of this policy.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">8. Your Rights</h2>
          <p>Depending on your location, you may have certain rights regarding your personal information, such as the right to access, correct, or delete the data we hold about you.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">9. International Transfers</h2>
          <p>Your information may be transferred to — and maintained on — computers located outside of your state, province, country, or other governmental jurisdiction where the data protection laws may differ from those of your jurisdiction.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">10. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us at <a href="mailto:privacy@example.com" className="text-blue-600 hover:underline">privacy@example.com</a>.</p>
          
          <div className="mt-8">
            <Link href="/terms" className="text-blue-600 hover:underline">View our Terms of Service</Link>
          </div>
          
          <div className="mt-4">
            <Link href="/" className="text-blue-600 hover:underline">Return to Home Page</Link>
          </div>
        </div>
      </main>
    </div>
  );
}