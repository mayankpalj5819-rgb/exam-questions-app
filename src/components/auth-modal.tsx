"use client";

import { useState, useMemo } from "react";
import { signIn } from "next-auth/react";
import { useAppState } from "@/hooks/use-app-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Loader2, GraduationCap, Mail, Lock, User, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password: string): { valid: boolean; message: string } {
  if (password.length < 6) {
    return { valid: false, message: "Password must be at least 6 characters" };
  }
  return { valid: true, message: "" };
}

export function AuthModal() {
  const { authModalOpen, setAuthModalOpen } = useAppState();

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginShowPassword, setLoginShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginErrors, setLoginErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  // Register state
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerShowPassword, setRegisterShowPassword] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerErrors, setRegisterErrors] = useState<{ name?: string; email?: string; password?: string; general?: string }>({});

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { email?: string; password?: string } = {};

    if (!loginEmail.trim()) {
      errors.email = "Email is required";
    } else if (!validateEmail(loginEmail)) {
      errors.email = "Please enter a valid email";
    }

    if (!loginPassword) {
      errors.password = "Password is required";
    }

    if (Object.keys(errors).length > 0) {
      setLoginErrors(errors);
      return;
    }

    setLoginErrors({});
    setLoginLoading(true);
    try {
      const result = await signIn("credentials", {
        email: loginEmail,
        password: loginPassword,
        redirect: false,
      });
      if (result?.error) {
        setLoginErrors({ general: "Invalid email or password" });
      } else {
        toast.success("Welcome back!");
        setAuthModalOpen(false);
        resetLoginForm();
      }
    } catch {
      setLoginErrors({ general: "Something went wrong. Please try again." });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { name?: string; email?: string; password?: string } = {};

    if (!registerEmail.trim()) {
      errors.email = "Email is required";
    } else if (!validateEmail(registerEmail)) {
      errors.email = "Please enter a valid email";
    }

    const pwCheck = validatePassword(registerPassword);
    if (!registerPassword) {
      errors.password = "Password is required";
    } else if (!pwCheck.valid) {
      errors.password = pwCheck.message;
    }

    if (Object.keys(errors).length > 0) {
      setRegisterErrors(errors);
      return;
    }

    setRegisterErrors({});
    setRegisterLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: registerEmail,
          password: registerPassword,
          name: registerName || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRegisterErrors({ general: data.error || "Registration failed" });
        return;
      }
      // Auto sign in after registration
      const result = await signIn("credentials", {
        email: registerEmail,
        password: registerPassword,
        redirect: false,
      });
      if (result?.error) {
        toast.success("Account created! Please log in.");
        return;
      }
      toast.success("Account created successfully!");
      setAuthModalOpen(false);
      resetRegisterForm();
    } catch {
      setRegisterErrors({ general: "Something went wrong. Please try again." });
    } finally {
      setRegisterLoading(false);
    }
  };

  const resetLoginForm = () => {
    setLoginEmail("");
    setLoginPassword("");
    setLoginErrors({});
  };

  const resetRegisterForm = () => {
    setRegisterName("");
    setRegisterEmail("");
    setRegisterPassword("");
    setRegisterErrors({});
  };

  const handleForgotPassword = () => {
    toast.info("Password reset is coming soon!");
  };

  return (
    <Dialog open={authModalOpen} onOpenChange={(open) => {
      if (!open) {
        resetLoginForm();
        resetRegisterForm();
      }
      setAuthModalOpen(open);
    }}>
      <DialogContent className="sm:max-w-[420px] mx-auto p-0 gap-0 overflow-hidden">
        {/* Branding header */}
        <div className="px-6 pt-6 pb-4">
          <DialogHeader>
            <div className="flex items-center justify-center gap-2.5 mb-1.5">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/50">
                <GraduationCap className="h-5.5 w-5.5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <DialogTitle className="text-center text-xl font-bold">
              JEE PYQ Vault
            </DialogTitle>
            <p className="text-center text-sm text-muted-foreground mt-1">
              Save and practice previous year questions
            </p>
          </DialogHeader>
        </div>

        <Tabs defaultValue="login" className="px-6 pb-6">
          <TabsList className="grid w-full grid-cols-2 h-10">
            <TabsTrigger value="login" className="text-sm rounded-lg">Login</TabsTrigger>
            <TabsTrigger value="register" className="text-sm rounded-lg">Register</TabsTrigger>
          </TabsList>

          {/* LOGIN TAB */}
          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4 mt-5">
              {/* General error */}
              <AnimatePresence>
                {loginErrors.general && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {loginErrors.general}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-1.5">
                <Label htmlFor="login-email" className="text-sm font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={loginEmail}
                    onChange={(e) => {
                      setLoginEmail(e.target.value);
                      if (loginErrors.email) setLoginErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    disabled={loginLoading}
                    className={cn(
                      "h-10 pl-10 rounded-lg",
                      loginErrors.email && "border-destructive focus-visible:ring-destructive/30"
                    )}
                    autoComplete="email"
                  />
                </div>
                <AnimatePresence>
                  {loginErrors.email && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-xs text-destructive flex items-center gap-1"
                    >
                      <AlertCircle className="h-3 w-3" />
                      {loginErrors.email}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password" className="text-sm font-medium">Password</Label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs text-amber-600 dark:text-amber-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                  <Input
                    id="login-password"
                    type={loginShowPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      if (loginErrors.password) setLoginErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    disabled={loginLoading}
                    className={cn(
                      "h-10 pl-10 pr-10 rounded-lg",
                      loginErrors.password && "border-destructive focus-visible:ring-destructive/30"
                    )}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setLoginShowPassword(!loginShowPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {loginShowPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <AnimatePresence>
                  {loginErrors.password && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-xs text-destructive flex items-center gap-1"
                    >
                      <AlertCircle className="h-3 w-3" />
                      {loginErrors.password}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <Button
                type="submit"
                className="w-full h-10 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg"
                disabled={loginLoading}
              >
                {loginLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </TabsContent>

          {/* REGISTER TAB */}
          <TabsContent value="register">
            <form onSubmit={handleRegister} className="space-y-4 mt-5">
              {/* General error */}
              <AnimatePresence>
                {registerErrors.general && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {registerErrors.general}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-1.5">
                <Label htmlFor="reg-name" className="text-sm font-medium">
                  Name <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                  <Input
                    id="reg-name"
                    type="text"
                    placeholder="Your name"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    disabled={registerLoading}
                    className="h-10 pl-10 rounded-lg"
                    autoComplete="name"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-email" className="text-sm font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="you@example.com"
                    value={registerEmail}
                    onChange={(e) => {
                      setRegisterEmail(e.target.value);
                      if (registerErrors.email) setRegisterErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    disabled={registerLoading}
                    className={cn(
                      "h-10 pl-10 rounded-lg",
                      registerErrors.email && "border-destructive focus-visible:ring-destructive/30"
                    )}
                    autoComplete="email"
                  />
                </div>
                <AnimatePresence>
                  {registerErrors.email && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-xs text-destructive flex items-center gap-1"
                    >
                      <AlertCircle className="h-3 w-3" />
                      {registerErrors.email}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                  <Input
                    id="reg-password"
                    type={registerShowPassword ? "text" : "password"}
                    placeholder="Min 6 characters"
                    value={registerPassword}
                    onChange={(e) => {
                      setRegisterPassword(e.target.value);
                      if (registerErrors.password) setRegisterErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    disabled={registerLoading}
                    className={cn(
                      "h-10 pl-10 pr-10 rounded-lg",
                      registerErrors.password && "border-destructive focus-visible:ring-destructive/30"
                    )}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setRegisterShowPassword(!registerShowPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {registerShowPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <AnimatePresence>
                  {registerErrors.password && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-xs text-destructive flex items-center gap-1"
                    >
                      <AlertCircle className="h-3 w-3" />
                      {registerErrors.password}
                    </motion.p>
                  )}
                </AnimatePresence>
                {/* Password strength hint */}
                {registerPassword && registerPassword.length > 0 && registerPassword.length < 6 && !registerErrors.password && (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    {registerPassword.length}/6 minimum characters
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-10 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg"
                disabled={registerLoading}
              >
                {registerLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}