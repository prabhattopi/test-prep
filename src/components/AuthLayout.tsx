import React from "react";
import ImagePlaceholder from "../assets/loginImage.png";
export const AuthLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <div className="min-h-screen w-full flex bg-surface">
      {/* Left Side - Illustration Canvas Area */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center bg-bg-main border-r border-border-subtle relative">
        <div className="w-full max-w-md aspect-square flex flex-col items-center justify-center text-text-muted">
          <img
            src={ImagePlaceholder}
            alt="Login Illustration"
            className="w-119 h-86 object-cover"
          />
        </div>
      </div>

      {/* Right Side - Form Interactive Canvas */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24 xl:px-32">
        <div className="w-full max-w-100 mx-auto">{children}</div>
      </div>
    </div>
  );
};
