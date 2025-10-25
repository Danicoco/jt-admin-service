const Admin = require("../../../models/admin");
const { jsonS, jsonFailed } = require('../../../utils');
const bcrypt = require("bcryptjs");

const Controller = {
    getSettings: async (req, res) => {
        try {
            const admin = await Admin.findById(req.user.id).select('-password');
            if (!admin) return jsonFailed(res, {}, 'Admin not found', 404);
            return jsonS(res, 200, 'Settings fetched', admin);
        } catch (err) {
            console.error('getSettings error:', err);
            return jsonFailed(res, {}, 'Internal Server Error', 500);
        }
    },

    updateSettings: async (req, res) => {
        try {
            const admin = await Admin.findById(req.user.id);
            if (!admin) return jsonFailed(res, {}, 'Admin not found', 404);

            if (req.body.photoUrl) {
            admin.photoUrl = req.body.photoUrl;
            }

            if (Array.isArray(req.body.imageUrls)) {
            if (req.body.imageUrls.length > 0) {
                admin.photoUrl = req.body.imageUrls[0];
            }
            }

            const fields = ['firstName', 'lastName', 'email', 'phoneNumber', 'location'];
            fields.forEach(field => {
            if (req.body[field] !== undefined) {
                admin[field] = req.body[field];
            }
            });

            await admin.save();
            const result = await Admin.findById(req.user.id).select('-password');
            return jsonS(res, 200, 'Settings updated', result);

        } catch (err) {
            console.error('updateSettings error:', err);
            return jsonFailed(res, {}, 'Internal Server Error', 500);
        }
    },

    deleteAccount: async (req, res) => {
        try {
            const admin = await Admin.findByIdAndDelete(req.user.id);
            if (!admin) return jsonFailed(res, {}, 'Admin not found', 404);
            return jsonS(res, 200, 'Account deleted', {});
        } catch (err) {
            console.error('deleteAccount error:', err);
            return jsonFailed(res, {}, 'Internal Server Error', 500);
        }
    },

    changePassword: async (req, res) => {
        const { currentPassword, newPassword, confirmNewPassword } = req.body;
        const { id } = req.user; 

        try {
            const user = await Admin.findById(id).select("+password"); 

            if (!user) {
                return jsonFailed(res, {}, "User not found", 404);
            }

            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return jsonFailed(res, {}, "Current password is incorrect", 400);
            }

            if (newPassword !== confirmNewPassword) {
                return jsonFailed(res, {}, "New password and confirm password do not match", 400);
            }

            if (newPassword.length < 8 || !/\d/.test(newPassword) || !/[!@#$%^&*]/.test(newPassword)) {
                return jsonFailed(res, {}, "Password must be at least 8 characters, include a number and a special character", 400);
            }

            const hashedPassword = bcrypt.hashSync(newPassword, 8);

            user.password = hashedPassword;
            await user.save();

            return jsonS(res, 200, "Password changed successfully", {});
        } catch (error) {
            console.error("Error changing password:", error);
            return jsonFailed(res, {}, "Internal Server Error", 500);
        }
    },

};

module.exports = Controller;