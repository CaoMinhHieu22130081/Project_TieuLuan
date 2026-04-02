import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { userAPI } from "../services/api";

/**
 * OAuth2 Callback Page
 * Backend redirects here after OAuth2 authentication success
 * Query params: ?userId=X&email=Y
 */
export default function OAuth2CallbackPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleOAuth2Callback = async () => {
      try {
        const userId = searchParams.get("userId");
        const email = searchParams.get("email");

        if (!userId || !email) {
          setError("OAuth2 callback parameters missing");
          setLoading(false);
          setTimeout(() => navigate("/login"), 2000);
          return;
        }

        // Call backend endpoint to generate JWT token
        const response = await fetch("http://localhost:8080/api/users/oauth2/callback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId, email }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "OAuth2 callback failed");
        }

        const data = await response.json();

        if (data.token && data.user) {
          // Save token to localStorage và AuthContext
          localStorage.setItem("authToken", data.token);
          
          // Save user info
          localStorage.setItem("userId", data.user.id);
          localStorage.setItem("userEmail", data.user.email);
          localStorage.setItem("userName", data.user.name);
          
          // Save full user object
          localStorage.setItem("userData", JSON.stringify(data.user));
          
          // Save to AuthContext
          login(data.token, data.user);

          setLoading(false);
          
          // Redirect dựa trên role
          const userRole = data.user.role;
          setTimeout(() => {
            if (userRole === "admin") {
              navigate("/admin");
            } else if (userRole === "staff") {
              navigate("/admin/orders");
            } else {
              navigate("/profile");
            }
          }, 1000);
        } else {
          throw new Error("No token or user data received");
        }
      } catch (err) {
        console.error("OAuth2 callback error:", err);
        setError(err.message || "OAuth2 authentication failed");
        setLoading(false);
        
        // Redirect to login after showing error
        setTimeout(() => navigate("/login"), 2000);
      }
    };

    handleOAuth2Callback();
  }, [searchParams, navigate]);

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    }}>
      <div style={{
        background: "white",
        borderRadius: "12px",
        padding: "40px 60px",
        textAlign: "center",
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
        maxWidth: "500px",
      }}>
        {loading ? (
          <>
            <div style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "24px",
            }}>
              <div style={{
                width: "40px",
                height: "40px",
                border: "4px solid #e5e7eb",
                borderTop: "4px solid #667eea",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}></div>
            </div>
            <div style={{ fontSize: "18px", fontWeight: "600", color: "#1f2937" }}>
              Đang xác thực...
            </div>
            <div style={{ fontSize: "14px", color: "#6b7280", marginTop: "12px" }}>
              Vui lòng chờ trong giây lát
            </div>
          </>
        ) : error ? (
          <>
            <div style={{
              fontSize: "48px",
              marginBottom: "16px",
            }}>
              ❌
            </div>
            <div style={{ fontSize: "18px", fontWeight: "600", color: "#dc2626" }}>
              Xác thực thất bại
            </div>
            <div style={{ fontSize: "14px", color: "#6b7280", marginTop: "12px" }}>
              {error}
            </div>
            <div style={{ fontSize: "13px", color: "#9ca3af", marginTop: "20px" }}>
              Đang chuyển hướng về trang đăng nhập...
            </div>
          </>
        ) : (
          <>
            <div style={{
              fontSize: "48px",
              marginBottom: "16px",
            }}>
              ✓
            </div>
            <div style={{ fontSize: "18px", fontWeight: "600", color: "#E91E8C" }}>
              Xác thực thành công!
            </div>
            <div style={{ fontSize: "14px", color: "#6b7280", marginTop: "12px" }}>
              Địa chỉ đang được chuyển hướng...
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
