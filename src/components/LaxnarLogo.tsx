
import React from 'react';

interface LaxnarLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  withText?: boolean;
}

const LaxnarLogo: React.FC<LaxnarLogoProps> = ({ 
  className = "", 
  size = "md", 
  withText = true 
}) => {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Laxnar.ai logo */}
      <div className={`flex items-center justify-center bg-laxnar-light rounded-lg ${sizeClasses[size]}`}>
        <div className="text-white font-bold text-xl">
          {size === "sm" ? "LX" : "LX"}
        </div>
      </div>
      
      {withText && (
        <span className="font-bold text-xl text-white">
          Laxnar<span className="text-laxnar-primary">.ai</span>
        </span>
      )}
    </div>
  );
};

export default LaxnarLogo;
