import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Camera, User, Key, Shield, Trash2, Mail, Loader2 } from 'lucide-react';
import type { RootState, AppDispatch } from '@/app/store';
import { supabase } from '@/lib/supabaseClient';
import { fetchProfile, updateProfile, uploadAvatar, deleteAccount } from './profileSlice';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toaster';
import { formatDate } from '@/lib/utils';

export function ProfileSettingsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, loading, updating } = useSelector((state: RootState) => state.profile);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Profile form
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  // Password form
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '');
      setEmail(profile.email ?? '');
    }
  }, [profile]);

  const isGoogle = profile?.providers?.includes('google');

  const initials = profile?.email
    ? profile.email.slice(0, 2).toUpperCase()
    : 'U';

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    const changes: { full_name?: string; email?: string } = {};
    if (fullName !== (profile?.full_name ?? '')) changes.full_name = fullName;
    if (email !== profile?.email) changes.email = email;

    if (Object.keys(changes).length === 0) return;

    try {
      await dispatch(updateProfile(changes)).unwrap();
      toast({ title: 'Profile updated', variant: 'success' });
      if (changes.email) {
        toast({
          title: 'Email change pending',
          description: 'Check your inbox to confirm the new email address.',
        });
      }
      // Refresh session so Header picks up changes
      await supabase.auth.refreshSession();
    } catch {
      toast({ title: 'Failed to update profile', variant: 'destructive' });
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarPreview(URL.createObjectURL(file));
    try {
      await dispatch(uploadAvatar(file)).unwrap();
      toast({ title: 'Avatar updated', variant: 'success' });
      await supabase.auth.refreshSession();
    } catch {
      toast({ title: 'Failed to upload avatar', variant: 'destructive' });
      setAvatarPreview(null);
    }
    // Reset input so the same file can be re-selected
    e.target.value = '';
  }

  async function handlePasswordUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast({ title: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: 'Password updated successfully', variant: 'success' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast({ title: err.message || 'Failed to update password', variant: 'destructive' });
    } finally {
      setPasswordLoading(false);
    }
  }

  async function handleResetPassword() {
    if (!profile?.email) return;
    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });
      if (error) throw error;
      toast({
        title: 'Reset email sent',
        description: 'Check your inbox for the password reset link.',
        variant: 'success',
      });
    } catch (err: any) {
      toast({ title: err.message || 'Failed to send reset email', variant: 'destructive' });
    } finally {
      setPasswordLoading(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleteLoading(true);
    try {
      await dispatch(deleteAccount()).unwrap();
      await supabase.auth.signOut();
      navigate('/login');
    } catch {
      toast({ title: 'Failed to delete account', variant: 'destructive' });
      setDeleteLoading(false);
    }
  }

  if (loading && !profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const displayAvatar = avatarPreview || profile?.avatar_url;

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4 md:p-0">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Profile Settings</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Manage your account and preferences</p>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile Information
          </CardTitle>
          <CardDescription>Update your personal details and profile picture</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSave} className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="relative group">
                <Avatar className="h-20 w-20">
                  {displayAvatar && <AvatarImage src={displayAvatar} alt="avatar" />}
                  <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Camera className="h-5 w-5 text-white" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Profile photo</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Click the avatar to upload a new photo. Max 5MB.</p>
              </div>
            </div>

            <Separator />

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
              {email !== profile?.email && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Changing your email requires confirmation via both old and new email addresses.
                </p>
              )}
            </div>

            <Button type="submit" disabled={updating}>
              {updating && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Password
          </CardTitle>
          <CardDescription>
            {isGoogle
              ? 'You signed in with Google'
              : 'Set or update your password'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isGoogle ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Your account uses Google authentication. Password management is not applicable.
            </p>
          ) : (
            <div className="space-y-4">
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    minLength={6}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your new password"
                    minLength={6}
                    required
                  />
                </div>
                <Button type="submit" disabled={passwordLoading}>
                  {passwordLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Update Password
                </Button>
              </form>

              <Separator />

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Forgot your current password? We'll send a reset link to your email.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetPassword}
                  disabled={passwordLoading}
                >
                  <Mail className="h-4 w-4" />
                  Send Reset Email
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Account ID</dt>
              <dd className="text-gray-900 dark:text-gray-100 font-mono text-xs">
                {profile?.id ? `${profile.id.slice(0, 8)}...${profile.id.slice(-4)}` : '-'}
              </dd>
            </div>
            <Separator />
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Member since</dt>
              <dd className="text-gray-900 dark:text-gray-100">
                {profile?.created_at ? formatDate(profile.created_at) : '-'}
              </dd>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <dt className="text-gray-500 dark:text-gray-400">Auth method</dt>
              <dd>
                {isGoogle ? (
                  <Badge>Google</Badge>
                ) : (
                  <Badge variant="secondary">Email</Badge>
                )}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 dark:border-red-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <Trash2 className="h-4 w-4" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            Delete Account
          </Button>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              This will permanently delete your account, all statements, transactions, and data.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deleteConfirm">
                Type <span className="font-semibold text-red-600">DELETE</span> to confirm
              </Label>
              <Input
                id="deleteConfirm"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setDeleteOpen(false); setDeleteConfirm(''); }}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={deleteConfirm !== 'DELETE' || deleteLoading}
                onClick={handleDeleteAccount}
              >
                {deleteLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete Account
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
