"use client";
import { useState, useEffect } from 'react';
import { FileText, Download, Search } from 'lucide-react';
import githubConfig from '@/config/githubConfig';

export default function Datasheets() {
  const [datasheets, setDatasheets] = useState([]);  // Initialize as empty array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchDatasheets = async () => {
      try {
        const response = await fetch(`/api/datasheets`);
        const data = await response.json();
        
        // Verify that data is an array
        if (Array.isArray(data)) {
          setDatasheets(data);
        } else if (data.error) {
          setError(data.error);
        } else {
          setError('Invalid data format received');
        }
      } catch (error) {
        console.error('Error fetching datasheets:', error);
        setError('Failed to fetch datasheets');
      } finally {
        setLoading(false);
      }
    };

    fetchDatasheets();
  }, []);

  const filteredDatasheets = Array.isArray(datasheets) 
    ? datasheets.filter(datasheet =>
        datasheet.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-red-600 bg-red-50 p-4 rounded-lg">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 flex items-center">
        <FileText className="mr-2" /> Component Datasheets
      </h1>

      <div className="mb-6 relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search datasheets..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDatasheets.map((datasheet) => (
            <div key={datasheet.id} className="border rounded-lg p-4 hover:shadow-lg transition">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{datasheet.name}</h3>
                  <p className="text-sm text-gray-500">{datasheet.component}</p>
                </div>
                <a
                  href={datasheet.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <Download className="h-5 w-5 text-blue-600" />
                </a>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Last updated: {new Date(datasheet.updatedAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
        
      )}
    </div>
  );
}