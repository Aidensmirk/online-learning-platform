import React from "react";
import { Navigate } from "react-router-dom";

const mockUser = {
  role: "instructor", // Ensure this matches the role required for the dashboard
};

const RoleBasedRoute = ({ children, allowedRoles }) => {
  if (!allowedRoles.includes(mockUser.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
};

export default RoleBasedRoute;