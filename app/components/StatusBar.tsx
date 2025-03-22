import { useState, useEffect } from 'react';
import { FiWifi, FiBattery, FiActivity } from 'react-icons/fi';

export default function StatusBar() {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="status-bar">
      <div className="status-bar-time">{time}</div>
      <div className="status-bar-icons">
        <FiActivity />
        <FiWifi />
        <FiBattery />
      </div>
    </div>
  );
} 