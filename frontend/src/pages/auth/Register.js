import React, { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaEye,
  FaEyeSlash,
  FaCheckCircle,
  FaThumbsUp
} from "react-icons/fa";
import "../../STYLES/Login.css";
import "../../STYLES/Register.css";
import { requestAuth } from "../../services/authService";
import {
  validateLowercaseEmail,
  validateStrongPassword,
} from "../../utils/authValidation";
import flightCarImage from "../../assets/images/loginimage.png";

const REGISTRATION_PENDING_EMAIL_KEY = "registrationPendingEmail";
const REGISTRATION_VERIFIED_EMAIL_KEY = "registrationVerifiedEmail";
const REGISTRATION_FORM_KEY = "registrationFormDraft";
const REGISTRATION_OTP_STATE_KEY = "registrationOtpState";
const OTP_LENGTH = 6;
const OTP_TIMER_SECONDS = 60;
const DEFAULT_OTP_CHANNEL = "";
const OTP_CHANNEL_OPTIONS = [
  { value: "", label: "Select one" },
  { value: "email", label: "Email" },
  { value: "mobile", label: "Mobile Number" },
];
const COUNTRY_CODE_OPTIONS = [
  { value: "", label: "Select code", mobileLength: null },
  { value: "+91", label: "+91 (India)", mobileLength: 10 },
  // { value: "+1", label: "+1 (USA/Canada)", mobileLength: 10 },
  // { value: "+44", label: "+44 (UK)", mobileLength: 10 },
  // { value: "+61", label: "+61 (Australia)", mobileLength: 9 },
  // { value: "+971", label: "+971 (UAE)", mobileLength: 9 }
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

const validateRegisterForm = (form) => {
  const nextErrors = {};

  if (!form.firstName) {
    nextErrors.firstName = "First name is required";
  } else if (form.firstName.length > 18) {
    nextErrors.firstName = "First name cannot exceed 18 characters";
  } else if (!NAME_REGEX.test(form.firstName)) {
    nextErrors.firstName = "Only letters are allowed";
  }

  if (!form.lastName) {
    nextErrors.lastName = "Last name is required";
  }  else if (form.lastName.length > 18) {
    nextErrors.lastName = "Last name cannot exceed 18 characters";
  } else if (!NAME_REGEX.test(form.lastName)) {
    nextErrors.lastName = "Only letters are allowed";
  }

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

  const emailError = validateLowercaseEmail(
    form.email,
    "Email address is required"
  );

  if (emailError) {
    nextErrors.email = emailError;
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

const Register = () => {
  const navigate = useNavigate();
  const firstNameRef = useRef(null);
  const otpInputRefs = useRef([]);
  const countryDropdownRef = useRef(null);
  const draftForm = readRegistrationDraft();
  const draftOtpState = readRegistrationOtpState();
  const authPageStyle = {
    backgroundImage: `url(${flightCarImage})`
  };
  const verifiedEmail =
    typeof window !== "undefined"
      ? window.sessionStorage.getItem(REGISTRATION_VERIFIED_EMAIL_KEY) || ""
      : "";
  const initialEmail =
    verifiedEmail ||
    (typeof window !== "undefined"
      ? window.sessionStorage.getItem(REGISTRATION_PENDING_EMAIL_KEY) || ""
      : "");
  const isOtpVerified = Boolean(verifiedEmail);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState("");
  const [apiMessage, setApiMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const [highlightRequiredFields, setHighlightRequiredFields] = useState(false);
  const [showVerifiedPopup, setShowVerifiedPopup] = useState(isOtpVerified);
  const [shakeOtp, setShakeOtp] = useState(false);
  const [otpPopupMessage, setOtpPopupMessage] = useState("");
  const [otpChannel, setOtpChannel] = useState(
    draftOtpState?.otpChannel || DEFAULT_OTP_CHANNEL
  );
  const [emailOtpSent, setEmailOtpSent] = useState(
    !isOtpVerified && Boolean(draftOtpState?.emailOtpSent || initialEmail)
  );
  const [emailOtp, setEmailOtp] = useState(
    !isOtpVerified ? draftOtpState?.emailOtp || "" : ""
  );
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(
    !isOtpVerified
      ? Number(draftOtpState?.otpSecondsLeft) || (Boolean(initialEmail) ? OTP_TIMER_SECONDS : 0)
      : 0
  );
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);

  const [form, setForm] = useState({
    firstName: draftForm?.firstName || "",
    lastName: draftForm?.lastName || "",
    countryCode: draftForm?.countryCode || "",
    mobile: draftForm?.mobile || "",
    email: initialEmail,
    password: draftForm?.password || "",
    confirmPassword: draftForm?.confirmPassword || "",
    agree: Boolean(draftForm?.agree)
  });

  const [touched, setTouched] = useState({});

  const normalizedForm = useMemo(() => normalizeForm(form), [form]);
  const validationErrors = useMemo(
    () => validateRegisterForm(normalizedForm),
    [normalizedForm]
  );
  const selectedCountry = COUNTRY_CODE_MAP.get(form.countryCode);
  const mobileMaxLength = selectedCountry?.mobileLength || 15;

  useEffect(() => {
    firstNameRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target)) {
        setCountryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCountryCodeSelect = (val) => {
    setForm((prev) => ({
      ...prev,
      countryCode: val
    }));
    setTouched((prev) => ({ ...prev, countryCode: true }));
    setServerErrors((prev) => ({ ...prev, countryCode: "" }));
    setHighlightRequiredFields(false);
    setApiMessage("");
    setCountryDropdownOpen(false);
  };

  const handleOtpChannelChange = (event) => {
    const nextChannel = event.target.value;

    setOtpChannel(nextChannel);
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

  useEffect(() => {
    if (!otpPopupMessage) {
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      setOtpPopupMessage("");
    }, 3500);

    return () => window.clearTimeout(timerId);
  }, [otpPopupMessage]);

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

  const shouldHighlightRequiredField = (fieldName) =>
    highlightRequiredFields &&
    REQUIRED_FIELD_NAMES.has(fieldName) &&
    ((fieldName === "agree" && !form.agree) ||
      (fieldName !== "agree" && !String(form[fieldName] || "").trim()));

  const getFieldHasError = (fieldName) =>
    shouldHighlightRequiredField(fieldName) || Boolean(getFieldError(fieldName));

  const getStatusMessage = () => {
    if (apiMessage) {
      return apiMessage;
    }

    return "";
  };

  const statusMessage = getStatusMessage();
  const showGlobalError =
    statusMessage &&
    !isSuccess &&
    !serverErrors.email &&
    !serverErrors.emailOtp;
  const otpTimerExpired = emailOtpSent && otpSecondsLeft === 0;
  const otpInlineMessage = otpTimerExpired ? "OTP expired" : "";

  const showOtpUI = emailOtpSent && !isOtpVerified;
  // const showExpiredMessage = showOtpUI && otpTimerExpired;

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

  const showEmailSpaceError = () => {
    setTouched((prev) => ({ ...prev, email: true }));
    setServerErrors((prev) => ({
      ...prev,
      email: "Email cannot contain spaces",
    }));
    setHighlightRequiredFields(false);
    setApiMessage("");
  };

  const handleEmailKeyDown = (event) => {
    if (event.key === " ") {
      event.preventDefault();
      showEmailSpaceError();
    }
  };

  const handleEmailPaste = (event) => {
    if (/\s/.test(event.clipboardData.getData("text"))) {
      event.preventDefault();
      showEmailSpaceError();
    }
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

  const handleOtpBoxChange = (index, value) => {
    const digits = value.replace(/\D+/g, "");

    if (!digits) {
      const otpDigits = emailOtp.split("");
      otpDigits[index] = "";
      updateEmailOtp(otpDigits.join("").slice(0, OTP_LENGTH));
      return;
    }

    const otpDigits = emailOtp.split("");
    digits.split("").forEach((digit, offset) => {
      const nextIndex = index + offset;
      if (nextIndex < OTP_LENGTH) {
        otpDigits[nextIndex] = digit;
      }
    });

    updateEmailOtp(otpDigits.join("").slice(0, OTP_LENGTH));
    const focusIndex = Math.min(index + digits.length, OTP_LENGTH - 1);
    otpInputRefs.current[focusIndex]?.focus();
  };

  const handleOtpKeyDown = (index, event) => {
    if (event.key === "Backspace" && !emailOtp[index] && index > 0) {
      event.preventDefault();
      otpInputRefs.current[index - 1]?.focus();
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (index, event) => {
    event.preventDefault();
    handleOtpBoxChange(index, event.clipboardData.getData("text"));
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

  const getOtpTargetValidation = (cleanedForm) => {
    if (!otpChannel) {
      return { field: "otpChannel", message: "Please select one" };
    }

    if (otpChannel === "mobile") {
      if (!cleanedForm.countryCode) {
        return { field: "countryCode", message: "Please select a country code" };
      }

      const countryConfig = COUNTRY_CODE_MAP.get(cleanedForm.countryCode);
      const expectedLength = countryConfig?.mobileLength;

      if (!cleanedForm.mobile) {
        return { field: "mobile", message: "Mobile number is required" };
      }

      if (!/^\d+$/.test(cleanedForm.mobile)) {
        return { field: "mobile", message: "Only numbers are allowed" };
      }

      if (expectedLength && cleanedForm.mobile.length !== expectedLength) {
        return {
          field: "mobile",
          message: `Mobile number must contain ${expectedLength} digits`,
        };
      }

      if (cleanedForm.countryCode === "+91" && !/^[6-9]/.test(cleanedForm.mobile)) {
        return { field: "mobile", message: "Enter a valid mobile number" };
      }

      return null;
    }

    const emailError = validateLowercaseEmail(
      cleanedForm.email,
      "Email address is required"
    );

    if (emailError) {
      return { field: "email", message: emailError };
    }

    return null;
  };

  const sendRegistrationOtp = async ({ validateFullForm = false } = {}) => {
    if (loading) return;

    const cleanedForm = normalizeForm(form);
    setForm(cleanedForm);

    if (validateFullForm) {
      const nextErrors = validateRegisterForm(cleanedForm);
      if (Object.keys(nextErrors).length > 0) {
        showValidationErrors(cleanedForm);
        return false;
      }
    }

    const otpTargetError = getOtpTargetValidation(cleanedForm);

    if (otpTargetError) {
      setTouched((prev) => ({ ...prev, [otpTargetError.field]: true }));
      setServerErrors((prev) => ({
        ...prev,
        [otpTargetError.field]: otpTargetError.message,
      }));
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
            email,
            mobile,
            phoneNumber: mobile,
            countryCode: cleanedForm.countryCode,
            otpChannel,
            deliveryChannel: otpChannel,
            recipient: otpChannel === "mobile" ? mobile : email,
          })
        },
        "Failed to send OTP"
      );

      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(REGISTRATION_PENDING_EMAIL_KEY, email);
        window.sessionStorage.removeItem(REGISTRATION_VERIFIED_EMAIL_KEY);
      }

      setEmailOtpSent(true);
      setOtpSecondsLeft(OTP_TIMER_SECONDS);
      setEmailOtp("");
      setOtpPopupMessage("");
      setIsSuccess(true);
      setApiMessage("OTP sent to your email.");
      window.setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 0);
      return true;
    } catch (error) {
      const message = error?.message || "Something went wrong. Please try again.";

      setIsSuccess(false);

      if (/already/i.test(message)) {
        if (typeof window !== "undefined") {
          window.sessionStorage.removeItem(REGISTRATION_PENDING_EMAIL_KEY);
        }
        setForm((prev) => ({
          ...prev,
          email: ""
        }));
        setServerErrors({
          email: "Email already registered"
        });
        setTouched((prev) => ({ ...prev, email: true }));
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

  const restartRegistration = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(REGISTRATION_PENDING_EMAIL_KEY);
      window.sessionStorage.removeItem(REGISTRATION_VERIFIED_EMAIL_KEY);
      window.sessionStorage.removeItem(REGISTRATION_FORM_KEY);
      window.localStorage.removeItem(REGISTRATION_FORM_KEY);
      clearOtpSessionState();
    }

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

    setTouched({});
    setServerErrors({});
    setApiMessage("");
    setIsSuccess(false);
    setHighlightRequiredFields(false);
    setShowVerifiedPopup(false);

    // OTP UI state
    setEmailOtpSent(false);
    setEmailOtp("");
    setOtpSecondsLeft(0);
  };

  const resendRegistrationOtp = async () => {
    if (loading || !emailOtpSent) {
      return;
    }

    // Only allow resend when timer expired
    if (!otpTimerExpired) {
      return;
    }

    // Clear old OTP immediately and restart timer via sendRegistrationOtp
    setEmailOtp("");
    setServerErrors((prev) => ({ ...prev, emailOtp: "" }));
    setOtpPopupMessage("");

    await sendRegistrationOtp();

    // Focus first OTP box after resend
    window.setTimeout(() => {
      otpInputRefs.current[0]?.focus();
    }, 0);
  };

  const verifyRegistrationOtp = async () => {
    if (loading) return false;

    if (otpTimerExpired) {
      setServerErrors((prev) => ({
        ...prev,
        emailOtp: "OTP expired"
      }));
      setOtpPopupMessage("");
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
            email,
            mobile,
            phoneNumber: mobile,
            countryCode: form.countryCode,
            otp: emailOtp,
            otpChannel,
            deliveryChannel: otpChannel,
          })
        },
        "OTP verification failed"
      );

      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(REGISTRATION_PENDING_EMAIL_KEY);
        window.sessionStorage.setItem(REGISTRATION_VERIFIED_EMAIL_KEY, email);
      }

      setEmailOtpSent(false);
      setOtpSecondsLeft(0);
      setEmailOtp("");
      clearOtpSessionState();
      setShowVerifiedPopup(true);
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

    const nextErrors = validateRegisterForm(cleanedForm);
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
            phoneNumber: cleanedForm.mobile,
            email: verifiedEmail,
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
        window.sessionStorage.removeItem(REGISTRATION_FORM_KEY);
        window.localStorage.removeItem(REGISTRATION_FORM_KEY);
        clearOtpSessionState();
      }
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      const message = error?.message || "Something went wrong. Please try again.";

      setIsSuccess(false);

      if (/otp verification required/i.test(message)) {
        setApiMessage("OTP verification required");
        if (typeof window !== "undefined") {
          window.sessionStorage.removeItem(REGISTRATION_VERIFIED_EMAIL_KEY);
          window.sessionStorage.setItem(REGISTRATION_PENDING_EMAIL_KEY, verifiedEmail);
        }
        navigate("/verify", {
          state: {
            flow: "register",
            email: verifiedEmail,
          },
        });
      } else if (/already exists|already registered/i.test(message)) {
        setServerErrors({
          email: "Email already registered"
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

  return (
    <div className="travel-auth-page travel-auth-register" style={authPageStyle}>
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

          <h3 className="travel-tagline">Create Account</h3>
          <p className="travel-auth-subheading">
            {isOtpVerified
          ? "OTP verified. Complete your details to create the account."
              : "Sign up to book bus seats, flights and more"}
          </p>

          {statusMessage && isSuccess && (
            <p
              className={`travel-auth-status ${isSuccess ? "is-success" : "is-error"}`}
            >
              {statusMessage}
            </p>
          )}

          <form className="travel-auth-form" onSubmit={handleSubmit} noValidate autoComplete="off">
            <div className="travel-register-grid">
              <div className="travel-field">
                <label className="travel-label" htmlFor="register-first-name">First Name <span className="travel-required-star">*</span></label>
                <div className={`travel-field-line ${getFieldHasError("firstName") ? "has-error" : ""}`}>
                  <input
                    ref={firstNameRef}
                    id="register-first-name"
                    name="firstName"
                    placeholder="First name"
                    value={form.firstName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    autoComplete="off"
                    maxLength={18}
                    disabled={loading}
                  />
                  {hasValue(form.firstName) && !getFieldHasError("firstName") && (
                    <FaCheckCircle className="travel-field-check" aria-hidden="true" />
                  )}
                </div>
                <p className="travel-field-error">{getFieldDisplayError("firstName") || "\u00A0"}</p>
              </div>

              <div className="travel-field">
                <label className="travel-label" htmlFor="register-last-name">Last Name <span className="travel-required-star">*</span></label>
                <div className={`travel-field-line ${getFieldHasError("lastName") ? "has-error" : ""}`}>
                  <input
                    id="register-last-name"
                    name="lastName"
                    placeholder="Last name"
                    value={form.lastName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    autoComplete="off"
                    maxLength={18}
                    disabled={loading}
                  />
                  {hasValue(form.lastName) && !getFieldHasError("lastName") && (
                    <FaCheckCircle className="travel-field-check" aria-hidden="true" />
                  )}
                </div>
                <p className="travel-field-error">{getFieldDisplayError("lastName") || "\u00A0"}</p>
              </div>

              <div className="travel-field">
                <label className="travel-label" htmlFor="register-country-code">Country Code <span className="travel-required-star">*</span></label>
                <div 
                  ref={countryDropdownRef}
                  className={`travel-field-line travel-custom-dropdown-container ${getFieldHasError("countryCode") ? "has-error" : ""}`}
                >
                  <div 
                    id="register-country-code"
                    className={`travel-custom-dropdown-header ${form.countryCode ? "valid-selected" : ""}`}
                    onClick={() => !loading && setCountryDropdownOpen(!countryDropdownOpen)}
                  >
                    <span>
                      {form.countryCode 
                        ? COUNTRY_CODE_OPTIONS.find(o => o.value === form.countryCode)?.label 
                        : "Select code"}
                    </span>
                    <span className={`travel-dropdown-arrow ${countryDropdownOpen ? "open" : ""}`}>▼</span>
                  </div>
                  {countryDropdownOpen && (
                    <div className="travel-custom-dropdown-options">
                      {COUNTRY_CODE_OPTIONS.map((option) => (
                        <div
                          key={option.label}
                          className={`travel-custom-dropdown-option ${form.countryCode === option.value ? "is-selected" : ""}`}
                          onClick={() => handleCountryCodeSelect(option.value)}
                        >
                          {option.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <p className="travel-field-error">{getFieldDisplayError("countryCode") || "\u00A0"}</p>
              </div>

              <div className="travel-field">
                <label className="travel-label" htmlFor="register-mobile">Mobile or Email <span className="travel-required-star">*</span></label>
                  <div
                    className={`travel-field-line travel-otp-dropdown ${
                      getFieldHasError("mobile") ? "has-error" : ""
                    }`}
                  >
                  <select
                    className={`travel-otp-channel-select ${!otpChannel ? "is-placeholder" : ""}`}
                    value={otpChannel}
                    onChange={handleOtpChannelChange}
                    disabled={loading}
                    aria-label="Select OTP destination"
                  >
                    {OTP_CHANNEL_OPTIONS.map((option) => (
                      <option key={option.value || "placeholder"} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {/* <input
                    id="register-mobile"
                    name="mobile"
                    placeholder="Enter email or mobile"
                    value={form.mobile}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={mobileMaxLength}
                    disabled={loading}
                  /> 
                  {/* {hasValue(form.mobile) && !getFieldHasError("mobile") && (
                    <FaCheckCircle className="travel-field-check" aria-hidden="true" />
                  )} */}
                </div>
                <p className="travel-field-error">{getFieldDisplayError("otpChannel") || getFieldDisplayError("mobile") || "\u00A0"}</p>
              </div>

              <div className="travel-field">
                <label className="travel-label" htmlFor="register-password">Password <span className="travel-required-star">*</span></label>
                <div className={`travel-field-line ${getFieldHasError("password") ? "has-error" : ""}`}>
                  <input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Create password"
                    value={form.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    autoComplete="new-password"
                    maxLength={64}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="travel-eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    disabled={loading}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                <p className="travel-field-error">{getFieldDisplayError("password") || "\u00A0"}</p>
              </div>

              <div className="travel-field">
                <label className="travel-label" htmlFor="register-confirm-password">Confirm Password <span className="travel-required-star">*</span></label>
                <div className={`travel-field-line ${getFieldHasError("confirmPassword") ? "has-error" : ""}`}>
                  <input
                    id="register-confirm-password"
                    type={showConfirm ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Confirm password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    autoComplete="new-password"
                    maxLength={64}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="travel-eye-btn"
                    onClick={() => setShowConfirm(!showConfirm)}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                    disabled={loading}
                  >
                    {showConfirm ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                <p className="travel-field-error">{getFieldDisplayError("confirmPassword") || "\u00A0"}</p>
              </div>

              <div className="travel-field travel-email-field">
                <label className="travel-label" htmlFor="register-email">E-mail Address <span className="travel-required-star">*</span></label>
                <div className={`travel-field-line travel-email-otp-line ${getFieldHasError("email") ? "has-error" : ""} ${isOtpVerified ? "is-verified" : ""}`}>
                  <input
                    id="register-email"
                    type="email"
                    name="email"
                    placeholder="name@example.com"
                    value={form.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onKeyDown={handleEmailKeyDown}
                    onPaste={handleEmailPaste}
                    autoComplete="new-email"
                    autoCapitalize="none"
                    spellCheck={false}
                    disabled={loading || isOtpVerified}
                  />
                  {!isOtpVerified && (
                    <button
                      type="button"
                      className="travel-send-otp-btn"
                      onClick={
                        otpTimerExpired
                          ? resendRegistrationOtp
                          : emailOtpSent
                          ? verifyRegistrationOtp
                          : sendRegistrationOtp
                      }
                      disabled={loading}
                    >
                      {loadingAction === "otp"
                        ? "Sending..."
                        : loadingAction === "verify-otp"
                        ? "Verifying..."
                        : otpTimerExpired
                        ? "Resend OTP"
                        : emailOtpSent
                        ? "Verify OTP"
                        : "Send OTP"}
                    </button>
                  )}

                  {isOtpVerified &&
                    hasValue(form.email) &&
                    !getFieldHasError("email") && (
                      <FaCheckCircle
                        className="travel-field-check"
                        aria-hidden="true"
                      />
                    )}
                </div>
                <p className="travel-field-error">{getFieldDisplayError("email") || "\u00A0"}</p>
              </div>

              {showOtpUI && (
                <div className={`travel-field travel-otp-field ${shakeOtp ? "shake-animation" : ""}`}>
                  <label className="travel-label" htmlFor="register-email-otp">Enter OTP <span className="travel-required-star">*</span></label>
                    {/* {Array.from({ length: OTP_LENGTH }).map((_, index) => (
                      <input
                        key={index}
                        ref={(element) => {
                          otpInputRefs.current[index] = element;
                        }}
                        id={index === 0 ? "register-email-otp" : undefined}
                        type="text"
                        inputMode="numeric"
                        autoComplete={index === 0 ? "one-time-code" : "off"}
                        aria-label={`OTP digit ${index + 1}`}
                        value={emailOtp[index] || ""}
                        onChange={(event) => handleOtpBoxChange(index, event.target.value)}
                        onKeyDown={(event) => handleOtpKeyDown(index, event)}
                        onPaste={(event) => handleOtpPaste(index, event)}
                        maxLength={1}
                        disabled={loading}
                      />
                    ))} */}
                  <div
                    className={`travel-otp-row ${
                      otpSecondsLeft <= 6 || otpInlineMessage ? "timer-danger" : ""
                    }`}
                  >
                    <div
                      className={`travel-otp-boxes ${
                        otpInlineMessage || otpPopupMessage ? "has-error" : ""
                      }`}
                    >
                      {Array.from({ length: OTP_LENGTH }).map((_, index) => (
                        <input
                          key={index}
                          ref={(element) => {
                            otpInputRefs.current[index] = element;
                          }}
                          id={index === 0 ? "register-email-otp" : undefined}
                          type="text"
                          inputMode="numeric"
                          autoComplete={index === 0 ? "one-time-code" : "off"}
                          aria-label={`OTP digit ${index + 1}`}
                          value={emailOtp[index] || ""}
                          onChange={(event) =>
                            handleOtpBoxChange(index, event.target.value)
                          }
                          onKeyDown={(event) =>
                            handleOtpKeyDown(index, event)
                          }
                          onPaste={(event) =>
                            handleOtpPaste(index, event)
                          }
                          maxLength={1}
                          disabled={loading}
                        />
                      ))}
                    </div>

                    <span
                      className={`travel-otp-timer ${
                        otpInlineMessage
                          ? "is-error"
                          : otpSecondsLeft <= 6
                            ? "is-warning"
                            : ""
                      }`}
                    >
                      {otpInlineMessage || formatOtpTime(otpSecondsLeft)}
                    </span>
                  </div>

                  {otpPopupMessage && (
                    <div
                      className="travel-invalid-otp-popup"
                      role="alert"
                      aria-live="assertive"
                    >
                      <span className="travel-invalid-icon">!</span>
                      <span className="travel-invalid-text">{otpPopupMessage}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

                <div className="travel-terms-wrap">
                  <label className={`travel-terms ${getFieldHasError("agree") ? "has-error" : ""}`}>
                <input
                  type="checkbox"
                  name="agree"
                  checked={form.agree}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loading}
                />
                <span>
                  I agree with{" "}
                  <span className="travel-terms-link">Terms & Conditions</span>
                  <span className="travel-required-star"> *</span>
                </span>
              </label>
              <p className="travel-field-error">{getFieldDisplayError("agree") || "\u00A0"}</p>
            </div>

            {showGlobalError && (
              <p className="form-global-error">{statusMessage}</p>
            )}

            <div className="travel-auth-actions">
              <button
                type="submit"
                className="travel-btn travel-btn-primary travel-signup-otp-btn"
                disabled={loading}
              >
                {loadingAction === "register"
                  ? "Signing Up..."
                  : loadingAction === "verify-otp"
                    ? "Verifying OTP..."
                    : "Sign Up"}
              </button>
              {isOtpVerified && (
                <button
                  type="button"
                  className="travel-btn travel-btn-secondary"
                  onClick={restartRegistration}
                  disabled={loading}
                >
                  Use another email
                </button>
              )}
            </div>

            <p className="travel-auth-footnote">
              Already have account?{" "}
              <button
                type="button"
                className="travel-footnote-link"
                onClick={() => navigate("/login")}
              >
                Sign In
              </button>
            </p>
          </form>
        </section>
      </div>
    </div>
  );
};

export default Register;
