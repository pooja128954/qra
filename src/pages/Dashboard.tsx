import { motion } from "framer-motion";
import { User, Mail, Calendar } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const ease = [0.16, 1, 0.3, 1] as const;

export default function Dashboard() {
  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
      >
        <h1 className="text-2xl font-semibold mb-1">Profile</h1>
        <p className="text-sm text-muted-foreground mb-8">Manage your account details.</p>

        <div className="bg-card border border-border rounded-xl p-6 max-w-lg space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center">
              <User className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-lg">John Doe</p>
              <p className="text-sm text-muted-foreground">Pro Plan</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="label-caps text-muted-foreground mb-0.5">Email</p>
                <p className="text-sm">john@company.com</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="label-caps text-muted-foreground mb-0.5">Member Since</p>
                <p className="text-sm">January 2026</p>
              </div>
            </div>
          </div>

          <button className="bg-foreground text-background px-5 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 btn-press">
            Edit Profile
          </button>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
