import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '@/lib/apiClient';

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string;
  created_at: string;
  auth_provider: string;
  providers: string[];
}

interface ProfileState {
  profile: Profile | null;
  loading: boolean;
  updating: boolean;
  error: string | null;
}

const initialState: ProfileState = {
  profile: null,
  loading: false,
  updating: false,
  error: null,
};

export const fetchProfile = createAsyncThunk('profile/fetch', async () => {
  const { data } = await apiClient.get('/api/profile');
  return data as Profile;
});

export const updateProfile = createAsyncThunk(
  'profile/update',
  async (payload: { full_name?: string; email?: string }) => {
    const { data } = await apiClient.patch('/api/profile', payload);
    return data;
  }
);

export const uploadAvatar = createAsyncThunk(
  'profile/uploadAvatar',
  async (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const { data } = await apiClient.post('/api/profile/avatar', formData);
    return data as { avatar_url: string };
  }
);

export const deleteAccount = createAsyncThunk('profile/delete', async () => {
  await apiClient.delete('/api/profile');
});

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    clearProfileError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
        state.loading = false;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to load profile';
      })
      .addCase(updateProfile.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.updating = false;
        if (state.profile) {
          state.profile.full_name = action.payload.full_name;
          state.profile.email = action.payload.email;
        }
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.updating = false;
        state.error = action.error.message ?? 'Failed to update profile';
      })
      .addCase(uploadAvatar.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(uploadAvatar.fulfilled, (state, action) => {
        state.updating = false;
        if (state.profile) {
          state.profile.avatar_url = action.payload.avatar_url;
        }
      })
      .addCase(uploadAvatar.rejected, (state, action) => {
        state.updating = false;
        state.error = action.error.message ?? 'Failed to upload avatar';
      });
  },
});

export const { clearProfileError } = profileSlice.actions;
export default profileSlice.reducer;
