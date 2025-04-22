// import jwt from "jsonwebtoken";

// function authMiddleware(req, res, next) {
//   const token = req.header("Authorization")?.replace("Bearer ", "");
//   if (!token) {
//     return res.status(401).json({ message: "No token, authorization denied" });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     console.log('hi',decoded)
//     req.user = decoded; 
//     next();
//   } catch (err) {
//     res.status(401).json({ message: "Token is not valid" });
//   }
// }

// export default authMiddleware;
import jwt from "jsonwebtoken";
import User from "../models/User.js";

async function authMiddleware(req, res, next) {
  const token = req.cookies.accessToken;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log(decoded); //{ id: '67e2d0962ef0f06bd535b6ea', iat: 1742918253, exp: 1742919153 }
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized: User not found" });
    }

    next();
  } catch (error) {
    console.error("Auth error:", error);
    res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
}

export default authMiddleware;