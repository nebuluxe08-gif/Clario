import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useGetProfile, useUpdateProfile, useGetStats, getGetProfileQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, User, Mail, PenTool, Layout, FileText, Activity } from "lucide-react";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  bio: z.string().max(160, "Bio must be less than 160 characters").optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function Profile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const { data: profile, isLoading: isLoadingProfile } = useGetProfile();
  const { data: stats, isLoading: isLoadingStats } = useGetStats();
  const updateProfileMutation = useUpdateProfile();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile?.name || "",
      email: profile?.email || "",
      bio: profile?.bio || "",
    },
    values: {
      name: profile?.name || "",
      email: profile?.email || "",
      bio: profile?.bio || "",
    }
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
      }
    });
  };

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

  return (
    <div className="container max-w-4xl mx-auto py-12 px-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight">Your Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your account and view writing statistics.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_2fr] gap-8 mb-12">
        <Card className="border-border/50 bg-card shadow-sm">
          <CardHeader className="text-center pb-2">
            <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-background shadow-sm">
              <AvatarImage src={profile?.avatarUrl || ""} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary font-serif">
                {profile?.name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="font-serif text-xl">{profile?.name}</CardTitle>
            <CardDescription>{profile?.email}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mt-2">{profile?.bio || "No bio provided."}</p>
            <div className="mt-6 flex justify-center">
              <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
                {isEditing ? "Cancel" : "Edit Profile"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <User size={18} className="text-muted-foreground"/> 
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
                        <FormLabel>Name</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl><Input {...field} type="email" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl><Textarea {...field} className="resize-none" rows={3} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={updateProfileMutation.isPending} className="w-full">
                    {updateProfileMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Changes"}
                  </Button>
                </form>
              </Form>
            ) : (
              <div className="space-y-6">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Full Name</div>
                  <div className="text-base">{profile?.name}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Email Address</div>
                  <div className="text-base">{profile?.email}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Bio</div>
                  <div className="text-base">{profile?.bio || <span className="text-muted-foreground italic">None provided</span>}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Member Since</div>
                  <div className="text-base">{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}</div>
                </div>
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
        <StatCard label="Total Docs" value={stats?.totalDocuments || 0} icon={<FileText size={16} className="text-muted-foreground"/>} />
        <StatCard label="Avg. Grammar" value={stats?.avgGrammarScore || 0} highlight="text-chart-1" />
        <StatCard label="Avg. Fluency" value={stats?.avgFluencyScore || 0} highlight="text-chart-2" />
        <StatCard label="Avg. Clarity" value={stats?.avgClarityScore || 0} highlight="text-chart-3" />
        <StatCard label="Avg. Engagement" value={stats?.avgEngagementScore || 0} highlight="text-chart-4" />
      </div>
    </div>
  );
}

function StatCard({ label, value, highlight, icon }: { label: string, value: number | string, highlight?: string, icon?: React.ReactNode }) {
  return (
    <div className="p-5 rounded-xl border border-border bg-card shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
        {icon}
      </div>
      <div className={`text-3xl font-serif font-bold ${highlight || 'text-foreground'}`}>
        {typeof value === 'number' && highlight ? Math.round(value) : value}
      </div>
    </div>
  );
}
