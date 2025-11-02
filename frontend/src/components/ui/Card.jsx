import React from "react";
import { cn } from "../../utils/helpers";

const Card = ({ children, className = "", header, footer, ...props }) => {
  return (
    <div
      className={cn(
        "bg-white rounded-lg shadow-md border border-gray-200",
        className
      )}
      {...props}
    >
      {header && (
        <div className="px-6 py-4 border-b border-gray-200">{header}</div>
      )}
      <div className="p-6">{children}</div>
      {footer && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
