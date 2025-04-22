import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  // sameSite: "Strict",
};

// Register a new user
export async function register(req, res) {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Please provide username, email, and password" });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error in register:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
}

// Login a user
export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password" });
    }
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: "15m" });
    const refreshToken = crypto.randomBytes(32).toString("hex");
    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("accessToken", token, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
    res.cookie("refreshToken", refreshToken, { ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 * 1000 });
    
    res.json({ message: "Login successful" });
  } catch (error) {
    console.error("Error in login:", error);
    res.status(500).json({ message: "Server error during login" });
  }
}

// Refresh access token
export async function refresh(req, res) {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }
    const user = await User.findOne({ refreshToken });
    if (!user) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: "15m" });

    res.cookie("accessToken", token, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
    res.json({ message: "Token refreshed successfully" });
  } catch (error) {
    console.error("Error in refresh:", error);
    res.status(500).json({ message: "Server error during token refresh" });
  }
}

// Logout a user
export async function logout(req, res) {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }
    const user = await User.findOne({ refreshToken });
    if (!user) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }
    user.refreshToken = undefined;
    await user.save();

    res.clearCookie("accessToken", COOKIE_OPTIONS);
    res.clearCookie("refreshToken", COOKIE_OPTIONS);

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error in logout:", error);
    res.status(500).json({ message: "Server error during logout" });
  }
}

export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Please provide an email" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found with this email" });
    }
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiration = Date.now() + 3600000;
    await user.save();
    res.json({ resetToken });
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    res
      .status(500)
      .json({ message: "Server error during password reset request" });
  }
}

// Reset password (unchanged)
export async function resetPassword(req, res) {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) {
      return res
        .status(400)
        .json({ message: "Please provide reset token and new password" });
    }
    const user = await User.findOne({
      resetPasswordToken: resetToken,
      resetPasswordExpiration: { $gt: Date.now() },
    });
    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiration = undefined;
    await user.save();
    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    res.status(500).json({ message: "Server error during password reset" });
  }
}


//////////////////////////////////////////////////////////////////////////////////////

// import User from "../models/User.js";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";
// import crypto from "crypto";

// // Register a new user
// export async function register(req, res) {
//   try {
//     const { username, email, password } = req.body;
//     if (!username || !email || !password) {
//       return res
//         .status(400)
//         .json({ message: "Please provide username, email, and password" });
//     }
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res
//         .status(400)
//         .json({ message: "User already exists with this email" });
//     }
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const user = new User({ username, email, password: hashedPassword });
//     await user.save();
//     res.status(201).json({ message: "User registered successfully" });
//   } catch (error) {
//     console.error("Error in register:", error);
//     res.status(500).json({ message: "Server error during registration" });
//   }
// }

// // Login a user
// export async function login(req, res) {
//   try {
//     const { email, password } = req.body;
//     if (!email || !password) {
//       return res
//         .status(400)
//         .json({ message: "Please provide email and password" });
//     }
//     const user = await User.findOne({ email });
//     const matchedUser = await bcrypt.compare(password, user.password);
//     if (!user || !matchedUser) {
//       return res.status(400).json({ message: "Invalid email or password" });
//     }
//     const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
//       expiresIn: "15m",
//     });
//     const refreshToken = crypto.randomBytes(32).toString("hex");
//     user.refreshToken = refreshToken;
//     await user.save();

//     // Set tokens in cookies
//     res.cookie("accessToken", token, {
//       // httpOnly: true, // Prevents client-side JavaScript access
//       // secure: process.env.NODE_ENV === 'production', // Use secure in production (HTTPS)
//       // sameSite: 'Strict', // Prevents CSRF
//       maxAge: 15 * 60 * 1000, // 15 minutes in milliseconds
//     });
//     res.cookie("refreshToken", refreshToken, {
//       // httpOnly: true,
//       // secure: process.env.NODE_ENV === 'production',
//       // sameSite: 'Strict',
//       maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
//     });

//     res.json({ message: "Login successful" });
//   } catch (error) {
//     console.error("Error in login:", error);
//     res.status(500).json({ message: "Server error during login" });
//   }
// }

// // Refresh access token
// export async function refresh(req, res) {
//   try {
//     const refreshToken = req.cookies.refreshToken; // Get from cookie instead of body
//     if (!refreshToken) {
//       return res.status(400).json({ message: "Refresh token is required" });
//     }
//     const user = await User.findOne({ refreshToken });
//     if (!user) {
//       return res.status(403).json({ message: "Invalid refresh token" });
//     }
//     const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
//       expiresIn: "15m",
//     });

//     // Set new access token in cookie
//     res.cookie("accessToken", token, {
//       // httpOnly: true,
//       // secure: process.env.NODE_ENV === 'production',
//       // sameSite: 'Strict',
//       maxAge: 15 * 60 * 1000,
//     });

//     res.json({ message: "Token refreshed successfully" });
//   } catch (error) {
//     console.error("Error in refresh:", error);
//     res.status(500).json({ message: "Server error during token refresh" });
//   }
// }

// // Logout a user
// export async function logout(req, res) {
//   try {
//     const refreshToken = req.cookies.refreshToken; // Get from cookie
//     if (!refreshToken) {
//       return res.status(400).json({ message: "Refresh token is required" });
//     }
//     const user = await User.findOne({ refreshToken });
//     if (!user) {
//       return res.status(403).json({ message: "Invalid refresh token" });
//     }
//     user.refreshToken = undefined;
//     await user.save();

//     // Clear cookies
//     res.clearCookie("accessToken");
//     res.clearCookie("refreshToken");

//     res.json({ message: "Logged out successfully" });
//   } catch (error) {
//     console.error("Error in logout:", error);
//     res.status(500).json({ message: "Server error during logout" });
//   }
// }

// // Request password reset (unchanged)
// export async function forgotPassword(req, res) {
//   try {
//     const { email } = req.body;
//     if (!email) {
//       return res.status(400).json({ message: "Please provide an email" });
//     }
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res
//         .status(404)
//         .json({ message: "User not found with this email" });
//     }
//     const resetToken = crypto.randomBytes(32).toString("hex");
//     user.resetPasswordToken = resetToken;
//     user.resetPasswordExpiration = Date.now() + 3600000;
//     await user.save();
//     res.json({ resetToken });
//   } catch (error) {
//     console.error("Error in forgotPassword:", error);
//     res
//       .status(500)
//       .json({ message: "Server error during password reset request" });
//   }
// }

// // Reset password (unchanged)
// export async function resetPassword(req, res) {
//   try {
//     const { resetToken, newPassword } = req.body;
//     if (!resetToken || !newPassword) {
//       return res
//         .status(400)
//         .json({ message: "Please provide reset token and new password" });
//     }
//     const user = await User.findOne({
//       resetPasswordToken: resetToken,
//       resetPasswordExpiration: { $gt: Date.now() },
//     });
//     if (!user) {
//       return res
//         .status(400)
//         .json({ message: "Invalid or expired reset token" });
//     }
//     user.password = await bcrypt.hash(newPassword, 10);
//     user.resetPasswordToken = undefined;
//     user.resetPasswordExpiration = undefined;
//     await user.save();
//     res.json({ message: "Password reset successfully" });
//   } catch (error) {
//     console.error("Error in resetPassword:", error);
//     res.status(500).json({ message: "Server error during password reset" });
//   }
// }
