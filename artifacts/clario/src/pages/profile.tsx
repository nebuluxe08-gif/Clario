import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUser } from "@clerk/react";
import { useGetProfile, useUpdateProfile, useGetStats, getGetProfileQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, User, FileText, Activity, Calendar } from "lucide-react";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  bio: z.string().max(160, "Bio must be less than 160 characters").optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function Profile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [synced, setSynced] = useState(false);

  const { user: clerkUser, isSignedIn, isLoaded: isClerkLoaded } = useUser();
  const { data: profile, isLoading: isLoadingProfile } = useGetProfile();
  const { data: stats, isLoading: isLoadingStats } = useGetStats();
  const updateProfileMutation = useUpdateProfile();

  const clerkName = [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") || clerkUser?.username || "";
  const clerkEmail = clerkUser?.primaryEmailAddress?.emailAddress || clerkUser?.emailAddresses?.[0]?.emailAddress || "";
  const clerkAvatar = clerkUser?.imageUrl || "";

  const displayName = profile?.name || clerkName;
  const displayEmail = profile?.email || clerkEmail;
  const displayAvatar = clerkAvatar || profile?.avatarUrl || "";

  useEffect(() => {
    if (!isSignedIn || !isClerkLoaded || !clerkUser || synced) return;
    if (isLoadingProfile) return;

    const name = clerkName;
    const email = clerkEmail;
    const avatarUrl = clerkAvatar || null;

    if (!name && !email) return;

    setSynced(true);

    fetch("/api/profile/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, avatarUrl }),
      credentials: "include",
    })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
      })
      .catch(() => {});
  }, [isSignedIn, isClerkLoaded, clerkUser, isLoadingProfile, synced]);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: displayName, email: displayEmail, bio: "" },
    values: {
      name: displayName,
      email: displayEmail,
      bio: profile?.bio || "",
    },
  });

  const onSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate({ data }, {
      onSuccess: () => {
        toast({ title: "Profile updated", description: "Your changes have been saved." });
        setIsEditing(false);
        queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
      },
      onError: () => {
        toast({ title: "Update failed", description: "Could not save your changes.", variant: "destructive" });
      },
    });
  };

  if (!isClerkLoaded || !isSignedIn) {
    return (
      <div className="container max-w-4xl mx-auto py-20 px-6 text-center">
        <p className="text-muted-foreground">Please sign in to view your profile.</p>
      </div>
    );
  }

  if (isLoadingProfile || isLoadingStats) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-6 space-y-8">
        <Skeleton className="h-[200px] w-full rounded-2xl" />
        <div className="grid md:grid-cols-3 gap-6">
          <Skeleton className="h-[150px] w-full rounded-xl" />
          <Skeleton className="h-[150px] w-full rounded-xl" />
          <Skeleton className="h-[150px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  const initials = displayName
    ? displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : (displayEmail?.[0] || "U").toUpperCase();

  const joinDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <div className="container max-w-4xl mx-auto py-12 px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold tracking-tight">Your Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your account and view writing statistics.</p>
      </div>

      <div className="grid md:grid-cols-[1fr_2fr] gap-8 mb-12">
        <Card className="border-border/50 bg-card shadow-sm">
          <CardHeader className="text-center pb-4 pt-8">
            <div className="relative mx-auto mb-4 w-fit">
              <Avatar className="w-24 h-24 border-4 border-background shadow-md">
                <AvatarImage src={displayAvatar} alt={displayName} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary font-serif">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="font-serif text-xl">{displayName || "—"}</CardTitle>
            <p className="text-sm text-muted-foreground truncate px-2">{displayEmail || "—"}</p>
          </CardHeader>
          <CardContent className="text-center pb-8">
            {profile?.bio && (
              <p className="text-sm text-muted-foreground mb-4 px-2">{profile.bio}</p>
            )}
            {joinDate && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mb-5">
                <Calendar size={12} />
                <span>Joined {joinDate}</span>
              </div>
            )}
            <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)} className="w-full">
              {isEditing ? "Cancel" : "Edit Profile"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <User size={18} className="text-muted-foreground" />
              {isEditing ? "Edit Details" : "Personal Information"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input placeholder="your@email.com" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell us a little about yourself…"
                            className="resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="w-full"
                  >
                    {updateProfileMutation.isPending ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </form>
              </Form>
            ) : (
              <div className="space-y-5">
                <InfoRow label="Full Name" value={displayName} />
                <InfoRow label="Email Address" value={displayEmail} />
                <InfoRow label="Bio" value={profile?.bio} placeholder="No bio yet — click Edit Profile to add one." />
                <InfoRow label="Member Since" value={joinDate} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 flex items-center gap-2">
        <Activity className="text-primary" size={20} />
        <h2 className="text-2xl font-serif font-bold tracking-tight">Writing Analytics</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <StatCard label="Total Docs" value={stats?.totalDocuments ?? 0} icon={<FileText size={16} className="text-muted-foreground" />} />
        <StatCard label="Avg. Grammar" value={stats?.avgGrammarScore ?? 0} highlight="text-emerald-500" />
        <StatCard label="Avg. Fluency" value={stats?.avgFluencyScore ?? 0} highlight="text-amber-500" />
        <StatCard label="Avg. Clarity" value={stats?.avgClarityScore ?? 0} highlight="text-blue-500" />
        <StatCard label="Avg. Engagement" value={stats?.avgEngagementScore ?? 0} highlight="text-purple-500" />
      </div>
    </div>
  );
}

function InfoRow({ label, value, placeholder }: { label: string; value?: string | number | null; placeholder?: string }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      <div className="text-base">
        {value || <span className="text-muted-foreground italic text-sm">{placeholder ?? "—"}</span>}
      </div>
    </div>
  );
}

function StatCard({ label, value, highlight, icon }: { label: string; value: number | string; highlight?: string; icon?: React.ReactNode }) {
  return (
    <div className="p-5 rounded-xl border border-border bg-card shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
        {icon}
      </div>
      <div className={`text-3xl font-serif font-bold ${highlight || "text-foreground"}`}>
        {typeof value === "number" && highlight ? Math.round(value) : value}
      </div>
    </div>
  );
}
