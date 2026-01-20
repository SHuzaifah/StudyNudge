import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, Camera, Loader2, Save, Bell, Clock, Globe } from 'lucide-react';

interface ProfilePageProps {
    session: any;
}

export function ProfilePage({ session }: ProfilePageProps) {
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [profile, setProfile] = useState<any>(null);

    // Form State
    const [fullName, setFullName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [checkInTime, setCheckInTime] = useState('09:00');
    const [timezone, setTimezone] = useState('UTC');
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    const downloadImage = async (path: string) => {
        try {
            const { data, error } = await supabase.storage.from('avatars').download(path);
            if (error) {
                throw error;
            }
            const url = URL.createObjectURL(data);
            setAvatarUrl(url);
        } catch (error) {
            console.log('Error downloading image: ', error);
        }
    };

    const setProfileData = (data: any) => {
        setProfile(data);
        setFullName(data.display_name || '');
        setCheckInTime(data.check_in_time || '09:00');
        setTimezone(data.timezone || 'UTC');
        setNotificationsEnabled(data.notifications_enabled ?? true);
        if (data.avatar_url) downloadImage(data.avatar_url);
    };

    const fetchProfileFromDb = async (userId: string) => {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (data) {
            setProfileData(data);
            localStorage.setItem(`profile_${userId}`, JSON.stringify({
                data,
                timestamp: Date.now()
            }));
        }
    };

    const getProfile = async () => {
        try {
            setLoading(true);
            const { user } = session;

            // 1. Check Cache
            const cachedProfile = localStorage.getItem(`profile_${user.id}`);
            let cacheHit = false;

            if (cachedProfile) {
                const { data, timestamp } = JSON.parse(cachedProfile);
                if (Date.now() - timestamp < 1000 * 60 * 60) { // 1 hour TTL
                    setProfileData(data);
                    setLoading(false);
                    cacheHit = true;
                }
            }

            // Always fetch background update or full fetch if no cache
            await fetchProfileFromDb(user.id);
            if (!cacheHit) setLoading(false);
        } catch (error) {
            console.error('Error loading user data!', error);
            setLoading(false);
        }
    };

    // Fetch Profile
    useEffect(() => {
        if (session) {
            getProfile();
        }
    }, [session]);

    const uploadAvatar = async (event: any) => {
        try {
            setUploading(true);

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${session.user.id}/${fileName}`;

            let { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            await updateProfile({ avatar_url: filePath });
            downloadImage(filePath);
        } catch (error) {
            alert('Error uploading avatar!');
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    const updateProfile = async (updates: any) => {
        try {
            setLoading(true);
            const { user } = session;

            const { error } = await supabase.from('user_profiles').upsert({
                id: user.id,
                ...updates,
                updated_at: new Date(),
            });

            if (error) {
                throw error;
            }

            // Refresh local profile state slightly to ensure sync
            if (updates.display_name) setFullName(updates.display_name);
            alert("Profile updated successfully!");

        } catch (error: any) {
            alert(`Error updating the data! ${error.message || error.error_description || JSON.stringify(error)}`);
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAll = () => {
        updateProfile({
            display_name: fullName,
            check_in_time: checkInTime,
            timezone: timezone,
            notifications_enabled: notificationsEnabled
        });
    };

    return (
        <div className="flex justify-center p-6 bg-gray-50 min-h-full overflow-y-auto pb-20 transition-colors">
            <div className="w-full max-w-2xl bg-white rounded-3xl shadow-sm p-8 border border-gray-200 transition-colors">
                <h1 className="text-2xl font-bold text-gray-900 mb-6 tracking-tight">Profile Settings</h1>

                {/* Avatar Section */}
                <div className="flex flex-col items-center mb-8">
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100 mb-4">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                    <User className="w-12 h-12" />
                                </div>
                            )}
                        </div>
                        <label className="absolute bottom-4 right-0 bg-black p-2.5 rounded-full text-white cursor-pointer hover:bg-gray-800 transition-colors shadow-md group-hover:scale-105 border border-white">
                            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                            <input type="file" accept="image/*" onChange={uploadAvatar} disabled={uploading} className="hidden" />
                        </label>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">Basic Info</h2>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none bg-gray-50 text-gray-900 transition-all"
                                placeholder="Your Name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <input
                                type="text"
                                disabled
                                value={session.user.email}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed"
                            />
                        </div>
                    </div>

                    {/* Preferences */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">Preferences</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <Clock className="w-4 h-4 text-gray-400" /> Daily Check-in Time
                                </label>
                                <input
                                    type="time"
                                    value={checkInTime}
                                    onChange={(e) => setCheckInTime(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none bg-gray-50 text-gray-900 transition-all"
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <Globe className="w-4 h-4 text-gray-400" /> Timezone
                                </label>
                                <select
                                    value={timezone}
                                    onChange={(e) => setTimezone(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none bg-gray-50 text-gray-900 transition-all"
                                >
                                    <option value="UTC">UTC (Universal)</option>
                                    <option value="EST">EST (Eastern)</option>
                                    <option value="PST">PST (Pacific)</option>
                                    <option value="IST">IST (India)</option>
                                    {/* Add more as needed */}
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="flex items-center gap-3">
                                <Bell className="w-5 h-5 text-yellow-500" />
                                <div className="flex flex-col">
                                    <span className="font-medium text-gray-900">Notifications</span>
                                    <span className="text-xs text-gray-500">Receive nudges and reminders</span>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={notificationsEnabled}
                                    onChange={(e) => setNotificationsEnabled(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-black/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                            </label>
                        </div>
                    </div>

                    <button
                        onClick={handleSaveAll}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-black text-white px-6 py-3.5 rounded-xl font-medium hover:bg-gray-800 transition-all disabled:opacity-50 mt-6 shadow-lg shadow-black/5 active:scale-[0.98]"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        <Save className="w-4 h-4" />
                        Save All Changes
                    </button>
                </div>

                {/* Account Statistics */}
                <div className="mt-10 pt-10 border-t border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Statistics</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 transition-colors group hover:border-gray-200">
                            <span className="text-sm text-gray-500 font-medium uppercase tracking-wider text-[11px]">Focus Score</span>
                            <div className="text-3xl font-bold text-gray-900 mt-1">{profile?.focus_score || 0}</div>
                        </div>
                        <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 transition-colors group hover:border-gray-200">
                            <span className="text-sm text-gray-500 font-medium uppercase tracking-wider text-[11px]">Current Streak</span>
                            <div className="text-3xl font-bold text-gray-900 mt-1">{profile?.current_streak || 0} <span className="text-xl align-top">🔥</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
