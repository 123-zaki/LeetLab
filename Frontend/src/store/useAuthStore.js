import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast"


export const useAuthStore = create((set) => ({
    authUser: null,
    isSigningUp: false,
    isLogginIn: false,
    isCheckingAuth: null,

    checkAuth: async () => {
        set({ isCheckingAuth: true });
        try {
            const res = await axiosInstance.get("/auth/check");
            console.log("Check auth response: ", res.data);
            set({ authUser: res.data.user });
        } catch (error) {
            console.log("❌ Error checking auth");
            set({ authUser: null });
        }
        finally {
            set({ isCheckingAuth: false });
        }
    },

    login: async (data) => {
        set({ isLogginIn: true });
        try {
            const res = await axiosInstance.post("/auth/login", data);
            set({ authUser: res.data.user });
            toast.success(res.data.message);
        } catch (error) {
            console.log("❌ Error Logging in: ", error);
            toast.error("Error Logging in");
            set({ authUser: null });
        }
        finally {
            set({ isLogginIn: false });
        }
    },

    signup: async (data) => {
        set({ isSigningUp: true });
        try {
            const res = await axiosInstance.post("/auth/register", data);
            set({ authUser: res.data.user });
            toast.success(res.data.message);
        } catch (error) {
            console.log("❌ Error Signing up: ", error);
            set({ authUser: null });
            toast.error("Error Signing up");
        }
        finally {
            set({ isSigningUp: false });
        }
    },

    logout: async() => {
        try {
            await axiosInstance.post("/auth/logout");
            set({authUser: null});
            toast.success("Logout successful");
        } catch (error) {
            console.log("Error logging out: ", error);
            toast.error("Error logging out");
        }
    }
}));