import React, { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaEye,
  FaEyeSlash,
  FaCheckCircle,
  FaThumbsUp,
  FaEnvelope,
  FaMobileAlt,
  FaShieldAlt,
  FaCar,
  FaHeadset,
  FaTags,
  FaUserFriends,
  FaTicketAlt,
  FaMapMarkerAlt,
  FaStar,
  FaApple,
  FaRegUser,
  FaTimes,
  FaFacebook
} from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import "../../STYLES/Login.css";
import "../../STYLES/Register.css";
import { requestAuth } from "../../services/authService";
import {
  validateLowercaseEmail,
  validateStrongPassword,
} from "../../utils/authValidation";
import landscapeImage from "../../assets/images/new-landscape-bg.jpg";
import brandLogo from "../../assets/images/brand/pick-n-book-logo.svg";

const REGISTRATION_PENDING_EMAIL_KEY = "registrationPendingEmail";
const REGISTRATION_VERIFIED_EMAIL_KEY = "registrationVerifiedEmail";
const REGISTRATION_PENDING_MOBILE_KEY = "registrationPendingMobile";
const REGISTRATION_VERIFIED_MOBILE_KEY = "registrationVerifiedMobile";
const REGISTRATION_FORM_KEY = "registrationFormDraft";
const REGISTRATION_OTP_STATE_KEY = "registrationOtpState";
const OTP_TIMER_SECONDS = 60;
const DEFAULT_OTP_CHANNEL = "";
const COUNTRY_CODE_OPTIONS = [
  { value: "", label: "Select Country", mobileLength: null },
  { value: "+91", label: "+91 (India)", mobileLength: 10 },
  { value: "+1", label: "+1 (USA)", mobileLength: 10 },
  { value: "+44", label: "+44 (UK)", mobileLength: 10 },
  { value: "+971", label: "+971 (UAE)", mobileLength: 9 },
  { value: "+65", label: "+65 (Singapore)", mobileLength: 8 }
];

const COUNTRY_CODE_MAP = COUNTRY_CODE_OPTIONS.reduce((map, option) => {
  if (option.value) {
    map.set(option.value, option);
  }
  return map;
}, new Map());

const NAME_REGEX = /^[A-Za-z]+$/;
const REQUIRED_FIELD_NAMES = new Set([
  "firstName",
  "lastName",
  "countryCode",
  "mobile",
  "password",
  "confirmPassword",
  "email",
  "agree",
]);

const REQUIRED_FIELDS_MESSAGE = "Please fill all required fields";

const normalizeForm = (form) => ({
  ...form,
  firstName: form.firstName.trim(),
  lastName: form.lastName.trim(),
  mobile: form.mobile.trim(),
  email: form.email,
  password: form.password,
  confirmPassword: form.confirmPassword,
});

const readStoredJson = (storage, key) => {
  if (!storage) {
    return null;
  }

  try {
    const saved = storage.getItem(key);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

const readRegistrationDraft = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return (
    readStoredJson(window.localStorage, REGISTRATION_FORM_KEY) ||
    readStoredJson(window.sessionStorage, REGISTRATION_FORM_KEY)
  );
};

const readRegistrationOtpState = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return (
    readStoredJson(window.localStorage, REGISTRATION_OTP_STATE_KEY) ||
    readStoredJson(window.sessionStorage, REGISTRATION_OTP_STATE_KEY)
  );
};

const hasAnyEnteredRegisterDetail = (form) => {
  return Boolean(
    form.firstName ||
    form.lastName ||
    form.countryCode ||
    form.mobile ||
    form.email ||
    form.password ||
    form.confirmPassword
  );
};

const validateRegisterForm = (form, otpChannel) => {
  const nextErrors = {};

  if (!otpChannel) {
    nextErrors.otpChannel = "Please select Mobile or Email";
  }

  if (!form.firstName) {
    nextErrors.firstName = "First name is required";
  } else if (form.firstName.length > 18) {
    nextErrors.firstName = "First name cannot exceed 18 characters";
  } else if (!NAME_REGEX.test(form.firstName)) {
    nextErrors.firstName = "Only letters are allowed";
  }

  if (!form.lastName) {
    nextErrors.lastName = "Last name is required";
  } else if (form.lastName.length > 18) {
    nextErrors.lastName = "Last name cannot exceed 18 characters";
  } else if (!NAME_REGEX.test(form.lastName)) {
    nextErrors.lastName = "Only letters are allowed";
  }

  if (otpChannel === "mobile") {
    if (!form.countryCode) {
      nextErrors.countryCode = "Please select a country code";
    } else if (!COUNTRY_CODE_MAP.has(form.countryCode)) {
      nextErrors.countryCode = "Invalid country code";
    }

    if (!form.mobile) {
      nextErrors.mobile = "Mobile number is required";
    } else if (!/^\d+$/.test(form.mobile)) {
      nextErrors.mobile = "Only numbers are allowed";
    } else {
      const countryConfig = COUNTRY_CODE_MAP.get(form.countryCode);
      const expectedLength = countryConfig?.mobileLength;

      if (expectedLength && form.mobile.length !== expectedLength) {
        nextErrors.mobile = `Mobile number must contain ${expectedLength} digits`;
      } else if (form.countryCode === "+91" && !/^[6-9]/.test(form.mobile)) {
        nextErrors.mobile = "Enter a valid mobile number";
      } else if (!expectedLength && (form.mobile.length < 6 || form.mobile.length > 15)) {
        nextErrors.mobile = "Enter a valid mobile number";
      }
    }
  }

  if (otpChannel === "email") {
    const emailError = validateLowercaseEmail(
      form.email,
      "Email address is required"
    );

    if (emailError) {
      nextErrors.email = emailError;
    }
  }

  const passwordError = validateStrongPassword(form.password);
  if (passwordError) {
    nextErrors.password = passwordError;
  }

  if (!form.confirmPassword) {
    nextErrors.confirmPassword = "Please confirm your password";
  } else if (/\s/.test(form.confirmPassword)) {
    nextErrors.confirmPassword = "Confirm password cannot contain spaces";
  } else if (form.confirmPassword !== form.password) {
    nextErrors.confirmPassword = "Passwords do not match";
  }

  if (!form.agree) {
    nextErrors.agree = "Please accept terms & conditions";
  }

  return nextErrors;
};

const getBackgroundImage = (step) => {
  return landscapeImage;
};

const Register = () => {
  const navigate = useNavigate();
  const firstNameRef = useRef(null);
  const otpInputRef = useRef(null);
  const otpDropdownRef = useRef(null);
  const draftForm = readRegistrationDraft();
  const draftOtpState = readRegistrationOtpState();
  const verifiedEmail =
    typeof window !== "undefined"
      ? window.sessionStorage.getItem(REGISTRATION_VERIFIED_EMAIL_KEY) || ""
      : "";
  const verifiedMobile =
    typeof window !== "undefined"
      ? window.sessionStorage.getItem(REGISTRATION_VERIFIED_MOBILE_KEY) || ""
      : "";

  const initialEmail =
    verifiedEmail ||
    (typeof window !== "undefined"
      ? window.sessionStorage.getItem(REGISTRATION_PENDING_EMAIL_KEY) || ""
      : "");
  const initialMobile =
    verifiedMobile ||
    (typeof window !== "undefined"
      ? window.sessionStorage.getItem(REGISTRATION_PENDING_MOBILE_KEY) || ""
      : "");

  const isOtpVerified = Boolean(verifiedEmail) || Boolean(verifiedMobile);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState("");
  const [apiMessage, setApiMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const [highlightRequiredFields, setHighlightRequiredFields] = useState(false);

  const [currentStep, setCurrentStep] = useState(() => {
    if (isOtpVerified) return 2;
    if (draftOtpState?.emailOtpSent || initialEmail || initialMobile) return 2;
    return 1;
  });
  const [showVerifiedPopup, setShowVerifiedPopup] = useState(isOtpVerified);
  const [shakeOtp, setShakeOtp] = useState(false);
  const [otpPopupMessage, setOtpPopupMessage] = useState("");
  const [isEditEmailModalOpen, setIsEditEmailModalOpen] = useState(false);
  const [draftEditEmail, setDraftEditEmail] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const navEntries = window.performance.getEntriesByType("navigation");
    if (navEntries.length > 0 && navEntries[0].type === "reload") {
      let count = parseInt(window.sessionStorage.getItem("pageRefreshCount") || "0", 10);
      count += 1;
      window.sessionStorage.setItem("pageRefreshCount", count.toString());

      if (count >= 3) {
        window.sessionStorage.removeItem(REGISTRATION_PENDING_EMAIL_KEY);
        window.sessionStorage.removeItem(REGISTRATION_VERIFIED_EMAIL_KEY);
        window.sessionStorage.removeItem(REGISTRATION_PENDING_MOBILE_KEY);
        window.sessionStorage.removeItem(REGISTRATION_VERIFIED_MOBILE_KEY);
        window.sessionStorage.removeItem(REGISTRATION_FORM_KEY);
        window.sessionStorage.removeItem(REGISTRATION_OTP_STATE_KEY);
        window.sessionStorage.setItem("pageRefreshCount", "0");
        window.localStorage.removeItem(REGISTRATION_FORM_KEY);
        window.localStorage.removeItem(REGISTRATION_OTP_STATE_KEY);

        setCurrentStep(1);
        setForm({
          firstName: "",
          lastName: "",
          countryCode: "",
          mobile: "",
          email: "",
          password: "",
          confirmPassword: "",
          agree: false
        });
        setOtpChannel(DEFAULT_OTP_CHANNEL);
        setEmailOtpSent(false);
        setEmailOtp("");
        setOtpSecondsLeft(0);

        setApiMessage("Session reset due to multiple page refreshes. Please start over.");
        setIsSuccess(false);
      }
    }
  }, []);

  useEffect(() => {
    if (otpPopupMessage) {
      const timer = setTimeout(() => {
        setOtpPopupMessage("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [otpPopupMessage]);

  useEffect(() => {
    if (apiMessage && !isSuccess) {
      const timer = setTimeout(() => {
        setApiMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [apiMessage, isSuccess]);

  const [contactValue, setContactValue] = useState(initialEmail || initialMobile || "");
  const [otpChannel, setOtpChannel] = useState(
    draftOtpState?.otpChannel || DEFAULT_OTP_CHANNEL
  );
  const [emailOtpSent, setEmailOtpSent] = useState(
    !isOtpVerified && Boolean(draftOtpState?.emailOtpSent || initialEmail || initialMobile)
  );
  const [emailOtp, setEmailOtp] = useState(
    !isOtpVerified ? draftOtpState?.emailOtp || "" : ""
  );
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(
    !isOtpVerified
      ? Number(draftOtpState?.otpSecondsLeft) || (Boolean(initialEmail) || Boolean(initialMobile) ? OTP_TIMER_SECONDS : 0)
      : 0
  );
  const [otpDropdownOpen, setOtpDropdownOpen] = useState(false);

  const [form, setForm] = useState({
    firstName: draftForm?.firstName || "",
    lastName: draftForm?.lastName || "",
    countryCode: draftForm?.countryCode || "",
    mobile: initialMobile || draftForm?.mobile || "",
    email: initialEmail || draftForm?.email || "",
    password: draftForm?.password || "",
    confirmPassword: draftForm?.confirmPassword || "",
    agree: Boolean(draftForm?.agree)
  });

  const [touched, setTouched] = useState({});

  const normalizedForm = useMemo(() => normalizeForm(form), [form]);
  const validationErrors = useMemo(
    () => validateRegisterForm(normalizedForm, otpChannel),
    [normalizedForm, otpChannel]
  );
  const selectedCountry = COUNTRY_CODE_MAP.get(form.countryCode);
  const mobileMaxLength = selectedCountry?.mobileLength || 15;

  useEffect(() => {
    firstNameRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (otpDropdownRef.current && !otpDropdownRef.current.contains(event.target)) {
        setOtpDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleContactChange = (e) => {
    const val = e.target.value;
    setContactValue(val);

    // Automatically determine if it's email or mobile
    if (val.includes("@") || /[a-zA-Z]/.test(val)) {
      setOtpChannel("email");
      setForm((prev) => ({ ...prev, email: val, mobile: "", countryCode: "" }));
    } else {
      setOtpChannel("mobile");
      // Clean mobile input (digits only)
      const mobileVal = val.replace(/\D/g, "");
      setForm((prev) => ({ ...prev, mobile: mobileVal, email: "", countryCode: "+91" }));
    }
  };

  const handleOtpChannelChange = (event) => {
    const nextChannel = event.target.value;

    setOtpChannel(nextChannel);

    if (nextChannel === "mobile") {
      setForm((prev) => ({
        ...prev,
        countryCode: prev.countryCode || "+91"
      }));
    }

    setEmailOtpSent(false);
    setEmailOtp("");
    setOtpSecondsLeft(0);
    setOtpPopupMessage("");
    setServerErrors((prev) => ({ ...prev, emailOtp: "" }));
    setApiMessage("");
  };

  useEffect(() => {
    if (!isOtpVerified) {
      setShowVerifiedPopup(false);
      return;
    }

    setShowVerifiedPopup(true);
    const timerId = window.setTimeout(() => {
      setShowVerifiedPopup(false);
    }, 2600);

    return () => window.clearTimeout(timerId);
  }, [isOtpVerified]);

  useEffect(() => {
    if (!emailOtpSent || otpSecondsLeft <= 0 || isOtpVerified) {
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      setOtpSecondsLeft((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearTimeout(timerId);
  }, [emailOtpSent, otpSecondsLeft, isOtpVerified]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const draftPayload = JSON.stringify(form);
    window.localStorage.setItem(REGISTRATION_FORM_KEY, draftPayload);
    window.sessionStorage.setItem(REGISTRATION_FORM_KEY, draftPayload);
  }, [form]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const otpPayload = JSON.stringify({
      otpChannel,
      emailOtpSent,
      emailOtp,
      otpSecondsLeft,
    });

    window.localStorage.setItem(REGISTRATION_OTP_STATE_KEY, otpPayload);
    window.sessionStorage.setItem(REGISTRATION_OTP_STATE_KEY, otpPayload);
  }, [otpChannel, emailOtpSent, emailOtp, otpSecondsLeft]);

  const getFieldError = (fieldName) => {
    if (serverErrors[fieldName]) {
      return serverErrors[fieldName];
    }

    if (!touched[fieldName]) {
      return "";
    }

    return touched[fieldName] && validationErrors[fieldName];
  };

  const getFieldDisplayError = (fieldName) => {
    if (serverErrors[fieldName]) {
      return serverErrors[fieldName];
    }

    return getFieldError(fieldName) || "";
  };

  const shouldHighlightRequiredField = (fieldName) => {
    if (!highlightRequiredFields) return false;
    if (fieldName === "agree") return !form.agree;
    if (fieldName === "email" && otpChannel !== "email") return false;
    if (fieldName === "mobile" && otpChannel !== "mobile") return false;
    if (fieldName === "countryCode" && otpChannel !== "mobile") return false;

    return REQUIRED_FIELD_NAMES.has(fieldName) && !String(form[fieldName] || "").trim();
  };

  const getFieldHasError = (fieldName) =>
    shouldHighlightRequiredField(fieldName) || Boolean(getFieldError(fieldName));

  const getStatusMessage = () => {
    if (apiMessage) {
      return apiMessage;
    }

    return "";
  };

  const statusMessage = getStatusMessage();
  const otpTimerExpired = emailOtpSent && otpSecondsLeft === 0;

  const sanitizeValue = (name, value) => {
    if (name === "firstName" || name === "lastName") {
      return value.replace(/\s+/g, "").slice(0, 18);
    }

    if (name === "mobile") {
      return value.replace(/\s+/g, "").slice(0, 15);
    }

    if (name === "email") {
      return value;
    }

    return value;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const nextValue = type === "checkbox" ? checked : sanitizeValue(name, value);
    const shouldResetOtp = ["email", "mobile", "countryCode"].includes(name);

    setForm((prev) => ({
      ...prev,
      [name]: nextValue
    }));
    setTouched((prev) => ({ ...prev, [name]: true }));
    setServerErrors((prev) => ({ ...prev, [name]: "" }));
    setHighlightRequiredFields(false);
    setApiMessage("");

    if (shouldResetOtp) {
      setEmailOtpSent(false);
      setEmailOtp("");
      setOtpSecondsLeft(0);
      setOtpPopupMessage("");
      setServerErrors((prev) => ({ ...prev, emailOtp: "" }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const formatOtpTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  };

  const markAllTouched = () => {
    setTouched({
      firstName: true,
      lastName: true,
      countryCode: true,
      mobile: true,
      email: true,
      password: true,
      confirmPassword: true,
      agree: true
    });
  };

  const updateEmailOtp = (nextOtp) => {
    setEmailOtp(nextOtp);
    setServerErrors((prev) => ({ ...prev, emailOtp: "" }));
    setOtpPopupMessage("");
    setApiMessage("");
    setIsSuccess(false);
  };

  const showValidationErrors = (formToCheck) => {
    if (!hasAnyEnteredRegisterDetail(formToCheck)) {
      setTouched({});
      setServerErrors({});
      setHighlightRequiredFields(true);
      setApiMessage(REQUIRED_FIELDS_MESSAGE);
      setIsSuccess(false);
      return;
    }

    setHighlightRequiredFields(false);
    markAllTouched();
    setApiMessage("");
    setIsSuccess(false);
  };

  const clearOtpSessionState = () => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.removeItem(REGISTRATION_OTP_STATE_KEY);
    window.sessionStorage.removeItem(REGISTRATION_OTP_STATE_KEY);
  };

  const sendRegistrationOtp = async ({ validateFullForm = false, overrideForm = null } = {}) => {
    if (loading) return;

    const cleanedForm = normalizeForm(overrideForm || form);
    if (!overrideForm) {
      setForm(cleanedForm);
    } else {
      setForm(overrideForm);
    }

    const nextErrors = validateRegisterForm(cleanedForm, otpChannel);
    const step1Errors = ['firstName', 'lastName', 'otpChannel', 'email', 'mobile', 'countryCode']
      .reduce((acc, field) => {
        if (nextErrors[field]) acc[field] = nextErrors[field];
        return acc;
      }, {});

    if (Object.keys(step1Errors).length > 0) {
      setTouched((prev) => ({
        ...prev,
        firstName: true,
        lastName: true,
        email: true,
        mobile: true,
        countryCode: true
      }));
      setServerErrors(step1Errors);
      setApiMessage("");
      setIsSuccess(false);
      return false;
    }

    setLoading(true);
    setLoadingAction("otp");
    setApiMessage("");
    setIsSuccess(false);
    setServerErrors({});

    try {
      const email = cleanedForm.email.trim();
      const mobile = cleanedForm.mobile.trim();
      await requestAuth(
        "/api/Auth/send-registration-otp",
        {
          method: "POST",
          body: JSON.stringify({
            ...(otpChannel === "mobile" ? { phoneNumber: mobile, channel: "Mobile" } : { email, channel: "Email" })
          })
        },
        "Failed to send OTP"
      );

      if (typeof window !== "undefined") {
        if (otpChannel === "mobile") {
          window.sessionStorage.setItem(REGISTRATION_PENDING_MOBILE_KEY, mobile);
          window.sessionStorage.removeItem(REGISTRATION_VERIFIED_MOBILE_KEY);
        } else {
          window.sessionStorage.setItem(REGISTRATION_PENDING_EMAIL_KEY, email);
          window.sessionStorage.removeItem(REGISTRATION_VERIFIED_EMAIL_KEY);
        }
      }

      setEmailOtpSent(true);
      setOtpSecondsLeft(OTP_TIMER_SECONDS);
      setEmailOtp("");
      setOtpPopupMessage("");
      setIsSuccess(true);
      setApiMessage("OTP sent.");
      setCurrentStep(2);
      window.setTimeout(() => {
        otpInputRef.current?.focus();
      }, 0);
      return true;
    } catch (error) {
      const message = error?.message || "Something went wrong. Please try again.";

      setIsSuccess(false);

      if (/already/i.test(message)) {
        if (typeof window !== "undefined") {
          window.sessionStorage.removeItem(otpChannel === "mobile" ? REGISTRATION_PENDING_MOBILE_KEY : REGISTRATION_PENDING_EMAIL_KEY);
        }
        setServerErrors({
          [otpChannel === "mobile" ? "mobile" : "email"]: `${otpChannel === "mobile" ? "Mobile" : "Email"} already registered`
        });
        setTouched((prev) => ({ ...prev, [otpChannel === "mobile" ? "mobile" : "email"]: true }));
        setApiMessage("");
      } else {
        setApiMessage(message);
      }
      return false;
    } finally {
      setLoading(false);
      setLoadingAction("");
    }
  };

  const resendRegistrationOtp = async () => {
    if (loading || !emailOtpSent) {
      return;
    }

    // Only allow resend when timer expired
    if (!otpTimerExpired) {
      return;
    }

    // Clear old OTP immediately and restart timer
    setEmailOtp("");
    setServerErrors((prev) => ({ ...prev, emailOtp: "" }));
    setOtpPopupMessage("");
    setOtpSecondsLeft(OTP_TIMER_SECONDS);

    await sendRegistrationOtp();

    // Focus OTP input after resend
    window.setTimeout(() => {
      otpInputRef.current?.focus();
    }, 0);
  };

  const verifyRegistrationOtp = async () => {
    if (loading) return false;

    if (otpTimerExpired) {
      setServerErrors((prev) => ({
        ...prev,
        emailOtp: "OTP will expire"
      }));
      setOtpPopupMessage("OTP will expire");
      setShakeOtp(true);
      setTimeout(() => setShakeOtp(false), 500);
      setApiMessage("");
      setIsSuccess(false);
      return false;
    }

    if (!/^\d{6}$/.test(emailOtp)) {
      setServerErrors((prev) => ({
        ...prev,
        emailOtp: "Invalid OTP"
      }));
      setOtpPopupMessage("Invalid OTP");
      setShakeOtp(true);
      setTimeout(() => setShakeOtp(false), 500);
      return false;
    }

    setLoading(true);
    setLoadingAction("verify-otp");
    setApiMessage("");
    setIsSuccess(false);
    setServerErrors((prev) => ({ ...prev, emailOtp: "" }));
    setOtpPopupMessage("");

    try {
      const email = form.email.trim();
      const mobile = form.mobile.trim();
      await requestAuth(
        "/api/Auth/verify-registration-otp",
        {
          method: "POST",
          body: JSON.stringify({
            ...(otpChannel === "mobile" ? { phoneNumber: mobile } : { email }),
            channel: otpChannel === "mobile" ? "Mobile" : "Email",
            otp: emailOtp,
          })
        },
        "OTP verification failed"
      );

      if (typeof window !== "undefined") {
        if (otpChannel === "mobile") {
          window.sessionStorage.removeItem(REGISTRATION_PENDING_MOBILE_KEY);
          window.sessionStorage.setItem(REGISTRATION_VERIFIED_MOBILE_KEY, mobile);
        } else {
          window.sessionStorage.removeItem(REGISTRATION_PENDING_EMAIL_KEY);
          window.sessionStorage.setItem(REGISTRATION_VERIFIED_EMAIL_KEY, email);
        }
      }

      setEmailOtpSent(false);
      setOtpSecondsLeft(0);
      setEmailOtp("");
      clearOtpSessionState();
      setShowVerifiedPopup(true);
      setShakeOtp(false);
      setOtpPopupMessage("");
      setIsSuccess(true);
      setApiMessage("OTP verified successfully.");
      // Hide OTP UI after successful verification
      setEmailOtpSent(false);
      setOtpSecondsLeft(0);
      return true;
    } catch (error) {
      const message = error?.message || "OTP verification failed";

      // Avoid duplicate “expired” messaging; timer UI handles the expired state.
      let otpMessage = message;
      if (/invalid otp/i.test(message)) {
        otpMessage = "Invalid OTP";
      } else if (/expired/i.test(message)) {
        otpMessage = "OTP expired";
      } else if (/attempt limit exceeded/i.test(message)) {
        otpMessage = "Too many attempts. Try again later.";
      } else {
        // keep original message
        otpMessage = message;
      }

      setServerErrors((prev) => ({
        ...prev,
        emailOtp: otpMessage
      }));
      setOtpPopupMessage(otpMessage === "Invalid OTP" ? "Invalid OTP" : "");
      setApiMessage("");
      setIsSuccess(false);
      return false;
    } finally {
      setLoading(false);
      setLoadingAction("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    if (!isOtpVerified && emailOtpSent) {
      // Trigger shake animation to highlight OTP input and resend button
      setShakeOtp(true);
      // Remove shake after animation completes (~0.5s)
      setTimeout(() => setShakeOtp(false), 600);
      await verifyRegistrationOtp();
      return;
    }

    if (!isOtpVerified) {
      await sendRegistrationOtp({ validateFullForm: true });
      return;
    }

    const cleanedForm = normalizeForm(form);
    setForm(cleanedForm);

    const nextErrors = validateRegisterForm(cleanedForm, otpChannel);
    const formIsValid = Object.keys(nextErrors).length === 0;
    if (!formIsValid) {
      showValidationErrors(cleanedForm);
      return;
    }

    setLoading(true);
    setLoadingAction("register");
    setApiMessage("");
    setIsSuccess(false);
    setServerErrors({});

    try {
      await requestAuth(
        "/api/Auth/register",
        {
          method: "POST",
          body: JSON.stringify({
            firstName: cleanedForm.firstName,
            lastName: cleanedForm.lastName,
            phoneNumber: verifiedMobile || cleanedForm.mobile,
            email: verifiedEmail || cleanedForm.email,
            password: cleanedForm.password
          })
        },
        "Registration failed"
      );

      setIsSuccess(true);
      setApiMessage("User registered successfully.");
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(REGISTRATION_PENDING_EMAIL_KEY);
        window.sessionStorage.removeItem(REGISTRATION_VERIFIED_EMAIL_KEY);
        window.sessionStorage.removeItem(REGISTRATION_PENDING_MOBILE_KEY);
        window.sessionStorage.removeItem(REGISTRATION_VERIFIED_MOBILE_KEY);
        window.sessionStorage.removeItem(REGISTRATION_FORM_KEY);
        window.localStorage.removeItem(REGISTRATION_FORM_KEY);
        clearOtpSessionState();
      }
      setCurrentStep(3);
    } catch (error) {
      const message = error?.message || "Something went wrong. Please try again.";

      setIsSuccess(false);

      if (/otp verification required/i.test(message)) {
        setApiMessage("OTP verification required");
        if (typeof window !== "undefined") {
          if (verifiedMobile) {
            window.sessionStorage.removeItem(REGISTRATION_VERIFIED_MOBILE_KEY);
            window.sessionStorage.setItem(REGISTRATION_PENDING_MOBILE_KEY, verifiedMobile);
          } else {
            window.sessionStorage.removeItem(REGISTRATION_VERIFIED_EMAIL_KEY);
            window.sessionStorage.setItem(REGISTRATION_PENDING_EMAIL_KEY, verifiedEmail);
          }
        }
        navigate("/verify", {
          state: {
            flow: "register",
            email: verifiedEmail || verifiedMobile,
          },
        });
      } else if (/already exists|already registered/i.test(message)) {
        setServerErrors({
          [otpChannel === "mobile" ? "mobile" : "email"]: `${otpChannel === "mobile" ? "Mobile" : "Email"} already registered`
        });
        setApiMessage("");
      } else {
        setApiMessage(message);
      }
    } finally {
      setLoading(false);
      setLoadingAction("");
    }
  };

  const hasValue = (value) => value.trim().length > 0;

  const getPasswordStrength = (pw) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };
  const pwScore = getPasswordStrength(form.password);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (currentStep === 1) {
      sendRegistrationOtp({ validateFullForm: false });
    } else if (currentStep === 2) {
      handleSubmit(e);
    }
  };

  const authPageStyle = {
    backgroundImage: `url(${getBackgroundImage(currentStep || 1)})`,
    transition: 'background-image 0.5s ease-in-out'
  };

  return (
    <div className="travel-auth-page travel-auth-register" style={authPageStyle}>
      <div className="travel-auth-left-content">
        <h1 className="travel-hero-title">Travel More, Worry Less</h1>
        <p className="travel-hero-subtitle">Join millions of happy travelers and book your next journey with ease.</p>

        <ul className="travel-benefits-list">
          <li>
            <span className="travel-benefit-icon"><FaTags /></span>
            <div className="travel-benefit-text">
              <strong>Best Prices Guaranteed</strong>
              <span>Get the best deals on flights, buses and more.</span>
            </div>
          </li>
          <li>
            <span className="travel-benefit-icon"><FaShieldAlt /></span>
            <div className="travel-benefit-text">
              <strong>Safe & Secure Payments</strong>
              <span>Your payments and personal details are 100% secure.</span>
            </div>
          </li>
          <li>
            <span className="travel-benefit-icon"><FaCar /></span>
            <div className="travel-benefit-text">
              <strong>Wide Choices</strong>
              <span>Choose from thousands of routes, buses and schedules.</span>
            </div>
          </li>
          <li>
            <span className="travel-benefit-icon"><FaHeadset /></span>
            <div className="travel-benefit-text">
              <strong>24/7 Customer Support</strong>
              <span>Our support team is always here to help you anytime.</span>
            </div>
          </li>
        </ul>

        <div className="travel-stats-bar">
          <div className="travel-stat-item">
            <div className="travel-stat-icon text-orange"><FaUserFriends /></div>
            <div className="travel-stat-text"><strong>10M+</strong><br /><span>Happy Users</span></div>
          </div>
          <div className="travel-stat-item">
            <div className="travel-stat-icon text-blue"><FaTicketAlt /></div>
            <div className="travel-stat-text"><strong>200K+</strong><br /><span>Daily Bookings</span></div>
          </div>
          <div className="travel-stat-item">
            <div className="travel-stat-icon text-green"><FaMapMarkerAlt /></div>
            <div className="travel-stat-text"><strong>5000+</strong><br /><span>Routes Covered</span></div>
          </div>
          <div className="travel-stat-item">
            <div className="travel-stat-icon text-purple"><FaStar /></div>
            <div className="travel-stat-text"><strong>4.8 <FaStar className="small-star" /></strong><br /><span>Average Rating</span></div>
          </div>
        </div>
      </div>

      <div className="travel-auth-card">
        <section className="travel-auth-form-panel">
          {showVerifiedPopup && (
            <div className="travel-verified-popup" role="status" aria-live="polite">
              <span className="travel-verified-popup-icon" aria-hidden="true">
                <FaThumbsUp />
              </span>
              <span>Email verified successfully</span>
            </div>
          )}

          {otpPopupMessage && (
            <div className="travel-otp-toast">
              <span style={{ color: '#ef4444' }}>⚠️</span>
              <span className="travel-otp-toast-message">{otpPopupMessage}</span>
              <div className="travel-otp-toast-progress"></div>
            </div>
          )}

          {apiMessage && !isSuccess && (
            <div className="travel-otp-toast">
              <span style={{ color: '#ef4444' }}>⚠️</span>
              <span className="travel-otp-toast-message">{apiMessage}</span>
              <div className="travel-otp-toast-progress"></div>
            </div>
          )}

          <img
            src={brandLogo}
            alt="Pick N Book"
            className="auth-brand-logo auth-brand-logo-form"
          />

          {currentStep === 1 && (
            <>
              <h2 className="travel-auth-heading">Create Account</h2>
              <p className="travel-auth-subheading">
                {isOtpVerified
                  ? "OTP verified. Complete your details to create the account."
                  : "Let's get you started on your next journey"}
              </p>
            </>
          )}

          {statusMessage && isSuccess && (
            <p className="travel-auth-status is-success">{statusMessage}</p>
          )}

          {currentStep <= 2 && (
            <div className="travel-stepper">
              <div className={`stepper-item ${currentStep >= 1 ? 'active' : ''}`}>
                <div className="step-circle">{currentStep > 1 ? '✓' : 1}</div>
                <div className="step-label">Details</div>
              </div>
              <div className={`stepper-line ${currentStep >= 2 ? 'active' : ''}`} />
              <div className={`stepper-item ${currentStep >= 2 ? 'active' : ''}`}>
                <div className="step-circle">{currentStep > 2 ? '✓' : 2}</div>
                <div className="step-label">Verify & Create</div>
              </div>
            </div>
          )}

          <form className="travel-auth-form" onSubmit={handleFormSubmit} noValidate autoComplete="off">
            {currentStep === 1 && (
              <>
                <div className="travel-form-section">
                  <div className="travel-section-title">
                    Personal Details
                  </div>
                </div>

                <div className="travel-register-grid">
                  <div className="travel-field">
                    <label className="travel-label-top">First Name <span className="travel-required-star" style={getFieldHasError("firstName") ? { color: '#ef4444' } : {}}>*</span></label>
                    <div className={`travel-field-line travel-input-with-icon ${getFieldHasError("firstName") ? "has-error" : ""}`}>
                      <span className="travel-input-icon-left"><FaRegUser /></span>
                      <input
                        ref={firstNameRef}
                        name="firstName"
                        placeholder="Enter first name"
                        value={form.firstName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        autoComplete="off"
                        maxLength={18}
                        disabled={loading}
                      />
                    </div>
                    <p className="travel-field-error" style={{ marginBottom: '8px' }}>{getFieldDisplayError("firstName") || "\u00A0"}</p>
                  </div>

                  <div className="travel-field">
                    <label className="travel-label-top">Last Name <span className="travel-required-star" style={getFieldHasError("lastName") ? { color: '#ef4444' } : {}}>*</span></label>
                    <div className={`travel-field-line travel-input-with-icon ${getFieldHasError("lastName") ? "has-error" : ""}`}>
                      <span className="travel-input-icon-left"><FaRegUser /></span>
                      <input
                        name="lastName"
                        placeholder="Enter last name"
                        value={form.lastName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        autoComplete="off"
                        maxLength={18}
                        disabled={loading}
                      />
                    </div>
                    <p className="travel-field-error" style={{ marginBottom: '8px' }}>{getFieldDisplayError("lastName") || "\u00A0"}</p>
                  </div>

                  <div className="travel-field" style={{ gridColumn: "1 / -1", marginBottom: '0' }}>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <div style={{ width: '160px', display: 'flex', flexDirection: 'column' }}>
                        <label className="travel-label-top">Contact Method <span className="travel-required-star" style={getFieldHasError("otpChannel") ? { color: '#ef4444' } : {}}>*</span></label>
                        <div className="travel-field-line travel-input-with-icon">
                          <span className="travel-input-icon-left" style={{ zIndex: 10 }}>
                            {otpChannel === "email" ? <FaEnvelope /> : <FaMobileAlt />}
                          </span>
                          <div
                            className={`travel-custom-dropdown-container ${loading ? 'is-disabled' : ''}`}
                            ref={otpDropdownRef}
                            onClick={() => !loading && setOtpDropdownOpen(!otpDropdownOpen)}
                            style={{ height: '100%', width: '100%', paddingLeft: '32px' }}
                          >
                            <div className="travel-field-select" style={{ display: 'flex', alignItems: 'center', height: '100%', padding: '0 8px 0 4px' }}>
                              <span style={{ textTransform: 'capitalize' }}>{otpChannel || 'Select'}</span>
                            </div>
                            {otpDropdownOpen && (
                              <div className="travel-custom-dropdown-options" style={{ paddingLeft: 0, marginTop: '8px', border: '1px solid #f97316', zIndex: 9999 }}>
                                <div
                                  className={`travel-custom-dropdown-option ${otpChannel === 'email' ? 'is-selected' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOtpChannelChange({ target: { value: 'email' } });
                                    setOtpDropdownOpen(false);
                                  }}
                                >
                                  Email
                                </div>
                                <div
                                  className={`travel-custom-dropdown-option ${otpChannel === 'mobile' ? 'is-selected' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOtpChannelChange({ target: { value: 'mobile' } });
                                    setOtpDropdownOpen(false);
                                  }}
                                >
                                  Mobile
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="travel-field-error" style={{ marginTop: '4px' }}>{getFieldDisplayError("otpChannel") || "\u00A0"}</p>
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <label className="travel-label-top">{otpChannel === "email" ? "Email Address" : "Mobile Number"} <span className="travel-required-star" style={getFieldHasError(otpChannel === "mobile" ? "mobile" : "email") ? { color: '#ef4444' } : {}}>*</span></label>
                        <div className={`travel-field-line travel-input-with-icon ${getFieldHasError(otpChannel === "mobile" ? "mobile" : "email") ? "has-error" : ""}`} style={{ position: 'relative' }}>
                          <span className="travel-input-icon-left">
                            {otpChannel === "email" ? <FaEnvelope /> : <FaMobileAlt />}
                          </span>
                          <input
                            type="text"
                            name="contact"
                            placeholder={otpChannel === "email" ? "Enter your email address" : "Enter mobile number"}
                            value={contactValue}
                            onChange={handleContactChange}
                            onBlur={handleBlur}
                            autoComplete="off"
                            disabled={loading}
                            maxLength={otpChannel === "mobile" ? (mobileMaxLength || 15) : undefined}
                          />
                          {hasValue(contactValue) && !getFieldHasError(otpChannel === "mobile" ? "mobile" : "email") && (
                            <span className="travel-field-check" style={{ position: 'absolute', right: '16px', color: '#10b981', display: 'flex', alignItems: 'center', height: '100%', top: 0 }}>
                              <FaCheckCircle />
                            </span>
                          )}
                        </div>
                        <p className="travel-field-error" style={{ marginTop: '4px' }}>{getFieldDisplayError(otpChannel === "mobile" ? "mobile" : "email") || "\u00A0"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="travel-auth-actions" style={{ marginTop: '16px' }}>
                  <button
                    type="submit"
                    className="travel-btn travel-btn-primary"
                    disabled={loading}
                    style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}
                  >
                    <span>{loadingAction === "otp" ? "Sending..." : "Send OTP"}</span>
                    {loadingAction !== "otp" && <span className="btn-arrow" style={{ position: 'absolute', right: '24px', fontSize: '18px' }}>→</span>}
                  </button>
                </div>

                <div className="travel-social-login">
                  <div className="travel-social-divider">
                    <span>or sign up with</span>
                  </div>
                  <div className="travel-social-icons">
                    <button type="button" className="travel-social-btn"><FcGoogle size={24} /></button>
                    <button type="button" className="travel-social-btn"><FaFacebook size={24} color="#1877F2" /></button>
                    <button type="button" className="travel-social-btn"><FaApple size={24} /></button>
                  </div>
                </div>

                <p className="travel-auth-footnote" style={{ marginTop: '16px' }}>
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="travel-footnote-link"
                    onClick={() => navigate("/login")}
                  >
                    Sign In
                  </button>
                </p>
              </>
            )}

            {currentStep === 2 && (
              <div className="travel-step2-wrapper" style={{ width: '100%' }}>
                <h2 className="travel-auth-heading">Verify OTP</h2>
                <p className="travel-auth-subheading">
                  Enter OTP and set your new account password.
                </p>

                <div className={`travel-field ${shakeOtp ? "shake-animation" : ""}`}>
                  <label htmlFor="register-otp">OTP</label>
                  <div className="travel-field-line travel-otp-line">
                    <input
                      id="register-otp"
                      ref={otpInputRef}
                      type="text"
                      placeholder="Enter OTP"
                      value={emailOtp}
                      maxLength={6}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        updateEmailOtp(val);
                      }}
                      autoComplete="off"
                      disabled={isOtpVerified || loading}
                    />
                    <button
                      type="button"
                      className="travel-inline-otp-btn"
                      onClick={
                        isOtpVerified
                          ? undefined
                          : emailOtp.trim()
                            ? verifyRegistrationOtp
                            : resendRegistrationOtp
                      }
                      disabled={
                        loading || 
                        isOtpVerified || 
                        (emailOtp.trim() ? emailOtp.length !== 6 : otpSecondsLeft > 0)
                      }
                    >
                      {loading && !isOtpVerified
                        ? emailOtp.trim()
                          ? "Verifying..."
                          : "Resending..."
                        : isOtpVerified
                          ? "Verified"
                          : emailOtp.trim()
                            ? "Verify OTP"
                            : "Resend OTP"}
                    </button>
                  </div>
                  <p className="travel-field-error">{serverErrors.emailOtp || "\u00A0"}</p>
                </div>

                <div className="travel-field password-field-wrap">
                  <label htmlFor="register-password">New Password <span className="travel-required-star" style={getFieldHasError("password") ? { color: '#ef4444' } : {}}>*</span></label>
                  <div className={`travel-field-line ${getFieldHasError("password") ? "has-error" : ""}`}>
                    <input
                      id="register-password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Enter new password"
                      value={form.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      maxLength={64}
                      disabled={!isOtpVerified || loading}
                    />
                    <button
                      type="button"
                      className="travel-eye-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={!isOtpVerified || loading}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>

                  <div className="travel-password-strength">
                    <div className="strength-bars">
                      <div className={`bar ${pwScore >= 1 ? 'active' : ''}`} />
                      <div className={`bar ${pwScore >= 2 ? 'active' : ''}`} />
                      <div className={`bar ${pwScore >= 3 ? 'active' : ''}`} />
                      <div className={`bar ${pwScore >= 4 ? 'active' : ''}`} />
                    </div>
                    <span className={`strength-text score-${pwScore}`} style={{ fontSize: '10px' }}>
                      {pwScore === 0 ? '' : pwScore <= 2 ? 'Weak' : pwScore === 3 ? 'Good' : 'Strong'}
                    </span>
                  </div>
                </div>

                <div className="travel-field">
                  <label htmlFor="register-confirm-password">Confirm Password <span className="travel-required-star" style={getFieldHasError("confirmPassword") ? { color: '#ef4444' } : {}}>*</span></label>
                  <div className={`travel-field-line ${getFieldHasError("confirmPassword") ? "has-error" : ""}`}>
                    <input
                      id="register-confirm-password"
                      type={showConfirm ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="Confirm new password"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      maxLength={64}
                      disabled={!isOtpVerified || loading}
                    />
                    <button
                      type="button"
                      className="travel-eye-btn"
                      onClick={() => setShowConfirm(!showConfirm)}
                      disabled={!isOtpVerified || loading}
                    >
                      {showConfirm ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  <p className="travel-field-error">{getFieldDisplayError("confirmPassword") || "\u00A0"}</p>
                </div>

                <div className="travel-terms-wrap" style={{ margin: '8px 0 16px' }}>
                  <label className={`travel-terms ${getFieldHasError("agree") ? "has-error" : ""}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      name="agree"
                      checked={form.agree}
                      onChange={handleChange}
                      disabled={!isOtpVerified || loading}
                      style={{ margin: 0 }}
                    />
                    <span style={{ fontSize: '12px' }}>
                      I accept the <span className="travel-terms-link" style={{ color: '#009b8f', textDecoration: 'underline' }}>Terms & Conditions</span>
                    </span>
                  </label>
                  <p className="travel-field-error">{getFieldDisplayError("agree") || "\u00A0"}</p>
                </div>

                <div className="travel-auth-links" style={{ justifyContent: 'space-between', width: '100%' }}>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                  >
                    Back to Register
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                  >
                    Back to Login
                  </button>
                </div>

                <div className="travel-auth-actions" style={{ width: '100%', marginTop: '16px' }}>
                  <button
                    type="submit"
                    className="travel-btn travel-btn-primary"
                    disabled={loading}
                  >
                    {loadingAction === "register" ? "Submitting..." : "Submit"}
                  </button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="travel-step4-wrapper" style={{ width: '100%' }}>
                <div className="travel-step4-icon">✓</div>
                <h2 className="travel-step4-title">Account Created<br />Successfully!</h2>
                <p className="travel-step4-text">
                  Welcome to Pick N Book 🎉<br />
                  Your journey begins now.
                </p>
                <div className="travel-auth-actions" style={{ marginTop: '32px', width: '100%' }}>
                  <button
                    type="button"
                    className="travel-btn travel-btn-primary"
                    onClick={() => navigate("/login")}
                  >
                    Explore Now
                  </button>
                </div>
              </div>
            )}

            {isEditEmailModalOpen && (
              <div className="travel-edit-modal-overlay">
                <div className="travel-edit-modal">
                  <div className="travel-edit-modal-header">
                    <h4>Edit {otpChannel === "mobile" ? "Mobile" : "Email"}</h4>
                    <button className="travel-edit-modal-close" onClick={() => setIsEditEmailModalOpen(false)}>
                      <FaTimes />
                    </button>
                  </div>
                  <div className="travel-edit-modal-body">
                    <label htmlFor="edit-modal-input">{otpChannel === "mobile" ? "Mobile Number" : "Email Address"}</label>
                    <div className="travel-field-line">
                      <input
                        id="edit-modal-input"
                        type="text"
                        value={draftEditEmail}
                        onChange={(e) => setDraftEditEmail(e.target.value)}
                        style={{ height: '100%', border: 'none', background: 'transparent', outline: 'none', width: '100%', padding: '0 12px' }}
                      />
                    </div>
                  </div>
                  <div className="travel-edit-modal-footer">
                    <button className="travel-btn travel-btn-cancel" onClick={() => setIsEditEmailModalOpen(false)}>Cancel</button>
                    <button className="travel-btn travel-btn-primary travel-btn-update" onClick={() => {
                      const nextForm = {
                        ...form,
                        [otpChannel === "mobile" ? "mobile" : "email"]: draftEditEmail
                      };
                      setForm(nextForm);
                      setContactValue(draftEditEmail);
                      setIsEditEmailModalOpen(false);
                      sendRegistrationOtp({ overrideForm: nextForm });
                    }}>
                      Send OTP
                    </button>
                  </div>
                </div>
              </div>
            )}
          </form>
        </section>
      </div>
    </div>
  );
};

export default Register;
