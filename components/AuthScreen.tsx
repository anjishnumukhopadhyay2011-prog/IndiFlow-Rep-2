// Authentication Screen - Polished commercial login/signup UI
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Navigation,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  Sparkles,
  Shield,
  CheckCircle2,
  MapPin,
  Clock,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

type AuthMode = "login" | "signup" | "forgot-password";

interface AuthScreenProps {
  onSuccess?: () => void;
}

export function AuthScreen({ onSuccess }: AuthScreenProps) {
  const { login, signup, forgotPassword, error, clearError } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setAgreeToTerms(false);
    setSuccessMessage(null);
    setLocalError(null);
    clearError();
  };

  const switchMode = (newMode: AuthMode) => {
    resetForm();
    setMode(newMode);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setIsLoading(true);

    const success = await login({ email, password });
    setIsLoading(false);

    if (success) {
      onSuccess?.();
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (password !== confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }

    if (!agreeToTerms) {
      setLocalError("Please agree to the terms and conditions");
      return;
    }

    setIsLoading(true);
    const success = await signup({ name, email, password, phone: phone || undefined });
    setIsLoading(false);

    if (success) {
      onSuccess?.();
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setIsLoading(true);

    const success = await forgotPassword(email);
    setIsLoading(false);

    if (success) {
      setSuccessMessage("Check your email for password reset instructions");
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex">
      {/* Left Side - Branding & Features */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 left-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Navigation className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">IndiFlow</h1>
              <p className="text-slate-400 text-sm">Smart Traffic Navigation</p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
              Navigate India's roads<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                with AI-powered intelligence
              </span>
            </h2>
            <p className="text-lg text-slate-400 max-w-lg">
              Real-time traffic predictions, smart route optimization, and local insights
              powered by machine learning.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <FeatureCard
              icon={Zap}
              title="Real-time Updates"
              description="Live traffic data from across India"
              color="from-yellow-500 to-orange-500"
            />
            <FeatureCard
              icon={MapPin}
              title="Smart Routes"
              description="AI-optimized path suggestions"
              color="from-blue-500 to-cyan-500"
            />
            <FeatureCard
              icon={Clock}
              title="Time Predictions"
              description="Accurate ETA with ML models"
              color="from-purple-500 to-pink-500"
            />
            <FeatureCard
              icon={Shield}
              title="Safe Navigation"
              description="Avoid accident-prone areas"
              color="from-green-500 to-emerald-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center gap-6 text-sm text-slate-500">
          <span>Trusted by 100,000+ users</span>
          <Separator orientation="vertical" className="h-4 bg-slate-700" />
          <span>4.8 rating</span>
          <Separator orientation="vertical" className="h-4 bg-slate-700" />
          <span>Made in India</span>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Navigation className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">IndiFlow</h1>
              <p className="text-xs text-slate-400">Smart Traffic Navigation</p>
            </div>
          </div>

          <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-800 shadow-2xl">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-bold text-white text-center">
                {mode === "login" && "Welcome back"}
                {mode === "signup" && "Create account"}
                {mode === "forgot-password" && "Reset password"}
              </CardTitle>
              <CardDescription className="text-slate-400 text-center">
                {mode === "login" && "Sign in to access your personalized routes"}
                {mode === "signup" && "Start your smart navigation journey"}
                {mode === "forgot-password" && "Enter your email to receive reset instructions"}
              </CardDescription>
            </CardHeader>

            <CardContent>
              {displayError && (
                <Alert className="mb-4 bg-red-900/20 border-red-700/50">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-red-300 ml-2">
                    {displayError}
                  </AlertDescription>
                </Alert>
              )}

              {successMessage && (
                <Alert className="mb-4 bg-green-900/20 border-green-700/50">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  <AlertDescription className="text-green-300 ml-2">
                    {successMessage}
                  </AlertDescription>
                </Alert>
              )}

              {/* Login Form */}
              {mode === "login" && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-slate-300">
                      Email address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="login-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
                        disabled={isLoading}
                        autoComplete="email"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password" className="text-slate-300">
                        Password
                      </Label>
                      <button
                        type="button"
                        onClick={() => switchMode("forgot-password")}
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="pl-10 pr-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
                        disabled={isLoading}
                        autoComplete="current-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || !email || !password}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-6 text-base font-medium shadow-lg shadow-blue-500/25"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign in
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              )}

              {/* Signup Form */}
              {mode === "signup" && (
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-slate-300">
                      Full name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="signup-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your full name"
                        className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                        disabled={isLoading}
                        autoComplete="name"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-slate-300">
                      Email address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="signup-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                        disabled={isLoading}
                        autoComplete="email"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-phone" className="text-slate-300">
                      Phone number <span className="text-slate-500">(optional)</span>
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="signup-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                        disabled={isLoading}
                        autoComplete="tel"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-slate-300">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        className="pl-10 pr-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                        disabled={isLoading}
                        autoComplete="new-password"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm" className="text-slate-300">
                      Confirm password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="signup-confirm"
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                        className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                        disabled={isLoading}
                        autoComplete="new-password"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/30">
                    <Checkbox
                      id="terms"
                      checked={agreeToTerms}
                      onCheckedChange={(checked) => setAgreeToTerms(checked === true)}
                      className="mt-0.5 border-slate-600 data-[state=checked]:bg-blue-600"
                    />
                    <label htmlFor="terms" className="text-sm text-slate-400 cursor-pointer">
                      I agree to the{" "}
                      <span className="text-blue-400 hover:underline">Terms of Service</span> and{" "}
                      <span className="text-blue-400 hover:underline">Privacy Policy</span>
                    </label>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || !name || !email || !password || !confirmPassword}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-6 text-base font-medium shadow-lg shadow-blue-500/25"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-2" />
                        Create account
                      </>
                    )}
                  </Button>
                </form>
              )}

              {/* Forgot Password Form */}
              {mode === "forgot-password" && (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email" className="text-slate-300">
                      Email address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="reset-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                        disabled={isLoading}
                        autoComplete="email"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || !email}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-6 text-base font-medium"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="h-5 w-5 mr-2" />
                        Send reset link
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => switchMode("login")}
                    className="w-full text-slate-400 hover:text-white"
                  >
                    Back to sign in
                  </Button>
                </form>
              )}

              {/* Switch Mode */}
              {mode !== "forgot-password" && (
                <>
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full bg-slate-700" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-slate-900 px-4 text-sm text-slate-500">
                        {mode === "login" ? "New to IndiFlow?" : "Already have an account?"}
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => switchMode(mode === "login" ? "signup" : "login")}
                    className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white py-6"
                  >
                    {mode === "login" ? "Create an account" : "Sign in instead"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Footer */}
          <p className="text-center text-xs text-slate-500 mt-6">
            By continuing, you agree to IndiFlow's Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}

// Feature Card Component
function FeatureCard({
  icon: Icon,
  title,
  description,
  color,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <div className="group p-4 rounded-2xl bg-slate-800/30 border border-slate-700/50 hover:border-slate-600 transition-all hover:bg-slate-800/50">
      <div className={cn(
        "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3 group-hover:scale-110 transition-transform",
        color
      )}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <h3 className="font-semibold text-white mb-1">{title}</h3>
      <p className="text-sm text-slate-400">{description}</p>
    </div>
  );
}

export default AuthScreen;
