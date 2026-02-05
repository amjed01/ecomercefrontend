"use client";

import React, { useState } from "react";
import { Formik } from "formik";
import * as yup from "yup";
import { FaEnvelope, FaArrowLeft } from "react-icons/fa";
import axios from "axios";

export default function Page() {
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
        // You can redirect here later if you want
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
        <p className="text-gray-600 mt-2">
          Enter your email to receive a verification code
        </p>
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg mb-4 ${
            message.includes("sent")
              ? "bg-green-100 text-green-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {message}
        </div>
      )}

      <Formik
        initialValues={{ email: "" }}
        validationSchema={yup.object({
          email: yup.string().email("Invalid email").required("Email is required"),
        })}
        onSubmit={handleSubmit}
      >
        {({
          handleChange,
          handleBlur,
          touched,
          handleSubmit,
          values,
          errors,
          isValid,
        }) => (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={values.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {touched.email && errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={!isValid || loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {loading ? "Sending Code..." : "Send Verification Code"}
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
}
