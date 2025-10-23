"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

interface JoinModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type StatusType = {
  type: "idle" | "loading" | "success" | "error";
  message: string;
};

export function JoinModal({ open, onOpenChange }: JoinModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    discord: "",
    phone: "",
    email: "",
  });
  const [status, setStatus] = useState<StatusType>({
    type: "idle",
    message: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: "loading", message: "Submitting application..." });

    // The Next.js API route is located at /api/application
    try {
      // 🎯 FIX: This is the missing fetch call to your Next.js API route
      const response = await fetch("/api/application", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        // Success
        setStatus({
          type: "success",
          message:
            "Application submitted successfully! Check Discord for updates.",
        });
        // Clear the form after success
        setFormData({ name: "", discord: "", phone: "", email: "" });

        // Auto-close modal after a short delay for user to see the message
        setTimeout(() => onOpenChange(false), 3000);
      } else {
        // API Route/Bot Server Error
        setStatus({
          type: "error",
          message:
            result.message ||
            "Submission failed. Check your data and try again.",
        });
        console.error("Submission failed on server:", result);
      }
    } catch (error) {
      // Network/Connection Error
      console.error("Network error during submission:", error);
      setStatus({
        type: "error",
        message: "A network error occurred. Please check your connection.",
      });
    }
  };

  // Determine if the form can be submitted (must not be loading and must have required fields)
  const isFormValid =
    formData.name.trim() !== "" &&
    formData.discord.trim() !== "" &&
    formData.email.trim() !== "";
  const isLoading = status.type === "loading";
  const isError = status.type === "error";
  const isSuccess = status.type === "success";
  const isFormDisabled = isLoading || isSuccess;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black uppercase text-primary">
            Join CCC Esports
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Fill out the form below to join our competitive gaming community
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground font-semibold">
              Full Name *
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              required
              value={formData.name}
              onChange={handleInputChange}
              className="bg-background border-primary/20 focus:border-primary"
              disabled={isFormDisabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground font-semibold">
              Email Address *
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="john.doe@college.edu"
              required
              value={formData.email}
              onChange={handleInputChange}
              className="bg-background border-primary/20 focus:border-primary"
              disabled={isFormDisabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="discord" className="text-foreground font-semibold">
              Discord Username *
            </Label>
            <Input
              id="discord"
              type="text"
              placeholder="username#1234 or @username"
              required
              value={formData.discord}
              onChange={handleInputChange}
              className="bg-background border-primary/20 focus:border-primary"
              disabled={isFormDisabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-foreground font-semibold">
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="(555) 123-4567"
              value={formData.phone}
              onChange={handleInputChange}
              className="bg-background border-primary/20 focus:border-primary"
              disabled={isFormDisabled}
            />
          </div>

          {/* Status Message Display */}
          {status.type !== "idle" && (
            <div
              className={`p-3 rounded-lg flex items-center gap-2 font-medium ${
                isSuccess
                  ? "bg-green-500/10 text-green-500 border border-green-500/30"
                  : isError
                  ? "bg-red-500/10 text-red-500 border border-red-500/30"
                  : "bg-blue-500/10 text-blue-500 border border-blue-500/30"
              }`}
            >
              {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
              {isSuccess && <CheckCircle className="h-5 w-5" />}
              {isError && <XCircle className="h-5 w-5" />}
              {status.message}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="flex-1 font-bold uppercase tracking-wide"
              disabled={!isFormValid || isLoading || isSuccess}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Submit Application"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="font-bold uppercase tracking-wide"
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
