"use client";

import React, { useState, useEffect } from "react";
import { Formik } from "formik";
import * as yup from "yup";
import { FaLock, FaCheck, FaArrowLeft } from "react-icons/fa";
import axios from "axios";
import { useSearchParams, useRouter } from "next/navigation";

const ResetPasswordForm = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [isValidToken, setIsValidToken] = useState(true);

  useEffect(() => {
    if (!token) {
      setMessage("Invalid or expired reset link. Please request a new password reset.");
      setIsValidToken(false);
    }
  }, [token]);

  const handleSubmit = async (values: { 
    newPassword: string; 
    confirmPassword: string 
  }) => {
    setLoading(true);
    setMessage("");
    
    try {
      const response = await axios.post(
        "https://ecomercebackend-654m.onrender.com/api/auth/reset-password",
        { 
          token: token,
          newPassword: values.newPassword 
        }
      );

      if (response.data.success) {
        setSuccess(true);
        setMessage("Password reset successfully! Redirecting to login...");
        
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setMessage(response.data.message || "Failed to reset password");
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  if (!isValidToken) {
    return (
      <div className="text-center py-8">
        <div className="h-16 w-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <FaLock size={32} />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Invalid Reset Link</h3>
        <p className="text-gray-600 mb-4">{message}</p>
        <a
          href="/forgot-password"
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          Request a new reset link
        </a>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <FaCheck size={32} />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Password Reset Successful!</h3>
        <p className="text-gray-600">{message}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <h3 className="text-xl font-bold text-gray-900">Create New Password</h3>
        <p className="text-gray-600 mt-2">Enter your new password below</p>
      </div>

      {message && (
        <div className={`p-3 rounded-lg mb-4 ${
          message.includes("success") 
            ? "bg-green-100 text-green-800" 
            : "bg-red-100 text-red-800"
        }`}>
          {message}
        </div>
      )}

      <Formik
        initialValues={{ newPassword: "", confirmPassword: "" }}
        validationSchema={yup.object({
          newPassword: yup.string()
            .min(8, "Password must be at least 8 characters")
            .required("Password is required"),
          confirmPassword: yup.string()
            .oneOf([yup.ref('newPassword'), undefined], "Passwords must match")
            .required("Please confirm your password")
        })}
        onSubmit={handleSubmit}
      >
        {({ handleChange, handleBlur, touched, handleSubmit, values, errors, isValid }) => (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  name="newPassword"
                  placeholder="Enter new password"
                  value={values.newPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {touched.newPassword && errors.newPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.newPassword}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm new password"
                  value={values.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {touched.confirmPassword && errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            <div className="text-sm text-gray-600 mt-2">
              <p>• At least 8 characters</p>
              <p>• Use a mix of letters, numbers, and symbols</p>
            </div>

            <button
              type="submit"
              disabled={!isValid || loading || !token}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center mt-4"
            >
              {loading ? "Resetting..." : (
                <>
                  <FaCheck className="mr-2" /> Reset Password
                </>
              )}
            </button>

            <a
              href="/login"
              className="flex items-center justify-center text-gray-600 hover:text-gray-800 mt-4"
            >
              <FaArrowLeft className="mr-2" /> Back to Login
            </a>
          </form>
        )}
      </Formik>
    </div>
  );
};

export default ResetPasswordForm;