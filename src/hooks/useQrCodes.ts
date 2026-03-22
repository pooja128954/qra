import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import type { Database } from "@/lib/database.types";

export type QrCode = Database["public"]["Tables"]["qr_codes"]["Row"];
export type QrCodeInsert = Omit<
  Database["public"]["Tables"]["qr_codes"]["Insert"],
  "user_id"
>;

export function useQrCodes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: codes = [], isLoading } = useQuery({
    queryKey: ["qr_codes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("qr_codes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as QrCode[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: QrCodeInsert) => {
      if (!user) throw new Error("Not logged in");
      const { error } = await supabase
        .from("qr_codes")
        .insert({ ...payload, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qr_codes", user?.id] });
      toast.success("QR code saved!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<QrCodeInsert> }) => {
      const { error } = await supabase.from("qr_codes").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qr_codes", user?.id] });
      toast.success("QR code updated!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("qr_codes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qr_codes", user?.id] });
      toast.success("QR code deleted.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: "active" | "paused";
    }) => {
      // @ts-ignore
      // @ts-ignore
      const { error } = await supabase
        .from("qr_codes")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qr_codes", user?.id] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const createQrCode = useCallback(
    async (payload: QrCodeInsert) => {
      return await createMutation.mutateAsync(payload);
    },
    [createMutation]
  );

  const deleteQrCode = useCallback(
    async (id: string) => {
      return await deleteMutation.mutateAsync(id);
    },
    [deleteMutation]
  );

  const updateQrCodeStatus = useCallback(
    async (id: string, status: "active" | "paused") => {
      return await updateStatusMutation.mutateAsync({ id, status });
    },
    [updateStatusMutation]
  );

  const updateQrCode = useCallback(
    async (id: string, payload: Partial<QrCodeInsert>) => {
      return await updateMutation.mutateAsync({ id, payload });
    },
    [updateMutation]
  );

  return {
    codes,
    isLoading,
    createQrCode,
    isCreating: createMutation.isPending,
    deleteQrCode,
    isDeleting: deleteMutation.isPending,
    updateQrCodeStatus,
    updateQrCode,
  };
}
