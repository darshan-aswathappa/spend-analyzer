import { Response, NextFunction } from 'express';
import path from 'path';
import { AuthenticatedRequest } from '../types';
import { supabase } from '../config/supabase';

export async function getProfile(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.userId)
      .single();

    if (profileError) throw profileError;

    const { data: authData, error: authError } = await supabase.auth.admin.getUserById(req.userId);
    if (authError) throw authError;

    const user = authData.user;
    const providers: string[] = user.app_metadata?.providers ?? [];
    let auth_provider = 'email';
    if (providers.includes('google')) {
      auth_provider = 'google';
    } else if (providers.includes('email')) {
      // Check if user has identities that indicate password-based signup
      const emailIdentity = user.identities?.find((i) => i.provider === 'email');
      // If the user signed up with OTP (magic link), they may not have a password.
      // Supabase doesn't directly expose this, so we use a heuristic:
      // If the user has logged in via password at least once, the provider is 'email'.
      // We'll let the client handle both set/change password flows.
      auth_provider = 'email';
    }

    res.json({
      id: profile.id,
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      email: user.email,
      created_at: profile.created_at,
      auth_provider,
      providers,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { full_name, email } = req.body;

    if (full_name !== undefined) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name })
        .eq('id', req.userId);

      if (profileError) throw profileError;

      // Keep user_metadata in sync
      await supabase.auth.admin.updateUserById(req.userId, {
        user_metadata: { full_name },
      });
    }

    if (email !== undefined) {
      const { error: emailError } = await supabase.auth.admin.updateUserById(req.userId, {
        email,
      });
      if (emailError) throw emailError;
    }

    // Return updated profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.userId)
      .single();

    if (error) throw error;

    const { data: authData } = await supabase.auth.admin.getUserById(req.userId);

    res.json({
      id: profile.id,
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      email: authData.user?.email,
      created_at: profile.created_at,
    });
  } catch (err) {
    next(err);
  }
}

export async function uploadAvatar(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  try {
    const ext = path.extname(file.originalname).slice(1) || 'png';
    const filePath = `${req.userId}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file.buffer, {
        upsert: true,
        contentType: file.mimetype,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // Append cache-buster so browsers pick up the new image
    const avatar_url = `${urlData.publicUrl}?t=${Date.now()}`;

    // Update profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ avatar_url })
      .eq('id', req.userId);

    if (profileError) throw profileError;

    // Keep user_metadata in sync so Header picks it up
    await supabase.auth.admin.updateUserById(req.userId, {
      user_metadata: { avatar_url },
    });

    res.json({ avatar_url });
  } catch (err) {
    next(err);
  }
}

export async function deleteAccount(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Delete avatar files from storage (best-effort)
    const { data: files } = await supabase.storage
      .from('avatars')
      .list(req.userId);

    if (files && files.length > 0) {
      await supabase.storage
        .from('avatars')
        .remove(files.map((f) => `${req.userId}/${f.name}`));
    }

    // Delete the auth user — cascades to profiles and all related data
    const { error } = await supabase.auth.admin.deleteUser(req.userId);
    if (error) throw error;

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
