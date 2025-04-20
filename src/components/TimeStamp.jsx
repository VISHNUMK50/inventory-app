'use client';
import { useState, useEffect } from 'react';

const TimeStamp = () => {
  const [timestamp, setTimestamp] = useState('');

  useEffect(() => {
    setTimestamp(new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }));
  }, []);

  return (
    <span className="text-sm text-gray-600">
      Last updated: {timestamp}
    </span>
  );
};

export default TimeStamp;