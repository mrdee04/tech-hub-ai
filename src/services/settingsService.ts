import { supabase } from '../supabaseClient';

export interface BannerItem {
  id: string;
  isActive: boolean;
  text: string;
  link?: string;
  imageUrl?: string;
}

export interface GlobalBannerData {
  enabled: boolean;
  items: BannerItem[];
}

export const fetchGlobalBanner = async (): Promise<GlobalBannerData | null> => {
  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('id', 'global_banner')
    .single();

  if (error) {
    if (error.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Error fetching global banner:', error);
    }
    return null;
  }

  // Backward compatibility: Convert old single-banner format to new multi-banner array if needed.
  let items: BannerItem[] = data?.value?.items || [];
  if (items.length === 0 && data?.value?.text) {
    items = [{
      id: 'default-1',
      isActive: true,
      text: data.value.text,
      link: data.value.link || '',
      imageUrl: data.value.imageUrl || ''
    }];
  }

  return {
    enabled: data?.value?.enabled ?? data?.value?.isActive ?? false,
    items: items
  };
};

export const updateGlobalBanner = async (bannerData: GlobalBannerData): Promise<boolean> => {
  const { error } = await supabase
    .from('site_settings')
    .upsert({
      id: 'global_banner',
      value: bannerData
    }, { onConflict: 'id' });

  if (error) {
    console.error('Error updating global banner:', error);
    return false;
  }
  return true;
};
