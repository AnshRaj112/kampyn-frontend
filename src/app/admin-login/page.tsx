'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import dynamic from 'next/dynamic';
import { UniTransitionOverlay } from '../components/shared/Skeleton/UniTransitionOverlay';
import styles from "../uni-login/styles/login.module.scss"; // Reuse uni-login styles
import api from '@/utils/apiUtils';

// Lazy load ToastContainer
const ToastContainer = dynamic(
    () => import("react-toastify").then((mod) => mod.ToastContainer),
    { ssr: false }
);

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function AdminLoginPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await api.post('/api/admin/auth/login', formData);
            const json = res.data;

            if (res.status === 200) {
                if (json) {
                    toast.success('Login successful!');
                    setIsRedirecting(true);
                    setTimeout(() => {
                        router.push('/admin-dashboard');
                    }, 1500);
                }
            } else {
                toast.error(json.message || 'Login failed');
            }
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || 'Invalid credentials or network error.');
        } finally {
            if (!isRedirecting) {
                setIsLoading(false);
            }
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.authWrapper}>
                <div className={styles.msg}>Welcome Back</div>
                <div className={styles.box}>
                    <h1>Admin Login</h1>
                    <form onSubmit={handleSubmit}>
                        <div className={styles.fieldGroup}>
                            <label htmlFor="email">Admin Email</label>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                placeholder="Enter your admin email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className={styles.passwordField}>
                            <label htmlFor="password">Password</label>
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                name="password"
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={handleInputChange}
                                required
                            />
                            <span
                                className={styles.eyeIcon}
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <FaEye /> : <FaEyeSlash />}
                            </span>
                        </div>

                        <button type="submit" disabled={isLoading}>
                            {isLoading ? "Logging in..." : "Login to Dashboard"}
                            {!isLoading && <span className={styles.buttonArrow}>→</span>}
                        </button>
                    </form>
                </div>

                <div className={styles.infoPanel}>
                    <div className={styles.badge}>Secure Access</div>
                    <h2 className={styles.heading}>
                        Login to the{" "}
                        <span className={styles.highlight}>Admin Dashboard</span>
                    </h2>
                    <p className={styles.subtext}>
                        Authenticating your session to provide secure access to KAMPYN&apos;s administrative tools and system configurations.
                    </p>
                    <div className={styles.infoList}>
                        <p className={styles.infoItem}>• Verify system health</p>
                        <p className={styles.infoItem}>• Audit logs and security</p>
                        <p className={styles.infoItem}>• Manage university partners</p>
                    </div>
                </div>
            </div>

            <ToastContainer />
            {isRedirecting && <UniTransitionOverlay />}
        </div>
    );
}
