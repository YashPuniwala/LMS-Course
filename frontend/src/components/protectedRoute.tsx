import { RootState } from "@/app/store";
import React, { ReactNode } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
    children: ReactNode;
  }

export const ProtectedRoute = ({children}: ProtectedRouteProps) => {
    const { user } = useSelector((store: RootState) => store.auth);
    const isAuthenticated = user !== null; 

  if(!isAuthenticated) {
    return <Navigate to="/login" />
  }

  return <>{children}</>
};

export const AuthenticatedUser: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { isAuthenticated } = useSelector((store: RootState) => store.auth);
  
    if (isAuthenticated) {
      return <Navigate to="/" />;
    }
  
    return <>{children}</>;
  };
  
  export const AdminRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { user, isAuthenticated } = useSelector((store: RootState) => store.auth);
  
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }
  
    if (user?.role !== "instructor") {
      return <Navigate to="/" />;
    }
  
    return <>{children}</>;
  };