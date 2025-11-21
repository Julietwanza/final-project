import React, { useState, useEffect } from "react";
import "./Notification.css";

const Notification = ({ message, type, duration = 3000, onClose }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (visible && duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onClose]);

  if (!visible) return null;

  return (
    <div className={`notification ${type}`}>
      <p>{message}</p>
      <button onClick={() => { setVisible(false); if (onClose) onClose(); }}>&times;</button>
    </div>
  );
};

export default Notification;