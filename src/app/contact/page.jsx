"use client"

// pages/contact-us.js
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function ContactUs() {
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

  return (
    <>
      <Head>
        <title>Contact Us | Your Company</title>
        <meta name="description" content="Get in touch with our support team" />
      </Head>

      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-blue-600 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
            <p className="text-xl max-w-2xl mx-auto">We're here to help! Send us a message and we'll get back to you as soon as possible.</p>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="md:flex">
                  {/* Contact Information */}
                  <div className="md:w-2/5 bg-blue-600 text-white p-8">
                    <h2 className="text-2xl font-bold mb-8">Get in Touch</h2>
                    
                    <div className="mb-8">
                      <h3 className="font-semibold text-lg mb-2">Email Us</h3>
                      <p className="flex items-center">
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                        </svg>
                        support@yourcompany.com
                      </p>
                    </div>
                    
                    <div className="mb-8">
                      <h3 className="font-semibold text-lg mb-2">Call Us</h3>
                      <p className="flex items-center">
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                        </svg>
                        +1 (800) 123-4567
                      </p>
                    </div>
                    
                    <div className="mb-8">
                      <h3 className="font-semibold text-lg mb-2">Office Hours</h3>
                      <p className="flex items-center">
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        Monday - Friday: 9:00 AM - 6:00 PM EST
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Visit Us</h3>
                      <p className="flex items-start">
                        <svg className="w-5 h-5 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                        <span>
                          123 Business Avenue<br />
                          Suite 456<br />
                          New York, NY 10001
                        </span>
                      </p>
                    </div>
                    
                    {/* Social Media Links */}
                    <div className="mt-12">
                      <h3 className="font-semibold text-lg mb-4">Connect With Us</h3>
                      <div className="flex space-x-4">
                        {['facebook', 'twitter', 'instagram', 'linkedin'].map(platform => (
                          <a 
                            key={platform} 
                            href={`https://${platform}.com/yourcompany`} 
                            className="bg-white bg-opacity-20 p-2 rounded-full hover:bg-opacity-30 transition-all"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <span className="sr-only">{platform}</span>
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-2 16h-2v-6h2v6zm-1-6.891c-.607 0-1.1-.496-1.1-1.109 0-.612.492-1.109 1.1-1.109s1.1.497 1.1 1.109c0 .613-.493 1.109-1.1 1.109zm8 6.891h-1.998v-2.861c0-1.881-2.002-1.722-2.002 0v2.861h-2v-6h2v1.093c.872-1.616 4-1.736 4 1.548v3.359z"/>
                            </svg>
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Contact Form */}
                  <div className="p-8 md:w-3/5">
                    {submitted ? (
                      <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-500 rounded-full mb-6">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                          </svg>
                        </div>
                        <h3 className="text-2xl font-bold mb-3">Thank You!</h3>
                        <p className="text-gray-600 mb-6">
                          Your message has been sent successfully. We'll get back to you as soon as possible.
                        </p>
                        <button 
                          onClick={() => setSubmitted(false)}
                          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Send Another Message
                        </button>
                      </div>
                    ) : (
                      <>
                        <h3 className="text-2xl font-bold mb-6">Send Us a Message</h3>
                        <form onSubmit={handleSubmit}>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                              <label htmlFor="name" className="block text-gray-700 mb-2 font-medium">Full Name</label>
                              <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="John Doe"
                                required
                              />
                            </div>
                            <div>
                              <label htmlFor="email" className="block text-gray-700 mb-2 font-medium">Email Address</label>
                              <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="john@example.com"
                                required
                              />
                            </div>
                          </div>
                          
                          <div className="mb-6">
                            <label htmlFor="subject" className="block text-gray-700 mb-2 font-medium">Subject</label>
                            <input
                              type="text"
                              id="subject"
                              name="subject"
                              value={formData.subject}
                              onChange={handleChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="How can we help you?"
                              required
                            />
                          </div>
                          
                          <div className="mb-6">
                            <label htmlFor="message" className="block text-gray-700 mb-2 font-medium">Message</label>
                            <textarea
                              id="message"
                              name="message"
                              value={formData.message}
                              onChange={handleChange}
                              rows="6"
                              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Please describe your question or issue in detail..."
                              required
                            ></textarea>
                          </div>
                          
                          <div className="mb-6">
                            <label className="flex items-center">
                              <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" required />
                              <span className="ml-2 text-gray-700">
                                I agree to the <Link href="/privacy-policy" className="text-blue-600 hover:underline">privacy policy</Link>
                              </span>
                            </label>
                          </div>
                          
                          <button
                            type="submit"
                            className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium"
                          >
                            Send Message
                          </button>
                        </form>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Quick Link to Help Center */}
              <div className="mt-12 text-center">
                <p className="text-gray-600 mb-4">Looking for answers to common questions?</p>
                <Link 
                  href="/help-center"
                  className="inline-block bg-gray-100 text-blue-600 px-6 py-3 rounded-md hover:bg-gray-200 transition-colors font-medium"
                >
                  Visit our Help Center
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Map Section */}
        <section className="pb-16">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                  {/* Placeholder for an actual map integration */}
                  <div className="w-full h-64 md:h-96 bg-gray-200 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
                      </svg>
                      <p className="text-lg">Map Location</p>
                      <p className="text-sm">You would integrate Google Maps or another map service here</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}