
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
    sm: "h-8 w-auto",
    md: "h-12 w-auto",
    lg: "h-16 w-auto",
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Placeholder for Laxnar.ai logo - replace with actual logo from www.laxnar.ai */}
      <div className={`flex items-center justify-center bg-gradient-to-br from-laxnar-primary to-laxnar-light rounded-lg p-1 ${sizeClasses[size]}`}>
        <div className="text-white font-bold">
          {size === "sm" ? "L" : "LX"}
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
