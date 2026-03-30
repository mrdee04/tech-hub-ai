import { supabase } from '../supabaseClient';

export interface BottomPriceReport {
  id: string;
  product_id: string;
  user_id: string;
  variant_combination: Record<string, string>;
  reported_price: number;
  screenshot_url?: string;
  shopping_time?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  profiles?: {
    full_name: string;
  };
  products?: {
    name: string;
  };
}

export const submitBottomPriceReport = async (report: Omit<BottomPriceReport, 'id' | 'status' | 'created_at'>): Promise<boolean> => {
  const { error } = await supabase
    .from('bottom_price_reports')
    .insert([report]);

  if (error) {
    console.error('Error submitting bottom price report:', error);
    return false;
  }
  return true;
};

export const fetchAllReportsForAdmin = async (): Promise<BottomPriceReport[]> => {
  const { data, error } = await supabase
    .from('bottom_price_reports')
    .select('*, profiles(full_name), products(name)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching reports:', error);
    return [];
  }
  return data as BottomPriceReport[];
};

export const updateReportStatus = async (reportId: string, status: 'approved' | 'rejected'): Promise<boolean> => {
  const { error } = await supabase
    .from('bottom_price_reports')
    .update({ status })
    .eq('id', reportId);

  if (error) {
    console.error('Error updating report status:', error);
    return false;
  }
  return true;
};

export const fetchReportsByProductId = async (productId: string): Promise<BottomPriceReport[]> => {
  const { data, error } = await supabase
    .from('bottom_price_reports')
    .select('*')
    .eq('product_id', productId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching product reports:', error);
    return [];
  }
  return data as BottomPriceReport[];
};
