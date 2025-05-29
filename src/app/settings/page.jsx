"use client"
import Header from "@/components/Header";
import React, { useState } from 'react';
import { Save, User, Shield, Bell, Tag, CreditCard, Building, Settings, Github, Server } from 'lucide-react';
import githubConfigImport from '@/config/githubConfig';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    name: 'John Smith',
    email: 'john.smith@example.com',
    company: 'Smith Enterprises',
    phone: '(555) 123-4567',
    notifications: {
      emailAlerts: true,
      stockAlerts: true,
      weeklyReports: true,
      newFeatures: false
    },
    theme: 'light'
  });

  const [githubConfig, setGithubConfig] = useState(githubConfigImport);
  // Initialize GitHub configuration state  



  const handleGithubConfigChange = (e) => {
    const { name, value } = e.target;
    setGithubConfig({
      ...githubConfig,
      [name]: value,
    });
  };

  const handleSaveGithubConfig = (e) => {
    e.preventDefault();
    // Save GitHub config to localStorage or backend
    localStorage.setItem("githubConfig", JSON.stringify(githubConfig));
    alert("GitHub Configuration saved successfully!");
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      notifications: {
        ...formData.notifications,
        [name]: checked
      }
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    // In a real app, this would save to backend
    alert('Settings saved successfully!');
  };

  // ...existing code...
  return (
    <div className="mx-auto bg-white shadow-xl overflow-hidden min-h-screen">
      <Header title="Inventory Management System" />

      <div className="px-2 sm:px-4 py-4 sm:py-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Settings</h1>
        <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
          {/* Sidebar */}
          <div className="w-full md:w-64 bg-white rounded shadow md:sticky md:top-24">
            {/* Mobile: horizontal scrollable nav */}
            <nav className="block md:hidden  p-1 overflow-x-auto ">
              <ul className="flex flex-row gap-2">
                {[
                  { key: 'profile', icon: <User className="h-4 w-4 mr-1" />, label: 'Profile' },
                  { key: 'githubConfig', icon: <Github className="h-4 w-4 mr-1" />, label: 'GitHub' },
                  { key: 'security', icon: <Shield className="h-4 w-4 mr-1" />, label: 'Security' },
                  { key: 'notifications', icon: <Bell className="h-4 w-4 mr-1" />, label: 'Notifications' },
                  { key: 'preferences', icon: <Tag className="h-4 w-4 mr-1" />, label: 'Preferences' },
                  { key: 'billing', icon: <CreditCard className="h-4 w-4 mr-1" />, label: 'Billing' },
                  { key: 'company', icon: <Building className="h-4 w-4 mr-1" />, label: 'Company' },
                  { key: 'integrations', icon: <Server className="h-4 w-4 mr-1" />, label: 'Integrations' },
                  { key: 'advanced', icon: <Settings className="h-4 w-4 mr-1" />, label: 'Advanced' },
                ].map(tab => (
                  <li key={tab.key}>
                    <button
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex items-center justify-center h-9 px-3 rounded text-xs whitespace-nowrap transition-colors duration-150 ${activeTab === tab.key
                        ? 'bg-blue-50 text-blue-600'
                        : 'hover:bg-gray-100 text-gray-700'
                        }`}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
            {/* Desktop: vertical nav */}
            <nav className="hidden md:block p-4">
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`flex items-center w-full px-3 py-2 text-left rounded ${activeTab === 'profile' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
                      }`}
                  >
                    <User className="h-4 w-4 mr-3" />
                    <span>Profile</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab("githubConfig")}
                    className={`flex items-center w-full px-3 py-2 text-left rounded ${activeTab === "githubConfig"
                      ? "bg-blue-50 text-blue-600"
                      : "hover:bg-gray-100"
                      }`}
                  >
                    <Github className="h-4 w-4 mr-3" />
                    <span>GitHub Configuration</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('security')}
                    className={`flex items-center w-full px-3 py-2 text-left rounded ${activeTab === 'security' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
                      }`}
                  >
                    <Shield className="h-4 w-4 mr-3" />
                    <span>Security</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('notifications')}
                    className={`flex items-center w-full px-3 py-2 text-left rounded ${activeTab === 'notifications' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
                      }`}
                  >
                    <Bell className="h-4 w-4 mr-3" />
                    <span>Notifications</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('preferences')}
                    className={`flex items-center w-full px-3 py-2 text-left rounded ${activeTab === 'preferences' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
                      }`}
                  >
                    <Tag className="h-4 w-4 mr-3" />
                    <span>Preferences</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('billing')}
                    className={`flex items-center w-full px-3 py-2 text-left rounded ${activeTab === 'billing' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
                      }`}
                  >
                    <CreditCard className="h-4 w-4 mr-3" />
                    <span>Billing</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('company')}
                    className={`flex items-center w-full px-3 py-2 text-left rounded ${activeTab === 'company' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
                      }`}
                  >
                    <Building className="h-4 w-4 mr-3" />
                    <span>Company</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('integrations')}
                    className={`flex items-center w-full px-3 py-2 text-left rounded ${activeTab === 'integrations' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
                      }`}
                  >
                    <Server className="h-4 w-4 mr-3" />
                    <span>Integrations</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('advanced')}
                    className={`flex items-center w-full px-3 py-2 text-left rounded ${activeTab === 'advanced' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
                      }`}
                  >
                    <Settings className="h-4 w-4 mr-3" />
                    <span>advanced</span>
                  </button>
                </li>
              </ul>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white p-3 sm:p-6 rounded shadow">
              {/* GitHub Configuration Settings */}
              {activeTab === "githubConfig" && (
                <form onSubmit={handleSaveGithubConfig}>
                  <h2 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6">
                    GitHub Configuration
                  </h2>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        Token
                      </label>
                      <input
                        type="password"
                        name="token"
                        value={githubConfig.token}
                        onChange={handleGithubConfigChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm"
                        placeholder="GitHub Personal Access Token"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        Owner
                      </label>
                      <input
                        type="text"
                        name="owner"
                        value={githubConfig.owner}
                        onChange={handleGithubConfigChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm"
                        placeholder="GitHub Username or Org"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        Repository
                      </label>
                      <input
                        type="text"
                        name="repo"
                        value={githubConfig.repo}
                        onChange={handleGithubConfigChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm"
                        placeholder="Repository Name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        Branch
                      </label>
                      <input
                        type="text"
                        name="branch"
                        value={githubConfig.branch}
                        onChange={handleGithubConfigChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm"
                        placeholder="main"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        Path
                      </label>
                      <input
                        type="text"
                        name="path"
                        value={githubConfig.path}
                        onChange={handleGithubConfigChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm"
                        placeholder="inventory"
                      />
                    </div>
                  </div>

                  <div className="mt-4 sm:mt-6">
                    <button
                      type="submit"
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Configuration
                    </button>
                  </div>
                </form>
              )}
              {/* Profile Settings */}
              {activeTab === 'profile' && (
                <form onSubmit={handleSave}>
                  <h2 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6">Profile Settings</h2>

                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="mt-4 sm:mt-6">
                    <button
                      type="submit"
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </button>
                  </div>
                </form>
              )}

              {/* Notification Settings */}
              {activeTab === 'notifications' && (
                <form onSubmit={handleSave}>
                  <h2 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6">Notification Settings</h2>

                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="emailAlerts"
                        name="emailAlerts"
                        checked={formData.notifications.emailAlerts}
                        onChange={handleCheckboxChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
                      />
                      <label htmlFor="emailAlerts" className="ml-2 block text-xs sm:text-sm text-gray-700">
                        Email alerts when inventory is low
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="stockAlerts"
                        name="stockAlerts"
                        checked={formData.notifications.stockAlerts}
                        onChange={handleCheckboxChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
                      />
                      <label htmlFor="stockAlerts" className="ml-2 block text-xs sm:text-sm text-gray-700">
                        Out of stock notifications
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="weeklyReports"
                        name="weeklyReports"
                        checked={formData.notifications.weeklyReports}
                        onChange={handleCheckboxChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
                      />
                      <label htmlFor="weeklyReports" className="ml-2 block text-xs sm:text-sm text-gray-700">
                        Weekly inventory reports
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="newFeatures"
                        name="newFeatures"
                        checked={formData.notifications.newFeatures}
                        onChange={handleCheckboxChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
                      />
                      <label htmlFor="newFeatures" className="ml-2 block text-xs sm:text-sm text-gray-700">
                        New feature announcements
                      </label>
                    </div>
                  </div>

                  <div className="mt-4 sm:mt-6">
                    <button
                      type="submit"
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </button>
                  </div>
                </form>
              )}

              {/* Preferences Settings */}
              {activeTab === 'preferences' && (
                <form onSubmit={handleSave}>
                  <h2 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6">Preferences Settings</h2>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Theme
                    </label>
                    <select
                      name="theme"
                      value={formData.theme}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="system">System Default</option>
                    </select>
                  </div>

                  <div className="mt-4 sm:mt-6">
                    <button
                      type="submit"
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </button>
                  </div>
                </form>
              )}

              {/* Company Settings */}
              {activeTab === 'company' && (
                <form onSubmit={handleSave}>
                  <h2 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6">Company Settings</h2>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Company Name
                    </label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="mt-4 sm:mt-6">
                    <button
                      type="submit"
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </button>
                  </div>
                </form>
              )}

              {/* Placeholder for other tabs */}
              {(activeTab === 'security' || activeTab === 'billing' || activeTab === 'integrations') && (
                <div>
                  <h2 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Settings</h2>
                  <p className="text-gray-600 text-xs sm:text-sm">Settings for {activeTab} would be displayed here.</p>
                </div>
              )}

              {activeTab === 'advanced' && (
                <div>
                  <h2 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6">Advanced Settings</h2>
                  <div className="mb-4">
                    <button
                      onClick={() => {
                        localStorage.clear();
                        alert('Local storage cleared!');
                      }}
                      className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                    >
                      Clear Local Storage
                    </button>
                  </div>
                  {/* Add more advanced settings here if needed */}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  // ...existing code...
};

export default SettingsPage;