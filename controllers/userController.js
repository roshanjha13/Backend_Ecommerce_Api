const userModel = require("../models/userModel");
const cloudinary = require("cloudinary");
const { getDataUri } = require("../utils/feature");

exports.register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      address,
      city,
      country,
      phone,
      role,
      answer,
    } = req.body;
    if (
      !email ||
      !password ||
      !name ||
      !address ||
      !city ||
      !country ||
      !phone ||
      !answer
    )
      return res.status(401).json({ message: "please enter all field" });

    const userExist = await userModel.findOne({ email });

    if (userExist)
      return res.status(401).json({ message: "user Already Exist" });

    const user = await userModel.create({
      name,
      email,
      password,
      address,
      city,
      country,
      phone,
      role,
      answer,
    });

    res.status(201).json({
      data: user,
      message: `${user.name} your account is successfully created`,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error,
    });
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(401).json({ message: "please enter all field" });

    const user = await userModel.findOne({ email });
    if (!user)
      return res.status(401).json({
        message:
          "your account is not register our site please register your account and then login",
      });
    //check password
    const isMatch = await user.isValidPassword(password);

    if (!isMatch)
      return res.status(401).json({ message: "Invalid Creadentials" });

    const token = user.generateToken();

    res
      .status(200)
      .cookie("token", token, {
        expires: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        httpOnly: true,
        sameSite: "none",
      })
      .json({
        success: true,
        message: `${user.email} Login Successfully`,
        user,
        token,
      });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error,
    });
  }
};

exports.getMyProfile = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.user._id).select("-password");
    res.status(200).json({
      success: true,
      message: "User Profile Fetched Successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error in profile api",
      error,
    });
  }
};

exports.logout = async (req, res, next) => {
  try {
    res.status(200).clearCookie("token").json({
      success: true,
      message: "User logout  Successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error in logout api",
      error,
    });
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const user = await userModel
      .findByIdAndUpdate(req.user._id, req.body, {
        new: true,
      })
      .select("-password");

    res.status(200).json({
      success: true,
      message: "User Profile Updated Successfully Successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error in Update Profile api",
      error,
    });
  }
};

exports.updatePassword = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.user._id);
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword)
      return res.status(401).json({
        success: false,
        message: "please provide old or new password",
      });

    const isMatch = await user.isValidPassword(oldPassword);

    if (!isMatch)
      return res.status(401).json({ message: "Invalid Creadentials" });

    user.password = newPassword;
    await user.save();

    res
      .status(200)
      .json({ message: `${user.name} your password update successfully` });
  } catch (error) {
    res.status(500).json({
      message: "Error in Update Password api",
      error,
    });
  }
};

exports.updateProfilePic = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.user._id);
    const file = getDataUri(req.file);
    //delete prev image
    // await cloudinary.v2.uploader.destroy(user.profilePic.public_id);

    const cdb = await cloudinary.v2.uploader.upload(file.content);
    user.profilePic = {
      public_id: cdb.public_id,
      url: cdb.secure_url,
    };

    await user.save();
    res.status(200).json({
      success: true,
      message: "Profile picture updated",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error in Update profile pic api",
      error,
    });
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { email, newPassword, answer } = req.body;
    if (!email || !newPassword || !answer)
      return res.status(401).json({ message: "Please enter all fields" });

    const user = await userModel.findOne({ email, answer });
    if (!user)
      return res.status(401).json({
        message: `${user.email} is not found please register yourself or wrong answer`,
      });

    user.password = newPassword;
    await user.save();
    res.status(200).json({
      success: true,
      data: user,
      message: "Your Password Change Successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error in Reset Password api",
      error,
    });
  }
};
