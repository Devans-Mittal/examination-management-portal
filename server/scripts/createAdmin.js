import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import bcrypt from "bcrypt";
import connectDB from "../config/db.js";
import User from "../models/User.js";

const createAdmin = async () => {
    try {
        const {
            ADMIN_NAME,
            ADMIN_EMAIL,
            ADMIN_PASSWORD,
        } = process.env;

        if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
            throw new Error(
                "Missing ADMIN_NAME, ADMIN_EMAIL, or ADMIN_PASSWORD."
            );
        }

        if (ADMIN_PASSWORD.length < 12) {
            throw new Error(
                "Admin password must contain at least 12 characters."
            );
        }

        await connectDB();

        const email = ADMIN_EMAIL.trim().toLowerCase();

        // Refuse to overwrite a non-admin account.
        const existingUser = await User.findOne({ email });

        if (existingUser && existingUser.role !== "admin") {
            throw new Error(
                "This email belongs to a non-admin account. Choose another email."
            );
        }

        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

        if (existingUser) {
            // Update the existing admin's credentials.
            existingUser.fullName = ADMIN_NAME.trim();
            existingUser.password = hashedPassword;
            existingUser.approvalStatus = "not_required";
            existingUser.isActive = true;

            await existingUser.save();

            console.log("Existing Admin account updated successfully.");
        } else {
            // Create a new admin if the configured email does not exist.
            await User.create({
                fullName: ADMIN_NAME.trim(),
                email,
                password: hashedPassword,
                role: "admin",
                approvalStatus: "not_required",
                isActive: true,
            });

            console.log("New Admin account created successfully.");
        }

        console.log(`Admin email: ${email}`);
    } catch (error) {
        console.error("Admin setup failed:", error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect().catch(() => { });
    }
};

createAdmin();