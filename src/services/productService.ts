import { supabase } from '../supabaseClient';
import type { Product } from '../components/ProductCard';
import { fetchCommentsCountForProducts } from './commentService';
import { fetchSalePostsCountForProducts } from './saleHuntingService';

const MOCK_JOURNEYS: Record<string, any> = {
  'iPhone 17 Pro Max': {
    bottomPriceTime: '3/2026',
    bottomPricePlatform: 'Shopee (Flash Sale)',
    bottomPriceLink: 'https://shopee.vn/apple-iphone-17-pro-max',
    day_vuong: 'Vinh Xô'
  },
  'Samsung Galaxy S26 Ultra': {
    bottomPriceTime: '2/2026',
    bottomPricePlatform: 'Lazada (Tech Day)',
    bottomPriceLink: 'https://lazada.vn/samsung-s26-ultra',
    day_vuong: 'Tony Phùng'
  },
  'MacBook Air M4': {
    bottomPriceTime: '1/2026',
    bottomPricePlatform: 'Tiki',
    bottomPriceLink: 'https://tiki.vn/macbook-air-m4',
    day_vuong: 'Cu Hiệp'
  }
};

const MOCK_REVIEWS: Record<string, any[]> = {
  'iPhone 17 Pro Max': [
    {
      id: 'rev-1',
      type: 'reviewer',
      author: 'Vinh Vật Vờ (Vật Vờ Studio)',
      content: 'iPhone 17 Pro Max năm nay thực sự gây sốc với dải camera nằm ngang. Hiệu năng của chip A19 Pro là không bàn cãi, cân mọi loại game hiện nay.',
      rating: 5,
      created_at: new Date().toISOString(),
      reviewerProfile: {
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
        facebookUrl: 'https://fb.com/vatvostudio',
        youtubeUrl: 'https://www.youtube.com/@realvatvostudio'
      },
      screenshotUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=1000',
      postUrl: 'https://vatvostudio.vn/iphone-17-pro-max-review'
    },
    {
      id: 'rev-2',
      type: 'reviewer',
      author: 'Tuấn Ngọc (Đây là đâu?)',
      content: 'Màn hình 144Hz thực sự mượt mà. Tuy nhiên dải camera mới cần thời gian để làm quen. Pin vẫn là trùm trong thế giới smartphone.',
      rating: 4.5,
      created_at: new Date().toISOString(),
      reviewerProfile: {
        avatarUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop',
        facebookUrl: 'https://fb.com/tuanngocdayla',
        youtubeUrl: 'https://www.youtube.com/@tuanngocdayla'
      },
      screenshotUrl: 'https://images.unsplash.com/photo-1556656793-062ff9878273?q=80&w=1000',
      postUrl: 'https://tuanngoc.tech/iphone-17-review'
    },
    {
      id: 'user-1',
      type: 'user',
      author: 'Người săn Đáy 01',
      content: 'Canh mãi mới mua được giá 28tr trên Shopee, đúng là cực phẩm!',
      rating: 5,
      created_at: new Date().toISOString()
    },
    {
      id: 'user-2',
      type: 'user',
      author: 'TechFan99',
      content: 'Máy mượt, camera đẹp, nhưng sạc vẫn hơi chậm so với các đối thủ Trung Quốc.',
      rating: 4,
      created_at: new Date().toISOString()
    }
  ],
  'MacBook Air M4': [
    {
      id: 'mac-rev-1',
      type: 'reviewer',
      author: 'Cu Hiệp (Tinh tế)',
      content: 'MacBook Air M4 mỏng nhẹ đến mức không tưởng. Hiệu năng chip M4 dư sức cho mọi tác vụ văn phòng và edit video nhẹ nhàng.',
      rating: 5,
      created_at: new Date().toISOString(),
      reviewerProfile: {
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
        facebookUrl: 'https://fb.com/cuhiep',
        youtubeUrl: 'https://www.youtube.com/@tinhte'
      }
    },
    {
      id: 'mac-user-1',
      type: 'user',
      author: 'Sinh viên nghèo',
      content: 'Canh sale mãi mới mua được bản 16GB RAM. Máy dùng cực phê, pin trâu cả ngày không cần sạc.',
      rating: 5,
      created_at: new Date().toISOString()
    }
  ],
  'Samsung Galaxy S26 Ultra': [
    {
      id: 'rev-3',
      type: 'reviewer',
      author: 'Duy Thẩm (Schannel)',
      content: 'Galaxy S26 Ultra là đỉnh cao của Android trong năm 2026. Galaxy AI đã thông minh hơn rất nhiều, hỗ trợ công việc cực tốt.',
      rating: 4.8,
      created_at: new Date().toISOString(),
      reviewerProfile: {
        avatarUrl: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop',
        facebookUrl: 'https://fb.com/koolmode',
        youtubeUrl: 'https://www.youtube.com/@DuyTham'
      },
      screenshotUrl: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?q=80&w=1000',
      postUrl: 'https://schannel.vn/s26-ultra-review'
    }
  ]
};

export const fetchProducts = async (category: string = 'all'): Promise<Product[]> => {
  let query = supabase
    .from('products')
    .select('*');

  if (category !== 'all') {
    query = query.eq('category', category);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) {
    console.error('Supabase error fetching products:', error);
    return [];
  }

  // Fetch comment counts
  const productIds = data.map((item: any) => item.id);
  const commentCounts = await fetchCommentsCountForProducts(productIds);
  const salePostCounts = await fetchSalePostsCountForProducts(productIds);
  
  return data.map((item: any) => {
    const mockReviews = MOCK_REVIEWS[item.name] || [];
    const commentsCount = commentCounts[item.id] || 0;
    const salePostCount = salePostCounts[item.id] || 0;
    
    // Status mocking logic
    let status: Product['status'] = undefined;
    if (item.name.includes('iPhone 17')) status = 'hot';
    else if (item.name.includes('S26')) status = 'new';
    else if (item.name.includes('MacBook')) status = 'best-seller';

    return {
      id: item.id,
      name: item.name,
      imageUrl: item.image_url,
      bottomPrice: item.bottom_price,
      rating: Number(item.rating),
      reviewCount: mockReviews.length + (item.review_count || 0) + commentsCount,
      topReview: item.top_review,
      category: item.category,
      shops: item.shops || [],
      reviews: mockReviews,
      status: status,
      bottomPriceTime: item.bottom_price_time || MOCK_JOURNEYS[item.name]?.bottomPriceTime,
      bottomPricePlatform: item.bottom_price_platform || MOCK_JOURNEYS[item.name]?.bottomPricePlatform,
      bottomPriceLink: item.bottom_price_link || MOCK_JOURNEYS[item.name]?.bottomPriceLink,
      dayVuong: item.day_vuong || MOCK_JOURNEYS[item.name]?.day_vuong
    };
  }) as Product[];
};

export const addProduct = async (product: Omit<Product, 'id' | 'reviewCount'>): Promise<Product | null> => {
  const dbProduct = {
    name: product.name,
    image_url: product.imageUrl,
    bottom_price: product.bottomPrice,
    rating: product.rating,
    top_review: product.topReview,
    shops: product.shops,
    review_count: 0,
    bottom_price_time: product.bottomPriceTime,
    bottom_price_platform: product.bottomPricePlatform,
    bottom_price_link: product.bottomPriceLink,
    day_vuong: product.dayVuong
  };

  const { data, error } = await supabase
    .from('products')
    .insert([dbProduct])
    .select()
    .single();

  if (error) {
    console.error('Error adding product:', error);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    imageUrl: data.image_url,
    bottomPrice: data.bottom_price,
    rating: Number(data.rating),
    reviewCount: data.review_count,
    topReview: data.top_review,
    shops: data.shops || [],
    bottomPriceTime: data.bottom_price_time,
    bottomPricePlatform: data.bottom_price_platform,
    bottomPriceLink: data.bottom_price_link,
    dayVuong: data.day_vuong
  } as Product;
};

export const updateProduct = async (id: string, updates: Partial<Product>): Promise<boolean> => {
  const dbUpdates: any = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
  if (updates.bottomPrice !== undefined) dbUpdates.bottom_price = updates.bottomPrice;
  if (updates.rating !== undefined) dbUpdates.rating = updates.rating;
  if (updates.topReview !== undefined) dbUpdates.top_review = updates.topReview;
  if (updates.shops !== undefined) dbUpdates.shops = updates.shops;
  if (updates.bottomPriceTime !== undefined) dbUpdates.bottom_price_time = updates.bottomPriceTime;
  if (updates.bottomPricePlatform !== undefined) dbUpdates.bottom_price_platform = updates.bottomPricePlatform;
  if (updates.bottomPriceLink !== undefined) dbUpdates.bottom_price_link = updates.bottomPriceLink;
  if (updates.dayVuong !== undefined) dbUpdates.day_vuong = updates.dayVuong;
  if (updates.category !== undefined) dbUpdates.category = updates.category;

  const { error } = await supabase
    .from('products')
    .update(dbUpdates)
    .eq('id', id);

  if (error) {
    console.error('Error updating product:', error);
    return false;
  }
  return true;
};

export const fetchProductById = async (id: string): Promise<Product | null> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error('Error fetching product by id:', error);
    return null;
  }

  // Fetch comment counts for this product
  const commentCounts = await fetchCommentsCountForProducts([data.id]);
  const commentsCount = commentCounts[data.id] || 0;
  const mockReviews = MOCK_REVIEWS[data.name] || [];

  let status: Product['status'] = undefined;
  if (data.name.includes('iPhone 17')) status = 'hot';
  else if (data.name.includes('S26')) status = 'new';
  else if (data.name.includes('MacBook')) status = 'best-seller';

  return {
    id: data.id,
    name: data.name,
    imageUrl: data.image_url,
    bottomPrice: data.bottom_price,
    rating: Number(data.rating),
    reviewCount: mockReviews.length + (data.review_count || 0) + commentsCount,
    topReview: data.top_review,
    category: data.category,
    shops: data.shops || [],
    reviews: mockReviews,
    status: status,
    bottomPriceTime: data.bottom_price_time || MOCK_JOURNEYS[data.name]?.bottomPriceTime,
    bottomPricePlatform: data.bottom_price_platform || MOCK_JOURNEYS[data.name]?.bottomPricePlatform,
    bottomPriceLink: data.bottom_price_link || MOCK_JOURNEYS[data.name]?.bottomPriceLink,
    dayVuong: data.day_vuong || MOCK_JOURNEYS[data.name]?.day_vuong
  } as Product;
};

export const deleteProduct = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting product:', error);
    return false;
  }

  return true;
};
