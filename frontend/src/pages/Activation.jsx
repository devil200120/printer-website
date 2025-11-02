import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../config/api";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { FiCheckCircle, FiXCircle, FiArrowLeft } from "react-icons/fi";
import toast from "react-hot-toast";

const Activation = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const activateAccount = async () => {
      try {
        setLoading(true);
        const response = await api.post("/user/activation", {
          activation_token: token,
        });

        if (response.data.success) {
          setSuccess(true);
          toast.success("Account activated successfully!");
          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate("/login");
          }, 3000);
        }
      } catch (err) {
        console.error("Activation error:", err);
        setError(
          err.response?.data?.message ||
            "Failed to activate account. The link may be expired or invalid."
        );
        toast.error("Account activation failed");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      activateAccount();
    } else {
      setError("Invalid activation link");
      setLoading(false);
    }
  }, [token, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">
            Activating your account...
          </h2>
          <p className="text-gray-600 mt-2">
            Please wait while we verify your account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          {success ? (
            <>
              {/* Success State */}
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <FiCheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Account Activated!
              </h2>
              <p className="text-gray-600 mb-6">
                Your account has been successfully activated. You can now sign
                in to your account.
              </p>
              <div className="space-y-3">
                <Link
                  to="/login"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors inline-block"
                >
                  Sign In Now
                </Link>
                <p className="text-sm text-gray-500">
                  Redirecting to login page in 3 seconds...
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Error State */}
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <FiXCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Activation Failed
              </h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="space-y-3">
                <Link
                  to="/register"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors inline-block"
                >
                  Register Again
                </Link>
                <Link
                  to="/login"
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center"
                >
                  <FiArrowLeft className="w-4 h-4 mr-2" />
                  Back to Login
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-500">
            © 2025 Token Management System. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Activation;
