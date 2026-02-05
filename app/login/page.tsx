// components/LoginPage.tsx
"use client";

import React, { useState } from "react";
import { Formik } from "formik";
import * as yup from "yup";
import {
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaUserTie,
  FaMagic,
} from "react-icons/fa";
import axios from "axios";

const validationSchema = yup.object({
  email: yup
    .string()
    .email("Provide a valid email address")
    .required("Email is required"),
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
});

const LoginPage: React.FC = () => {
  const [loader, setLoader] = useState(false);
  const [obscureText, setObscureText] = useState(true);

  // Default seller credentials
  const defaultSeller = {
    email: "seller@peakbuy.com",
    password: "seller1234",
  };

  const handleLogin = async (values: { email: string; password: string }) => {
    setLoader(true);
    try {
      // Check if it's the default seller
      if (
        values.email === defaultSeller.email &&
        values.password === defaultSeller.password
      ) {
        // Create mock seller data
        const mockSellerData = {
          token: "default_seller_token_" + Date.now(),
          _id: "default_seller_id",
          email: defaultSeller.email,
          role: "seller",
          store: {
            id: "default_store_id",
            name: "Peakbuy Default Store",
            description: "Welcome to our default seller store",
            isActive: true,
            createdAt: new Date().toISOString(),
          },
        };

        // Store in localStorage for web
        localStorage.setItem("authToken", mockSellerData.token);
        localStorage.setItem("userId", mockSellerData._id);
        localStorage.setItem("userData", JSON.stringify(mockSellerData));
        localStorage.setItem("userRole", mockSellerData.role);
        localStorage.setItem("storeData", JSON.stringify(mockSellerData.store));

        // Redirect to seller dashboard
        window.location.href = "/seller/dashboard";
        return;
      }

      // Regular login flow for other users
      const endpoint = "https://ecomercebackend-654m.onrender.com/api/auth/login";
      const response = await axios.post(endpoint, {
        email: values.email,
        password: values.password,
      });

      if (response.data.token) {
        // Store in localStorage for web
        localStorage.setItem("authToken", response.data.token);
        localStorage.setItem("userId", response.data._id);
        localStorage.setItem("userData", JSON.stringify(response.data));
        localStorage.setItem("userRole", response.data.role || "client");

        if (response.data.role === "seller" && response.data.store) {
          localStorage.setItem("storeData", JSON.stringify(response.data.store));
        }

        // Redirect based on role
        window.location.href =
          response.data.role === "seller" ? "/seller/dashboard" : "/";
      } else {
        throw new Error("Authentication failed: No token received");
      }
    } catch (error: any) {
      let errorMessage = "An error occurred during login";
      if (error.response) {
        switch (error.response.status) {
          case 401:
            errorMessage = "Invalid email or password";
            break;
          case 404:
            errorMessage = "Server endpoint not found";
            break;
          default:
            errorMessage = error.response.data?.message || errorMessage;
        }
      } else if (error.request) {
        errorMessage = "No response from server. Check your connection.";
      }
      alert(errorMessage);
    } finally {
      setLoader(false);
    }
  };

  const fillDefaultSeller = (setFieldValue: any) => {
    setFieldValue("email", defaultSeller.email);
    setFieldValue("password", defaultSeller.password);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100/50 [background-image:radial-gradient(ellipse_at_top,_var(--tw-color-gray-50)_0%,_var(--tw-color-gray-200)_100%)]">
      <div className="bg-white/90 backdrop-blur-sm shadow-2xl shadow-gray-500/10 border border-gray-100 rounded-3xl p-8 sm:p-12 w-full max-w-md transform transition-all duration-500 hover:shadow-gray-500/20">
        <div className="flex flex-col items-center mb-8">
          <FaUserTie className="h-10 w-10 text-gray-800 mb-3" />
          <h2 className="text-3xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-700 tracking-tight">
            Sign In to Peakbuy
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            Access your premium shopping experience
          </p>
        </div>

      
        
        <Formik
          initialValues={{ email: "", password: "" }}
          validationSchema={validationSchema}
          onSubmit={handleLogin}
        >
          {({
            handleChange,
            handleBlur,
            touched,
            handleSubmit,
            values,
            errors,
            isValid,
            // setFieldValue is not needed here as it's extracted to the button above
          }) => (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email Address
                </label>
                <div className="relative">
                  <FaEnvelope className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={values.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full border-2 rounded-xl pl-12 pr-4 py-3 text-base text-gray-800 transition-all duration-300
                      ${
                        touched.email && errors.email
                          ? "border-red-400"
                          : "border-gray-200 focus:border-gray-700/50 focus:ring-1 focus:ring-gray-700/50"
                      }
                      focus:outline-none shadow-sm hover:shadow-md
                    `}
                  />
                </div>
                {touched.email && errors.email && (
                  <p className="text-red-500 text-xs mt-1.5 font-medium">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Password
                </label>
                <div className="relative">
                  <FaLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    id="password"
                    type={obscureText ? "password" : "text"}
                    name="password"
                    placeholder="••••••••"
                    value={values.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full border-2 rounded-xl pl-12 pr-12 py-3 text-base text-gray-800 transition-all duration-300
                      ${
                        touched.password && errors.password
                          ? "border-red-400"
                          : "border-gray-200 focus:border-gray-700/50 focus:ring-1 focus:ring-gray-700/50"
                      }
                      focus:outline-none shadow-sm hover:shadow-md
                    `}
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setObscureText(!obscureText)}
                  >
                    {obscureText ? <FaEye /> : <FaEyeSlash />}
                  </button>
                </div>
                {touched.password && errors.password && (
                  <p className="text-red-500 text-xs mt-1.5 font-medium">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={!isValid || loader}
                className={`w-full flex items-center justify-center space-x-2 font-bold py-3 rounded-xl text-white tracking-wider uppercase text-sm mt-8 transition-all duration-300 transform
                  ${
                    !isValid || loader
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-gray-800 to-gray-600 hover:from-gray-900 hover:to-gray-700 shadow-xl shadow-gray-700/30 hover:shadow-gray-700/40 hover:scale-[1.01]"
                  }
                `}
              >
                {loader ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Signing In...</span>
                  </>
                ) : (
                  <span>Log In to Your Account</span>
                )}
              </button>

              {/* Sign Up Link */}
              <p className="text-center text-sm text-gray-500 pt-4">
                Don't have an account?{" "}
                <a
                  href="/signup"
                  className="text-gray-800 hover:text-gray-900 hover:underline font-semibold transition-colors"
                >
                  Sign Up Here
                </a>
              </p>
            
<div className="text-center pt-2">
  <a
    href="/ForgotPassword"
    className="text-sm text-gray-600 hover:text-gray-800 hover:underline"
  >
    Forgot your password?
  </a>
</div>
            </form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default LoginPage;