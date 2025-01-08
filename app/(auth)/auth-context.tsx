import React, { createContext, useContext, useState } from "react";

interface FormData {
  name: string;
  email: string;
  password: string;
  faceVerified: boolean;
}

interface AuthContextProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}

const initialFormData: FormData = {
  name: "",
  email: "",
  password: "",
  faceVerified: false,
};

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [formData, setFormData] = useState<FormData>(initialFormData);

  return (
    <AuthContext.Provider value={{ formData, setFormData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
