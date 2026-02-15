import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { supabase } from '../config/supabase';

// GET /api/wealth-flows
export async function getFlows(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('wealth_flows')
      .select('*')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ flows: data || [] });
  } catch (err) {
    next(err);
  }
}

// POST /api/wealth-flows
export async function createFlow(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name, tree_data } = req.body;
    if (!name) {
      res.status(400).json({ error: 'name is required' });
      return;
    }

    const { data, error } = await supabase
      .from('wealth_flows')
      .insert({
        user_id: req.userId,
        name,
        tree_data: tree_data || {},
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ flow: data });
  } catch (err) {
    next(err);
  }
}

// PUT /api/wealth-flows/:flowId
export async function updateFlow(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { flowId } = req.params;
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.tree_data !== undefined) updates.tree_data = req.body.tree_data;

    const { data, error } = await supabase
      .from('wealth_flows')
      .update(updates)
      .eq('id', flowId)
      .eq('user_id', req.userId)
      .select()
      .single();

    if (error) throw error;
    res.json({ flow: data });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/wealth-flows/:flowId
export async function deleteFlow(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { flowId } = req.params;
    const { error } = await supabase
      .from('wealth_flows')
      .delete()
      .eq('id', flowId)
      .eq('user_id', req.userId);

    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// GET /api/wealth-flows/settings
export async function getUserSettings(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('wealth_user_settings')
      .select('*')
      .eq('user_id', req.userId)
      .single();

    // PGRST116 = no rows found — not an error, just means no settings yet
    if (error && error.code !== 'PGRST116') throw error;
    res.json({ settings: data || null });
  } catch (err) {
    next(err);
  }
}

// PUT /api/wealth-flows/settings
export async function saveUserSettings(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { assets, asset_node_links, next_flow_num, next_asset_num } = req.body;

    const { data, error } = await supabase
      .from('wealth_user_settings')
      .upsert(
        {
          user_id: req.userId,
          assets: assets || {},
          asset_node_links: asset_node_links || {},
          next_flow_num: next_flow_num ?? 1,
          next_asset_num: next_asset_num ?? 1,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (error) throw error;
    res.json({ settings: data });
  } catch (err) {
    next(err);
  }
}
