import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, Lock, User, Sparkles } from "lucide-react";
import { Login, Register } from "@/types/types";
import { useEffect, useState } from "react";
import { useLoginMutation, useRegisterMutation } from "@/features/api/authApi";
import { toast } from "sonner";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { useNavigate } from "react-router-dom";

const LoginComponent = () => {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [signupInput, setSignupInput] = useState<Register>({
    name: "",
    email: "",
    password: "",
  });

  const [loginInput, setLoginInput] = useState<Login>({
    email: "",
    password: "",
  });

  const [
    registerUser,
    {
      data: registerData,
      error: registerError,
      isLoading: registerIsLoading,
      isSuccess: registerIsSuccess,
    },
  ] = useRegisterMutation();
  const [
    loginUser,
    {
      data: loginData,
      error: loginError,
      isLoading: loginIsLoading,
      isSuccess: loginIsSuccess,
    },
  ] = useLoginMutation();

  const navigate = useNavigate();

  useEffect(() => {
    if (registerIsSuccess && registerData) {
      toast.success(registerData.message || "Registered Successfully");
      setActiveTab("login");
      setLoginInput(prev => ({ ...prev, email: signupInput.email }));
      setSignupInput({ name: "", email: "", password: "" });
    }

    if (registerError) {
      const errorData = (registerError as FetchBaseQueryError)?.data as {
        message?: string;
      };
      toast.error(errorData?.message || "Registration Failed");
    }

    if (loginError) {
      const errorData = (loginError as FetchBaseQueryError)?.data as {
        message?: string;
      };
      toast.error(errorData?.message || "Login Failed");
    }

    if (loginIsSuccess && loginData) {
      toast.success(loginData.message || "LoggedIn Successfully");
      navigate("/");
    }
  }, [
    loginIsLoading,
    registerIsLoading,
    loginData,
    registerData,
    loginError,
    registerError,
    loginIsSuccess,
    registerIsSuccess,
    signupInput.email,
    navigate
  ]);

  const changeInputHandler = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "signup" | "login"
  ) => {
    const { name, value } = e.target;
    if (type === "signup") {
      setSignupInput((prev) => ({ ...prev, [name]: value }));
    } else {
      setLoginInput((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleRegistration = async (type: "signup" | "login") => {
    if (type === "signup") {
      const inputData = signupInput;
      try {
        await registerUser(inputData).unwrap();
      } catch (error) {
        console.error("Signup Error:", error);
      }
    } else if (type === "login") {
      const inputData = loginInput;
      try {
        await loginUser(inputData).unwrap();
      } catch (error) {
        console.error("Login Error:", error);
      }
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="w-full max-w-md mx-auto">
        <div className="relative">
          {/* Floating decorative elements */}
          <div className="absolute -top-8 -left-8 w-16 h-16 rounded-full bg-blue-200 opacity-30 blur-xl"></div>
          <div className="absolute -bottom-8 -right-8 w-20 h-20 rounded-full bg-blue-200 opacity-30 blur-xl"></div>
          
          <Tabs 
            value={activeTab} 
            onValueChange={(value) => setActiveTab(value as "login" | "signup")} 
            className="w-full relative z-10"
          >
            <TabsList className="grid w-full grid-cols-2 bg-blue-100/50 gap-1 p-1 rounded-xl backdrop-blur-sm border border-blue-200/50">
              <TabsTrigger 
                value="signup" 
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-lg transition-all data-[state=active]:shadow-sm"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Sign Up
              </TabsTrigger>
              <TabsTrigger 
                value="login" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg transition-all data-[state=active]:shadow-sm"
              >
                <Mail className="w-4 h-4 mr-2" />
                Login
              </TabsTrigger>
            </TabsList>

            {/* Signup Tab */}
            <TabsContent value="signup" className="mt-6">
              <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-1 bg-blue-500"></div>
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-blue-900">
                    Create Your Account
                  </CardTitle>
                  <CardDescription className="text-blue-700/80">
                    Join us and unlock amazing features
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-blue-800">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-400" />
                      <Input
                        type="text"
                        name="name"
                        placeholder="John Doe"
                        value={signupInput.name}
                        onChange={(e) => changeInputHandler(e, "signup")}
                        required
                        className="w-full pl-10 py-5 rounded-lg border-blue-200 focus:ring-2 focus:ring-blue-500 bg-white/90"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-blue-800">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-400" />
                      <Input
                        type="email"
                        name="email"
                        placeholder="john@example.com"
                        value={signupInput.email}
                        onChange={(e) => changeInputHandler(e, "signup")}
                        required
                        className="w-full pl-10 py-5 rounded-lg border-blue-200 focus:ring-2 focus:ring-blue-500 bg-white/90"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-blue-800">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-400" />
                      <Input
                        type="password"
                        name="password"
                        placeholder="••••••••"
                        value={signupInput.password}
                        onChange={(e) => changeInputHandler(e, "signup")}
                        required
                        className="w-full pl-10 py-5 rounded-lg border-blue-200 focus:ring-2 focus:ring-blue-500 bg-white/90"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-center">
                  <Button
                    disabled={registerIsLoading}
                    onClick={() => handleRegistration("signup")}
                    className="w-full py-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md hover:shadow-lg transition-all"
                  >
                    {registerIsLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Creating account...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Get Started
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Login Tab */}
            <TabsContent value="login" className="mt-6">
              <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-1 bg-blue-600"></div>
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-blue-900">
                    Welcome Back
                  </CardTitle>
                  <CardDescription className="text-blue-700/80">
                    Sign in to continue your journey
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-blue-800">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-400" />
                      <Input
                        type="email"
                        name="email"
                        placeholder="john@example.com"
                        value={loginInput.email}
                        onChange={(e) => changeInputHandler(e, "login")}
                        required
                        className="w-full pl-10 py-5 rounded-lg border-blue-200 focus:ring-2 focus:ring-blue-500 bg-white/90"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-blue-800">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-400" />
                      <Input
                        type="password"
                        name="password"
                        placeholder="••••••••"
                        value={loginInput.password}
                        onChange={(e) => changeInputHandler(e, "login")}
                        required
                        className="w-full pl-10 py-5 rounded-lg border-blue-200 focus:ring-2 focus:ring-blue-500 bg-white/90"
                      />
                    </div>
                  </div>
                  {/* <div className="flex justify-end">
                    <button className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
                      Forgot password?
                    </button>
                  </div> */}
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                  <Button
                    disabled={loginIsLoading}
                    onClick={() => handleRegistration("login")}
                    className="w-full py-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md hover:shadow-lg transition-all"
                  >
                    {loginIsLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                  <div className="text-center text-sm text-blue-700">
                    Don't have an account?{' '}
                    <button 
                      onClick={() => setActiveTab("signup")}
                      className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                    >
                      Sign up
                    </button>
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default LoginComponent;