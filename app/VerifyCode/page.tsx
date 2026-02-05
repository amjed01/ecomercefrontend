export const dynamic = "force-dynamic";

"use client";

import React, { useState, useRef, useEffect } from "react";
import { FaKey, FaArrowLeft, FaCheck } from "react-icons/fa";
import axios from "axios";
import { useSearchParams, useRouter } from "next/navigation";

const VerifyCode = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") || "";
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) {
      router.push("/forgot-password");
      return;
    }
    
    if (inputsRef.current[0]) {
      inputsRef.current[0]?.focus();
    }
  }, [email, router]);

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
        // Redirect to reset password page with token
        setTimeout(() => {
          router.push(`/reset-password?token=${response.data.resetToken}`);
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
    try {
      const response = await axios.post(
        "https://ecomercebackend-654m.onrender.com/api/auth/forgot-password",
        { email }
      );
      setMessage("New code sent to your email");
    } catch (error) {
      setMessage("Failed to resend code");
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="text-center py-8">
        <div className="h-16 w-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <FaKey size={32} />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Email Required</h3>
        <p className="text-gray-600 mb-4">Please request a password reset first.</p>
        <a
          href="/forgot-password"
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          Go to Forgot Password
        </a>
      </div>
    );
  }

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
            disabled={loading}
            className="text-blue-600 hover:text-blue-800 disabled:text-gray-400"
          >
            Resend code
          </button>
        </p>
      </div>

      <button
        onClick={handleVerify}
        disabled={loading || code.some(digit => digit === "")}
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center"
      >
        {loading ? "Verifying..." : (
          <>
            <FaCheck className="mr-2" /> Verify Code
          </>
        )}
      </button>

      <button
        type="button"
        onClick={() => router.push("/forgot-password")}
        className="w-full text-gray-600 hover:text-gray-800 mt-4 flex items-center justify-center"
      >
        <FaArrowLeft className="mr-2" /> Use different email
      </button>
    </div>
  );
};

export default VerifyCode;