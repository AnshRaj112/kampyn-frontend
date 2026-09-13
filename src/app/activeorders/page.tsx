"use client";
import React, { useState, useEffect, Suspense } from "react";
import styles from "./styles/activeorder.module.scss";
import api from "@/utils/apiUtils";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import 'react-toastify/dist/ReactToastify.css';
import PageLoading from "../components/layout/PageLoading/PageLoading";
import OrderListView from "../components/order/OrderListView";
import { BaseOrder, College, User } from "../components/order/orderTypes";
import useCollegeFilter from "../components/order/useCollegeFilter";
import OrderPageLayout from "../components/order/OrderPageLayout";



type ActiveOrder = BaseOrder;


const ActiveOrdersPageContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [colleges, setColleges] = useState<College[]>([]);
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { isDropdownOpen, setIsDropdownOpen, selectedCollege, dropdownRef, handleCollegeSelect } =
    useCollegeFilter({ searchParams, colleges });

  // Fetch user details
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const token = null;
        if (!token) {
          router.push("/login");
          return;
        }

        const response = await api.get("/api/user/auth/user");
        setUser(response.data);
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          router.push("/login");
        } else {
          console.error("Error fetching user details:", error);
        }
      }
    };
    fetchUserDetails();
  }, [router]);

  // Fetch colleges list
  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const response = await api.get("/api/user/auth/list");
        setColleges(response.data);
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          router.push("/login");
        } else {
          console.error("Error fetching colleges:", error);
        }
      }
    };
    fetchColleges();
  }, [router]);

  // Fetch active orders based on selected college
  useEffect(() => {
    const fetchActiveOrders = async () => {
      if (!user?._id) return;

      try {
        setLoading(true);
        const url = selectedCollege
          ? `/order/user-active/${user._id}?collegeId=${selectedCollege._id}`
          : `/order/user-active/${user._id}`;

        const response = await api.get(url);
        console.log('Active orders response:', response.data);
        setActiveOrders(response.data.orders || []);
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          router.push("/login");
        } else {
          console.error("Error fetching active orders:", error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchActiveOrders();
  }, [user?._id, selectedCollege, router]);

  return (
    <OrderPageLayout
      title="Your Active Orders"
      subtitle="Your Active Orders"
      styles={styles}
      isDropdownOpen={isDropdownOpen}
      selectedCollege={selectedCollege}
      colleges={colleges}
      dropdownRef={dropdownRef}
      onToggleDropdown={() => setIsDropdownOpen(!isDropdownOpen)}
      onSelectCollege={handleCollegeSelect}
    >
      <OrderListView
        orders={activeOrders}
        loading={loading}
        emptyTitle="No active orders found"
        emptyDescription="You don't have any active orders at the moment. Start ordering to see your active orders here!"
        onGoHome={() => router.push("/")}
        styles={styles}
      />
    </OrderPageLayout>
  );
};

const ActiveOrdersPage: React.FC = () => {
  return (
    <Suspense
      fallback={
        <PageLoading message="Loading your active orders…" />
      }
    >
      <ActiveOrdersPageContent />
    </Suspense>
  );
};

export default ActiveOrdersPage; 