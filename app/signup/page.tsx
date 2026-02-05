// app/signup/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import Link from "next/link"; // Use Link for navigation like in the Header

interface FormValues {
  username: string;
  email: string;
  location: string;
  password: string;
}

export default function SignUpPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validation
  const validationSchema = Yup.object({
    username: Yup.string().min(3, "Min 3 characters").required("Required"),
    email: Yup.string().email("Invalid email").required("Required"),
    location: Yup.string().min(3, "Min 3 characters").required("Required"),
    password: Yup.string().min(8, "Min 8 characters").required("Required"),
  });

  // Submit
  const handleSubmit = async (values: FormValues) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post('https://ecomercebackend-654m.onrender.com/api/auth/register', {
        ...values,
        role: "client",
      });

      if (res.status === 201) {
        router.push('/login');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(
        err.response?.data?.message ||
        'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100">
      <div className="bg-white shadow-2xl shadow-gray-300/60 rounded-3xl w-full max-w-md p-8 sm:p-10 transition-all duration-300 hover:shadow-gray-400/70">
        
        {/* Title and Logo Mockup */}
        <div className="flex flex-col items-center mb-8">
          <Link
            href="/"
            className="flex items-center space-x-2 group mb-4"
          >
             <div className="w-10 h-10 bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="text-gray-900 font-extrabold text-2xl tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Peakbuy
            </span>
            <span className="text-gray-800 text-xl font-black ml-0.5">.</span>
          </Link>
          <h1 className="text-3xl font-extrabold text-gray-900 text-center">
            Create Your Account 🚀
          </h1>
          <p className="text-sm text-gray-500 mt-1">Join the premium shopping experience.</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200">
            <strong className="font-semibold">Error:</strong> {error}
          </div>
        )}

        {/* Form */}
        <Formik
          initialValues={{
            username: "",
            email: "",
            location: "",
            password: "",
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isValid }) => (
            <Form className="space-y-6">
              
              {/* Username */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Username</label>
                <Field
                  name="username"
                  type="text"
                  placeholder="Your full name"
                  className="mt-1 block w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-gray-700 transition-all duration-300 shadow-sm placeholder-gray-400"
                />
                <ErrorMessage
                  name="username"
                  component="div"
                  className="text-red-500 text-xs mt-1"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                <Field
                  name="email"
                  type="email"
                  placeholder="you@peakbuy.com"
                  className="mt-1 block w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-gray-700 transition-all duration-300 shadow-sm placeholder-gray-400"
                />
                <ErrorMessage
                  name="email"
                  component="div"
                  className="text-red-500 text-xs mt-1"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Location</label>
                <Field
                  name="location"
                  type="text"
                  placeholder="e.g., New York, USA"
                  className="mt-1 block w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-gray-700 transition-all duration-300 shadow-sm placeholder-gray-400"
                />
                <ErrorMessage
                  name="location"
                  component="div"
                  className="text-red-500 text-xs mt-1"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                <Field
                  name="password"
                  type="password"
                  placeholder="•••••••• (Min 8 characters)"
                  className="mt-1 block w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-gray-700 transition-all duration-300 shadow-sm placeholder-gray-400"
                />
                <ErrorMessage
                  name="password"
                  component="div"
                  className="text-red-500 text-xs mt-1"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!isValid || loading}
                className="w-full bg-gray-800 text-white py-3 rounded-xl font-bold text-base tracking-wide hover:bg-gray-700 transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg shadow-gray-400/50 hover:shadow-xl hover:shadow-gray-500/50"
              >
                {loading ? "Creating Account..." : "Sign Up"}
              </button>
            </Form>
          )}
        </Formik>

        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-gray-800 hover:text-gray-600 hover:underline font-semibold transition-colors duration-300"
          >
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}