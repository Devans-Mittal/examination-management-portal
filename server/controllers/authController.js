import User from "../models/User.js";
import bcrypt from "bcrypt";
import generateToken from "../utils/generateToken.js";

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 24 * 60 * 60 * 1000,
    path: "/",
};

const publicUser = (user) => ({
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    approvalStatus: user.approvalStatus,
    department: user.department,
});

// REGISTER
export const register = async (req, res) => {
    try {
        const { fullName, email, password, role, department } = req.body;

        if (!fullName?.trim() || !email?.trim() || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email, and password are required.",
            });
        }

        if (fullName.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: "Name must contain at least 2 characters.",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address.",
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 8 characters.",
            });
        }

        // Public registration cannot create administrators.
        const requestedRole = role || "student";

        if (!["student", "examiner"].includes(requestedRole)) {
            return res.status(403).json({
                success: false,
                message: "Invalid registration role.",
            });
        }

        const existingUser = await User.findOne({
            email: normalizedEmail,
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists.",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            fullName: fullName.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: requestedRole,
            department:
                requestedRole === "examiner"
                    ? department?.trim() || ""
                    : "",
            approvalStatus:
                requestedRole === "examiner" ? "pending" : "not_required",
        });

        return res.status(201).json({
            success: true,
            message:
                requestedRole === "examiner"
                    ? "Registration successful. Await administrator approval."
                    : "Registration successful. You can now log in.",
            user: publicUser(user),
        });
    } catch (error) {
        // Handles concurrent registrations for the same email.
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists.",
            });
        }

        console.error("Registration error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to register right now.",
        });
    }
};

// LOGIN
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email?.trim() || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required.",
            });
        }

        const user = await User.findOne({
            email: email.trim().toLowerCase(),
        }).select("+password");

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password.",
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: "Your account has been deactivated.",
            });
        }

        if (
            user.role === "examiner" &&
            user.approvalStatus !== "approved"
        ) {
            return res.status(403).json({
                success: false,
                message:
                    user.approvalStatus === "rejected"
                        ? "Your examiner registration was rejected."
                        : "Your examiner account is awaiting administrator approval.",
            });
        }

        const token = generateToken(user._id);

        res.cookie("token", token, cookieOptions);

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            user: publicUser(user),
        });
    } catch (error) {
        console.error("Login error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to log in right now.",
        });
    }
};

// GET CURRENT USER
export const getMe = async (req, res) => {
    return res.status(200).json({
        success: true,
        user: publicUser(req.user),
    });
};

// LOGOUT
export const logout = async (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/",
    });

    return res.status(200).json({
        success: true,
        message: "Logged out successfully.",
    });
};