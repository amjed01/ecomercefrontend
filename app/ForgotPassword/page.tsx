"use client";

import React, { useState, useRef, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as yup from "yup";
import { FaEnvelope, FaArrowLeft, FaKey, FaCheck, FaLock, FaRedo } from "react-icons/fa";
import axios from "axios";

// ==================== MAIN COMPONENT ====================
const ForgotPassword = () => {
  const [step, setStep] = useState<"email" | "code" | "reset">("email");
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");

  // ==================== STEP 1: Email Form Component ====================
  const ForgotPasswordEmail = ({ onEmailSent }: { onEmailSent: (email: string) => void }) => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleSubmit = async (values: { email: string }) => {
      setLoading(true);
      setMessage("");
      
      try {
        const response = await axios.post(
          "https://ecomercebackend-654m.onrender.com/api/auth/forgot-password",
          { email: values.email }
        );

        if (response.data.success) {
          setMessage("Verification code sent to your email");
          setTimeout(() => {
            onEmailSent(values.email);
          }, 1500);
        } else {
          setMessage(response.data.message || "Failed to send code");
        }
      } catch (error: any) {
        setMessage(error.response?.data?.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    return (
      <div>
        <div className="mb-6 text-center">
          <h3 className="text-xl font-bold text-gray-900">Reset Your Password</h3>
          <p className="text-gray-600 mt-2">Enter your email to receive a verification code</p>
        </div>

        {message && (
          <div className={`p-3 rounded-lg mb-4 ${message.includes("sent") ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
            {message}
          </div>
        )}

        <Formik
          initialValues={{ email: "" }}
          validationSchema={yup.object({
            email: yup.string().email("Invalid email").required("Email is required")
          })}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, isValid }) => (
            <Form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Field
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <ErrorMessage 
                  name="email" 
                  component="div" 
                  className="text-red-500 text-sm mt-1" 
                />
              </div>

              <button
                type="submit"
                disabled={!isValid || loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-3 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending Code...
                  </>
                ) : "Send Verification Code"}
              </button>

              <a
                href="/login"
                className="flex items-center justify-center text-gray-600 hover:text-gray-800 mt-4"
              >
                <FaArrowLeft className="mr-2" /> Back to Login
              </a>
            </Form>
          )}
        </Formik>
      </div>
    );
  };

  // ==================== STEP 2: Code Verification Component ====================
  const VerifyCode = ({ email, onVerified }: { 
    email: string; 
    onVerified: (token: string) => void 
  }) => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [code, setCode] = useState(["", "", "", "", "", ""]);
    const [countdown, setCountdown] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
      // Initialize the ref array
      inputsRef.current = inputsRef.current.slice(0, 6);
    }, []);

    useEffect(() => {
      if (inputsRef.current[0]) {
        inputsRef.current[0]?.focus();
      }
      
      // Start countdown timer
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }, []);

    const handleChange = (index: number, value: string) => {
      if (value.length > 1) return;
      
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      // Auto-focus next input
      if (value && index < 5) {
        inputsRef.current[index + 1]?.focus();
      }

      // Auto-submit if all fields filled
      if (newCode.every(digit => digit !== "") && index === 5) {
        handleVerify();
      }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
      if (e.key === "Backspace" && !code[index] && index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
    };

    const handleVerify = async () => {
      const verificationCode = code.join("");
      if (verificationCode.length !== 6) {
        setMessage("Please enter the 6-digit code");
        return;
      }

      setLoading(true);
      setMessage("");
      
      try {
        const response = await axios.post(
          "https://ecomercebackend-654m.onrender.com/api/auth/verify-reset-code",
          { email, code: verificationCode }
        );

        if (response.data.success) {
          setMessage("Code verified successfully!");
          setTimeout(() => {
            onVerified(response.data.resetToken);
          }, 1000);
        } else {
          setMessage(response.data.message || "Invalid code");
          // Clear code on error
          setCode(["", "", "", "", "", ""]);
          inputsRef.current[0]?.focus();
        }
      } catch (error: any) {
        setMessage(error.response?.data?.message || "Verification failed");
      } finally {
        setLoading(false);
      }
    };

    const resendCode = async () => {
      setLoading(true);
      setCanResend(false);
      setCountdown(60);
      
      try {
        const response = await axios.post(
          "https://ecomercebackend-654m.onrender.com/api/auth/forgot-password",
          { email }
        );
        setMessage("New code sent to your email");
        
        // Restart countdown
        const timer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              setCanResend(true);
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } catch (error) {
        setMessage("Failed to resend code");
        setCanResend(true);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div>
        <div className="mb-6 text-center">
          <FaKey className="h-12 w-12 text-blue-600 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-gray-900">Enter Verification Code</h3>
          <p className="text-gray-600 mt-2">
            We sent a 6-digit code to <span className="font-semibold">{email}</span>
          </p>
        </div>

        {message && (
          <div className={`p-3 rounded-lg mb-4 ${
            message.includes("success") 
              ? "bg-green-100 text-green-800" 
              : "bg-yellow-100 text-yellow-800"
          }`}>
            {message}
          </div>
        )}

        <div className="mb-6">
          <div className="flex justify-between gap-2 mb-4">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputsRef.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-12 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            ))}
          </div>
          
          <p className="text-sm text-gray-500 text-center">
            Didn't receive the code?{" "}
            <button
              type="button"
              onClick={resendCode}
              disabled={!canResend || loading}
              className="text-blue-600 hover:text-blue-800 disabled:text-gray-400"
            >
              {canResend ? (
                <>
                  <FaRedo className="inline mr-1" /> Resend code
                </>
              ) : (
                `Resend in ${countdown}s`
              )}
            </button>
          </p>
        </div>

        <button
          onClick={handleVerify}
          disabled={loading || code.some(digit => digit === "")}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Verifying...
            </>
          ) : (
            <>
              <FaCheck className="mr-2" /> Verify Code
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => setStep("email")}
          className="w-full text-gray-600 hover:text-gray-800 mt-4 flex items-center justify-center"
        >
          <FaArrowLeft className="mr-2" /> Use different email
        </button>
      </div>
    );
  };

  // ==================== STEP 3: Reset Password Component ====================
  const ResetPasswordForm = ({ token }: { token: string }) => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [success, setSuccess] = useState(false);

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
            window.location.href = "/login";
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
          {({ isSubmitting, isValid }) => (
            <Form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Field
                    type="password"
                    name="newPassword"
                    placeholder="Enter new password"
                    className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <ErrorMessage 
                  name="newPassword" 
                  component="div" 
                  className="text-red-500 text-sm mt-1" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Field
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm new password"
                    className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <ErrorMessage 
                  name="confirmPassword" 
                  component="div" 
                  className="text-red-500 text-sm mt-1" 
                />
              </div>

              <div className="text-sm text-gray-600 mt-2">
                <p>• At least 8 characters</p>
                <p>• Use a mix of letters, numbers, and symbols</p>
              </div>

              <button
                type="submit"
                disabled={!isValid || loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center mt-4"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Resetting...
                  </>
                ) : (
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
            </Form>
          )}
        </Formik>
      </div>
    );
  };

  // ==================== MAIN RENDER ====================
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md border border-gray-100">
        {step === "email" && (
          <ForgotPasswordEmail 
            onEmailSent={(email) => {
              setEmail(email);
              setStep("code");
            }} 
          />
        )}
        
        {step === "code" && (
          <VerifyCode 
            email={email}
            onVerified={(token) => {
              setResetToken(token);
              setStep("reset");
            }}
          />
        )}
        
        {step === "reset" && (
          <ResetPasswordForm token={resetToken} />
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;