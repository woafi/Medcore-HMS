"use client";

import Link from "next/link";
import { AlertTriangle, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Content Container */}
        <div className="text-center space-y-8">
          {/* Icon Section */}
          <div className="flex justify-center">
            <div className="relative">
              {/* Animated Background Circle */}
              <div className="absolute inset-0 bg-red-100 dark:bg-red-900/20 rounded-full blur-2xl opacity-50 animate-pulse"></div>
              
              {/* Icon */}
              <div className="relative bg-white dark:bg-slate-900 rounded-full p-8 shadow-lg border border-slate-200 dark:border-slate-800">
                <AlertTriangle className="w-16 h-16 text-red-500" />
              </div>
            </div>
          </div>

          {/* Status Code */}
          <div className="space-y-2">
            <h1 className="text-7xl md:text-8xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              404
            </h1>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Page Not Found
            </p>
          </div>

          {/* Description */}
          <div className="space-y-3 max-w-md mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
              Oops! We couldn&apos;t find what you&apos;re looking for.
            </h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              The page you&apos;re trying to access doesn&apos;t exist or may have been moved. 
              Don&apos;t worry, you can navigate back to the home page or dashboard.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            {/* Back Button */}
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              Go Back
            </button>

            {/* Home Button */}
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl group"
            >
              <Home className="w-5 h-5" />
              Go to Home
            </Link>
          </div>

          {/* Additional Links */}
          <div className="pt-8 border-t border-slate-200 dark:border-slate-800">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Need help? Try these popular pages:
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/doctor"
                className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Doctors
              </Link>
              <Link
                href="/settings"
                className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Settings
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="mt-12 grid grid-cols-3 gap-4 opacity-10">
          <div className="h-32 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl blur-xl"></div>
          <div className="h-32 bg-gradient-to-br from-blue-400 to-cyan-600 rounded-2xl blur-xl"></div>
          <div className="h-32 bg-gradient-to-br from-purple-400 to-pink-600 rounded-2xl blur-xl"></div>
        </div>
      </div>
    </div>
  );
}
