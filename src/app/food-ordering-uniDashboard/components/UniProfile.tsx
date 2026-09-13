"use client";

import React, { useState, useEffect, useRef } from 'react';
import styles from '../styles/UniProfile.module.scss';
import { Camera, Plus, Upload } from 'lucide-react';
import Image from 'next/image';
import { toast, ToastContainer } from 'react-toastify';
import CustomDropdown from './CustomDropdown';
import 'react-toastify/dist/ReactToastify.css';
import api from "@/utils/apiUtils";



interface CategoryImage {
    name: string;
    image: string;
}

interface UniProfileData {
    _id: string;
    fullName: string;
    email: string;
    phone: string;
    retailImage: string;
    produceImage: string;
    categoryImages: CategoryImage[];
    packingCharge: number;
    deliveryCharge: number;
}

const UniProfile = () => {
    const [profileData, setProfileData] = useState<UniProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // File inputs
    const retailInputRef = useRef<HTMLInputElement>(null);
    const produceInputRef = useRef<HTMLInputElement>(null);
    const kindImageInputRef = useRef<HTMLInputElement>(null);

    // New Category Image State
    const [selectedItemType, setSelectedItemType] = useState<"retail" | "produce" | "">("");
    const [newKindName, setNewKindName] = useState("");
    const [newKindImage, setNewKindImage] = useState<File | null>(null);
    const [newKindPreview, setNewKindPreview] = useState<string | null>(null);

    const [availableRetailCategories, setAvailableRetailCategories] = useState<string[]>([]);
    const [availableProduceCategories, setAvailableProduceCategories] = useState<string[]>([]);

    // Determine which category array to show based on the first dropdown
    const currentCategories = selectedItemType === "retail"
        ? availableRetailCategories
        : (selectedItemType === "produce" ? availableProduceCategories : []);

    useEffect(() => {
        fetchProfile();
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const uniId = localStorage.getItem('uniId');
            if (!uniId) return;

            const [retailRes, produceRes] = await Promise.all([
                api.get(`/api/item/retail/uni/${uniId}?limit=1000`),
                api.get(`/api/item/produce/uni/${uniId}?limit=1000`),
            ]);

            const retailData = retailRes.data;
            const produceData = produceRes.data;

            const retailItems = retailData.items || [];
            const produceItems = produceData.items || [];

            const retailStrategies = new Set<string>();
            const produceStrategies = new Set<string>();

            // Extract unique types (categories) separately
            retailItems.forEach((item: Record<string, unknown>) => {
                if (typeof item.type === 'string') retailStrategies.add(item.type);
            });
            produceItems.forEach((item: Record<string, unknown>) => {
                if (typeof item.type === 'string') produceStrategies.add(item.type);
            });

            setAvailableRetailCategories(Array.from(retailStrategies).sort());
            setAvailableProduceCategories(Array.from(produceStrategies).sort());
        } catch (error) {
            console.error("Error fetching categories:", error);
            // Don't show toast for this background fetch, just log it
        }
    };

    const fetchProfile = async () => {
        try {
            const uniId = localStorage.getItem('uniId');
            const token = null;

            if (!uniId || !token) {
                toast.error("Authentication failed. Please login again.");
                return;
            }

            // We need to fetch basic info + images. 
            // Existing /api/uni/auth/user gives basic info. 
            // But we added images to Uni model. We might need a generic GET or use the user auth one if it returns everything.
            // Let's check if we can get the full uni object. 
            // For now, let's assume we can fetch from a new endpoint or the auth endpoint returns updated fields.
            // Actually, let's assume we use /api/university/charges/:uniId for charges and maybe a new GET for profile?
            // Or we can just use the PUT response to refresh.
            // Let's try to fetch user details first.

            const response = await api.get("/api/uni/auth/user");

            if (response.status === 200) {
                const profileRes = await api.get(`/api/university/${uniId}/profile`);

                if (profileRes.status === 200) {
                    const data = profileRes.data;
                    setProfileData(data);
                } else {
                    toast.error("Failed to fetch profile details");
                }
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
            toast.error("Error loading profile");
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (type: 'retail' | 'produce', file: File) => {
        if (!profileData) return;

        // Optimistic UI update
        const reader = new FileReader();
        reader.onload = (e) => {
            setProfileData(prev => prev ? ({
                ...prev,
                [`${type}Image`]: e.target?.result as string
            }) : null);
        };
        reader.readAsDataURL(file);

        // Upload to server
        const formData = new FormData();
        formData.append(`${type}Image`, file);

        try {
            setSaving(true);
            const uniId = localStorage.getItem('uniId');
            const response = await api.put(`/api/university/${uniId}/profile`, formData);

            if (response.status === 200) {
                toast.success(`${type === 'retail' ? 'Retail' : 'Produce'} image updated!`);
                const result = response.data;
                // Update with server URL
                setProfileData(prev => prev ? ({
                    ...prev,
                    retailImage: result.university.retailImage,
                    produceImage: result.university.produceImage
                }) : null);
            } else {
                toast.error("Failed to upload image");
                fetchProfile(); // Revert
            }
        } catch (error) {
            console.error(error);
            toast.error("Error uploading image");
            fetchProfile(); // Revert
        } finally {
            setSaving(false);
        }
    };

    const handleKindImageUpload = async () => {
        if (!selectedItemType || !newKindName || !newKindImage) {
            toast.warning("Please provide Section Type, Category Name, and Image");
            return;
        }

        try {
            setSaving(true);
            const uniId = localStorage.getItem('uniId');
            const formData = new FormData();

            // NOTE: The backend API currently accepts `name` and `image` and dumps them 
            // directly into the `categoryImages` array on the university record. The user 
            // is requesting a logic split before upload (Retail vs Produce) but the 
            // University Model `categoryImages` has no schema field for 'sectionType'.
            // To preserve functionality, we will prepend the Section Type to the name 
            // if we need to track it, e.g. "Produce - Fruits", or we can just send the category.
            // Sending the unmodified name aligns with existing schema.

            formData.append('name', newKindName);
            formData.append('image', newKindImage);

            const response = await api.put(`/api/university/${uniId}/category-images`, formData);

            if (response.status === 200) {
                const result = response.data;
                toast.success("Category image saved!");
                setProfileData(prev => prev ? ({
                    ...prev,
                    categoryImages: result.categoryImages
                }) : null);
                setNewKindName("");
                setNewKindImage(null);
                setNewKindPreview(null);
            } else {
                toast.error("Failed to save category image");
            }
        } catch (e) {
            console.error(e);
            toast.error("Error saving category image");
        } finally {
            setSaving(false);
        }
    };


    if (loading) return <div className={styles.loading}>Loading Profile...</div>;
    if (!profileData) return <div className={styles.error}>Profile not found</div>;

    return (
        <div className={styles.profileContainer}>
            <ToastContainer position="bottom-right" />
            <h2 className={styles.pageTitle}>University Profile & Settings</h2>

            <div className={styles.grid}>

                {/* Main Category Images Card */}
                <div className={styles.card}>
                    <h3 className={styles.cardTitle}>Main Category Images</h3>

                    <div className={styles.imageUploadSection}>
                        <label>Retail Cover Image</label>
                        <div className={styles.imagePreview} onClick={() => retailInputRef.current?.click()}>
                            {profileData.retailImage ? (
                                <Image src={profileData.retailImage} alt="Retail" fill style={{ objectFit: 'cover' }} />
                            ) : (
                                <div className={styles.placeholder}><Camera size={30} /> Upload Retail Image</div>
                            )}
                            <input
                                type="file"
                                hidden
                                ref={retailInputRef}
                                accept="image/*"
                                onChange={(e) => e.target.files?.[0] && handleImageUpload('retail', e.target.files[0])}
                            />
                        </div>
                    </div>

                    <div className={styles.imageUploadSection}>
                        <label>Produce Cover Image</label>
                        <div className={styles.imagePreview} onClick={() => produceInputRef.current?.click()}>
                            {profileData.produceImage ? (
                                <Image src={profileData.produceImage} alt="Produce" fill style={{ objectFit: 'cover' }} />
                            ) : (
                                <div className={styles.placeholder}><Camera size={30} /> Upload Produce Image</div>
                            )}
                            <input
                                type="file"
                                hidden
                                ref={produceInputRef}
                                accept="image/*"
                                onChange={(e) => e.target.files?.[0] && handleImageUpload('produce', e.target.files[0])}
                            />
                        </div>
                    </div>
                </div>

                {/* Kind/Category Specific Images Card */}
                <div className={`${styles.card} ${styles.fullWidthCard}`}>
                    <h3 className={styles.cardTitle}>Food Category Images</h3>
                    <p className={styles.helperText}>Upload images for specific food categories (e.g. Pizza, Burger, Fruits)</p>

                    <div className={styles.addKindForm}>
                        <div className={styles.formInputs}>
                            <CustomDropdown
                                value={selectedItemType}
                                options={[
                                    { label: 'Retail', value: 'retail' },
                                    { label: 'Produce', value: 'produce' }
                                ]}
                                onChange={(val) => {
                                    setSelectedItemType(val as "retail" | "produce" | "");
                                    setNewKindName(""); // reset category on type change
                                }}
                                placeholder="Select Section Type"
                            />

                            <CustomDropdown
                                value={newKindName}
                                options={currentCategories.map(cat => ({ label: cat, value: cat }))}
                                onChange={(val) => setNewKindName(val)}
                                placeholder={selectedItemType ? "Select Category" : "Choose Section First"}
                                disabled={!selectedItemType}
                            />
                        </div>

                        <div className={styles.actionGroup}>
                            <div className={styles.miniUpload} onClick={() => kindImageInputRef.current?.click()}>
                                {newKindPreview ? (
                                    <Image src={newKindPreview} alt="Preview" width={48} height={48} style={{ objectFit: 'cover', borderRadius: '12px' }} />
                                ) : (
                                    <Upload size={20} />
                                )}
                            </div>
                            <input
                                type="file"
                                hidden
                                ref={kindImageInputRef}
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        setNewKindImage(file);
                                        setNewKindPreview(URL.createObjectURL(file));
                                    }
                                }}
                            />
                            <button
                                className={styles.addBtn}
                                onClick={handleKindImageUpload}
                                disabled={!selectedItemType || !newKindName || !newKindImage || saving}
                            >
                                <Plus size={18} />
                            </button>
                        </div>
                    </div>

                    <div className={styles.kindsList}>
                        {profileData.categoryImages?.map((item, idx) => (
                            <div key={idx} className={styles.kindItem}>
                                <Image src={item.image} alt={item.name} width={40} height={40} className={styles.kindImg} />
                                <span>{item.name}</span>
                            </div>
                        ))}
                        {(!profileData.categoryImages || profileData.categoryImages.length === 0) && (
                            <p className={styles.emptyText}>No category images added yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UniProfile;
