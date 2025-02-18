const mongoose = require("mongoose");
const ownerModel = require("../models/ownerModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const validator = require("email-validator");
require("dotenv").config();

const ownerControllers = {};

// 📌 Register Owner
ownerControllers.registerOwner = async (req, res) => {
    try {
        const { firstname, lastname, email, contact, password } = req.body;

        // 🔴 Validate Required Fields
        if (!firstname || !lastname || !email || !contact || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // 🔴 Validate Email Format
        if (!validator.validate(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }

        // 🔴 Check if owner already exists
        const existingOwner = await ownerModel.findOne();
        if (existingOwner) {
            return res.redirect("/owner/login"); // ✅ Redirect to login if owner exists
        }

        // 🔴 Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 🔴 Create New Owner
        const newOwner = new ownerModel({
            firstname,
            lastname,
            email,
            contact,
            password: hashedPassword,
        });

        // 🔴 Save New Owner to Database
        await newOwner.save();

        // 🔴 Generate JWT Token
        const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1h" });

        // 🔴 Set Cookie with Token
        res.cookie("token", token, { httpOnly: true, secure: false, sameSite: "Lax" });

        // 🔴 Send Success Response
        res.status(201).json({ message: "Owner registered successfully", owner: newOwner });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// 📌 Login Owner
ownerControllers.loginOwner = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 🔴 Validate Required Fields
        if (!email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // 🔴 Check if owner exists
        const owner = await ownerModel.findOne({ email });
        if (!owner) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // 🔴 Check Password
        const validPassword = await bcrypt.compare(password, owner.password);
        if (!validPassword) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // 🔴 Generate JWT Token
        const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1h" });

        // 🔴 Set Cookie with Token
        res.cookie("token", token, { httpOnly: true, secure: false, sameSite: "Lax" });

        // 🔴 Send Success Response
        res.status(200).json({ message: "Owner logged in successfully", owner });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// 📌 Logout Owner
ownerControllers.logoutOwner = async (req, res) => {
    try {
        res.clearCookie("token");
        res.status(200).json({ message: "Owner logged out successfully" });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// 📌 Get Owner Profile
ownerControllers.getOwnerProfile = async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ message: "Invalid or expired token" });
        }

        const owner = await ownerModel.findOne({ email: decoded.email });

        if (!owner) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        res.status(200).json({ message: "Owner profile fetched successfully", owner });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = ownerControllers;
