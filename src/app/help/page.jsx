"use client"


// pages/help-center.js
import { useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import Header from "@/components/Header";

export default function HelpCenter() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Here you would normally send the data to your backend
    // For demo purposes, we'll just show a success message
    setSubmitted(true);
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const helpCategories = [
    { title: 'Getting Started', icon: '🚀', description: 'New to our platform? Learn the basics here.' },
    { title: 'Account Management', icon: '👤', description: 'Manage your account settings and preferences.' },
    { title: 'Billing & Payments', icon: '💳', description: 'Questions about invoices, payments, or subscriptions.' },
    { title: 'Troubleshooting', icon: '🔧', description: 'Solutions for common issues and error messages.' },
    { title: 'FAQs', icon: '❓', description: 'Find answers to frequently asked questions.' },
    { title: 'Features & Tutorials', icon: '📚', description: 'Learn how to use all our features effectively.' },
  ];

  return (
    <>
          <Header title="Inventory Management System" />

      <Head>
        <title>Help Center & Contact Us | Your Company</title>
        <meta name="description" content="Get help and contact our support team" />
      </Head>

      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-blue-600 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold mb-4">How can we help you?</h1>
            <p className="text-xl max-w-2xl mx-auto">Find answers to common questions or contact our support team.</p>
            
            {/* Search bar */}
            <div className="mt-8 max-w-xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for help articles..."
                  className="w-full py-3 px-4 rounded-lg text-gray-800 focus:outline-none"
                />
                <button className="absolute right-2 top-2 bg-blue-700 text-white px-4 py-1 rounded-md">
                  Search
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Help Categories */}
        <section className="py-16 container mx-auto px-4">
          <h2 className="text-3xl font-semibold text-center mb-12">Browse Help Topics</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {helpCategories.map((category, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="text-3xl mb-4">{category.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{category.title}</h3>
                <p className="text-gray-600 mb-4">{category.description}</p>
                <Link 
                  href={`/help-center/${category.title.toLowerCase().replace(/ /g, '-')}`}
                  className="text-blue-600 hover:underline font-medium"
                >
                  View articles →
                </Link>
              </div>
            ))}
          </div>
        </section>

        

        {/* FAQ Section */}
        <section className="py-16 container mx-auto px-4">
          <h2 className="text-3xl font-semibold text-center mb-12">Frequently Asked Questions</h2>
          
          <div className="max-w-3xl mx-auto space-y-6">
            {[
              {
                q: "How do I reset my password?",
                a: "You can reset your password by clicking on 'Forgot Password' on the login page. We'll send you an email with instructions to create a new password."
              },
              {
                q: "How can I upgrade my subscription?",
                a: "To upgrade your subscription, go to Account Settings > Subscription and select the plan you'd like to upgrade to. Follow the payment instructions to complete your upgrade."
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and bank transfers for annual subscriptions."
              },
              {
                q: "How do I cancel my subscription?",
                a: "You can cancel your subscription anytime from your Account Settings > Subscription page. Your access will continue until the end of your billing period."
              },
            ].map((faq, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-10">
            <Link 
              href="/help-center/faqs"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
            >
              View All FAQs
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}