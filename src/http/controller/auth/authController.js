const { jsonS, jsonFailed } = require("../../../utils");
var jwt = require("jsonwebtoken");
var config = require("../../../config/jwt");
const Admin = require("../../../models/admin");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const errorHandler = require("../../../utils/errorHandler");
const { getOtp, verifyOtp, verifyOtpTemp } = require("../../../helpers/twilio");
const { sendEmailNotification } = require("../../../services/emailNotification");
const Role = require("../../../models/role");


const Controller = {
    signUp: async (req, res) => {
        const { firstName, lastName, email, phoneNumber, password, role, roleId } = req.body;

        if(!firstName || !lastName || !email || !password || !phoneNumber ||!role || !roleId) {
          return jsonFailed(res, {}, "firstName, lastName, email, password, role and valid phone number required", 400)
        }

        try {
            const userExists = await Admin.findOne({ email: { $regex: new RegExp("^" + email.toLowerCase(), "i") } });
            if(userExists){
                return jsonFailed(res, {}, "An account already exists with this email", 400);
            }
            const numberExists = await Admin.findOne({ phoneNumber: phoneNumber });
            if (numberExists){
                return jsonFailed(res, {}, "An account already exist with this phone number", 400);
            }
            const dbRole = await Role.findOne({ _id: roleId });
            if (!dbRole) return jsonFailed(res, {}, "Role not found", 400);

            const hashedPassword = bcrypt.hashSync(password, 8);
            await Admin.create({ _id: uuidv4(), firstName, lastName, email:  email.toLowerCase(), password: hashedPassword, phoneNumber, role, roleId });
            await Role.updateOne({ _id: dbRole._id }, { numberOfUserAssigned: Number(dbRole.numberOfUserAssigned || 0) + 1 });
            //getOtp(phoneNumber);
            // const authToken = Controller.getToken(user);
            return jsonS(res, 200, "success", {}, {});
        } catch (error) {
            console.error(error);
            errorHandler(error, req, res)
            return jsonFailed(res, {}, "server error", 500);
        }
    },

    login: async (req, res) => {
      const { email, password } = req.body;
      try {
        const adminExist = await Admin.findOne({ email: email }).select("+password");
        
        // Handle case when admin does not exist
        if (!adminExist) {
          return jsonFailed(res, null, "Admin not found", 404);
        }
    
        if (adminExist.isVerified && adminExist.isActive) {
          
          const passwordIsValid = await bcrypt.compareSync(password, adminExist.password);
          
          if (passwordIsValid) {
            req.session.admin = adminExist; 
            var token = Controller.getToken(adminExist); 
            return jsonS(res, 200, "success", token, {}); 
          } else {
            return jsonFailed(res, null, "Invalid username or password");
          }
    
        } else if (!adminExist.isVerified) {
          return jsonFailed(res, null, "Admin not verified");
        } else if (!adminExist.isActive) {
          return jsonFailed(res, null, "Admin not active");
        }
        
      } catch (error) {
        console.error(error);
        errorHandler(error, req, res);
        return jsonFailed(res, {}, "server error", 500);
      }
    },

    verifyPhoneNumber: async (req, res) => {
        const { phoneNumber, otp } = req.body;
    
        try {
        if (!otp) return jsonFailed(res, null, "OTP cannot be empty", 400);
        if (!phoneNumber) return jsonFailed(res, null, "Phone number cannot be empty", 400);
    
        const user = await Admin.findOne({ phoneNumber: phoneNumber });
        if (!user) {
            return jsonFailed(res, null, "User not found", 404);
        }
    
        if (user.isVerified === true) {
            return jsonFailed(res, null, "User already verified", 400);
        }
    
        const verification = await verifyOtpTemp(phoneNumber, otp);
        if (verification.status === "approved") {
    
            const updateResult = await Admin.updateOne(
            { phoneNumber: phoneNumber, isVerified: false }, 
            { $set: { isVerified: true, isActive: true } }
            );
    
            if (updateResult.nModified === 0) {
            console.error('Failed to update user verification status');
            return jsonFailed(res, {}, "Failed to update user verification status", 500);
            }
    
            const acctData = {
            email: user.email,
            name: user.name,
            phoneNumber: user.phoneNumber,
            role: user.role
            };
    
            req.session.user = user;
            const authToken = Controller.getToken(user);
            return jsonS(res, 200, "success", authToken, { acctData });
        }
    
        return jsonFailed(res, null, "Invalid 6-digit code");
    
        } catch (error) {
        console.error("Error verifying phone number:", error);
        return jsonFailed(res, {}, "Internal Server Error", 500);
        }
    },

    getToken: (admin) => {
        const token = jwt.sign(
        {
            id: admin._id,
            email: admin.email,
            role: admin.role,          
            is_user: true
        },
        config.jwt_secret,
        {
            expiresIn: 7776000, // 90 days
        }
        );
    
        return {
        email: admin.email,
        is_user: true,
        role: admin.role,             
        token: token,
        token_type: "jwt",
        expiresIn: 7776000,
        };
    },

    resendVerificationOtp: async (req, res) => {
        try {
            const { phoneNumber } = req.body;
            getOtp(phoneNumber);
            return jsonS(res, 200, "success", {}, {});
        } catch (error){
            console.error("There was a problem resending otp:", error);
            return jsonFailed(res, null, "Unable to verify phone number");
        }
    },

    sendResetPassword: async (req, res) => {
        const { email } = req.body;

        try {
            const user = await Admin.findOne({ email: email.toLowerCase() });
            if (!user) {
                return jsonFailed(res, {}, "Admin not found", 404);
            }

            const otp = Math.floor(100000 + Math.random() * 900000).toString();

            req.session.otp = otp;
            req.session.otpExpires = Date.now() * 1800000;

            const subject = "Reset Password Otp";
            const text = `Your password reset otp is ${otp}. Kindly note that this otp is valid for 30 minutes.`;

            await sendEmailNotification(user.email, subject, text);

            return jsonS(res, 200, "Your password rest otp has been sent to your mail.")
        } catch (error) {
            console.error("There was an error sending otp to the user:", error);
            return jsonFailed(res, {}, "Internal server error", 500);
        };
    },

    verifyOtp: async (req, res) => {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return jsonFailed(res, {}, "Email and OTP are required.", 400);
        }

        try {
            const storedOtp = req.session.otp;
          const otpExpires = req.session.otpExpires;

          if (Date.now() > otpExpires) {
            return jsonFailed(res, {}, "OTP expired. Please request a new one.", 400);
          }

          if (otp !== storedOtp) {
            return jsonFailed(res, {}, "Invalid OTP. Please try again.", 400);
          }

          req.session.isOtpVerified = true;
          req.session.otp = undefined;
          req.session.otpExpires = undefined;

          return jsonS(res, 200, "OTP verified successfully.");
        } catch (error) {
            return jsonFailed(res, {}, "Internal server error", 500);
        };
    },

    resetPassword: async (req, res) => {
        const { email, newPassword } = req.body;

        if (!email || !newPassword) {
            return jsonFailed(res, {}, "Your email and new password are required.", 400);
        }

        try {
            if (!req.session.isOtpVerified) {
                return jsonFailed(res, {}, "You cannot verify your password without verifying your OTP.", 403);
            }

            const user = await Admin.findOne({ email: email.toLowerCase() });
            if (!user) {
                return jsonFailed(res, {}, "Admin not found.", 404);
            }

            const hashedPassword = bcrypt.hashSync(newPassword, 8);
            user.password = hashedPassword;

            await Admin.updateOne(
                { _id: user._id },
                {$set:{password: hashedPassword}}
            );

            req.session.isOtpVerified = false;

            return jsonS(res, 200, "Password reset successfully.");
        } catch (error) {
            console.error("Error resetting password:", error);
            return jsonFailed(res, {}, "Internal server error.", 500);
        }
    },
  
};
module.exports = Controller;