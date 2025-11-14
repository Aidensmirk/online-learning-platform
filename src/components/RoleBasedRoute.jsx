import React from "react";
import { Navigate } from "react-router-dom";

const RoleBasedRoute = ({ children, allowedRoles }) => {
  const storedUser = localStorage.getItem("user");

  if (!storedUser) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(storedUser);

    if (user?.role === "admin") {
      // Admins can access any protected route
      return children;
    }

    if (!user?.role || !allowedRoles.includes(user.role)) {
      return <Navigate to="/" replace />;
    }

    return children;
  } catch (error) {
    console.error("Failed to parse stored user:", error);
    return <Navigate to="/login" replace />;
  }
};

export default RoleBasedRoute;